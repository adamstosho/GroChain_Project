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
import { Loader2, Search, User, X } from "lucide-react"
import { apiService } from "@/lib/api"

interface ReferralDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  referral?: any // For editing existing referrals
  onCreateSuccess?: () => void
}

interface Farmer {
  _id: string
  name: string
  email: string
  phone: string
  location: string
}

export function ReferralDialog({ open, onOpenChange, referral, onCreateSuccess }: ReferralDialogProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [isSearching, setIsSearching] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [farmers, setFarmers] = useState<Farmer[]>([])
  const [selectedFarmer, setSelectedFarmer] = useState<Farmer | null>(null)
  const [commissionRate, setCommissionRate] = useState(2)
  const [notes, setNotes] = useState("")
  const [errors, setErrors] = useState<Record<string, string>>({})
  const MIN_SEARCH_LEN = 2

  const { toast } = useToast()
  const { createReferral } = useReferrals()

  // Reset form when dialog opens/closes
  useEffect(() => {
    if (open) {
      setSearchQuery("")
      setFarmers([])
      setSelectedFarmer(null)
      setCommissionRate(2)
      setNotes("")
      setErrors({})
    }
  }, [open])

  // Search farmers (API call)
  const searchFarmers = async (query: string) => {
    const q = query.trim()
    if (q.length < MIN_SEARCH_LEN) {
      setFarmers([])
      return
    }

    setIsSearching(true)
    try {
      const response = await apiService.searchFarmers({
        search: q,
        limit: 10,
        page: 1
      })
      setFarmers(response.data?.farmers || [])
    } catch (error: any) {
      console.error('Failed to search farmers:', error)
      setFarmers([])
      toast({
        title: "Search failed",
        description: error?.message || "Failed to search for farmers.",
        variant: "destructive"
      })
    } finally {
      setIsSearching(false)
    }
  }

  // Handle search input change (debounced via effect below)
  const handleSearchChange = (value: string) => {
    setSearchQuery(value)
    if (value.trim().length < MIN_SEARCH_LEN) {
      setFarmers([])
    }
  }

  // Debounce search effect
  useEffect(() => {
    const q = searchQuery.trim()
    if (q.length < MIN_SEARCH_LEN) return
    const id = setTimeout(() => {
      searchFarmers(q)
    }, 300)
    return () => clearTimeout(id)
  }, [searchQuery])

  // Select farmer
  const handleSelectFarmer = (farmer: Farmer) => {
    setSelectedFarmer(farmer)
    setSearchQuery(farmer.name)
    setFarmers([])
  }

  // Remove selected farmer
  const handleRemoveFarmer = () => {
    setSelectedFarmer(null)
    setSearchQuery("")
  }

  // Validate form
  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!selectedFarmer) {
      newErrors.farmer = "Please select a farmer"
    }

    if (commissionRate < 0 || commissionRate > 100) {
      newErrors.commissionRate = "Commission rate must be between 0 and 100"
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  // Handle form submission
  const handleSubmit = async () => {
    if (!validateForm()) return

    setIsLoading(true)
    try {
      await createReferral({
        farmerId: selectedFarmer!._id,
        commissionRate: commissionRate / 100, // Convert to decimal
        notes: notes.trim() || undefined
      })

      toast({
        title: "Referral created",
        description: `Referral created for ${selectedFarmer!.name}`,
      })

      onCreateSuccess?.()
    } catch (error: any) {
      toast({
        title: "Creation failed",
        description: error.message || "Failed to create referral",
        variant: "destructive"
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Create New Referral</DialogTitle>
          <DialogDescription>
            Add a new farmer referral to track and manage.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Farmer Search */}
          <div className="space-y-2">
            <Label htmlFor="farmer-search">Select Farmer</Label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                id="farmer-search"
                placeholder="Search for farmer by name or email..."
                value={searchQuery}
                onChange={(e) => handleSearchChange(e.target.value)}
                className="pl-10"
              />
              {isSearching && (
                <Loader2 className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 animate-spin text-gray-400" />
              )}
            </div>
            {errors.farmer && (
              <p className="text-sm text-red-600">{errors.farmer}</p>
            )}

            {/* Selected Farmer */}
            {selectedFarmer && (
              <div className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className="h-8 w-8 bg-green-100 rounded-full flex items-center justify-center">
                    <User className="h-4 w-4 text-green-600" />
                  </div>
                  <div>
                    <p className="font-medium text-green-900">{selectedFarmer.name}</p>
                    <p className="text-sm text-green-700">{selectedFarmer.email}</p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleRemoveFarmer}
                  className="text-green-600 hover:text-green-700"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            )}

            {/* Search Results */}
            {farmers.length > 0 && !selectedFarmer && (
              <div className="max-h-48 overflow-y-auto border border-gray-200 rounded-lg">
                {farmers.map((farmer) => (
                  <button
                    key={farmer._id}
                    onClick={() => handleSelectFarmer(farmer)}
                    className="w-full flex items-center space-x-3 p-3 hover:bg-gray-50 text-left"
                  >
                    <div className="h-8 w-8 bg-gray-100 rounded-full flex items-center justify-center">
                      <User className="h-4 w-4 text-gray-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{farmer.name}</p>
                      <p className="text-sm text-gray-500 truncate">{farmer.email}</p>
                      <p className="text-xs text-gray-400 truncate">{farmer.location}</p>
                    </div>
                  </button>
                ))}
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
            <Label htmlFor="notes">Notes (Optional)</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add any additional notes about this referral..."
              rows={3}
            />
          </div>
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
            disabled={isLoading || !selectedFarmer}
          >
            {isLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Create Referral
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}