"use client"

import { useState, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { DashboardLayout } from "@/components/dashboard/dashboard-layout"
import { DashboardSubpageHeader } from "@/components/dashboard/dashboard-subpage-header"
import { DashboardPageShell } from "@/components/layout/dashboard-page-shell"
import { apiService } from "@/lib/api"
import { asRecord, getErrorMessage } from "@/lib/error-utils"
import type { Listing as ApiListing } from "@/lib/types"
import { useToast } from "@/hooks/use-toast"
import {
  ArrowLeft,
  Plus,
  Upload,
  Package,
  CheckCircle,
  AlertCircle
} from "lucide-react"
import Link from "next/link"
import Image from "next/image"
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

const categories = [
  { value: 'grains', label: 'Grains (Rice, Maize, Wheat)' },
  { value: 'tubers', label: 'Tubers (Cassava, Yam, Potato)' },
  { value: 'vegetables', label: 'Vegetables (Tomato, Pepper, Onion)' },
  { value: 'fruits', label: 'Fruits (Mango, Orange, Banana)' },
  { value: 'legumes', label: 'Legumes (Beans, Groundnut)' },
  { value: 'cash_crops', label: 'Cash Crops (Cocoa, Coffee, Tea)' }
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
  const [uploadingImages, setUploadingImages] = useState(false)

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

  const loadListingData = useCallback(async (id: string) => {
    try {
      setLoadingListing(true)
      console.log('Loading listing data for ID:', id)

      const response = await apiService.getListingForEdit(id)
      const rec = asRecord(response)
      const listingData = asRecord(rec.listing ?? rec.data ?? response)
      const loc = listingData.location

      if (!listingData || Object.keys(listingData).length === 0) {
        toast({
          title: "Listing Not Found",
          description: "The listing you're trying to edit could not be found.",
          variant: "destructive"
        })
        router.push("/dashboard/marketplace/listings")
        return
      }

      console.log('Loaded listing data:', listingData)

      // Pre-populate form with listing data
      setFormData({
        cropName: typeof listingData.cropName === "string" ? listingData.cropName : "",
        category: typeof listingData.category === "string" ? listingData.category : "",
        description: typeof listingData.description === "string" ? listingData.description : "",
        basePrice: Number(listingData.basePrice) || 0,
        quantity: Number(listingData.quantity) || 0,
        unit: typeof listingData.unit === "string" ? listingData.unit : "kg",
        availableQuantity: Number(listingData.availableQuantity ?? listingData.quantity) || 0,
        location: typeof loc === "string"
          ? loc
          : `${asRecord(loc).city || ""}, ${asRecord(loc).state || ""}`.trim(),
        images: Array.isArray(listingData.images) ? listingData.images.filter((img): img is string => typeof img === "string") : [],
        tags: Array.isArray(listingData.tags) ? listingData.tags.filter((t): t is string => typeof t === "string") : [],
        status: (typeof listingData.status === "string" ? listingData.status : "draft") as ListingFormData["status"],
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
  }, [router, toast])

  useEffect(() => {
    if (listingId) {
      loadListingData(listingId)
    }
  }, [listingId, loadListingData])

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

      await apiService.updateListing(listingId, updateData as Partial<ApiListing>)

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
        description: getErrorMessage(error, "Please try again."),
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

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return

    setUploadingImages(true)
    try {
      const uploadedUrls = await apiService.uploadImages(Array.from(files))
      if (uploadedUrls.length === 0) {
        throw new Error('No image URLs returned')
      }
      setFormData(prev => ({
        ...prev,
        images: [...prev.images, ...uploadedUrls]
      }))
    } catch (error) {
      console.error('Image upload failed:', error)
      toast({
        title: "Image upload failed",
        description: "Please try again.",
        variant: "destructive"
      })
    } finally {
      setUploadingImages(false)
      e.target.value = ''
    }
  }

  const removeImage = (imageToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      images: prev.images.filter(image => image !== imageToRemove)
    }))
  }

  if (loadingListing) {
    return (
      <DashboardLayout pageTitle="Edit Listing">
        <DashboardPageShell>
          <div className="flex items-center gap-4">
            <div className="h-6 bg-muted rounded w-32 animate-pulse"></div>
            <div className="h-6 bg-muted rounded w-48 animate-pulse"></div>
          </div>
          <Card className="border border-border">
            <CardContent className="p-6">
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mr-3"></div>
                <span className="text-muted-foreground">Loading listing data...</span>
              </div>
            </CardContent>
          </Card>
        </DashboardPageShell>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout pageTitle="Edit Listing">
      <DashboardPageShell>
        <Button variant="ghost" asChild className="w-fit text-muted-foreground hover:text-foreground">
          <Link href="/dashboard/marketplace/listings" className="flex items-center gap-2">
            <ArrowLeft className="h-4 w-4" />
            Back to Listings
          </Link>
        </Button>

        <DashboardSubpageHeader
          title="Edit Listing"
          description="Update your product listing information"
        />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Form */}
          <div className="lg:col-span-2">
            <Card className="border border-border">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base font-medium">
                  <Package className="h-4 w-4 text-primary" />
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
                    <h3 className="text-lg font-medium text-foreground">Basic Information</h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="cropName">Crop/Product Name *</Label>
                        <Input
                          id="cropName"
                          value={formData.cropName}
                          onChange={(e) => setFormData(prev => ({ ...prev, cropName: e.target.value }))}
                          placeholder="e.g., Fresh Maize, Cassava Tubers"
                          className={errors.cropName ? 'border-destructive' : ''}
                        />
                        {errors.cropName && (
                          <p className="text-sm text-destructive flex items-center gap-1">
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
                          <SelectTrigger className={errors.category ? 'border-destructive' : ''}>
                            <SelectValue placeholder="Select category" />
                          </SelectTrigger>
                          <SelectContent>
                            {categories.map((category) => (
                              <SelectItem key={category.value} value={category.value}>
                                {category.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        {errors.category && (
                          <p className="text-sm text-destructive flex items-center gap-1">
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
                        className={errors.description ? 'border-destructive' : ''}
                      />
                      {errors.description && (
                        <p className="text-sm text-destructive flex items-center gap-1">
                          <AlertCircle className="h-3 w-3" />
                          {errors.description}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Pricing and Quantity */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-medium text-foreground">Pricing & Quantity</h3>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="basePrice">Base Price (NGN) *</Label>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground">₦</span>
                          <Input
                            id="basePrice"
                            type="number"
                            value={formData.basePrice}
                            onChange={(e) => setFormData(prev => ({ ...prev, basePrice: Number(e.target.value) }))}
                            placeholder="0"
                            min="0"
                            step="10"
                            className={`pl-8 ${errors.basePrice ? 'border-destructive' : ''}`}
                          />
                        </div>
                        {errors.basePrice && (
                          <p className="text-sm text-destructive flex items-center gap-1">
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
                          className={errors.quantity ? 'border-destructive' : ''}
                        />
                        {errors.quantity && (
                          <p className="text-sm text-destructive flex items-center gap-1">
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
                        className={errors.availableQuantity ? 'border-destructive' : ''}
                      />
                      <p className="text-xs text-muted-foreground">
                        This should be less than or equal to total quantity
                      </p>
                      {errors.availableQuantity && (
                        <p className="text-sm text-destructive flex items-center gap-1">
                          <AlertCircle className="h-3 w-3" />
                          {errors.availableQuantity}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Location */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-medium text-foreground">Location</h3>

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
                          className={errors.location ? 'border-destructive' : ''}
                        />
                        {errors.location && (
                          <p className="text-sm text-destructive flex items-center gap-1">
                            <AlertCircle className="h-3 w-3" />
                            {errors.location}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Images */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-medium text-foreground">Product Images</h3>

                    <div className="space-y-4">
                      <div className="border-2 border-dashed border-border rounded-lg p-6 text-center">
                        <Upload className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                        <Label htmlFor="images" className={uploadingImages ? "cursor-wait" : "cursor-pointer"}>
                          <span className="text-sm text-muted-foreground">
                            {uploadingImages ? "Uploading..." : "Click to upload images or drag and drop"}
                          </span>
                          <Input
                            id="images"
                            type="file"
                            multiple
                            accept="image/*"
                            onChange={handleImageUpload}
                            disabled={uploadingImages}
                            className="hidden"
                          />
                        </Label>
                        <p className="text-xs text-muted-foreground mt-1">
                          PNG, JPG up to 5MB each
                        </p>
                      </div>

                      {formData.images.length > 0 && (
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                          {formData.images.map((image, index) => (
                            <div key={index} className="relative">
                              <Image
                                src={image}
                                alt={`Product ${index + 1}`}
                                width={200}
                                height={96}
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
                    <h3 className="text-lg font-medium text-foreground">Tags</h3>

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
                                className="ml-1 hover:text-destructive"
                              >
                                ×
                              </button>
                            </Badge>
                          ))}
                        </div>
                      )}

                      <div className="space-y-2">
                        <p className="text-sm text-muted-foreground">Popular tags:</p>
                        <div className="flex flex-wrap gap-2">
                          {popularTags.map((tag) => (
                            <Badge
                              key={tag}
                              variant="outline"
                              className={`cursor-pointer ${
                                formData.tags.includes(tag) ? 'bg-primary/10 text-primary border-primary/10' : ''
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
            <Card className="border border-border">
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-medium">Listing Preview</CardTitle>
                <CardDescription>How your listing will appear</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {formData.cropName ? (
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <Package className="h-5 w-5 text-primary" />
                      <div>
                        <h4 className="font-medium text-foreground">{formData.cropName}</h4>
                        <p className="text-sm text-muted-foreground">{formData.category}</p>
                      </div>
                    </div>

                    {formData.description && (
                      <p className="text-sm text-muted-foreground line-clamp-3">
                        {formData.description}
                      </p>
                    )}

                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Price:</span>
                        <span className="font-medium">
                          ₦{formData.basePrice > 0 ? formData.basePrice.toLocaleString() : '0'}/{formData.unit}
                        </span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Available:</span>
                        <span className="font-medium">
                          {formData.availableQuantity > 0 ? formData.availableQuantity : '0'} {formData.unit}
                        </span>
                      </div>
                      {formData.location && (
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Location:</span>
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
                  <div className="text-center py-8 text-muted-foreground">
                    <Package className="h-12 w-12 mx-auto mb-2" />
                    <p className="text-sm">Fill in the form to see a preview</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Tips */}
            <Card className="border border-border">
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-medium">Editing Tips</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-start gap-2 text-sm">
                  <CheckCircle className="h-4 w-4 text-success mt-0.5 flex-shrink-0" />
                  <span>Update product information to attract more buyers</span>
                </div>
                <div className="flex items-start gap-2 text-sm">
                  <CheckCircle className="h-4 w-4 text-success mt-0.5 flex-shrink-0" />
                  <span>Add fresh images to showcase your products</span>
                </div>
                <div className="flex items-start gap-2 text-sm">
                  <CheckCircle className="h-4 w-4 text-success mt-0.5 flex-shrink-0" />
                  <span>Adjust prices based on market conditions</span>
                </div>
                <div className="flex items-start gap-2 text-sm">
                  <CheckCircle className="h-4 w-4 text-success mt-0.5 flex-shrink-0" />
                  <span>Update quantities as you sell products</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </DashboardPageShell>
    </DashboardLayout>
  )
}
