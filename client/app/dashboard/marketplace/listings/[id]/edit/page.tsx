"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { DashboardLayout } from "@/components/dashboard/dashboard-layout"
import { apiService } from "@/lib/api"
import { useToast } from "@/hooks/use-toast"
import {
  ArrowLeft,
  Plus,
  Upload,
  Tag,
  MapPin,
  Banknote,
  Package,
  Info,
  CheckCircle,
  AlertCircle
} from "lucide-react"
import Link from "next/link"
import { useRouter, useParams } from "next/navigation"
import { Badge } from "@/components/ui/badge"

interface ListingFormData {
  cropName: string
  category: string
  description: string
  basePrice: number
  quantity: number
  unit: string
  availableQuantity: number
  location: string
  images: string[]
  tags: string[]
  status: 'draft' | 'active' | 'inactive' | 'sold_out'
}

interface Listing {
  _id: string
  farmer: {
    _id: string
    name: string
    email: string
  }
  cropName: string
  category: string
  description: string
  basePrice: number
  unit: string
  quantity: number
  availableQuantity: number
  images: string[]
  location: string
  status: 'draft' | 'active' | 'inactive' | 'sold_out' | 'paused'
  tags: string[]
  qualityGrade: string
  organic: boolean
  harvestDate: string
  expiryDate: string
  views: number
  favorites: number
  orders: number
  rating: number
  reviews: number
  createdAt: string
  updatedAt: string
}

const categories = [
  { value: 'grains', label: 'Grains (Rice, Maize, Wheat)', icon: '🌾' },
  { value: 'tubers', label: 'Tubers (Cassava, Yam, Potato)', icon: '🥔' },
  { value: 'vegetables', label: 'Vegetables (Tomato, Pepper, Onion)', icon: '🥬' },
  { value: 'fruits', label: 'Fruits (Mango, Orange, Banana)', icon: '🍎' },
  { value: 'legumes', label: 'Legumes (Beans, Groundnut)', icon: '🫘' },
  { value: 'cash_crops', label: 'Cash Crops (Cocoa, Coffee, Tea)', icon: '☕' }
]

const units = [
  { value: 'kg', label: 'Kilograms (kg)' },
  { value: 'tons', label: 'Tons (t)' },
  { value: 'pieces', label: 'Pieces (pcs)' },
  { value: 'bags', label: 'Bags (50kg)' },
  { value: 'baskets', label: 'Baskets' },
  { value: 'bundles', label: 'Bundles' }
]

const popularTags = [
  'organic', 'fresh', 'local', 'premium', 'bulk', 'wholesale', 'retail',
  'high-yield', 'disease-resistant', 'fast-growing', 'seasonal', 'year-round'
]

export default function EditListingPage() {
  const router = useRouter()
  const params = useParams()
  const listingId = params.id as string

  const [loading, setLoading] = useState(false)
  const [loadingListing, setLoadingListing] = useState(false)
  const [listing, setListing] = useState<Listing | null>(null)

  const [formData, setFormData] = useState<ListingFormData>({
    cropName: '',
    category: '',
    description: '',
    basePrice: 0,
    quantity: 0,
    unit: 'kg',
    availableQuantity: 0,
    location: '',
    images: [],
    tags: [],
    status: 'draft'
  })
  const [newTag, setNewTag] = useState("")
  const [errors, setErrors] = useState<Record<string, string>>({})

  const { toast } = useToast()

  // Load listing data when component mounts
  useEffect(() => {
    if (listingId) {
      loadListingData(listingId)
    }
  }, [listingId])

  const loadListingData = async (id: string) => {
    try {
      setLoadingListing(true)
      console.log('Loading listing data for ID:', id)

      const response = await apiService.getListingForEdit(id)
      const listingData = (response as any).listing || response.data || response

      if (!listingData) {
        toast({
          title: "Listing Not Found",
          description: "The listing you're trying to edit could not be found.",
          variant: "destructive"
        })
        router.push("/dashboard/marketplace/listings")
        return
      }

      console.log('Loaded listing data:', listingData)

      setListing(listingData)

      // Pre-populate form with listing data
      setFormData({
        cropName: listingData.cropName || '',
        category: listingData.category || '',
        description: listingData.description || '',
        basePrice: listingData.basePrice || 0,
        quantity: listingData.quantity || 0,
        unit: listingData.unit || 'kg',
        availableQuantity: listingData.availableQuantity || listingData.quantity || 0,
        location: typeof listingData.location === 'string'
          ? listingData.location
          : `${listingData.location?.city || ''}, ${listingData.location?.state || ''}`.trim(),
        images: listingData.images || [],
        tags: listingData.tags || [],
        status: listingData.status || 'draft'
      })

    } catch (error) {
      console.error('Failed to load listing data:', error)
      toast({
        title: "Error Loading Listing",
        description: "Failed to load listing data. Please try again.",
        variant: "destructive"
      })
    } finally {
      setLoadingListing(false)
    }
  }

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!formData.cropName.trim()) {
      newErrors.cropName = 'Crop name is required'
    }
    if (!formData.category) {
      newErrors.category = 'Category is required'
    }
    if (!formData.description.trim()) {
      newErrors.description = 'Description is required'
    }
    if (formData.basePrice <= 0) {
      newErrors.basePrice = 'Price must be greater than 0'
    }
    if (formData.quantity <= 0) {
      newErrors.quantity = 'Quantity must be greater than 0'
    }
    if (formData.availableQuantity <= 0) {
      newErrors.availableQuantity = 'Available quantity must be greater than 0'
    }
    if (formData.availableQuantity > formData.quantity) {
      newErrors.availableQuantity = 'Available quantity cannot exceed total quantity'
    }
    if (!formData.location.trim()) {
      newErrors.location = 'Location is required'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields correctly.",
        variant: "destructive"
      })
      return
    }

    try {
      setLoading(true)

      console.log('Updating listing:', listingId, formData)

      const updateData = {
        cropName: formData.cropName,
        category: formData.category,
        description: formData.description,
        basePrice: formData.basePrice,
        quantity: formData.quantity,
        unit: formData.unit,
        availableQuantity: formData.availableQuantity,
        location: formData.location,
        images: formData.images,
        tags: formData.tags,
        status: formData.status
      }

      await apiService.updateListing(listingId, updateData as any)

      toast({
        title: "Listing Updated Successfully! 🎉",
        description: "Your listing has been updated and saved.",
        variant: "default"
      })

      router.push("/dashboard/marketplace/listings")

    } catch (error) {
      console.error("Failed to update listing:", error)
      toast({
        title: "Update Failed",
        description: (error as any)?.message || "Please try again.",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const addTag = () => {
    if (newTag.trim() && !formData.tags.includes(newTag.trim().toLowerCase())) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, newTag.trim().toLowerCase()]
      }))
      setNewTag("")
    }
  }

  const removeTag = (tagToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }))
  }

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (files) {
      // Mock image upload - replace with actual image upload logic
      const imageUrls = Array.from(files).map(file => URL.createObjectURL(file))
      setFormData(prev => ({
        ...prev,
        images: [...prev.images, ...imageUrls]
      }))
    }
  }

  const removeImage = (imageToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      images: prev.images.filter(image => image !== imageToRemove)
    }))
  }

  const getCategoryIcon = (category: string) => {
    const found = categories.find(cat => cat.value === category)
    return found ? found.icon : '🌱'
  }

  if (loadingListing) {
    return (
      <DashboardLayout pageTitle="Edit Listing">
        <div className="space-y-6">
          <div className="flex items-center gap-4">
            <div className="h-6 bg-gray-200 rounded w-32 animate-pulse"></div>
            <div className="h-6 bg-gray-200 rounded w-48 animate-pulse"></div>
          </div>
          <Card className="border border-gray-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mr-3"></div>
                <span className="text-gray-600">Loading listing data...</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout pageTitle="Edit Listing">
      <div className="space-y-6">
        {/* Page Header */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-3">
              <Button variant="ghost" asChild className="text-gray-600 hover:text-gray-900">
                <Link href="/dashboard/marketplace/listings" className="flex items-center gap-2">
                  <ArrowLeft className="h-4 w-4" />
                  Back to Listings
                </Link>
              </Button>
            </div>
            <h1 className="text-2xl font-semibold text-gray-900">
              Edit Listing
            </h1>
            <p className="text-gray-600">
              Update your product listing information
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Form */}
          <div className="lg:col-span-2">
            <Card className="border border-gray-200">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base font-medium">
                  <Package className="h-4 w-4 text-blue-500" />
                  Product Information
                </CardTitle>
                <CardDescription>
                  Update the details about your agricultural product
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* Basic Information */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-medium text-gray-900">Basic Information</h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="cropName">Crop/Product Name *</Label>
                        <Input
                          id="cropName"
                          value={formData.cropName}
                          onChange={(e) => setFormData(prev => ({ ...prev, cropName: e.target.value }))}
                          placeholder="e.g., Fresh Maize, Cassava Tubers"
                          className={errors.cropName ? 'border-red-500' : ''}
                        />
                        {errors.cropName && (
                          <p className="text-sm text-red-600 flex items-center gap-1">
                            <AlertCircle className="h-3 w-3" />
                            {errors.cropName}
                          </p>
                        )}
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="category">Category *</Label>
                        <Select
                          value={formData.category}
                          onValueChange={(value) => setFormData(prev => ({ ...prev, category: value }))}
                        >
                          <SelectTrigger className={errors.category ? 'border-red-500' : ''}>
                            <SelectValue placeholder="Select category" />
                          </SelectTrigger>
                          <SelectContent>
                            {categories.map((category) => (
                              <SelectItem key={category.value} value={category.value}>
                                <span className="flex items-center gap-2">
                                  <span>{category.icon}</span>
                                  <span>{category.label}</span>
                                </span>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        {errors.category && (
                          <p className="text-sm text-red-600 flex items-center gap-1">
                            <AlertCircle className="h-3 w-3" />
                            {errors.category}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="description">Description *</Label>
                      <Textarea
                        id="description"
                        value={formData.description}
                        onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                        placeholder="Describe your product, its quality, benefits, and any special features..."
                        rows={4}
                        className={errors.description ? 'border-red-500' : ''}
                      />
                      {errors.description && (
                        <p className="text-sm text-red-600 flex items-center gap-1">
                          <AlertCircle className="h-3 w-3" />
                          {errors.description}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Pricing and Quantity */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-medium text-gray-900">Pricing & Quantity</h3>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="basePrice">Base Price (NGN) *</Label>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">₦</span>
                          <Input
                            id="basePrice"
                            type="number"
                            value={formData.basePrice}
                            onChange={(e) => setFormData(prev => ({ ...prev, basePrice: Number(e.target.value) }))}
                            placeholder="0"
                            min="0"
                            step="10"
                            className={`pl-8 ${errors.basePrice ? 'border-red-500' : ''}`}
                          />
                        </div>
                        {errors.basePrice && (
                          <p className="text-sm text-red-600 flex items-center gap-1">
                            <AlertCircle className="h-3 w-3" />
                            {errors.basePrice}
                          </p>
                        )}
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="unit">Unit *</Label>
                        <Select
                          value={formData.unit}
                          onValueChange={(value) => setFormData(prev => ({ ...prev, unit: value }))}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {units.map((unit) => (
                              <SelectItem key={unit.value} value={unit.value}>
                                {unit.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="quantity">Total Quantity *</Label>
                        <Input
                          id="quantity"
                          type="number"
                          value={formData.quantity}
                          onChange={(e) => setFormData(prev => ({ ...prev, quantity: Number(e.target.value) }))}
                          placeholder="0"
                          min="0"
                          step="1"
                          className={errors.quantity ? 'border-red-500' : ''}
                        />
                        {errors.quantity && (
                          <p className="text-sm text-red-600 flex items-center gap-1">
                            <AlertCircle className="h-3 w-3" />
                            {errors.quantity}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="availableQuantity">Available Quantity *</Label>
                      <Input
                        id="availableQuantity"
                        type="number"
                        value={formData.availableQuantity}
                        onChange={(e) => setFormData(prev => ({ ...prev, availableQuantity: Number(e.target.value) }))}
                        placeholder="0"
                        min="0"
                        max={formData.quantity}
                        step="1"
                        className={errors.availableQuantity ? 'border-red-500' : ''}
                      />
                      <p className="text-xs text-gray-500">
                        This should be less than or equal to total quantity
                      </p>
                      {errors.availableQuantity && (
                        <p className="text-sm text-red-600 flex items-center gap-1">
                          <AlertCircle className="h-3 w-3" />
                          {errors.availableQuantity}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Location */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-medium text-gray-900">Location</h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="location">Location *</Label>
                        <Input
                          id="location"
                          value={formData.location}
                          onChange={(e) => setFormData(prev => ({
                            ...prev,
                            location: e.target.value
                          }))}
                          placeholder="e.g., Ibadan, Oyo State, Nigeria"
                          className={errors.location ? 'border-red-500' : ''}
                        />
                        {errors.location && (
                          <p className="text-sm text-red-600 flex items-center gap-1">
                            <AlertCircle className="h-3 w-3" />
                            {errors.location}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Images */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-medium text-gray-900">Product Images</h3>

                    <div className="space-y-4">
                      <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                        <Upload className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                        <Label htmlFor="images" className="cursor-pointer">
                          <span className="text-sm text-gray-600">
                            Click to upload images or drag and drop
                          </span>
                          <Input
                            id="images"
                            type="file"
                            multiple
                            accept="image/*"
                            onChange={handleImageUpload}
                            className="hidden"
                          />
                        </Label>
                        <p className="text-xs text-gray-500 mt-1">
                          PNG, JPG up to 5MB each
                        </p>
                      </div>

                      {formData.images.length > 0 && (
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                          {formData.images.map((image, index) => (
                            <div key={index} className="relative">
                              <img
                                src={image}
                                alt={`Product ${index + 1}`}
                                className="w-full h-24 object-cover rounded-lg"
                              />
                              <Button
                                type="button"
                                variant="destructive"
                                size="sm"
                                className="absolute -top-2 -right-2 h-6 w-6 rounded-full p-0"
                                onClick={() => removeImage(image)}
                              >
                                ×
                              </Button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Tags */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-medium text-gray-900">Tags</h3>

                    <div className="space-y-3">
                      <div className="flex gap-2">
                        <Input
                          value={newTag}
                          onChange={(e) => setNewTag(e.target.value)}
                          placeholder="Add a tag..."
                          onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
                        />
                        <Button type="button" variant="outline" onClick={addTag}>
                          <Plus className="h-4 w-4" />
                        </Button>
                      </div>

                      {formData.tags.length > 0 && (
                        <div className="flex flex-wrap gap-2">
                          {formData.tags.map((tag) => (
                            <Badge key={tag} variant="secondary" className="gap-1">
                              {tag}
                              <button
                                type="button"
                                onClick={() => removeTag(tag)}
                                className="ml-1 hover:text-red-600"
                              >
                                ×
                              </button>
                            </Badge>
                          ))}
                        </div>
                      )}

                      <div className="space-y-2">
                        <p className="text-sm text-gray-600">Popular tags:</p>
                        <div className="flex flex-wrap gap-2">
                          {popularTags.map((tag) => (
                            <Badge
                              key={tag}
                              variant="outline"
                              className={`cursor-pointer ${
                                formData.tags.includes(tag) ? 'bg-blue-50 text-blue-700 border-blue-200' : ''
                              }`}
                              onClick={() => {
                                if (formData.tags.includes(tag)) {
                                  removeTag(tag)
                                } else {
                                  setFormData(prev => ({ ...prev, tags: [...prev.tags, tag] }))
                                }
                              }}
                            >
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Form Actions */}
                  <div className="flex gap-3 pt-4">
                    <Button variant="outline" onClick={() => router.push("/dashboard/marketplace/listings")} type="button">
                      Cancel
                    </Button>
                    <Button
                      variant="outline"
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, status: 'draft' }))}
                    >
                      Save as Draft
                    </Button>
                    <Button type="submit" disabled={loading}>
                      {loading
                        ? "Updating..."
                        : "Update Listing"
                      }
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Listing Preview */}
            <Card className="border border-gray-200">
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-medium">Listing Preview</CardTitle>
                <CardDescription>How your listing will appear</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {formData.cropName ? (
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <span className="text-2xl">{getCategoryIcon(formData.category)}</span>
                      <div>
                        <h4 className="font-medium text-gray-900">{formData.cropName}</h4>
                        <p className="text-sm text-gray-500">{formData.category}</p>
                      </div>
                    </div>

                    {formData.description && (
                      <p className="text-sm text-gray-600 line-clamp-3">
                        {formData.description}
                      </p>
                    )}

                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Price:</span>
                        <span className="font-medium">
                          ₦{formData.basePrice > 0 ? formData.basePrice.toLocaleString() : '0'}/{formData.unit}
                        </span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Available:</span>
                        <span className="font-medium">
                          {formData.availableQuantity > 0 ? formData.availableQuantity : '0'} {formData.unit}
                        </span>
                      </div>
                      {formData.location && (
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">Location:</span>
                          <span className="font-medium">
                            {formData.location}
                          </span>
                        </div>
                      )}
                    </div>

                    {formData.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {formData.tags.map((tag) => (
                          <Badge key={tag} variant="secondary" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <Package className="h-12 w-12 mx-auto mb-2" />
                    <p className="text-sm">Fill in the form to see a preview</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Tips */}
            <Card className="border border-gray-200">
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-medium">Editing Tips</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-start gap-2 text-sm">
                  <CheckCircle className="h-4 w-4 text-emerald-500 mt-0.5 flex-shrink-0" />
                  <span>Update product information to attract more buyers</span>
                </div>
                <div className="flex items-start gap-2 text-sm">
                  <CheckCircle className="h-4 w-4 text-emerald-500 mt-0.5 flex-shrink-0" />
                  <span>Add fresh images to showcase your products</span>
                </div>
                <div className="flex items-start gap-2 text-sm">
                  <CheckCircle className="h-4 w-4 text-emerald-500 mt-0.5 flex-shrink-0" />
                  <span>Adjust prices based on market conditions</span>
                </div>
                <div className="flex items-start gap-2 text-sm">
                  <CheckCircle className="h-4 w-4 text-emerald-500 mt-0.5 flex-shrink-0" />
                  <span>Update quantities as you sell products</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
