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
import { Loader2, Search, User } from "lucide-react"
import { api } from "@/lib/api"

interface ReferralDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  referral?: any // For editing existing referrals
}

interface Farmer {
  _id: string
  name: string
  email: string
  phone: string
  location: string
}

export function ReferralDialog({ open, onOpenChange, referral }: ReferralDialogProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [isSearching, setIsSearching] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [farmers, setFarmers] = useState<Farmer[]>([])
  const [selectedFarmer, setSelectedFarmer] = useState<Farmer | null>(null)
  const [commissionRate, setCommissionRate] = useState(0.05)
  const [notes, setNotes] = useState("")
  
  const { toast } = useToast()
  const { createReferral, updateReferral } = useReferrals()

  // Reset form when dialog opens/closes
  useEffect(() => {
    if (open) {
      if (referral) {
        // Editing existing referral
        setSelectedFarmer(referral.farmer)
        setCommissionRate(referral.commissionRate)
        setNotes(referral.notes || "")
        setSearchTerm(referral.farmer.name)
      } else {
        // Creating new referral
        setSelectedFarmer(null)
        setCommissionRate(0.05)
        setNotes("")
        setSearchTerm("")
        setFarmers([])
      }
    }
  }, [open, referral])

  // Search for farmers
  const searchFarmers = async (query: string) => {
    if (query.length < 2) {
      setFarmers([])
      return
    }

    setIsSearching(true)
    try {
      const response = await api.searchFarmers({ search: query, limit: 10 })
      setFarmers(response.data?.farmers || [])
    } catch (error) {
      console.error("Failed to search farmers:", error)
      toast({
        title: "Search failed",
        description: "Failed to search for farmers",
        variant: "destructive"
      })
    } finally {
      setIsSearching(false)
    }
  }

  // Handle search input change
  const handleSearchChange = (value: string) => {
    setSearchTerm(value)
    if (value.length >= 2) {
      searchFarmers(value)
    } else {
      setFarmers([])
    }
  }

  // Handle farmer selection
  const handleFarmerSelect = (farmer: Farmer) => {
    setSelectedFarmer(farmer)
    setSearchTerm(farmer.name)
    setFarmers([])
  }

  // Handle form submission
  const handleSubmit = async () => {
    if (!selectedFarmer) {
      toast({
        title: "Validation error",
        description: "Please select a farmer",
        variant: "destructive"
      })
      return
    }

    if (commissionRate < 0 || commissionRate > 1) {
      toast({
        title: "Validation error",
        description: "Commission rate must be between 0% and 100%",
        variant: "destructive"
      })
      return
    }

    setIsLoading(true)
    try {
      const data = {
        farmerId: selectedFarmer._id,
        commissionRate,
        notes: notes.trim() || undefined
      }

      if (referral) {
        // Update existing referral
        await updateReferral(referral._id, data)
      } else {
        // Create new referral
        await createReferral(data)
      }

      onOpenChange(false)
    } catch (error: any) {
      toast({
        title: referral ? "Update failed" : "Creation failed",
        description: error.message || `Failed to ${referral ? 'update' : 'create'} referral`,
        variant: "destructive"
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            {referral ? "Edit Referral" : "Add New Referral"}
          </DialogTitle>
          <DialogDescription>
            {referral 
              ? "Update the referral details below."
              : "Create a new farmer referral to track performance and earn commissions."
            }
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Farmer Search */}
          <div className="space-y-2">
            <Label htmlFor="farmer-search">Farmer</Label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="farmer-search"
                placeholder="Search for farmer by name or email..."
                value={searchTerm}
                onChange={(e) => handleSearchChange(e.target.value)}
                className="pl-10"
                disabled={isLoading}
              />
              {isSearching && (
                <Loader2 className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />
              )}
            </div>

            {/* Farmer Search Results */}
            {farmers.length > 0 && (
              <div className="border rounded-md max-h-40 overflow-y-auto">
                {farmers.map((farmer) => (
                  <div
                    key={farmer._id}
                    className="flex items-center space-x-3 p-3 hover:bg-muted cursor-pointer"
                    onClick={() => handleFarmerSelect(farmer)}
                  >
                    <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                      <User className="h-4 w-4 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{farmer.name}</p>
                      <p className="text-xs text-muted-foreground truncate">{farmer.email}</p>
                      <p className="text-xs text-muted-foreground">
                        {typeof farmer.location === 'object' ? `${farmer.location?.city || 'Unknown'}, ${farmer.location?.state || 'Unknown State'}` : farmer.location || 'Unknown Location'}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Selected Farmer Display */}
            {selectedFarmer && farmers.length === 0 && (
              <div className="flex items-center space-x-3 p-3 border rounded-md bg-muted/50">
                <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                  <User className="h-4 w-4 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{selectedFarmer.name}</p>
                  <p className="text-xs text-muted-foreground truncate">{selectedFarmer.email}</p>
                  <p className="text-xs text-muted-foreground">
                    {typeof selectedFarmer.location === 'object' ? `${selectedFarmer.location?.city || 'Unknown'}, ${selectedFarmer.location?.state || 'Unknown State'}` : selectedFarmer.location || 'Unknown Location'}
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setSelectedFarmer(null)
                    setSearchTerm("")
                  }}
                >
                  Clear
                </Button>
              </div>
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
              value={commissionRate * 100}
              onChange={(e) => setCommissionRate(parseFloat(e.target.value) / 100)}
              placeholder="5.0"
              disabled={isLoading}
            />
            <p className="text-xs text-muted-foreground">
              Default: 5% (₦100 per farmer transaction)
            </p>
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">Notes (Optional)</Label>
            <Textarea
              id="notes"
              placeholder="Add any notes about this referral..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              disabled={isLoading}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isLoading}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isLoading || !selectedFarmer}>
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {referral ? "Update Referral" : "Create Referral"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

