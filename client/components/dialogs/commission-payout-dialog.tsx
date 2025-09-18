"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/hooks/use-toast"
import { useCommission } from "@/hooks/use-commission"
import { Loader2, Wallet, Banknote, CreditCard } from "lucide-react"

interface CommissionPayoutDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  pendingCommissions: any[]
  totalAmount: number
}

const payoutMethods = [
  { value: 'bank_transfer', label: 'Bank Transfer', icon: Banknote },
  { value: 'mobile_money', label: 'Mobile Money', icon: CreditCard },
  { value: 'wallet', label: 'Digital Wallet', icon: Wallet }
]

export function CommissionPayoutDialog({ 
  open, 
  onOpenChange, 
  pendingCommissions, 
  totalAmount 
}: CommissionPayoutDialogProps) {
  const [payoutMethod, setPayoutMethod] = useState('bank_transfer')
  const [accountNumber, setAccountNumber] = useState('')
  const [bankName, setBankName] = useState('')
  const [accountName, setAccountName] = useState('')
  const [mobileNumber, setMobileNumber] = useState('')
  const [walletAddress, setWalletAddress] = useState('')
  const [notes, setNotes] = useState('')
  const [isProcessing, setIsProcessing] = useState(false)
  
  const { toast } = useToast()
  const { processPayout } = useCommission()

  const handleSubmit = async () => {
    if (!accountNumber && payoutMethod === 'bank_transfer') {
      toast({
        title: "Account number required",
        description: "Please enter your bank account number",
        variant: "destructive",
      })
      return
    }

    if (!mobileNumber && payoutMethod === 'mobile_money') {
      toast({
        title: "Mobile number required",
        description: "Please enter your mobile money number",
        variant: "destructive",
      })
      return
    }

    if (!walletAddress && payoutMethod === 'wallet') {
      toast({
        title: "Wallet address required",
        description: "Please enter your wallet address",
        variant: "destructive",
      })
      return
    }

    setIsProcessing(true)
    try {
      const payoutDetails = {
        accountNumber: payoutMethod === 'bank_transfer' ? accountNumber : undefined,
        bankName: payoutMethod === 'bank_transfer' ? bankName : undefined,
        accountName: payoutMethod === 'bank_transfer' ? accountName : undefined,
        mobileNumber: payoutMethod === 'mobile_money' ? mobileNumber : undefined,
        walletAddress: payoutMethod === 'wallet' ? walletAddress : undefined,
        notes
      }

      const commissionIds = pendingCommissions.map(c => c._id)
      
      await processPayout(commissionIds, payoutMethod, payoutDetails)
      
      toast({
        title: "Payout request submitted",
        description: `₦${totalAmount.toLocaleString()} payout request has been submitted successfully`,
      })
      
      onOpenChange(false)
      
      // Reset form
      setAccountNumber('')
      setBankName('')
      setAccountName('')
      setMobileNumber('')
      setWalletAddress('')
      setNotes('')
      
    } catch (error: any) {
      toast({
        title: "Payout request failed",
        description: error.message || "Please try again",
        variant: "destructive",
      })
    } finally {
      setIsProcessing(false)
    }
  }

  const renderPayoutMethodFields = () => {
    switch (payoutMethod) {
      case 'bank_transfer':
        return (
          <div className="space-y-4">
            <div>
              <Label htmlFor="bankName">Bank Name</Label>
              <Input
                id="bankName"
                value={bankName}
                onChange={(e) => setBankName(e.target.value)}
                placeholder="Enter bank name"
              />
            </div>
            <div>
              <Label htmlFor="accountNumber">Account Number</Label>
              <Input
                id="accountNumber"
                value={accountNumber}
                onChange={(e) => setAccountNumber(e.target.value)}
                placeholder="Enter account number"
              />
            </div>
            <div>
              <Label htmlFor="accountName">Account Name</Label>
              <Input
                id="accountName"
                value={accountName}
                onChange={(e) => setAccountName(e.target.value)}
                placeholder="Enter account name"
              />
            </div>
          </div>
        )
      
      case 'mobile_money':
        return (
          <div className="space-y-4">
            <div>
              <Label htmlFor="mobileNumber">Mobile Number</Label>
              <Input
                id="mobileNumber"
                value={mobileNumber}
                onChange={(e) => setMobileNumber(e.target.value)}
                placeholder="Enter mobile money number"
              />
            </div>
          </div>
        )
      
      case 'wallet':
        return (
          <div className="space-y-4">
            <div>
              <Label htmlFor="walletAddress">Wallet Address</Label>
              <Input
                id="walletAddress"
                value={walletAddress}
                onChange={(e) => setWalletAddress(e.target.value)}
                placeholder="Enter wallet address"
              />
            </div>
          </div>
        )
      
      default:
        return null
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Wallet className="h-5 w-5" />
            Request Commission Payout
          </DialogTitle>
          <DialogDescription>
            Request payout for your pending commissions
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Payout Summary */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Payout Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Pending Amount</p>
                  <p className="text-2xl font-bold">₦{totalAmount.toLocaleString()}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-muted-foreground">Number of Commissions</p>
                  <p className="text-lg font-semibold">{pendingCommissions.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Payout Method */}
          <div className="space-y-4">
            <Label>Payout Method</Label>
            <Select value={payoutMethod} onValueChange={setPayoutMethod}>
              <SelectTrigger>
                <SelectValue placeholder="Select payout method" />
              </SelectTrigger>
              <SelectContent>
                {payoutMethods.map((method) => {
                  const Icon = method.icon
                  return (
                    <SelectItem key={method.value} value={method.value}>
                      <div className="flex items-center gap-2">
                        <Icon className="h-4 w-4" />
                        {method.label}
                      </div>
                    </SelectItem>
                  )
                })}
              </SelectContent>
            </Select>
          </div>

          {/* Payout Method Fields */}
          {renderPayoutMethodFields()}

          {/* Additional Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">Additional Notes (Optional)</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Any additional information for this payout request..."
              rows={3}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isProcessing}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isProcessing}>
            {isProcessing ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                <Wallet className="mr-2 h-4 w-4" />
                Request Payout
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

