"use client"

import { useState, useEffect, Suspense } from "react"
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
import { useRouter, useSearchParams } from "next/navigation"
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
  status: 'draft' | 'active'
}

interface HarvestData {
  id: string
  cropType: string
  variety?: string
  quantity: number
  unit: string
  location: string
  description?: string
  quality: string
  images?: string[]
  price?: number
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

const states = [
  'Abia', 'Adamawa', 'Akwa Ibom', 'Anambra', 'Bauchi', 'Bayelsa', 'Benue', 'Borno',
  'Cross River', 'Delta', 'Ebonyi', 'Edo', 'Ekiti', 'Enugu', 'FCT', 'Gombe',
  'Imo', 'Jigawa', 'Kaduna', 'Kano', 'Katsina', 'Kebbi', 'Kogi', 'Kwara',
  'Lagos', 'Nasarawa', 'Niger', 'Ogun', 'Ondo', 'Osun', 'Oyo', 'Plateau',
  'Rivers', 'Sokoto', 'Taraba', 'Yobe', 'Zamfara'
]

const popularTags = [
  'organic', 'fresh', 'local', 'premium', 'bulk', 'wholesale', 'retail',
  'high-yield', 'disease-resistant', 'fast-growing', 'seasonal', 'year-round'
]

function CreateListingPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const harvestId = searchParams.get('harvestId')

  const [loading, setLoading] = useState(false)
  const [loadingHarvest, setLoadingHarvest] = useState(false)
  const [harvestData, setHarvestData] = useState<HarvestData | null>(null)

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

  // Load harvest data if harvestId is provided
  useEffect(() => {
    if (harvestId) {
      loadHarvestData(harvestId)
    }
  }, [harvestId])

  const loadHarvestData = async (id: string) => {
    try {
      setLoadingHarvest(true)
      console.log('Loading harvest data for ID:', id)

      const response = await apiService.getHarvestById(id)
      const harvest = (response as any).harvest || response.data

      if (!harvest) {
        toast({
          title: "Harvest Not Found",
          description: "The harvest you're trying to list could not be found.",
          variant: "destructive"
        })
        router.push("/dashboard/harvests")
        return
      }

      console.log('Loaded harvest data:', harvest)

      setHarvestData({
        id: harvest._id,
        cropType: harvest.cropType,
        variety: harvest.variety,
        quantity: harvest.quantity,
        unit: harvest.unit,
        location: harvest.location,
        description: harvest.description,
        quality: harvest.quality,
        images: harvest.images,
        price: harvest.price
      })

      // Pre-populate form with harvest data
      setFormData(prev => ({
        ...prev,
        cropName: harvest.cropType,
        category: getCategoryFromCropType(harvest.cropType),
        description: harvest.description || `Fresh ${harvest.cropType} harvest`,
        quantity: harvest.quantity,
        unit: harvest.unit,
        availableQuantity: harvest.quantity,
        location: harvest.location,
        images: harvest.images || [],
        basePrice: harvest.price || 0,
        tags: harvest.quality ? [harvest.quality] : []
      }))

    } catch (error) {
      console.error('Failed to load harvest data:', error)
      toast({
        title: "Error Loading Harvest",
        description: "Failed to load harvest data. Please try again.",
        variant: "destructive"
      })
    } finally {
      setLoadingHarvest(false)
    }
  }

  const getCategoryFromCropType = (cropType: string): string => {
    const crop = cropType.toLowerCase()
    if (['maize', 'rice', 'wheat', 'millet', 'sorghum'].includes(crop)) return 'grains'
    if (['cassava', 'yam', 'potato', 'sweet potato'].includes(crop)) return 'tubers'
    if (['tomato', 'pepper', 'onion', 'lettuce', 'cabbage'].includes(crop)) return 'vegetables'
    if (['mango', 'orange', 'banana', 'pineapple'].includes(crop)) return 'fruits'
    if (['beans', 'groundnut', 'soybean'].includes(crop)) return 'legumes'
    if (['cocoa', 'coffee', 'tea'].includes(crop)) return 'cash_crops'
    return 'grains' // default
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

      if (harvestId && harvestData) {
        // Create listing from approved harvest
        console.log('Creating listing from harvest:', harvestId)

        const listingResponse = await apiService.createListingFromHarvest(
          harvestId,
          formData.basePrice,
          formData.description,
          formData.quantity,
          formData.unit
        )

        console.log('Listing created from harvest:', listingResponse)

        toast({
          title: "Harvest Listed Successfully! 🎉",
          description: "Your approved harvest is now live on the marketplace.",
          variant: "default"
        })

        // Refresh harvest data to show new status
        await apiService.getHarvests()

      } else {
        // Create new listing from scratch
        console.log('Creating new listing:', formData)

        const listingResponse = await apiService.createListing({
          cropName: formData.cropName,
          category: formData.category,
          description: formData.description,
          price: formData.basePrice,
          quantity: formData.quantity,
          unit: formData.unit,
          location: formData.location,
          images: formData.images,
          tags: formData.tags,
          status: formData.status
        } as any)

        console.log('New listing created:', listingResponse)

        toast({
          title: "Listing Created Successfully! 🎉",
          description: "Your product is now live on the marketplace.",
          variant: "default"
        })
      }

      router.push("/dashboard/marketplace")
    } catch (error) {
      console.error("Failed to create listing:", error)
      toast({
        title: "Creation Failed",
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

  return (
    <DashboardLayout pageTitle="Create New Listing">
      <div className="space-y-6">
        {/* Page Header */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-3">
              <Button variant="ghost" asChild className="text-gray-600 hover:text-gray-900">
                <Link href="/dashboard/marketplace" className="flex items-center gap-2">
                  <ArrowLeft className="h-4 w-4" />
                  Back to Marketplace
                </Link>
              </Button>
            </div>
            <h1 className="text-2xl font-semibold text-gray-900">
              {harvestId ? 'List Your Harvest' : 'Create New Listing'}
            </h1>
            <p className="text-gray-600">
              {harvestId
                ? 'Set a price and list your approved harvest on the marketplace'
                : 'List your agricultural products on the marketplace to reach more customers'
              }
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Form */}
          <div className="lg:col-span-2">
            {loadingHarvest ? (
              <Card className="border border-gray-200">
                <CardContent className="p-6">
                  <div className="flex items-center justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mr-3"></div>
                    <span className="text-gray-600">Loading harvest data...</span>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card className="border border-gray-200">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-base font-medium">
                    <Package className="h-4 w-4 text-blue-500" />
                    {harvestId ? 'Harvest Information' : 'Product Information'}
                  </CardTitle>
                  <CardDescription>
                    {harvestId
                      ? 'Review your harvest details and set your selling price'
                      : 'Fill in the details about your agricultural product'
                    }
                  </CardDescription>
                </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* Basic Information */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-medium text-gray-900">Basic Information</h3>
                      {harvestId && (
                        <Badge className="bg-green-50 text-green-700 border-green-200">
                          <CheckCircle className="h-3 w-3 mr-1" />
                          From Approved Harvest
                        </Badge>
                      )}
                    </div>
                    
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
                    <Button variant="outline" onClick={() => router.push("/dashboard/marketplace")} type="button">
                      Cancel
                    </Button>
                    <Button 
                      type="button" 
                      variant="outline"
                      onClick={() => setFormData(prev => ({ ...prev, status: 'draft' }))}
                    >
                      Save as Draft
                    </Button>
                    <Button type="submit" disabled={loading}>
                      {loading
                        ? (harvestId ? "Listing..." : "Creating...")
                        : (harvestId ? "List Harvest" : "Create Listing")
                      }
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
            )}
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
                <CardTitle className="text-base font-medium">Listing Tips</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-start gap-2 text-sm">
                  <CheckCircle className="h-4 w-4 text-emerald-500 mt-0.5 flex-shrink-0" />
                  <span>Use clear, descriptive product names</span>
                </div>
                <div className="flex items-start gap-2 text-sm">
                  <CheckCircle className="h-4 w-4 text-emerald-500 mt-0.5 flex-shrink-0" />
                  <span>Include high-quality images</span>
                </div>
                <div className="flex items-start gap-2 text-sm">
                  <CheckCircle className="h-4 w-4 text-emerald-500 mt-0.5 flex-shrink-0" />
                  <span>Set competitive pricing</span>
                </div>
                <div className="flex items-start gap-2 text-sm">
                  <CheckCircle className="h-4 w-4 text-emerald-500 mt-0.5 flex-shrink-0" />
                  <span>Add relevant tags for better visibility</span>
                </div>
                <div className="flex items-start gap-2 text-sm">
                  <CheckCircle className="h-4 w-4 text-emerald-500 mt-0.5 flex-shrink-0" />
                  <span>Keep quantities updated</span>
                </div>
              </CardContent>
            </Card>

            {/* Help */}
            <Card className="border border-gray-200">
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-medium">Need Help?</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-sm text-gray-600">
                  Having trouble creating your listing? Our support team is here to help.
                </p>
                <Button variant="outline" size="sm" className="w-full">
                  <Info className="h-4 w-4 mr-2" />
                  Contact Support
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}

// Wrapper component with Suspense boundary for useSearchParams
function CreateListingPageWrapper() {
  return (
    <Suspense fallback={
      <DashboardLayout pageTitle="Create Listing">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center space-y-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            <p className="text-lg font-medium">Loading...</p>
          </div>
        </div>
      </DashboardLayout>
    }>
      <CreateListingPage />
    </Suspense>
  )
}

export default CreateListingPageWrapper
