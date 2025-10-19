"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { useToast } from "@/hooks/use-toast"
import { useReferrals } from "@/hooks/use-referrals"
import { Loader2, User, AlertCircle } from "lucide-react"

interface ReferralStatusDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  referral?: any
  onUpdateSuccess?: () => void
}

export function ReferralStatusDialog({ 
  open, 
  onOpenChange, 
  referral, 
  onUpdateSuccess 
}: ReferralStatusDialogProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [status, setStatus] = useState("")
  const [commissionRate, setCommissionRate] = useState(0)
  const [notes, setNotes] = useState("")
  const [errors, setErrors] = useState<Record<string, string>>({})

  const { toast } = useToast()
  const { updateReferral } = useReferrals()

  // Initialize form when referral changes
  useEffect(() => {
    if (referral) {
      setStatus(referral.status || "")
      setCommissionRate((referral.commissionRate || 0) * 100) // Convert to percentage
      setNotes(referral.notes || "")
      setErrors({})
    }
  }, [referral])

  // Reset form when dialog opens/closes
  useEffect(() => {
    if (!open) {
      setStatus("")
      setCommissionRate(0)
      setNotes("")
      setErrors({})
    }
  }, [open])

  // Validate form
  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!status) {
      newErrors.status = "Please select a status"
    }

    if (commissionRate < 0 || commissionRate > 100) {
      newErrors.commissionRate = "Commission rate must be between 0 and 100"
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  // Handle form submission
  const handleSubmit = async () => {
    if (!referral || !validateForm()) return

    setIsLoading(true)
    try {
      await updateReferral(referral._id, {
        status,
        commissionRate: commissionRate / 100, // Convert to decimal
        notes: notes.trim() || undefined
      })

      toast({
        title: "Referral updated",
        description: `Referral status updated to ${status}`,
      })

      onUpdateSuccess?.()
    } catch (error: any) {
      toast({
        title: "Update failed",
        description: error.message || "Failed to update referral",
        variant: "destructive"
      })
    } finally {
      setIsLoading(false)
    }
  }

  if (!referral) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Update Referral Status</DialogTitle>
          <DialogDescription>
            Update the status and details for this referral.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Referral Info */}
          <div className="p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center space-x-3">
              <div className="h-10 w-10 bg-primary/10 rounded-full flex items-center justify-center">
                <User className="h-5 w-5 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-gray-900 truncate">
                  {referral.farmer?.name || 'Unknown Farmer'}
                </p>
                <p className="text-sm text-gray-500 truncate">
                  {referral.farmer?.email || 'No email'}
                </p>
                <p className="text-xs text-gray-400">
                  Referred on {new Date(referral.createdAt).toLocaleDateString()}
                </p>
              </div>
            </div>
          </div>

          {/* Status */}
          <div className="space-y-2">
            <Label htmlFor="status">Status</Label>
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger>
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pending">
                  <div className="flex items-center space-x-2">
                    <span className="text-yellow-600">⏳</span>
                    <span>Pending</span>
                  </div>
                </SelectItem>
                <SelectItem value="active">
                  <div className="flex items-center space-x-2">
                    <span className="text-blue-600">✅</span>
                    <span>Active</span>
                  </div>
                </SelectItem>
                <SelectItem value="completed">
                  <div className="flex items-center space-x-2">
                    <span className="text-green-600">💰</span>
                    <span>Completed</span>
                  </div>
                </SelectItem>
                <SelectItem value="cancelled">
                  <div className="flex items-center space-x-2">
                    <span className="text-red-600">❌</span>
                    <span>Cancelled</span>
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
            {errors.status && (
              <p className="text-sm text-red-600">{errors.status}</p>
            )}
          </div>

          {/* Commission Rate */}
          <div className="space-y-2">
            <Label htmlFor="commission-rate">Commission Rate (%)</Label>
            <Input
              id="commission-rate"
              type="number"
              min="0"
              max="100"
              step="0.1"
              value={commissionRate}
              onChange={(e) => setCommissionRate(Number(e.target.value))}
              placeholder="Enter commission rate"
            />
            {errors.commissionRate && (
              <p className="text-sm text-red-600">{errors.commissionRate}</p>
            )}
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add any additional notes about this referral..."
              rows={3}
            />
          </div>

          {/* Warning for status changes */}
          {status !== referral.status && (
            <div className="flex items-start space-x-2 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <AlertCircle className="h-4 w-4 text-yellow-600 mt-0.5 flex-shrink-0" />
              <div className="text-sm text-yellow-800">
                <p className="font-medium">Status Change</p>
                <p>Changing status from {referral.status} to {status} will affect commission calculations.</p>
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isLoading}
          >
            {isLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Update Referral
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}