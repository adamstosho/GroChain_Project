"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { usePriceAlerts, CreatePriceAlertData, PriceAlert } from "@/hooks/use-price-alerts"
import { Bell, TrendingDown, TrendingUp, Activity, Mail, MessageSquare, Smartphone, Monitor } from "lucide-react"
import Image from "next/image"

const formSchema = z.object({
  targetPrice: z.number().min(1, "Target price must be greater than 0"),
  alertType: z.enum(["price_drop", "price_increase", "both"]),
  notificationChannels: z.array(z.string()).min(1, "Select at least one notification method"),
})

interface PriceAlertDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  product: {
    _id: string
    cropName: string
    basePrice: number
    images: string[]
    category: string
  }
  existingAlert?: PriceAlert | null
  onSuccess?: () => void
}

export function PriceAlertDialog({
  open,
  onOpenChange,
  product,
  existingAlert,
  onSuccess
}: PriceAlertDialogProps) {
  const { createAlert, updateAlert, formatPrice } = usePriceAlerts()
  const [isSubmitting, setIsSubmitting] = useState(false)

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      targetPrice: existingAlert?.targetPrice || Math.round(product.basePrice * 0.9), // Default to 10% below current price
      alertType: existingAlert?.alertType || "price_drop",
      notificationChannels: existingAlert?.notificationChannels?.filter(ch => ch.enabled).map(ch => ch.type) || ["in_app"],
    },
  })

  // Reset form when dialog opens/closes or product changes
  useEffect(() => {
    if (open) {
      form.reset({
        targetPrice: existingAlert?.targetPrice || Math.round(product.basePrice * 0.9),
        alertType: existingAlert?.alertType || "price_drop",
        notificationChannels: existingAlert?.notificationChannels?.filter(ch => ch.enabled).map(ch => ch.type) || ["in_app"],
      })
    }
  }, [open, product, existingAlert, form])

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      setIsSubmitting(true)

      const alertData: CreatePriceAlertData = {
        listingId: product._id,
        targetPrice: values.targetPrice,
        alertType: values.alertType,
        notificationChannels: values.notificationChannels as Array<'email' | 'sms' | 'push' | 'in_app'>,
      }

      if (existingAlert) {
        await updateAlert(existingAlert._id, alertData)
      } else {
        const newAlert = await createAlert(alertData)
        if (!newAlert) {
          // If createAlert returned null, it means a specific error (e.g., duplicate) was handled with a toast
          // Do not close the dialog in this case
          return
        }
      }

      onSuccess?.()
      onOpenChange(false)
    } catch (error) {
      console.error('Error saving price alert:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const getAlertTypeIcon = (type: string) => {
    switch (type) {
      case 'price_drop':
        return <TrendingDown className="h-4 w-4" />
      case 'price_increase':
        return <TrendingUp className="h-4 w-4" />
      case 'both':
        return <Activity className="h-4 w-4" />
      default:
        return <Bell className="h-4 w-4" />
    }
  }

  const getAlertTypeDescription = (type: string) => {
    switch (type) {
      case 'price_drop':
        return 'Get notified when the price drops to or below your target'
      case 'price_increase':
        return 'Get notified when the price rises to or above your target'
      case 'both':
        return 'Get notified for both price increases and decreases'
      default:
        return ''
    }
  }

  const getNotificationIcon = (channel: string) => {
    switch (channel) {
      case 'email':
        return <Mail className="h-4 w-4" />
      case 'sms':
        return <MessageSquare className="h-4 w-4" />
      case 'push':
        return <Smartphone className="h-4 w-4" />
      case 'in_app':
        return <Monitor className="h-4 w-4" />
      default:
        return <Bell className="h-4 w-4" />
    }
  }

  const getNotificationLabel = (channel: string) => {
    switch (channel) {
      case 'email':
        return 'Email'
      case 'sms':
        return 'SMS'
      case 'push':
        return 'Push Notification'
      case 'in_app':
        return 'In-App Notification'
      default:
        return channel
    }
  }

  const currentPrice = product.basePrice
  const targetPrice = form.watch('targetPrice')
  const priceDifference = targetPrice - currentPrice
  const priceDifferencePercent = ((priceDifference / currentPrice) * 100).toFixed(1)
  const priceDifferencePercentNum = Math.abs(parseFloat(priceDifferencePercent))

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            {existingAlert ? 'Edit Price Alert' : 'Create Price Alert'}
          </DialogTitle>
          <DialogDescription>
            Set up price alerts for {product.cropName} to get notified when the price changes.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Product Info */}
          <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
            <div className="relative w-12 h-12 flex-shrink-0">
              <Image
                src={product.images[0] || "/placeholder.svg"}
                alt={product.cropName}
                fill
                className="rounded-md object-cover"
              />
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="font-medium text-sm">{product.cropName}</h4>
              <p className="text-sm text-muted-foreground">{product.category}</p>
              <p className="text-sm font-medium">
                Current Price: {formatPrice(currentPrice)}
              </p>
            </div>
          </div>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              {/* Target Price */}
              <FormField
                control={form.control}
                name="targetPrice"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Target Price (₦)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        placeholder="Enter target price"
                        {...field}
                        onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                      />
                    </FormControl>
                    <FormDescription>
                      {targetPrice > 0 && (
                        <span className="flex items-center gap-2 mt-2">
                          <Badge variant={priceDifference < 0 ? "destructive" : "default"}>
                            {priceDifference < 0 ? 'Below' : 'Above'} current price by {priceDifferencePercentNum}%
                          </Badge>
                          <span className="text-sm text-muted-foreground">
                            {formatPrice(targetPrice)}
                          </span>
                        </span>
                      )}
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Alert Type */}
              <FormField
                control={form.control}
                name="alertType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Alert Type</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select alert type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="price_drop">
                          <div className="flex items-center gap-2">
                            <TrendingDown className="h-4 w-4" />
                            <div>
                              <div className="font-medium">Price Drop</div>
                              <div className="text-xs text-muted-foreground">
                                Notify when price drops to target
                              </div>
                            </div>
                          </div>
                        </SelectItem>
                        <SelectItem value="price_increase">
                          <div className="flex items-center gap-2">
                            <TrendingUp className="h-4 w-4" />
                            <div>
                              <div className="font-medium">Price Increase</div>
                              <div className="text-xs text-muted-foreground">
                                Notify when price rises to target
                              </div>
                            </div>
                          </div>
                        </SelectItem>
                        <SelectItem value="both">
                          <div className="flex items-center gap-2">
                            <Activity className="h-4 w-4" />
                            <div>
                              <div className="font-medium">Both</div>
                              <div className="text-xs text-muted-foreground">
                                Notify for any price change
                              </div>
                            </div>
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      {getAlertTypeDescription(field.value)}
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Notification Channels */}
              <FormField
                control={form.control}
                name="notificationChannels"
                render={() => (
                  <FormItem>
                    <div className="mb-4">
                      <FormLabel className="text-base">Notification Methods</FormLabel>
                      <FormDescription>
                        Choose how you want to be notified when the price alert triggers.
                      </FormDescription>
                    </div>
                    {['in_app', 'email', 'push', 'sms'].map((channel) => (
                      <FormField
                        key={channel}
                        control={form.control}
                        name="notificationChannels"
                        render={({ field }) => {
                          return (
                            <FormItem
                              key={channel}
                              className="flex flex-row items-start space-x-3 space-y-0"
                            >
                              <FormControl>
                                <Checkbox
                                  checked={field.value?.includes(channel)}
                                  onCheckedChange={(checked) => {
                                    return checked
                                      ? field.onChange([...field.value, channel])
                                      : field.onChange(
                                          field.value?.filter(
                                            (value) => value !== channel
                                          )
                                        )
                                  }}
                                />
                              </FormControl>
                              <FormLabel className="text-sm font-normal flex items-center gap-2">
                                {getNotificationIcon(channel)}
                                {getNotificationLabel(channel)}
                              </FormLabel>
                            </FormItem>
                          )
                        }}
                      />
                    ))}
                    <FormMessage />
                  </FormItem>
                )}
              />

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => onOpenChange(false)}
                  disabled={isSubmitting}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? (
                    <>
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-gray-300 border-t-white mr-2" />
                      {existingAlert ? 'Updating...' : 'Creating...'}
                    </>
                  ) : (
                    <>
                      <Bell className="h-4 w-4 mr-2" />
                      {existingAlert ? 'Update Alert' : 'Create Alert'}
                    </>
                  )}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </div>
      </DialogContent>
    </Dialog>
  )
}

