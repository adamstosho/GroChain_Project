"use client"

import { useState, useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Slider } from "@/components/ui/slider"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Progress } from "@/components/ui/progress"
import {
  CalendarIcon,
  Leaf,
  MapPin,
  Scale,
  Thermometer,
  Camera,
  Upload,
  Save,
  X,
  Navigation,
  Loader2,
  AlertCircle,
  CheckCircle2
} from "lucide-react"
import { cn } from "@/lib/utils"
import { format } from "date-fns"
import { useGeolocation } from "@/hooks/useGeolocation"
import { useToast } from "@/hooks/use-toast"

interface HarvestFormProps {
  initialData?: Partial<HarvestFormData>
  onSubmit: (data: HarvestFormData & { images: string[] }) => void
  onCancel?: () => void
  onFormChange?: () => void
  isLoading?: boolean
  mode?: "create" | "edit"
}


const harvestSchema = z.object({
  cropType: z.string().min(1, "Crop type is required"),
  variety: z.string().min(1, "Variety is required"),
  harvestDate: z.date({
    required_error: "Harvest date is required",
  }),
  quantity: z.number().min(0.1, "Quantity must be greater than 0"),
  unit: z.enum(["kg", "tons", "bags", "pieces", "liters"]),
  location: z.string().min(1, "Location is required"),
  coordinates: z.object({
    latitude: z.number(),
    longitude: z.number(),
  }).optional(),
  quality: z.enum(["excellent", "good", "fair", "poor"]),
  grade: z.enum(["A", "B", "C"]),
  organic: z.boolean().default(false),
  moistureContent: z.number().min(0).max(100),
  price: z.number().min(0, "Price must be greater than 0"),
  notes: z.string().optional(),
  images: z.array(z.string()).optional(),
  certification: z.string().optional(),
  soilType: z.enum(["clay", "loam", "sandy", "silt", "other"]).optional(),
  irrigationType: z.enum(["rainfed", "irrigated", "mixed"]).optional(),
  pestManagement: z.enum(["organic", "conventional", "integrated"]).optional(),
})

export type HarvestFormData = z.infer<typeof harvestSchema>


const cropTypes = [
  "Rice", "Maize", "Cassava", "Yam", "Sorghum", "Millet", "Beans", "Groundnut",
  "Soybean", "Cotton", "Cocoa", "Coffee", "Tea", "Banana", "Plantain", "Pineapple",
  "Mango", "Orange", "Lemon", "Tomato", "Pepper", "Onion", "Garlic", "Carrot",
  "Cabbage", "Lettuce", "Spinach", "Okra", "Eggplant", "Cucumber", "Watermelon",
  "Melon", "Pumpkin", "Sweet Potato", "Irish Potato", "Ginger", "Turmeric"
]

const soilTypes = [
  { value: "clay", label: "Clay", description: "Heavy, retains water well" },
  { value: "loam", label: "Loam", description: "Balanced, ideal for most crops" },
  { value: "sandy", label: "Sandy", description: "Light, drains quickly" },
  { value: "silt", label: "Silt", description: "Fine particles, good fertility" },
  { value: "other", label: "Other", description: "Mixed or specialized soil" }
]

const irrigationTypes = [
  { value: "rainfed", label: "Rainfed", description: "Depends on natural rainfall" },
  { value: "irrigated", label: "Irrigated", description: "Artificial water supply" },
  { value: "mixed", label: "Mixed", description: "Combination of both" }
]

const pestManagementTypes = [
  { value: "organic", label: "Organic", description: "Natural pest control methods" },
  { value: "conventional", label: "Conventional", description: "Chemical pesticides" },
  { value: "integrated", label: "Integrated", description: "Combined approach" }
]

export function HarvestForm({
  initialData,
  onSubmit,
  onCancel,
  onFormChange,
  isLoading = false,
  mode = "create"
}: HarvestFormProps) {
  const [images, setImages] = useState<string[]>(initialData?.images || [])
  const [uploadingImages, setUploadingImages] = useState(false)
  const [showAdvanced, setShowAdvanced] = useState(false)
  const [locationStatus, setLocationStatus] = useState<'idle' | 'detecting' | 'success' | 'error'>('idle')

  const { location: geoLocation, loading: geoLoading, error: geoError, requestLocation } = useGeolocation()
  const { toast } = useToast()

  // Initialize form BEFORE any useEffect that uses it
  const form = useForm<HarvestFormData>({
    resolver: zodResolver(harvestSchema),
    defaultValues: {
      cropType: initialData?.cropType || "",
      variety: initialData?.variety || "",
      harvestDate: initialData?.harvestDate || new Date(),
      quantity: initialData?.quantity || 0,
      unit: initialData?.unit || "kg",
      location: initialData?.location || "",
      quality: initialData?.quality || "good",
      grade: initialData?.grade || "B",
      organic: initialData?.organic || false,
      moistureContent: initialData?.moistureContent || 15,
      price: initialData?.price || 0,
      notes: initialData?.notes || "",
      soilType: initialData?.soilType || "loam",
      irrigationType: initialData?.irrigationType || "rainfed",
      pestManagement: initialData?.pestManagement || "conventional",
    },
  })

  // Auto-populate location and coordinates when geolocation is available
  useEffect(() => {
    if (geoLocation && !geoLoading && !geoError) {
      setLocationStatus('success')
      form.setValue('coordinates', {
        latitude: geoLocation.lat,
        longitude: geoLocation.lng
      })

      // Set location string if not already set
      if (!form.getValues('location')) {
        const locationString = `${geoLocation.city || 'Current Location'}, ${geoLocation.state || 'Unknown State'}`
        form.setValue('location', locationString)

        toast({
          title: "Location Detected",
          description: `Automatically set location to ${locationString}`,
        })
      }
    } else if (geoError) {
      setLocationStatus('error')
    } else if (geoLoading) {
      setLocationStatus('detecting')
    }
  }, [geoLocation, geoLoading, geoError, form, toast])

  // Notify parent component about form changes
  useEffect(() => {
    if (onFormChange) {
      const subscription = form.watch(() => {
        onFormChange()
      })
      return () => subscription.unsubscribe()
    }
  }, [form, onFormChange])

  const handleGetLocation = async () => {
    setLocationStatus('detecting')
    try {
      await requestLocation()
    } catch (error) {
      setLocationStatus('error')
      toast({
        title: "Location Error",
        description: "Unable to get your current location. Please enter manually.",
        variant: "destructive"
      })
    }
  }

  const handleSubmit = async (data: HarvestFormData) => {
    try {
      // Validate required fields
      if (!data.cropType || !data.variety || !data.location) {
        toast({
          title: "Validation Error",
          description: "Please fill in all required fields.",
          variant: "destructive"
        })
        return
      }

      // Ensure coordinates are set if location is provided
      const finalData = { ...data }
      if (data.location && !data.coordinates) {
        // Try to get coordinates from geolocation if available
        if (geoLocation) {
          finalData.coordinates = {
            latitude: geoLocation.lat,
            longitude: geoLocation.lng
          }
        }
      }

      // Filter out blob URLs and only include successfully uploaded images
      const validImages = images.filter(url => url && !url.startsWith('blob:'))

      await onSubmit({
        ...finalData,
        images: validImages,
      })

      toast({
        title: "Success",
        description: mode === "edit"
          ? "Harvest updated successfully!"
          : "Harvest created successfully!",
        variant: "default"
      })
    } catch (error) {
      console.error("Form submission error:", error)
      toast({
        title: "Error",
        description: "Failed to save harvest. Please try again.",
        variant: "destructive"
      })
    }
  }

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return

    const maxFileSize = 5 * 1024 * 1024 // 5MB
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
    const maxImages = 10

    // Check total image count
    if (images.length + files.length > maxImages) {
      toast({
        title: "Too Many Images",
        description: `You can only upload up to ${maxImages} images total.`,
        variant: "destructive"
      })
      return
    }

    const validFiles: File[] = []

    // Validate all files first
    for (const file of Array.from(files)) {
      if (file.size > maxFileSize) {
        toast({
          title: "File Too Large",
          description: `${file.name} is larger than 5MB. Please choose a smaller file.`,
          variant: "destructive"
        })
        continue
      }

      if (!allowedTypes.includes(file.type)) {
        toast({
          title: "Invalid File Type",
          description: `${file.name} is not a supported image format. Please use JPEG, PNG, GIF, or WebP.`,
          variant: "destructive"
        })
        continue
      }

      validFiles.push(file)
    }

    if (validFiles.length === 0) return

    try {
      setUploadingImages(true)

      const uploadedUrls: string[] = []

      // Upload each image to backend/cloud storage
      for (const file of validFiles) {
        try {
          console.log('🔄 Starting upload for:', file.name)

          // Upload via our backend API endpoint using ApiService
          const formData = new FormData()
          formData.append('file', file)

          // Make direct request to backend (since ApiService expects JSON)
          const backendUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5000'
          const uploadUrl = `${backendUrl}/api/upload/image`

          console.log('📤 Upload URL:', uploadUrl)

          const response = await fetch(uploadUrl, {
            method: 'POST',
            body: formData,
            headers: {
              // Include auth token if available
              ...(localStorage.getItem('grochain_auth_token') && {
                'Authorization': `Bearer ${localStorage.getItem('grochain_auth_token')}`
              })
            }
          })

          console.log('📊 Upload response status:', response.status)

          if (response.ok) {
            const data = await response.json()
            console.log('✅ Upload successful for:', file.name, 'Response:', data)

            if (data.status === 'success' && data.url) {
              uploadedUrls.push(data.url)
              console.log('✅ Added URL to uploaded list:', data.url)
            } else {
              console.error('❌ Invalid response format:', data)
              toast({
                title: "Upload Failed",
                description: `Invalid response from server for ${file.name}`,
                variant: "destructive"
              })
              return
            }
          } else {
            let errorMessage = `Failed to upload ${file.name}`
            try {
              const errorData = await response.json()
              errorMessage = errorData.message || errorMessage
              console.error('❌ Upload failed with JSON error:', errorData)
            } catch {
              const errorText = await response.text()
              console.error('❌ Upload failed with text error:', errorText)
              errorMessage = `Server error (${response.status}) for ${file.name}`
            }

            toast({
              title: "Upload Failed",
              description: errorMessage,
              variant: "destructive"
            })
            return
          }
        } catch (uploadError) {
          console.error('❌ Upload error for:', file.name, uploadError)
          toast({
            title: "Upload Error",
            description: `Network error uploading ${file.name}. Please check your connection.`,
            variant: "destructive"
          })
          return
        }
      }

      // Only add successfully uploaded URLs (filter out any that failed)
      const successfulUploads = uploadedUrls.filter(url => url && !url.startsWith('blob:'))

      if (successfulUploads.length > 0) {
        setImages(prev => [...prev, ...successfulUploads])
        toast({
          title: "Images Uploaded",
          description: `${successfulUploads.length} image(s) uploaded successfully to cloud storage`,
        })
      }

      // Show warning if some uploads failed
      const failedCount = uploadedUrls.length - successfulUploads.length
      if (failedCount > 0) {
        toast({
          title: "Some Uploads Failed",
          description: `${failedCount} image(s) failed to upload. Only successfully uploaded images will be saved.`,
          variant: "destructive"
        })
      }
    } catch (error) {
      console.error('Image processing error:', error)
      toast({
        title: "Upload Failed",
        description: "Failed to upload images. Please try again.",
        variant: "destructive"
      })
    } finally {
      setUploadingImages(false)
    }
  }

  const removeImage = (index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index))
  }

  return (
    <Card className="w-full max-w-6xl mx-auto shadow-sm">
      <CardHeader className="px-4 sm:px-6 py-4 sm:py-6">
        <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
          <Leaf className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
          {mode === "create" ? "Log New Harvest" : "Edit Harvest"}
        </CardTitle>
        <CardDescription className="text-sm sm:text-base">
          Record your harvest details for transparency and traceability
        </CardDescription>
      </CardHeader>

      <CardContent className="px-4 sm:px-6 py-4 sm:py-6 max-h-[calc(100vh-12rem)] overflow-y-auto">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4 sm:space-y-6">
            {/* Basic Information */}
            <div className="space-y-4">
              <h3 className="text-base sm:text-lg font-semibold text-foreground">Basic Information</h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <FormField
                  control={form.control}
                  name="cropType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Crop Type *</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select crop type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {cropTypes.map((crop) => (
                            <SelectItem key={crop} value={crop}>
                              {crop}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="variety"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Variety *</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., Basmati, Sweet Corn" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                <FormField
                  control={form.control}
                  name="harvestDate"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>Harvest Date *</FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant="outline"
                              className={cn(
                                "w-full pl-3 text-left font-normal",
                                !field.value && "text-muted-foreground"
                              )}
                            >
                              {field.value ? (
                                format(field.value, "PPP")
                              ) : (
                                <span>Pick a date</span>
                              )}
                              <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={field.value}
                            onSelect={field.onChange}
                            disabled={(date) =>
                              date > new Date() || date < new Date("1900-01-01")
                            }
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="quantity"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Quantity *</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step="0.1"
                          placeholder="0.0"
                          {...field}
                          onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="unit"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Unit *</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="kg">Kilograms (kg)</SelectItem>
                          <SelectItem value="tons">Tons</SelectItem>
                          <SelectItem value="bags">Bags</SelectItem>
                          <SelectItem value="pieces">Pieces</SelectItem>
                          <SelectItem value="liters">Liters</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="location"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2 text-sm sm:text-base">
                      Location *
                      {locationStatus === 'success' && <CheckCircle2 className="h-3 w-3 sm:h-4 sm:w-4 text-green-500" />}
                      {locationStatus === 'detecting' && <Loader2 className="h-3 w-3 sm:h-4 sm:w-4 animate-spin text-blue-500" />}
                      {locationStatus === 'error' && <AlertCircle className="h-3 w-3 sm:h-4 sm:w-4 text-red-500" />}
                    </FormLabel>
                    <FormControl>
                      <div className="relative">
                        <MapPin className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                        <Input
                          placeholder="Farm location, village, or coordinates"
                          className="pl-10 pr-20 sm:pr-24 text-sm sm:text-base"
                          {...field}
                        />
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          className="absolute right-1 top-1 h-8 px-2 sm:px-3"
                          onClick={handleGetLocation}
                          disabled={locationStatus === 'detecting'}
                        >
                          {locationStatus === 'detecting' ? (
                            <Loader2 className="h-3 w-3 animate-spin" />
                          ) : (
                            <Navigation className="h-3 w-3" />
                          )}
                          <span className="ml-1 hidden sm:inline">
                            {locationStatus === 'success' ? 'Updated' :
                             locationStatus === 'detecting' ? 'Detecting...' :
                             'Auto-detect'}
                          </span>
                        </Button>
                      </div>
                    </FormControl>
                    <FormDescription className="flex items-center justify-between">
                      <span>Enter the specific location where the harvest took place</span>
                      {locationStatus === 'success' && geoLocation && (
                        <Badge variant="secondary" className="text-xs">
                          📍 {geoLocation.lat.toFixed(4)}, {geoLocation.lng.toFixed(4)}
                        </Badge>
                      )}
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <Separator />

            {/* Quality & Pricing */}
            <div className="space-y-4">
              <h3 className="text-base sm:text-lg font-semibold text-foreground">Quality & Pricing</h3>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                <FormField
                  control={form.control}
                  name="quality"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Quality Grade *</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="excellent">Excellent</SelectItem>
                          <SelectItem value="good">Good</SelectItem>
                          <SelectItem value="fair">Fair</SelectItem>
                          <SelectItem value="poor">Poor</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="grade"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Market Grade *</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="A">Grade A (Premium)</SelectItem>
                          <SelectItem value="B">Grade B (Standard)</SelectItem>
                          <SelectItem value="C">Grade C (Economy)</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="price"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Price per Unit (₦) *</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step="0.01"
                          placeholder="0.00"
                          {...field}
                          onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="space-y-4">
                <FormField
                  control={form.control}
                  name="moistureContent"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Moisture Content: {field.value}%</FormLabel>
                      <FormControl>
                        <Slider
                          value={[field.value]}
                          onValueChange={([value]) => field.onChange(value)}
                          max={100}
                          min={0}
                          step={1}
                          className="w-full"
                        />
                      </FormControl>
                      <FormDescription>
                        Optimal range: 12-18% for grains, 8-12% for legumes
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="organic"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel>Organic Certification</FormLabel>
                        <FormDescription>
                          Check if this harvest meets organic farming standards
                        </FormDescription>
                      </div>
                    </FormItem>
                  )}
                />
              </div>
            </div>

            <Separator />

            {/* Advanced Options */}
            <div className="space-y-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowAdvanced(!showAdvanced)}
                className="w-full"
              >
                {showAdvanced ? "Hide" : "Show"} Advanced Options
              </Button>

              {showAdvanced && (
                <div className="space-y-4 p-4 border rounded-lg bg-muted/30">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <FormField
                      control={form.control}
                      name="soilType"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Soil Type</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {soilTypes.map((soil) => (
                                <SelectItem key={soil.value} value={soil.value}>
                                  <div>
                                    <div className="font-medium">{soil.label}</div>
                                    <div className="text-xs text-muted-foreground">
                                      {soil.description}
                                    </div>
                                  </div>
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="irrigationType"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Irrigation Type</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {irrigationTypes.map((irrigation) => (
                                <SelectItem key={irrigation.value} value={irrigation.value}>
                                  <div>
                                    <div className="font-medium">{irrigation.label}</div>
                                    <div className="text-xs text-muted-foreground">
                                      {irrigation.description}
                                    </div>
                                  </div>
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="pestManagement"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Pest Management</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {pestManagementTypes.map((method) => (
                                <SelectItem key={method.value} value={method.value}>
                                  <div>
                                    <div className="font-medium">{method.label}</div>
                                    <div className="text-xs text-muted-foreground">
                                      {method.description}
                                    </div>
                                  </div>
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>
              )}
            </div>

            <Separator />

            {/* Images & Notes */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-foreground">Images & Notes</h3>
              
              <div className="space-y-4">
                <div>
                  <FormLabel>Harvest Images</FormLabel>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-2">
                    {images.map((image, index) => (
                      <div key={index} className="relative group">
                        <img
                          src={image}
                          alt={`Harvest ${index + 1}`}
                          className="w-full h-24 object-cover rounded-lg border"
                        />
                        <Button
                          type="button"
                          variant="destructive"
                          size="sm"
                          className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={() => removeImage(index)}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    ))}
                    <label className="w-full h-20 sm:h-24 border-2 border-dashed border-muted-foreground/25 rounded-lg flex flex-col items-center justify-center cursor-pointer hover:border-muted-foreground/50 transition-colors">
                      <Upload className="h-5 w-5 sm:h-6 sm:w-6 text-muted-foreground mb-1 sm:mb-2" />
                      <span className="text-xs text-muted-foreground">Add Image</span>
                      <input
                        type="file"
                        accept="image/*"
                        multiple
                        className="hidden"
                        onChange={handleImageUpload}
                      />
                    </label>
                  </div>
                </div>

                <FormField
                  control={form.control}
                  name="notes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Additional Notes</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Any additional information about this harvest..."
                          className="min-h-[100px]"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-end gap-3 sm:gap-4 pt-4 sm:pt-6">
              {onCancel && (
                <Button type="button" variant="outline" onClick={onCancel} className="w-full sm:w-auto">
                  Cancel
                </Button>
              )}
              <Button type="submit" disabled={isLoading} className="w-full sm:w-auto min-w-[120px]">
                {isLoading ? (
                  <div className="flex items-center justify-center gap-2">
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                    Saving...
                  </div>
                ) : (
                  <div className="flex items-center justify-center gap-2">
                    <Save className="h-4 w-4" />
                    {mode === "create" ? "Log Harvest" : "Update Harvest"}
                  </div>
                )}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  )
}
