"use client"

import { useState, useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { useToast } from "@/hooks/use-toast"
import { useCreateShipment } from "@/hooks/use-shipments"
import { useOfflineApi } from "@/hooks/use-offline-api"
import { CreateShipmentRequest } from "@/types/shipment"
import { Package, Truck, Shield, Thermometer, AlertTriangle } from "lucide-react"

const shipmentFormSchema = z.object({
  shippingMethod: z.enum(['road_standard', 'road_express', 'air', 'courier'], {
    required_error: "Please select a shipping method"
  }),
  carrier: z.string().min(1, "Carrier is required"),
  estimatedDelivery: z.string().min(1, "Estimated delivery date is required"),
  shippingCost: z.number().min(0, "Shipping cost must be positive"),
  insuranceCost: z.number().min(0, "Insurance cost must be positive").optional(),
  specialInstructions: z.string().optional(),
  temperatureControl: z.boolean().optional(),
  temperatureMin: z.number().optional(),
  temperatureMax: z.number().optional(),
  fragile: z.boolean().optional(),
  packagingType: z.string().optional(),
  packagingWeight: z.number().min(0, "Packaging weight must be positive").optional(),
  packagingLength: z.number().min(0, "Length must be positive").optional(),
  packagingWidth: z.number().min(0, "Width must be positive").optional(),
  packagingHeight: z.number().min(0, "Height must be positive").optional(),
})

type ShipmentFormData = z.infer<typeof shipmentFormSchema>

interface ShipmentCreationFormProps {
  orderId: string
  orderData?: any // Order data to auto-populate form
  onSuccess?: (shipment: any) => void
  onCancel?: () => void
  className?: string
}

export function ShipmentCreationForm({ 
  orderId, 
  orderData,
  onSuccess, 
  onCancel,
  className 
}: ShipmentCreationFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { toast } = useToast()
  const { createShipment, loading } = useCreateShipment()
  const { createShipment: createShipmentOffline, isOffline } = useOfflineApi()

  const {
    register,
    handleSubmit,
    formState: { errors, isValid },
    setValue,
    watch,
    reset
  } = useForm<ShipmentFormData>({
    resolver: zodResolver(shipmentFormSchema),
    defaultValues: {
      shippingMethod: 'road_standard',
      carrier: 'GIG Logistics',
      estimatedDelivery: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().slice(0, 16), // 3 days from now
      shippingCost: 0,
      temperatureControl: false,
      fragile: false,
      insuranceCost: 0,
      packagingType: 'standard',
      packagingWeight: 1,
      packagingLength: 10,
      packagingWidth: 10,
      packagingHeight: 10
    }
  })

  const temperatureControl = watch('temperatureControl')
  const fragile = watch('fragile')

  // Auto-populate form with order data
  useEffect(() => {
    if (orderData) {
      // Set shipping method from order
      if (orderData.shippingMethod) {
        setValue('shippingMethod', orderData.shippingMethod)
      }
      
      // Set shipping cost from order
      if (orderData.shipping && orderData.shipping > 0) {
        setValue('shippingCost', orderData.shipping)
      } else {
        // Calculate shipping cost if not provided
        const totalWeight = orderData.items?.reduce((sum: number, item: any) => sum + item.quantity, 0) || 1
        const estimatedCost = totalWeight * 100 // Basic calculation
        setValue('shippingCost', estimatedCost)
      }
      
      // Calculate estimated delivery based on shipping method
      const estimatedDays = orderData.shippingMethod === 'air' ? 1 : 
                          orderData.shippingMethod === 'road_express' ? 2 : 3
      const estimatedDelivery = new Date(Date.now() + estimatedDays * 24 * 60 * 60 * 1000)
      setValue('estimatedDelivery', estimatedDelivery.toISOString().slice(0, 16))
      
      // Calculate total weight from order items
      const totalWeight = orderData.items?.reduce((sum: number, item: any) => sum + item.quantity, 0) || 0
      setValue('packagingWeight', totalWeight)
      
      // Set carrier based on shipping method
      const carrierMap: { [key: string]: string } = {
        'road_standard': 'GIG Logistics',
        'road_express': 'Red Star Express',
        'air': 'DHL Express',
        'courier': 'Jumia Logistics'
      }
      const carrier = carrierMap[orderData.shippingMethod] || 'GIG Logistics'
      setValue('carrier', carrier)
    }
  }, [orderData, setValue])

  const onSubmit = async (data: ShipmentFormData) => {
    try {
      setIsSubmitting(true)

      // Validate required fields
      if (!orderId) {
        throw new Error('Order ID is required')
      }

      const shipmentData: CreateShipmentRequest = {
        orderId,
        shippingMethod: data.shippingMethod,
        carrier: data.carrier,
        estimatedDelivery: data.estimatedDelivery,
        shippingCost: data.shippingCost,
        insuranceCost: data.insuranceCost || 0,
        specialInstructions: data.specialInstructions,
        temperatureControl: data.temperatureControl || false,
        temperatureRange: data.temperatureControl ? {
          min: data.temperatureMin || 0,
          max: data.temperatureMax || 0
        } : undefined,
        fragile: data.fragile || false,
        packaging: {
          type: data.packagingType || 'standard',
          materials: ['cardboard', 'plastic'],
          weight: data.packagingWeight || 1, // Default to 1kg
          dimensions: {
            length: data.packagingLength || 10, // Default dimensions
            width: data.packagingWidth || 10,
            height: data.packagingHeight || 10
          }
        }
      }
      
      // Use offline-aware API
      const result = await createShipmentOffline(shipmentData)
      
      if (result.success && !result.queued) {
        onSuccess?.(result.data)
        reset()
      } else if (result.queued) {
        // If queued, still call onSuccess but with offline indicator
        onSuccess?.(result.offlineAction)
        reset()
      }
    } catch (error) {
      toast({
        title: "Error",
        description: error.message || "Failed to create shipment",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const shippingMethods = [
    { value: 'road_standard', label: 'Road Transport (Standard)', icon: Truck },
    { value: 'road_express', label: 'Road Transport (Express)', icon: Truck },
    { value: 'air', label: 'Air Freight', icon: Truck },
    { value: 'courier', label: 'Courier Service', icon: Package }
  ]

  const carriers = [
    'DHL Express',
    'FedEx',
    'UPS',
    'TNT Express',
    'Aramex',
    'GIG Logistics',
    'Red Star Express',
    'Jumia Logistics',
    'Kobo360',
    'Truckr',
    'Other'
  ]

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Package className="h-5 w-5 text-green-600" />
          Create Shipment
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Shipping Method */}
          <div className="space-y-2">
            <Label htmlFor="shippingMethod">Shipping Method *</Label>
            <Select onValueChange={(value) => setValue('shippingMethod', value as any)}>
              <SelectTrigger>
                <SelectValue placeholder="Select shipping method" />
              </SelectTrigger>
              <SelectContent>
                {shippingMethods.map((method) => (
                  <SelectItem key={method.value} value={method.value}>
                    <div className="flex items-center gap-2">
                      <method.icon className="h-4 w-4" />
                      {method.label}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.shippingMethod && (
              <p className="text-sm text-red-600">{errors.shippingMethod.message}</p>
            )}
          </div>

          {/* Carrier */}
          <div className="space-y-2">
            <Label htmlFor="carrier">Carrier *</Label>
            <Select onValueChange={(value) => setValue('carrier', value)}>
              <SelectTrigger>
                <SelectValue placeholder="Select carrier" />
              </SelectTrigger>
              <SelectContent>
                {carriers.map((carrier) => (
                  <SelectItem key={carrier} value={carrier}>
                    {carrier}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.carrier && (
              <p className="text-sm text-red-600">{errors.carrier.message}</p>
            )}
          </div>

          {/* Estimated Delivery */}
          <div className="space-y-2">
            <Label htmlFor="estimatedDelivery">Estimated Delivery Date *</Label>
            <Input
              type="datetime-local"
              {...register('estimatedDelivery')}
              min={new Date().toISOString().slice(0, 16)}
            />
            {errors.estimatedDelivery && (
              <p className="text-sm text-red-600">{errors.estimatedDelivery.message}</p>
            )}
          </div>

          {/* Costs */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="shippingCost">Shipping Cost (₦) *</Label>
              <Input
                type="number"
                step="0.01"
                {...register('shippingCost', { valueAsNumber: true })}
                placeholder="0.00"
              />
              {errors.shippingCost && (
                <p className="text-sm text-red-600">{errors.shippingCost.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="insuranceCost">Insurance Cost (₦)</Label>
              <Input
                type="number"
                step="0.01"
                {...register('insuranceCost', { valueAsNumber: true })}
                placeholder="0.00"
              />
              {errors.insuranceCost && (
                <p className="text-sm text-red-600">{errors.insuranceCost.message}</p>
              )}
            </div>
          </div>

          {/* Special Requirements */}
          <div className="space-y-4">
            <h4 className="font-medium text-gray-900 flex items-center gap-2">
              <AlertTriangle className="h-4 w-4" />
              Special Requirements
            </h4>
            
            <div className="flex items-center space-x-2">
              <Checkbox
                id="temperatureControl"
                checked={temperatureControl}
                onCheckedChange={(checked) => setValue('temperatureControl', !!checked)}
              />
              <Label htmlFor="temperatureControl" className="flex items-center gap-2">
                <Thermometer className="h-4 w-4" />
                Temperature Control Required
              </Label>
            </div>

            {temperatureControl && (
              <div className="grid grid-cols-2 gap-4 ml-6">
                <div className="space-y-2">
                  <Label htmlFor="temperatureMin">Min Temperature (°C)</Label>
                  <Input
                    type="number"
                    {...register('temperatureMin', { valueAsNumber: true })}
                    placeholder="0"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="temperatureMax">Max Temperature (°C)</Label>
                  <Input
                    type="number"
                    {...register('temperatureMax', { valueAsNumber: true })}
                    placeholder="25"
                  />
                </div>
              </div>
            )}

            <div className="flex items-center space-x-2">
              <Checkbox
                id="fragile"
                checked={fragile}
                onCheckedChange={(checked) => setValue('fragile', !!checked)}
              />
              <Label htmlFor="fragile" className="flex items-center gap-2">
                <Shield className="h-4 w-4" />
                Fragile Items
              </Label>
            </div>
          </div>

          {/* Packaging Details */}
          <div className="space-y-4">
            <h4 className="font-medium text-gray-900 flex items-center gap-2">
              <Package className="h-4 w-4" />
              Packaging Details
            </h4>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="packagingType">Packaging Type</Label>
                <Select onValueChange={(value) => setValue('packagingType', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="standard">Standard</SelectItem>
                    <SelectItem value="box">Box</SelectItem>
                    <SelectItem value="bag">Bag</SelectItem>
                    <SelectItem value="crate">Crate</SelectItem>
                    <SelectItem value="pallet">Pallet</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="packagingWeight">Weight (kg)</Label>
                <Input
                  type="number"
                  step="0.01"
                  {...register('packagingWeight', { valueAsNumber: true })}
                  placeholder="0.00"
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="packagingLength">Length (cm)</Label>
                <Input
                  type="number"
                  step="0.01"
                  {...register('packagingLength', { valueAsNumber: true })}
                  placeholder="0.00"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="packagingWidth">Width (cm)</Label>
                <Input
                  type="number"
                  step="0.01"
                  {...register('packagingWidth', { valueAsNumber: true })}
                  placeholder="0.00"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="packagingHeight">Height (cm)</Label>
                <Input
                  type="number"
                  step="0.01"
                  {...register('packagingHeight', { valueAsNumber: true })}
                  placeholder="0.00"
                />
              </div>
            </div>
          </div>

          {/* Special Instructions */}
          <div className="space-y-2">
            <Label htmlFor="specialInstructions">Special Instructions</Label>
            <Textarea
              {...register('specialInstructions')}
              placeholder="Any special handling instructions..."
              rows={3}
            />
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <Button
              type="submit"
              disabled={loading || isSubmitting}
              className="flex-1"
            >
              {loading || isSubmitting ? 'Creating...' : 'Create Shipment'}
            </Button>
            {onCancel && (
              <Button type="button" variant="outline" onClick={onCancel}>
                Cancel
              </Button>
            )}
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
