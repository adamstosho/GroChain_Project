"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { 
  Banknote, 
  User, 
  Package, 
  Calendar, 
  TrendingUp,
  CheckCircle,
  Clock,
  XCircle
} from "lucide-react"

interface CommissionDetailsDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  commission: any
}

const statusConfig = {
  pending: { 
    icon: Clock, 
    color: "text-yellow-600", 
    bgColor: "bg-yellow-100",
    label: "Pending" 
  },
  approved: { 
    icon: CheckCircle, 
    color: "text-blue-600", 
    bgColor: "bg-blue-100",
    label: "Approved" 
  },
  paid: { 
    icon: CheckCircle, 
    color: "text-green-600", 
    bgColor: "bg-green-100",
    label: "Paid" 
  },
  cancelled: { 
    icon: XCircle, 
    color: "text-red-600", 
    bgColor: "bg-red-100",
    label: "Cancelled" 
  }
}

export function CommissionDetailsDialog({ open, onOpenChange, commission }: CommissionDetailsDialogProps) {
  if (!commission) return null

  const statusInfo = statusConfig[commission.status as keyof typeof statusConfig] || statusConfig.pending
  const StatusIcon = statusInfo.icon

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Banknote className="h-5 w-5" />
            Commission Details
          </DialogTitle>
          <DialogDescription>
            Detailed information about this commission transaction
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Status and Amount */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg ${statusInfo.bgColor}`}>
                <StatusIcon className={`h-5 w-5 ${statusInfo.color}`} />
              </div>
              <div>
                <p className="font-medium">Commission Status</p>
                <Badge variant={commission.status === 'paid' ? 'default' : 'secondary'}>
                  {statusInfo.label}
                </Badge>
              </div>
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold">₦{commission.amount.toLocaleString()}</p>
              <p className="text-sm text-muted-foreground">
                {(commission.rate * 100).toFixed(1)}% of ₦{commission.orderAmount.toLocaleString()}
              </p>
            </div>
          </div>

          <Separator />

          {/* Transaction Details */}
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <User className="h-4 w-4" />
                  Farmer Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div>
                  <p className="text-sm font-medium">{commission.farmer?.name || 'Unknown Farmer'}</p>
                  <p className="text-xs text-muted-foreground">{commission.farmer?.email || 'No email'}</p>
                  <p className="text-xs text-muted-foreground">{commission.farmer?.phone || 'No phone'}</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Package className="h-4 w-4" />
                  Order Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div>
                  <p className="text-sm font-medium">
                    Order #{commission.order?.orderNumber || commission.order?._id || 'N/A'}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Total: ₦{commission.orderAmount.toLocaleString()}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Status: {commission.order?.status || 'Unknown'}
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Product Details */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <Package className="h-4 w-4" />
                Product Details
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">{commission.listing?.cropName || 'Unknown Crop'}</p>
                  <p className="text-sm text-muted-foreground">
                    Price: ₦{commission.listing?.price?.toLocaleString() || '0'} per unit
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium">Commission Rate</p>
                  <p className="text-lg font-bold text-primary">
                    {(commission.rate * 100).toFixed(1)}%
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Timeline */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Timeline
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 bg-primary rounded-full" />
                <div>
                  <p className="text-sm font-medium">Commission Created</p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(commission.createdAt).toLocaleString()}
                  </p>
                </div>
              </div>
              
              {commission.status === 'approved' && (
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-blue-500 rounded-full" />
                  <div>
                    <p className="text-sm font-medium">Commission Approved</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(commission.updatedAt).toLocaleString()}
                    </p>
                  </div>
                </div>
              )}
              
              {commission.status === 'paid' && commission.paidAt && (
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-green-500 rounded-full" />
                  <div>
                    <p className="text-sm font-medium">Commission Paid</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(commission.paidAt).toLocaleString()}
                    </p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Notes */}
          {commission.notes && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">Notes</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">{commission.notes}</p>
              </CardContent>
            </Card>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

