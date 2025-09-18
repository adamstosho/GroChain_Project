"use client"

import { useState, useEffect } from "react"
import { Plus, Search, Calendar, MapPin, QrCode, Eye, Edit, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { HarvestCard, type HarvestData } from "@/components/agricultural"
import { apiService } from "@/lib/api"
import type { Harvest } from "@/lib/types"
import Link from "next/link"
import Image from "next/image"

export default function HarvestsPage() {
  const [harvests, setHarvests] = useState<Harvest[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)

  useEffect(() => {
    fetchHarvests()
  }, [searchQuery, statusFilter, page])

  const fetchHarvests = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      if (searchQuery) params.set("cropType", searchQuery)
      if (statusFilter !== "all") params.set("status", statusFilter)
      params.set("page", String(page))
      params.set("limit", String(9))

      const response: any = await apiService.getHarvests({ page, limit: 9 })
      setHarvests(response.harvests || response.data?.harvests || [])
      const pg = response.pagination || response.data?.pagination
      if (pg) {
        setTotalPages(pg.pages || 1)
      } else {
        setTotalPages(1)
      }
    } catch (error) {
      console.error("Failed to fetch harvests:", error)
    } finally {
      setLoading(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-yellow-100 text-yellow-800"
      case "verified":
      case "approved":
        return "bg-green-100 text-green-800"
      case "rejected":
        return "bg-red-100 text-red-800"
      case "listed":
        return "bg-blue-100 text-blue-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const handleDeleteHarvest = async (harvestId: string) => {
    try {
      await apiService.deleteHarvest(harvestId)
      setHarvests(harvests.filter((h) => String((h as any)._id || (h as any).id) !== String(harvestId)))
    } catch (error) {
      console.error("Failed to delete harvest:", error)
    }
  }

  // Convert Harvest type to HarvestData type for our component
  const convertToHarvestData = (harvest: Harvest): HarvestData => {
    return {
      id: String((harvest as any)._id || (harvest as any).id),
      farmerName: (harvest as any).farmerName || (harvest as any).farmer?.name || "Unknown Farmer",
      cropType: harvest.cropType,
      variety: (harvest as any).variety || "Standard",
      harvestDate: new Date((harvest as any).date || (harvest as any).harvestDate || Date.now()),
      quantity: harvest.quantity,
      unit: harvest.unit,
      location: harvest.location,
      quality: (harvest as any).quality || "good",
      status: (harvest as any).status || "pending",
      qrCode: (harvest as any).qrCode || `HARVEST_${Date.now()}`,
      price: (harvest as any).price || 0,
      organic: (harvest as any).organic || false,
      moistureContent: (harvest as any).moistureContent || 15,
      grade: (harvest as any).grade || "B"
    }
  }

  const handleHarvestAction = (action: string, harvestId: string) => {
    switch (action) {
      case "view":
        // Navigate to harvest detail page
        window.location.href = `/harvests/${harvestId}`
        break
      case "edit":
        // Navigate to edit page
        window.location.href = `/harvests/${harvestId}/edit`
        break
      case "approve":
        // Handle approval logic
        console.log("Approving harvest:", harvestId)
        break
      case "reject":
        // Handle rejection logic
        console.log("Rejecting harvest:", harvestId)
        break
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-yellow-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold text-gray-900 mb-2">Harvest Management</h1>
            <p className="text-gray-600">Track and manage your agricultural harvests</p>
          </div>
          <Button asChild className="mt-4 md:mt-0">
            <Link href="/harvests/new" className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Log New Harvest
            </Link>
          </Button>
        </div>

        {/* Filters */}
        <div className="mb-8 space-y-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search harvests by crop, location, or batch..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full md:w-48">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="verified">Verified</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
                <SelectItem value="listed">Listed</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Harvests Grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <Card key={i} className="animate-pulse">
                <div className="h-48 bg-gray-200 rounded-t-lg"></div>
                <CardContent className="p-4">
                  <div className="h-4 bg-gray-200 rounded mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded mb-4"></div>
                  <div className="h-6 bg-gray-200 rounded"></div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {harvests.map((harvest) => (
              <HarvestCard
                key={(harvest as any).id || (harvest as any)._id}
                harvest={convertToHarvestData(harvest)}
                onView={(id) => handleHarvestAction("view", id)}
                onEdit={(id) => handleHarvestAction("edit", id)}
                onApprove={(id) => handleHarvestAction("approve", id)}
                onReject={(id) => handleHarvestAction("reject", id)}
              />
            ))}
          </div>
        )}

        {harvests.length === 0 && !loading && (
          <div className="text-center py-12">
            <div className="text-gray-400 mb-4">
              <Calendar className="h-16 w-16 mx-auto" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No harvests found</h3>
            <p className="text-gray-600 mb-4">Start by logging your first harvest</p>
            <Button asChild>
              <Link href="/harvests/new">Log New Harvest</Link>
            </Button>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 mt-8">
            <Button
              variant="outline"
              className="bg-transparent"
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
            >
              Prev
            </Button>
            <span className="text-sm text-gray-600">
              Page {page} of {totalPages}
            </span>
            <Button
              variant="outline"
              className="bg-transparent"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            >
              Next
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}
