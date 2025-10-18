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
      <DialogContent className="w-[95vw] max-w-[500px] mx-4 sm:mx-0 max-h-[90vh] overflow-y-auto">
        <DialogHeader className="space-y-2 sm:space-y-3">
          <DialogTitle className="flex items-center gap-2 text-lg sm:text-xl">
            <Bell className="h-4 w-4 sm:h-5 sm:w-5" />
            <span className="truncate">{existingAlert ? 'Edit Price Alert' : 'Create Price Alert'}</span>
          </DialogTitle>
          <DialogDescription className="text-sm sm:text-base">
            Set up price alerts for <span className="font-medium">{product.cropName}</span> to get notified when the price changes.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 sm:space-y-6">
          {/* Product Info */}
          <div className="flex items-center gap-2 sm:gap-3 p-2 sm:p-3 bg-muted rounded-lg">
            <div className="relative w-10 h-10 sm:w-12 sm:h-12 flex-shrink-0">
              <Image
                src={product.images[0] || "/placeholder.svg"}
                alt={product.cropName}
                fill
                className="rounded-md object-cover"
              />
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="font-medium text-sm sm:text-base truncate">{product.cropName}</h4>
              <p className="text-xs sm:text-sm text-muted-foreground truncate">{product.category}</p>
              <p className="text-xs sm:text-sm font-medium">
                Current Price: <span className="text-green-600">{formatPrice(currentPrice)}</span>
              </p>
            </div>
          </div>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 sm:space-y-6">
              {/* Target Price */}
              <FormField
                control={form.control}
                name="targetPrice"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm sm:text-base">Target Price (₦)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        placeholder="Enter target price"
                        className="h-9 sm:h-10 text-sm sm:text-base"
                        {...field}
                        onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                      />
                    </FormControl>
                    <FormDescription className="text-xs sm:text-sm">
                      {targetPrice > 0 && (
                        <span className="flex flex-col sm:flex-row sm:items-center gap-2 mt-2">
                          <Badge 
                            variant={priceDifference < 0 ? "destructive" : "default"}
                            className="text-xs sm:text-sm w-fit"
                          >
                            {priceDifference < 0 ? 'Below' : 'Above'} current price by {priceDifferencePercentNum}%
                          </Badge>
                          <span className="text-xs sm:text-sm text-muted-foreground">
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
                    <FormLabel className="text-sm sm:text-base">Alert Type</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger className="h-9 sm:h-10 text-sm sm:text-base">
                          <SelectValue placeholder="Select alert type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="price_drop">
                          <div className="flex items-center gap-2">
                            <TrendingDown className="h-3 w-3 sm:h-4 sm:w-4" />
                            <div>
                              <div className="font-medium text-sm sm:text-base">Price Drop</div>
                              <div className="text-xs sm:text-sm text-muted-foreground">
                                Notify when price drops to target
                              </div>
                            </div>
                          </div>
                        </SelectItem>
                        <SelectItem value="price_increase">
                          <div className="flex items-center gap-2">
                            <TrendingUp className="h-3 w-3 sm:h-4 sm:w-4" />
                            <div>
                              <div className="font-medium text-sm sm:text-base">Price Increase</div>
                              <div className="text-xs sm:text-sm text-muted-foreground">
                                Notify when price rises to target
                              </div>
                            </div>
                          </div>
                        </SelectItem>
                        <SelectItem value="both">
                          <div className="flex items-center gap-2">
                            <Activity className="h-3 w-3 sm:h-4 sm:w-4" />
                            <div>
                              <div className="font-medium text-sm sm:text-base">Both</div>
                              <div className="text-xs sm:text-sm text-muted-foreground">
                                Notify for any price change
                              </div>
                            </div>
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                    <FormDescription className="text-xs sm:text-sm">
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
                    <div className="mb-3 sm:mb-4">
                      <FormLabel className="text-sm sm:text-base">Notification Methods</FormLabel>
                      <FormDescription className="text-xs sm:text-sm">
                        Choose how you want to be notified when the price alert triggers.
                      </FormDescription>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3">
                      {['in_app', 'email', 'push', 'sms'].map((channel) => (
                      <FormField
                        key={channel}
                        control={form.control}
                        name="notificationChannels"
                        render={({ field }) => {
                          return (
                            <FormItem
                              key={channel}
                              className="flex flex-row items-start space-x-2 sm:space-x-3 space-y-0 p-2 sm:p-3 border rounded-lg hover:bg-muted/50 transition-colors"
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
                              <FormLabel className="text-xs sm:text-sm font-normal flex items-center gap-2 cursor-pointer flex-1">
                                {getNotificationIcon(channel)}
                                <span className="truncate">{getNotificationLabel(channel)}</span>
                              </FormLabel>
                            </FormItem>
                          )
                        }}
                      />
                      ))}
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <DialogFooter className="flex flex-col sm:flex-row gap-2 sm:gap-3 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => onOpenChange(false)}
                  disabled={isSubmitting}
                  className="w-full sm:w-auto h-9 sm:h-10 text-sm sm:text-base order-2 sm:order-1"
                >
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  disabled={isSubmitting}
                  className="w-full sm:w-auto h-9 sm:h-10 text-sm sm:text-base order-1 sm:order-2"
                >
                  {isSubmitting ? (
                    <>
                      <div className="h-3 w-3 sm:h-4 sm:w-4 animate-spin rounded-full border-2 border-gray-300 border-t-white mr-2" />
                      <span className="hidden sm:inline">{existingAlert ? 'Updating...' : 'Creating...'}</span>
                      <span className="sm:hidden">{existingAlert ? 'Updating...' : 'Creating...'}</span>
                    </>
                  ) : (
                    <>
                      <Bell className="h-3 w-3 sm:h-4 sm:w-4 mr-2" />
                      <span className="hidden sm:inline">{existingAlert ? 'Update Alert' : 'Create Alert'}</span>
                      <span className="sm:hidden">{existingAlert ? 'Update' : 'Create'}</span>
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

