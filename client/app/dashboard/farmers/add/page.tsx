"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { DashboardLayout } from "@/components/dashboard/dashboard-layout"
import { useToast } from "@/hooks/use-toast"
import { APP_CONFIG } from "@/lib/constants"
import { 
  ArrowLeft, 
  UserPlus, 
  CheckCircle, 
  AlertCircle,
  MapPin,
  Phone,
  Mail,
  Calendar,
  Building
} from "lucide-react"
import Link from "next/link"

interface FarmerFormData {
  name: string
  email: string
  phone: string
  location: string
  address: string
  farmSize: string
  primaryCrops: string
  experience: string
  notes: string
}

export default function AddFarmerPage() {
  const [formData, setFormData] = useState<FarmerFormData>({
    name: "",
    email: "",
    phone: "",
    location: "",
    address: "",
    farmSize: "",
    primaryCrops: "",
    experience: "",
    notes: ""
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errors, setErrors] = useState<Partial<FarmerFormData>>({})
  const { toast } = useToast()

  const handleInputChange = (field: keyof FarmerFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }))
    }
  }

  const validateForm = (): boolean => {
    const newErrors: Partial<FarmerFormData> = {}

    if (!formData.name.trim()) {
      newErrors.name = "Name is required"
    }

    if (!formData.email.trim()) {
      newErrors.email = "Email is required"
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "Invalid email format"
    }

    if (!formData.phone.trim()) {
      newErrors.phone = "Phone number is required"
    } else if (!/^(\+234|0)[789][01]\d{8}$/.test(formData.phone.replace(/\s/g, ''))) {
      newErrors.phone = "Invalid Nigerian phone format (use +234 or 0 followed by 10 digits)"
    }

    if (!formData.location.trim()) {
      newErrors.location = "Location is required"
    }

    if (!formData.farmSize.trim()) {
      newErrors.farmSize = "Farm size is required"
    }

    if (!formData.primaryCrops.trim()) {
      newErrors.primaryCrops = "Primary crops are required"
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) {
      return
    }

    try {
      setIsSubmitting(true)

      const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5000'
      const token = localStorage.getItem(APP_CONFIG.auth.tokenKey)
      if (!token) {
        toast({
          title: "Authentication Required",
          description: "Please log in again to continue",
          variant: "destructive",
        })
        return
      }

      const response = await fetch(`${apiBaseUrl}/api/partners/farmers/add`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          phone: formData.phone,
          location: formData.location,
          address: formData.address,
          farmSize: formData.farmSize,
          primaryCrops: formData.primaryCrops,
          experience: formData.experience,
          notes: formData.notes
        })
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.message || `Failed to add farmer (${response.status})`)
      }

      toast({
        title: "Farmer added successfully!",
        description: `${formData.name} has been onboarded to your network and welcome email sent`,
      })

      // Reset form
      setFormData({
        name: "",
        email: "",
        phone: "",
        location: "",
        address: "",
        farmSize: "",
        primaryCrops: "",
        experience: "",
        notes: ""
      })
      setErrors({})

    } catch (error: any) {
      toast({
        title: "Failed to add farmer",
        description: error.message || "Please try again",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const locations = [
    "Lagos", "Abuja", "Kano", "Kaduna", "Ondo", "Oyo", "Rivers", "Delta", "Edo", "Imo",
    "Anambra", "Enugu", "Ebonyi", "Abia", "Cross River", "Akwa Ibom", "Bayelsa", "Sokoto",
    "Zamfara", "Kebbi", "Niger", "Kwara", "Plateau", "Nasarawa", "Taraba", "Adamawa",
    "Borno", "Yobe", "Gombe", "Bauchi", "Jigawa", "Katsina"
  ]

  const experienceLevels = [
    "Beginner (0-2 years)",
    "Intermediate (3-5 years)", 
    "Experienced (6-10 years)",
    "Expert (10+ years)"
  ]

  return (
    <DashboardLayout pageTitle="Add New Farmer">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <div className="flex items-center space-x-2">
              <Button variant="ghost" size="sm" asChild>
                <Link href="/dashboard/farmers">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to Farmers
                </Link>
              </Button>
            </div>
            <h1 className="text-2xl font-bold tracking-tight">Add New Farmer</h1>
            <p className="text-muted-foreground">Onboard a new farmer to your network</p>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Main Form */}
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <UserPlus className="h-5 w-5" />
                  <span>Farmer Information</span>
                </CardTitle>
                <CardDescription>
                  Fill in the details below to onboard a new farmer
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* Basic Information */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-medium">Basic Information</h3>
                    
                    <div className="grid gap-4 sm:grid-cols-1 md:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="name">Full Name *</Label>
                        <Input
                          id="name"
                          placeholder="Enter farmer's full name"
                          value={formData.name}
                          onChange={(e) => handleInputChange('name', e.target.value)}
                          className={errors.name ? "border-red-500" : ""}
                        />
                        {errors.name && (
                          <p className="text-sm text-red-600 flex items-center space-x-1">
                            <AlertCircle className="h-3 w-3" />
                            <span>{errors.name}</span>
                          </p>
                        )}
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="email">Email Address *</Label>
                        <Input
                          id="email"
                          type="email"
                          placeholder="farmer@example.com"
                          value={formData.email}
                          onChange={(e) => handleInputChange('email', e.target.value)}
                          className={errors.email ? "border-red-500" : ""}
                        />
                        {errors.email && (
                          <p className="text-sm text-red-600 flex items-center space-x-1">
                            <AlertCircle className="h-3 w-3" />
                            <span>{errors.email}</span>
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="grid gap-4 sm:grid-cols-1 md:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="phone">Phone Number *</Label>
                        <Input
                          id="phone"
                          placeholder="+2348012345678"
                          value={formData.phone}
                          onChange={(e) => handleInputChange('phone', e.target.value)}
                          className={errors.phone ? "border-red-500" : ""}
                        />
                        {errors.phone && (
                          <p className="text-sm text-red-600 flex items-center space-x-1">
                            <AlertCircle className="h-3 w-3" />
                            <span>{errors.phone}</span>
                          </p>
                        )}
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="location">Location *</Label>
                        <Select value={formData.location} onValueChange={(value) => handleInputChange('location', value)}>
                          <SelectTrigger className={errors.location ? "border-red-500" : ""}>
                            <SelectValue placeholder="Select location" />
                          </SelectTrigger>
                          <SelectContent>
                            {locations.map((location) => (
                              <SelectItem key={location} value={location}>
                                {location}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        {errors.location && (
                          <p className="text-sm text-red-600 flex items-center space-x-1">
                            <AlertCircle className="h-3 w-3" />
                            <span>{errors.location}</span>
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="address">Address</Label>
                      <Textarea
                        id="address"
                        placeholder="Enter detailed address"
                        value={formData.address}
                        onChange={(e) => handleInputChange('address', e.target.value)}
                        rows={3}
                      />
                    </div>
                  </div>

                  {/* Farming Information */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-medium">Farming Information</h3>
                    
                    <div className="grid gap-4 sm:grid-cols-1 md:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="farmSize">Farm Size *</Label>
                        <Input
                          id="farmSize"
                          placeholder="e.g., 2 hectares"
                          value={formData.farmSize}
                          onChange={(e) => handleInputChange('farmSize', e.target.value)}
                          className={errors.farmSize ? "border-red-500" : ""}
                        />
                        {errors.farmSize && (
                          <p className="text-sm text-red-600 flex items-center space-x-1">
                            <AlertCircle className="h-3 w-3" />
                            <span>{errors.farmSize}</span>
                          </p>
                        )}
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="experience">Experience Level</Label>
                        <Select value={formData.experience} onValueChange={(value) => handleInputChange('experience', value)}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select experience level" />
                          </SelectTrigger>
                          <SelectContent>
                            {experienceLevels.map((level) => (
                              <SelectItem key={level} value={level}>
                                {level}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="primaryCrops">Primary Crops *</Label>
                      <Input
                        id="primaryCrops"
                        placeholder="e.g., Maize, Cassava, Tomatoes"
                        value={formData.primaryCrops}
                        onChange={(e) => handleInputChange('primaryCrops', e.target.value)}
                        className={errors.primaryCrops ? "border-red-500" : ""}
                      />
                      {errors.primaryCrops && (
                        <p className="text-sm text-red-600 flex items-center space-x-1">
                          <AlertCircle className="h-3 w-3" />
                          <span>{errors.primaryCrops}</span>
                        </p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="notes">Additional Notes</Label>
                      <Textarea
                        id="notes"
                        placeholder="Any additional information about the farmer..."
                        value={formData.notes}
                        onChange={(e) => handleInputChange('notes', e.target.value)}
                        rows={3}
                      />
                    </div>
                  </div>

                  {/* Submit Button */}
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-end space-y-2 sm:space-y-0 sm:space-x-2 pt-4">
                    <Button variant="outline" asChild className="w-full sm:w-auto">
                      <Link href="/dashboard/farmers">Cancel</Link>
                    </Button>
                    <Button type="submit" disabled={isSubmitting} className="w-full sm:w-auto">
                      {isSubmitting ? (
                        <>
                          <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent mr-2" />
                          Adding Farmer...
                        </>
                      ) : (
                        <>
                          <UserPlus className="h-4 w-4 mr-2" />
                          Add Farmer
                        </>
                      )}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6 lg:col-span-1">
            {/* Quick Tips */}
            <Card>
              <CardHeader>
                <CardTitle>Quick Tips</CardTitle>
                <CardDescription>Best practices for onboarding</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 text-sm">
                  <div className="flex items-start space-x-2">
                    <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                    <span>Verify contact information before submission</span>
                  </div>
                  <div className="flex items-start space-x-2">
                    <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                    <span>Include accurate farm size and crop information</span>
                  </div>
                  <div className="flex items-start space-x-2">
                    <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                    <span>Add notes for future reference</span>
                  </div>
                  <div className="flex items-start space-x-2">
                    <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                    <span>Use bulk upload for multiple farmers</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Required Fields */}
            <Card>
              <CardHeader>
                <CardTitle>Required Fields</CardTitle>
                <CardDescription>Fields marked with * are mandatory</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                    <span>Full Name</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                    <span>Email Address</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                    <span>Phone Number</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                    <span>Location</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                    <span>Farm Size</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                    <span>Primary Crops</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Next Steps */}
            <Card>
              <CardHeader>
                <CardTitle>Next Steps</CardTitle>
                <CardDescription>What happens after adding a farmer</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 text-sm">
                  <div className="flex items-start space-x-2">
                    <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                    <span>Farmer receives welcome SMS/email</span>
                  </div>
                  <div className="flex items-start space-x-2">
                    <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                    <span>Account activation link sent</span>
                  </div>
                  <div className="flex items-start space-x-2">
                    <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                    <span>Training materials provided</span>
                  </div>
                  <div className="flex items-start space-x-2">
                    <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                    <span>Performance tracking begins</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
