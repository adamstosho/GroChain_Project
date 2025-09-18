"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { useToast } from "@/hooks/use-toast"
import { useReferrals } from "@/hooks/use-referrals"
import { Loader2 } from "lucide-react"

interface ReferralStatusDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  referral: any
}

const statusOptions = [
  { value: 'pending', label: 'Pending', description: 'Referral created but not yet activated' },
  { value: 'active', label: 'Active', description: 'Referral is active and earning commissions' },
  { value: 'completed', label: 'Completed', description: 'Referral has been successfully completed' },
  { value: 'cancelled', label: 'Cancelled', description: 'Referral has been cancelled' }
]

export function ReferralStatusDialog({ open, onOpenChange, referral }: ReferralStatusDialogProps) {
  const [status, setStatus] = useState('pending')
  const [notes, setNotes] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  // Reset form when referral changes or dialog opens
  useEffect(() => {
    if (open && referral) {
      setStatus(referral.status || 'pending')
      setNotes(referral.notes || '')
    }
  }, [open, referral])
  
  const { toast } = useToast()
  const { updateReferral } = useReferrals()

  const handleSubmit = async () => {
    if (!referral) return

    setIsLoading(true)
    try {
      await updateReferral(referral._id, {
        status,
        notes: notes.trim() || undefined
      })
      
      onOpenChange(false)
    } catch (error: any) {
      toast({
        title: "Update failed",
        description: error.message || "Failed to update referral status",
        variant: "destructive"
      })
    } finally {
      setIsLoading(false)
    }
  }

  const selectedStatus = statusOptions.find(option => option.value === status)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Update Referral Status</DialogTitle>
          <DialogDescription>
            Update the status for {referral?.farmer?.name}'s referral
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Current Status Display */}
          <div className="space-y-2">
            <Label>Current Status</Label>
            <div className="p-3 border rounded-md bg-muted/50">
              <div className="flex items-center justify-between">
                <span className="font-medium capitalize">{referral?.status}</span>
                <span className="text-sm text-muted-foreground">
                  Referred on {new Date(referral?.createdAt).toLocaleDateString()}
                </span>
              </div>
            </div>
          </div>

          {/* Status Selection */}
          <div className="space-y-2">
            <Label htmlFor="status">New Status</Label>
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger>
                <SelectValue placeholder="Select new status" />
              </SelectTrigger>
              <SelectContent>
                {statusOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    <div className="flex flex-col">
                      <span className="font-medium">{option.label}</span>
                      <span className="text-xs text-muted-foreground">{option.description}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {selectedStatus && (
              <p className="text-xs text-muted-foreground">{selectedStatus.description}</p>
            )}
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">Notes (Optional)</Label>
            <Textarea
              id="notes"
              placeholder="Add any notes about this status change..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              disabled={isLoading}
            />
          </div>

          {/* Status Change Impact */}
          {status !== referral?.status && (
            <div className="p-3 border rounded-md bg-blue-50 border-blue-200">
              <h4 className="text-sm font-medium text-blue-900 mb-2">Status Change Impact</h4>
              <div className="text-xs text-blue-700 space-y-1">
                {status === 'active' && (
                  <p>• Farmer will be associated with your partner account</p>
                )}
                {status === 'completed' && (
                  <p>• Referral will be marked as successfully completed</p>
                )}
                {status === 'cancelled' && (
                  <p>• Referral will be cancelled and no commissions will be earned</p>
                )}
                {status === 'pending' && (
                  <p>• Referral will be reset to pending status</p>
                )}
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isLoading}>
            Cancel
          </Button>
          <Button 
            onClick={handleSubmit} 
            disabled={isLoading || status === referral?.status}
          >
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Update Status
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

