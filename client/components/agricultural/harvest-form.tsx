"use client"

import { useState, useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Button } from "@/components/ui/button"
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
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  ChevronRight,
  Droplet
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
  { value: "rainfed", label: "Rainfed", description: "Natural rainfall dependent" },
  { value: "irrigated", label: "Irrigated", description: "Artificial irrigation setup" },
  { value: "mixed", label: "Mixed", description: "Rainfed and supplemental irrigation" }
]

const pestManagementTypes = [
  { value: "organic", label: "Organic", description: "Natural pest control methods" },
  { value: "conventional", label: "Conventional", description: "Synthetic inputs" },
  { value: "integrated", label: "Integrated", description: "Integrated Pest Management (IPM)" }
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
  const [locationStatus, setLocationStatus] = useState<'idle' | 'detecting' | 'success' | 'error'>('idle')
  const [currentStep, setCurrentStep] = useState(1)

  const { location: geoLocation, loading: geoLoading, error: geoError, requestLocation } = useGeolocation()
  const { toast } = useToast()

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

  // Geolocation effect
  useEffect(() => {
    if (geoLocation && !geoLoading && !geoError) {
      setLocationStatus('success')
      form.setValue('coordinates', {
        latitude: geoLocation.lat,
        longitude: geoLocation.lng
      })

      if (!form.getValues('location')) {
        const locationString = `${geoLocation.city || 'Current Farm Location'}, ${geoLocation.state || 'Nigeria'}`
        form.setValue('location', locationString)
        toast({
          title: "Location Auto-Detected",
          description: `Set location coordinates to ${locationString}`,
        })
      }
    } else if (geoError) {
      setLocationStatus('error')
    } else if (geoLoading) {
      setLocationStatus('detecting')
    }
  }, [geoLocation, geoLoading, geoError, form, toast])

  // Watch for unsaved changes callback
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
        description: "Unable to retrieve GPS location. Please type manually.",
        variant: "destructive"
      })
    }
  }

  const steps = [
    { 
      id: 1, 
      name: "Crop & Origin", 
      icon: Leaf,
      description: "Crop variety, quantity, and source farm details",
      fields: ["cropType", "variety", "harvestDate", "quantity", "unit", "location"] 
    },
    { 
      id: 2, 
      name: "Commercial & Quality", 
      icon: Scale,
      description: "Moisture levels, market grade, and selling price",
      fields: ["quality", "grade", "price", "moistureContent", "organic"] 
    },
    { 
      id: 3, 
      name: "Agronomic Conditions", 
      icon: Thermometer,
      description: "Soil conditions and farm management methods",
      fields: ["soilType", "irrigationType", "pestManagement"] 
    },
    { 
      id: 4, 
      name: "Media & Submission", 
      icon: Camera,
      description: "Log harvest notes and upload visual evidence",
      fields: ["images", "notes"] 
    }
  ]

  const nextStep = async () => {
    const fieldsToValidate = steps[currentStep - 1].fields as any[]
    const isValid = await form.trigger(fieldsToValidate)
    if (isValid) {
      setCurrentStep(prev => Math.min(prev + 1, 4))
    } else {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields correctly before moving on.",
        variant: "destructive"
      })
    }
  }

  const prevStep = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1))
  }

  const handleStepClick = async (stepId: number) => {
    if (stepId < currentStep) {
      setCurrentStep(stepId)
    } else if (stepId > currentStep) {
      // Validate all intermediate steps
      let canProceed = true
      for (let i = currentStep; i < stepId; i++) {
        const fields = steps[i - 1].fields as any[]
        const isValid = await form.trigger(fields)
        if (!isValid) {
          canProceed = false
          setCurrentStep(i)
          toast({
            title: "Validation Check",
            description: `Please complete Step ${i} details first.`,
            variant: "destructive"
          })
          break
        }
      }
      if (canProceed) {
        setCurrentStep(stepId)
      }
    }
  }

  const handleSubmit = async (data: HarvestFormData) => {
    try {
      const finalData = { ...data }
      if (data.location && !data.coordinates && geoLocation) {
        finalData.coordinates = {
          latitude: geoLocation.lat,
          longitude: geoLocation.lng
        }
      }

      const validImages = images.filter(url => url && !url.startsWith('blob:'))
      await onSubmit({
        ...finalData,
        images: validImages,
      })
    } catch (error) {
      console.error("Submission error:", error)
      toast({
        title: "Error Saving Harvest",
        description: "Failed to record the harvest batch on-chain. Please try again.",
        variant: "destructive"
      })
    }
  }

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return

    const maxFileSize = 5 * 1024 * 1024
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
    const maxImages = 6

    if (images.length + files.length > maxImages) {
      toast({
        title: "Limit Exceeded",
        description: `You can upload a maximum of ${maxImages} images.`,
        variant: "destructive"
      })
      return
    }

    const validFiles: File[] = []
    for (const file of Array.from(files)) {
      if (file.size > maxFileSize) {
        toast({
          title: "File Too Large",
          description: `${file.name} exceeds 5MB size limit.`,
          variant: "destructive"
        })
        continue
      }
      if (!allowedTypes.includes(file.type)) {
        toast({
          title: "Invalid Type",
          description: `${file.name} is not a supported format.`,
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

      for (const file of validFiles) {
        const formData = new FormData()
        formData.append('file', file)

        const backendUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5000'
        const response = await fetch(`${backendUrl}/api/upload/image`, {
          method: 'POST',
          body: formData,
          headers: {
            ...(localStorage.getItem('grochain_auth_token') && {
              'Authorization': `Bearer ${localStorage.getItem('grochain_auth_token')}`
            })
          }
        })

        if (response.ok) {
          const resJson = await response.json()
          if (resJson.status === 'success' && resJson.url) {
            uploadedUrls.push(resJson.url)
          }
        }
      }

      const successUrls = uploadedUrls.filter(url => url && !url.startsWith('blob:'))
      if (successUrls.length > 0) {
        setImages(prev => [...prev, ...successUrls])
        toast({
          title: "Images Processed",
          description: `Uploaded ${successUrls.length} file(s) to secure cloud storage.`,
        })
      }
    } catch (error) {
      console.error('Image processing error:', error)
      toast({
        title: "Upload Failed",
        description: "Failed to upload image(s). Please try again.",
        variant: "destructive"
      })
    } finally {
      setUploadingImages(false)
    }
  }

  const removeImage = (index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index))
  }

  const completionPercentage = (currentStep / 4) * 100

  return (
    <div className="w-full space-y-6 sm:space-y-8">
      {/* Visual Stepper Progress Bar */}
      <div className="space-y-4">
        <div className="flex justify-between items-center text-xs sm:text-sm text-muted-foreground font-medium px-1">
          <span>Step {currentStep} of 4: {steps[currentStep - 1].name}</span>
          <span className="text-primary font-bold">{Math.round(completionPercentage)}% Complete</span>
        </div>
        <Progress value={completionPercentage} className="h-2 bg-muted rounded-full" />
        
        {/* Horizontal Wizard Stepper Navigation */}
        <div className="grid grid-cols-4 gap-2 pt-2">
          {steps.map((st) => {
            const IconComponent = st.icon
            const isActive = st.id === currentStep
            const isCompleted = st.id < currentStep
            return (
              <button
                key={st.id}
                type="button"
                onClick={() => handleStepClick(st.id)}
                className={cn(
                  "flex flex-col sm:flex-row items-center gap-2 p-2.5 rounded-xl border text-left transition-all duration-300 group",
                  isActive 
                    ? "bg-success/50 border-success shadow-sm text-success" 
                    : isCompleted 
                      ? "bg-success/20 border-success/10 text-success" 
                      : "bg-white border-border text-muted-foreground hover:border-border"
                )}
              >
                <div className={cn(
                  "flex items-center justify-center w-8 h-8 rounded-lg transition-colors",
                  isActive 
                    ? "bg-success text-white shadow-md shadow-emerald-600/20" 
                    : isCompleted 
                      ? "bg-success/10 text-success" 
                      : "bg-muted text-muted-foreground group-hover:bg-muted"
                )}>
                  {isCompleted ? <CheckCircle2 className="h-4 w-4" /> : <IconComponent className="h-4 w-4" />}
                </div>
                <div className="hidden sm:block min-w-0">
                  <p className="text-xs font-semibold leading-none truncate">{st.name}</p>
                  <p className="text-[10px] text-muted-foreground truncate mt-0.5">{st.description}</p>
                </div>
              </button>
            )
          })}
        </div>
      </div>

      <Separator className="bg-muted" />

      {/* Main Form Fields wrapper */}
      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
          
          {/* STEP 1: Crop & Origin */}
          {currentStep === 1 && (
            <div className="space-y-4 animate-in fade-in slide-in-from-bottom-3 duration-300">
              <div className="bg-success/30 p-3 rounded-lg border border-success/50 flex gap-3 items-start">
                <Leaf className="h-5 w-5 text-success mt-0.5 flex-shrink-0" />
                <div>
                  <h4 className="text-xs font-semibold text-success">Crop Details & Origin</h4>
                  <p className="text-[11px] text-success">Identify the type of crop harvested and specify the geographic coordinates of the harvest field for traceability.</p>
                </div>
              </div>

              <div className="grid gap-4 grid-cols-1 sm:grid-cols-2">
                <FormField
                  control={form.control}
                  name="cropType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs sm:text-sm font-semibold">Crop Type *</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger className="h-10 text-xs sm:text-sm focus:ring-success focus:border-success border-border">
                            <SelectValue placeholder="Select harvested crop" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {cropTypes.map((crop) => (
                            <SelectItem key={crop} value={crop} className="text-xs sm:text-sm">
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
                      <FormLabel className="text-xs sm:text-sm font-semibold">Variety/Cultivar *</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g. Basmati, Golden Yellow" className="h-10 text-xs sm:text-sm focus-visible:ring-success border-border" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid gap-4 grid-cols-1 sm:grid-cols-3">
                <FormField
                  control={form.control}
                  name="harvestDate"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel className="text-xs sm:text-sm font-semibold mb-1">Harvest Date *</FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant="outline"
                              className={cn(
                                "w-full pl-3 text-left font-normal h-10 text-xs sm:text-sm border-border",
                                !field.value && "text-muted-foreground"
                              )}
                            >
                              {field.value ? format(field.value, "PPP") : <span>Select harvest date</span>}
                              <CalendarIcon className="ml-auto h-4 w-4 opacity-50 text-muted-foreground" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={field.value}
                            onSelect={field.onChange}
                            disabled={(date) => date > new Date() || date < new Date("2020-01-01")}
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
                      <FormLabel className="text-xs sm:text-sm font-semibold">Yield Quantity *</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step="0.01"
                          placeholder="0.00"
                          className="h-10 text-xs sm:text-sm focus-visible:ring-success border-border"
                          {...field}
                          onChange={(e) => {
                            const val = e.target.value
                            field.onChange(val === '' ? 0 : parseFloat(parseFloat(val).toFixed(2)))
                          }}
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
                      <FormLabel className="text-xs sm:text-sm font-semibold">Measurement Unit *</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger className="h-10 text-xs sm:text-sm focus:ring-success border-border">
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="kg" className="text-xs sm:text-sm">Kilograms (kg)</SelectItem>
                          <SelectItem value="tons" className="text-xs sm:text-sm">Tons (t)</SelectItem>
                          <SelectItem value="bags" className="text-xs sm:text-sm">Bags (50kg)</SelectItem>
                          <SelectItem value="pieces" className="text-xs sm:text-sm">Pieces (pcs)</SelectItem>
                          <SelectItem value="liters" className="text-xs sm:text-sm">Liters (l)</SelectItem>
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
                    <FormLabel className="flex items-center justify-between text-xs sm:text-sm font-semibold">
                      <span>Farm Field Location *</span>
                      <div className="flex items-center gap-1.5 text-[11px] font-normal">
                        {locationStatus === 'success' && (
                          <span className="text-success flex items-center gap-1"><CheckCircle2 className="h-3 w-3" /> GPS Logged</span>
                        )}
                        {locationStatus === 'detecting' && (
                          <span className="text-primary flex items-center gap-1 animate-pulse"><Loader2 className="h-3 w-3 animate-spin" /> Detecting Coordinates...</span>
                        )}
                      </div>
                    </FormLabel>
                    <FormControl>
                      <div className="relative">
                        <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          placeholder="Type address, or click Auto-detect to record precise GPS coordinates"
                          className="pl-9 pr-28 h-10 text-xs sm:text-sm focus-visible:ring-success border-border"
                          {...field}
                        />
                        <Button
                          type="button"
                          size="sm"
                          variant="ghost"
                          className="absolute right-1 top-1 h-8 px-2 text-xs text-success hover:text-success hover:bg-success/50"
                          onClick={handleGetLocation}
                          disabled={locationStatus === 'detecting'}
                        >
                          <Navigation className={cn("h-3 w-3 mr-1", locationStatus === 'detecting' && "animate-pulse")} />
                          <span>Auto-detect</span>
                        </Button>
                      </div>
                    </FormControl>
                    <FormDescription className="flex items-center justify-between text-[11px] text-muted-foreground mt-1">
                      <span>Enter state/LGA details or trigger GPS coordinate recording.</span>
                      {locationStatus === 'success' && geoLocation && (
                        <span className="font-mono text-success bg-success/10 border border-success/10 rounded-md px-1.5 py-0.5">
                          LAT: {geoLocation.lat.toFixed(4)}, LNG: {geoLocation.lng.toFixed(4)}
                        </span>
                      )}
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          )}

          {/* STEP 2: Quality & Pricing */}
          {currentStep === 2 && (
            <div className="space-y-4 animate-in fade-in slide-in-from-bottom-3 duration-300">
              <div className="bg-success/30 p-3 rounded-lg border border-success/50 flex gap-3 items-start">
                <Scale className="h-5 w-5 text-success mt-0.5 flex-shrink-0" />
                <div>
                  <h4 className="text-xs font-semibold text-success">Quality Ratings & Pricing</h4>
                  <p className="text-[11px] text-success">Establish product quality metrics and standard listing prices per unit. These affect buyer search filtering and trust badges.</p>
                </div>
              </div>

              <div className="grid gap-4 grid-cols-1 sm:grid-cols-3">
                <FormField
                  control={form.control}
                  name="quality"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs sm:text-sm font-semibold">Quality Level *</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger className="h-10 text-xs sm:text-sm border-border">
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="excellent" className="text-xs sm:text-sm">Excellent (Freshly Harvested)</SelectItem>
                          <SelectItem value="good" className="text-xs sm:text-sm">Good (Standard Grade)</SelectItem>
                          <SelectItem value="fair" className="text-xs sm:text-sm">Fair (Processing Grade)</SelectItem>
                          <SelectItem value="poor" className="text-xs sm:text-sm">Poor (Sub-standard)</SelectItem>
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
                      <FormLabel className="text-xs sm:text-sm font-semibold">Market Grade *</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger className="h-10 text-xs sm:text-sm border-border">
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="A" className="text-xs sm:text-sm">Grade A (Premium Produce)</SelectItem>
                          <SelectItem value="B" className="text-xs sm:text-sm">Grade B (Standard Produce)</SelectItem>
                          <SelectItem value="C" className="text-xs sm:text-sm">Grade C (Industrial/Feed)</SelectItem>
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
                      <FormLabel className="text-xs sm:text-sm font-semibold">Unit Price (₦) *</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground text-xs sm:text-sm">₦</span>
                          <Input
                            type="number"
                            step="0.01"
                            placeholder="0.00"
                            className="pl-7 h-10 text-xs sm:text-sm focus-visible:ring-success border-border"
                            {...field}
                            onChange={(e) => {
                              const val = e.target.value
                              field.onChange(val === '' ? 0 : parseFloat(parseFloat(val).toFixed(2)))
                            }}
                          />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="moistureContent"
                render={({ field }) => (
                  <FormItem className="bg-muted/50 p-4 border border-border rounded-xl space-y-3">
                    <div className="flex justify-between items-center">
                      <FormLabel className="text-xs sm:text-sm font-semibold flex items-center gap-1.5">
                        <Droplet className="h-4 w-4 text-success" />
                        Moisture Content Level
                      </FormLabel>
                      <span className="text-xs font-bold text-success bg-success/10 px-2 py-0.5 rounded-full border border-success/10">{field.value}%</span>
                    </div>
                    <FormControl>
                      <Slider
                        value={[field.value]}
                        onValueChange={([val]) => field.onChange(val)}
                        max={100}
                        min={0}
                        step={1}
                        className="w-full cursor-pointer accent-emerald-600"
                      />
                    </FormControl>
                    <FormDescription className="text-[11px] text-muted-foreground">
                      Dry storage guideline: Grains (12-18%), Root crops & tubers (15-25%), Legumes (8-12%).
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="organic"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-xl border border-border bg-white p-4">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                        className="data-[state=checked]:bg-success border-border"
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel className="text-xs sm:text-sm font-semibold text-foreground flex items-center gap-1.5">
                        Organic Production Certificate
                        <Badge className="bg-success/10 hover:bg-success/10 text-success border-success/10 text-[10px] py-0 px-1.5 font-normal">Premium Tag</Badge>
                      </FormLabel>
                      <FormDescription className="text-[11px] text-muted-foreground">
                        Declare that no chemical pesticides or fertilizers were applied on this crop batch.
                      </FormDescription>
                    </div>
                  </FormItem>
                )}
              />
            </div>
          )}

          {/* STEP 3: Agronomics */}
          {currentStep === 3 && (
            <div className="space-y-4 animate-in fade-in slide-in-from-bottom-3 duration-300">
              <div className="bg-success/30 p-3 rounded-lg border border-success/50 flex gap-3 items-start">
                <Thermometer className="h-5 w-5 text-success mt-0.5 flex-shrink-0" />
                <div>
                  <h4 className="text-xs font-semibold text-success">Agronomic & Farm Conditions</h4>
                  <p className="text-[11px] text-success">Add parameters about your farm ecosystem. These support environmental sustainability metrics and verify carbon-neutral logs.</p>
                </div>
              </div>

              <div className="grid gap-4 grid-cols-1 sm:grid-cols-3">
                <FormField
                  control={form.control}
                  name="soilType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs sm:text-sm font-semibold">Soil Type</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger className="h-10 text-xs sm:text-sm border-border">
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {soilTypes.map((soil) => (
                            <SelectItem key={soil.value} value={soil.value} className="text-xs sm:text-sm">
                              <div className="text-left">
                                <p className="font-semibold text-foreground">{soil.label}</p>
                                <p className="text-[10px] text-muted-foreground leading-tight mt-0.5">{soil.description}</p>
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
                      <FormLabel className="text-xs sm:text-sm font-semibold">Irrigation Source</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger className="h-10 text-xs sm:text-sm border-border">
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {irrigationTypes.map((irr) => (
                            <SelectItem key={irr.value} value={irr.value} className="text-xs sm:text-sm">
                              <div className="text-left">
                                <p className="font-semibold text-foreground">{irr.label}</p>
                                <p className="text-[10px] text-muted-foreground leading-tight mt-0.5">{irr.description}</p>
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
                      <FormLabel className="text-xs sm:text-sm font-semibold">Pest Management</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger className="h-10 text-xs sm:text-sm border-border">
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {pestManagementTypes.map((pest) => (
                            <SelectItem key={pest.value} value={pest.value} className="text-xs sm:text-sm">
                              <div className="text-left">
                                <p className="font-semibold text-foreground">{pest.label}</p>
                                <p className="text-[10px] text-muted-foreground leading-tight mt-0.5">{pest.description}</p>
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

          {/* STEP 4: Media & Submission */}
          {currentStep === 4 && (
            <div className="space-y-5 animate-in fade-in slide-in-from-bottom-3 duration-300">
              <div className="bg-success/30 p-3 rounded-lg border border-success/50 flex gap-3 items-start">
                <Camera className="h-5 w-5 text-success mt-0.5 flex-shrink-0" />
                <div>
                  <h4 className="text-xs font-semibold text-success">Visual Verification & Remarks</h4>
                  <p className="text-[11px] text-success">Attach real-time photographs of the harvested bags or yield stacks. Transparent media verification builds buyer confidence.</p>
                </div>
              </div>

              <div className="space-y-2">
                <FormLabel className="text-xs sm:text-sm font-semibold">Produce Photographs (Max 6)</FormLabel>
                
                {/* Image Upload Zone */}
                <div className="grid gap-3 grid-cols-2 sm:grid-cols-3 md:grid-cols-4">
                  {images.map((image, index) => (
                    <div key={index} className="relative aspect-video rounded-xl overflow-hidden border border-border group shadow-sm bg-muted">
                      <img
                        src={image}
                        alt={`Harvest snapshot ${index + 1}`}
                        className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                      />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center">
                        <Button
                          type="button"
                          variant="destructive"
                          size="icon"
                          className="h-8 w-8 rounded-full shadow-lg"
                          onClick={() => removeImage(index)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                  
                  {images.length < 6 && (
                    <label className="aspect-video border-2 border-dashed border-border hover:border-success rounded-xl flex flex-col items-center justify-center cursor-pointer bg-muted/50 hover:bg-success/10 transition-all duration-300 group">
                      {uploadingImages ? (
                        <div className="text-center">
                          <Loader2 className="h-6 w-6 animate-spin text-success mx-auto mb-1" />
                          <span className="text-[10px] text-muted-foreground font-medium">Uploading to storage...</span>
                        </div>
                      ) : (
                        <div className="text-center p-2">
                          <Upload className="h-5 w-5 text-muted-foreground mx-auto group-hover:text-success group-hover:scale-110 transition-all mb-1" />
                          <span className="text-[11px] font-semibold text-muted-foreground block group-hover:text-success">Add Image</span>
                          <span className="text-[9px] text-muted-foreground block mt-0.5">JPEG, PNG up to 5MB</span>
                        </div>
                      )}
                      <input
                        type="file"
                        accept="image/*"
                        multiple
                        className="hidden"
                        onChange={handleImageUpload}
                        disabled={uploadingImages}
                      />
                    </label>
                  )}
                </div>
              </div>

              <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs sm:text-sm font-semibold">Traceability Notes / Remarks</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Log any notable weather conditions, soil moisture during harvest, or packing conditions for public records..."
                        className="min-h-[100px] text-xs sm:text-sm focus-visible:ring-success border-border"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          )}

          {/* Stepper Wizard Actions */}
          <div className="flex items-center justify-between pt-4 border-t border-border">
            <div>
              {onCancel && currentStep === 1 && (
                <Button type="button" variant="outline" onClick={onCancel} className="h-10 text-xs sm:text-sm border-border">
                  Cancel
                </Button>
              )}
              {currentStep > 1 && (
                <Button type="button" variant="outline" onClick={prevStep} className="h-10 text-xs sm:text-sm border-border flex items-center gap-1">
                  <ArrowLeft className="h-4 w-4" />
                  <span>Back</span>
                </Button>
              )}
            </div>

            <div>
              {currentStep < 4 ? (
                <Button type="button" onClick={nextStep} className="h-10 text-xs sm:text-sm bg-success hover:bg-success text-white flex items-center gap-1">
                  <span>Continue</span>
                  <ArrowRight className="h-4 w-4" />
                </Button>
              ) : (
                <Button type="submit" disabled={isLoading} className="h-10 text-xs sm:text-sm bg-success hover:bg-success text-white min-w-[140px]">
                  {isLoading ? (
                    <div className="flex items-center justify-center gap-1.5">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>Writing to Ledger...</span>
                    </div>
                  ) : (
                    <div className="flex items-center justify-center gap-1.5">
                      <Save className="h-4 w-4" />
                      <span>{mode === "create" ? "Confirm & Log Batch" : "Save Changes"}</span>
                    </div>
                  )}
                </Button>
              )}
            </div>
          </div>

        </form>
      </Form>
    </div>
  )
}
