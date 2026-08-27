"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { DashboardLayout } from "@/components/dashboard/dashboard-layout"
import { apiService } from "@/lib/api"
import { useToast } from "@/hooks/use-toast"
import {
  ArrowLeft,
  Shield,
  CheckCircle,
  Info,
  Star,
  Calculator,
  TrendingUp,
  FileText,
  Users
} from "lucide-react"
import Link from "next/link"

interface InsurancePolicy {
  _id: string
  name: string
  provider: string
  type: string
  coverage: string
  premium: number
  deductible: number
  maxCoverage: number
  features: string[]
  exclusions: string[]
  rating: number
  reviews: number
  claimProcess: string
  waitingPeriod: number
  renewalTerms: string
  contactInfo: {
    phone: string
    email: string
    website: string
  }
  logo: string
  isRecommended: boolean
  specialOffers: string[]
}

interface ComparisonFilters {
  cropType: string
  farmSize: string
  location: string
  budget: string
  coverageType: string
}

const cropTypes = [
  "All Crops",
  "Grains (Rice, Maize, Wheat)",
  "Tubers (Cassava, Yam, Potato)",
  "Legumes (Beans, Groundnut)",
  "Vegetables (Tomato, Pepper, Onion)",
  "Fruits (Mango, Orange, Banana)",
  "Cash Crops (Cocoa, Coffee, Tea)"
]

const farmSizes = [
  "Small (0-2 hectares)",
  "Medium (2-10 hectares)", 
  "Large (10+ hectares)"
]

const locations = [
  "All Locations",
  "North Central",
  "North East",
  "North West",
  "South East",
  "South South",
  "South West"
]

const budgetRanges = [
  "Any Budget",
  "Under ₦50,000/year",
  "₦50,000 - ₦100,000/year",
  "₦100,000 - ₦200,000/year",
  "Over ₦200,000/year"
]

const coverageTypes = [
  "All Coverage",
  "Crop Insurance",
  "Equipment Insurance",
  "Livestock Insurance",
  "Liability Insurance",
  "Property Insurance"
]

export default function InsuranceComparisonPage() {
  const [filteredPolicies, setFilteredPolicies] = useState<InsurancePolicy[]>([])
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState<ComparisonFilters>({
    cropType: "All Crops",
    farmSize: "Small (0-2 hectares)",
    location: "All Locations",
    budget: "Any Budget",
    coverageType: "All Coverage"
  })
  const [selectedPolicies, setSelectedPolicies] = useState<string[]>([])
  const [viewMode, setViewMode] = useState<"grid" | "table">("grid")
  
  const { toast } = useToast()

  useEffect(() => {
    fetchInsurancePolicies()
  }, [filters])

  const fetchInsurancePolicies = async () => {
    try {
      setLoading(true)

      // Fetch real data from backend API
      const response = await apiService.getInsuranceQuotes({
        cropType: filters.cropType,
        farmSize: filters.farmSize,
        location: filters.location,
        budget: filters.budget,
        coverageType: filters.coverageType
      })

      if (response.status === 'success' && response.data) {
        const policiesData = (response.data as any).policies || response.data || []

        // Transform backend data to match frontend interface
        const transformedPolicies: InsurancePolicy[] = policiesData.map((policy: any) => ({
          _id: policy._id || policy.id,
          name: policy.name,
          provider: policy.provider,
          type: policy.type,
          coverage: policy.coverage,
          premium: policy.premium,
          deductible: policy.deductible,
          maxCoverage: policy.maxCoverage,
          features: policy.features || [],
          exclusions: policy.exclusions || [],
          rating: policy.rating || 4.0,
          reviews: policy.reviews || 0,
          claimProcess: policy.claimProcess || 'Standard claims process',
          waitingPeriod: policy.waitingPeriod || 14,
          renewalTerms: policy.renewalTerms || 'Annual renewal',
          contactInfo: policy.contactInfo || {
            phone: '',
            email: '',
            website: ''
          },
          logo: policy.logo || '/insurance-logo.png',
          isRecommended: policy.isRecommended || false,
          specialOffers: policy.specialOffers || []
        }))

        setFilteredPolicies(transformedPolicies)
      } else {
        throw new Error('Failed to fetch insurance policies')
      }
    } catch (error) {
      console.error("Failed to fetch insurance policies:", error)
      toast({
        title: "Error",
        description: "Failed to load insurance policies. Please try again.",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const handlePolicySelection = (policyId: string) => {
    setSelectedPolicies(prev => 
      prev.includes(policyId) 
        ? prev.filter(id => id !== policyId)
        : [...prev, policyId]
    )
  }

  const getRatingStars = (rating: number) => {
    const stars = []
    const fullStars = Math.floor(rating)
    const hasHalfStar = rating % 1 !== 0

    for (let i = 0; i < fullStars; i++) {
      stars.push(<Star key={i} className="h-4 w-4 fill-warning text-warning" />)
    }

    if (hasHalfStar) {
      stars.push(<Star key="half" className="h-4 w-4 fill-warning text-warning" />)
    }

    const emptyStars = 5 - Math.ceil(rating)
    for (let i = 0; i < emptyStars; i++) {
      stars.push(<Star key={`empty-${i}`} className="h-4 w-4 text-muted-foreground" />)
    }

    return stars
  }

  const getFeatureIcon = (feature: string) => {
    if (feature.includes('coverage') || feature.includes('protection')) return <Shield className="h-4 w-4 text-success" />
    if (feature.includes('support') || feature.includes('consultation')) return <Users className="h-4 w-4 text-primary" />
    if (feature.includes('discount') || feature.includes('free')) return <TrendingUp className="h-4 w-4 text-success" />
    if (feature.includes('process') || feature.includes('online')) return <FileText className="h-4 w-4 text-accent" />
    return <CheckCircle className="h-4 w-4 text-success" />
  }

  if (loading) {
    return (
      <DashboardLayout pageTitle="Insurance Comparison">
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(6)].map((_, i) => (
              <Card key={i} className="animate-pulse border border-border">
                <CardHeader className="pb-3">
                  <div className="h-5 bg-muted rounded w-3/4"></div>
                  <div className="h-4 bg-muted rounded w-1/2"></div>
                </CardHeader>
                <CardContent>
                  <div className="h-4 bg-muted rounded mb-3"></div>
                  <div className="h-3 bg-muted rounded w-2/3"></div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout pageTitle="Insurance Comparison">
      <div className="space-y-6">
        {/* Page Header */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-3">
              <Button variant="ghost" asChild className="text-muted-foreground hover:text-foreground">
                <Link href="/dashboard/financial" className="flex items-center gap-2">
                  <ArrowLeft className="h-4 w-4" />
                  Back to Financial Services
                </Link>
              </Button>
            </div>
            <h1 className="text-2xl font-semibold text-foreground">Insurance Comparison</h1>
            <p className="text-muted-foreground">
              Compare insurance policies to find the best coverage for your farm
            </p>
          </div>
          
          <div className="flex gap-2">
            <Button
              variant={viewMode === "grid" ? "default" : "outline"}
              size="sm"
              onClick={() => setViewMode("grid")}
            >
              Grid View
            </Button>
            <Button
              variant={viewMode === "table" ? "default" : "outline"}
              size="sm"
              onClick={() => setViewMode("table")}
            >
              Table View
            </Button>
          </div>
        </div>

        {/* Filters */}
        <Card className="border border-border">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-medium">Filter Options</CardTitle>
            <CardDescription>
              Narrow down policies based on your specific needs
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Crop Type</label>
                <Select value={filters.cropType} onValueChange={(value) => setFilters(prev => ({ ...prev, cropType: value }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {cropTypes.map((crop) => (
                      <SelectItem key={crop} value={crop}>{crop}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Farm Size</label>
                <Select value={filters.farmSize} onValueChange={(value) => setFilters(prev => ({ ...prev, farmSize: value }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {farmSizes.map((size) => (
                      <SelectItem key={size} value={size}>{size}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Location</label>
                <Select value={filters.location} onValueChange={(value) => setFilters(prev => ({ ...prev, location: value }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {locations.map((location) => (
                      <SelectItem key={location} value={location}>{location}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Budget</label>
                <Select value={filters.budget} onValueChange={(value) => setFilters(prev => ({ ...prev, budget: value }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {budgetRanges.map((budget) => (
                      <SelectItem key={budget} value={budget}>{budget}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Coverage Type</label>
                <Select value={filters.coverageType} onValueChange={(value) => setFilters(prev => ({ ...prev, coverageType: value }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {coverageTypes.map((type) => (
                      <SelectItem key={type} value={type}>{type}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Results Summary */}
        <div className="flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            Showing {filteredPolicies.length} policies
          </div>
          {selectedPolicies.length > 0 && (
            <Button variant="outline" size="sm">
              Compare {selectedPolicies.length} Selected
            </Button>
          )}
        </div>

        {/* Policies Grid */}
        {viewMode === "grid" ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredPolicies.map((policy) => (
              <Card key={policy._id} className={`border border-border hover:shadow-lg transition-shadow ${
                selectedPolicies.includes(policy._id) ? 'ring-2 ring-primary' : ''
              }`}>
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Checkbox
                          checked={selectedPolicies.includes(policy._id)}
                          onCheckedChange={() => handlePolicySelection(policy._id)}
                        />
                        {policy.isRecommended && (
                          <Badge className="bg-success/10 text-success border-success/10">
                            Recommended
                          </Badge>
                        )}
                      </div>
                      <CardTitle className="text-lg font-semibold">{policy.name}</CardTitle>
                      <CardDescription className="text-sm">{policy.provider}</CardDescription>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-primary">
                        ₦{policy.premium.toLocaleString()}
                      </div>
                      <div className="text-xs text-muted-foreground">per year</div>
                    </div>
                  </div>
                </CardHeader>
                
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Shield className="h-4 w-4 text-primary" />
                      <span className="text-sm font-medium">{policy.type}</span>
                    </div>
                    <p className="text-sm text-muted-foreground">{policy.coverage}</p>
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Max Coverage:</span>
                      <span className="font-medium">₦{policy.maxCoverage.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Deductible:</span>
                      <span className="font-medium">₦{policy.deductible.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Waiting Period:</span>
                      <span className="font-medium">{policy.waitingPeriod} days</span>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <div className="flex">{getRatingStars(policy.rating)}</div>
                      <span className="text-sm text-muted-foreground">({policy.rating})</span>
                      <span className="text-sm text-muted-foreground">• {policy.reviews} reviews</span>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <h4 className="text-sm font-medium text-foreground">Key Features:</h4>
                    <div className="space-y-1">
                      {policy.features.slice(0, 3).map((feature, index) => (
                        <div key={index} className="flex items-center gap-2 text-sm text-muted-foreground">
                          {getFeatureIcon(feature)}
                          <span>{feature}</span>
                        </div>
                      ))}
                      {policy.features.length > 3 && (
                        <div className="text-xs text-primary cursor-pointer">
                          +{policy.features.length - 3} more features
                        </div>
                      )}
                    </div>
                  </div>

                  {policy.specialOffers.length > 0 && (
                    <div className="space-y-2">
                      <h4 className="text-sm font-medium text-success">Special Offers:</h4>
                      <div className="space-y-1">
                        {policy.specialOffers.slice(0, 2).map((offer, index) => (
                          <div key={index} className="flex items-center gap-2 text-sm text-success">
                            <TrendingUp className="h-3 w-3" />
                            <span>{offer}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="flex gap-2 pt-2">
                    <Button variant="outline" size="sm" className="flex-1">
                      <Info className="h-4 w-4 mr-1" />
                      Details
                    </Button>
                    <Button size="sm" className="flex-1">
                      <Calculator className="h-4 w-4 mr-1" />
                      Get Quote
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          /* Table View */
          <Card className="border border-border">
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-muted border-b">
                    <tr>
                      <th className="px-4 py-3 text-left text-sm font-medium text-foreground">Policy</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-foreground">Provider</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-foreground">Type</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-foreground">Premium</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-foreground">Coverage</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-foreground">Rating</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-foreground">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {filteredPolicies.map((policy) => (
                      <tr key={policy._id} className="hover:bg-muted">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <Checkbox
                              checked={selectedPolicies.includes(policy._id)}
                              onCheckedChange={() => handlePolicySelection(policy._id)}
                            />
                            <div>
                              <div className="font-medium text-foreground">{policy.name}</div>
                              {policy.isRecommended && (
                                <Badge className="bg-success/10 text-success border-success/10 text-xs">
                                  Recommended
                                </Badge>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-sm text-foreground">{policy.provider}</td>
                        <td className="px-4 py-3 text-sm text-muted-foreground">{policy.type}</td>
                        <td className="px-4 py-3">
                          <div className="text-sm font-medium text-foreground">
                            ₦{policy.premium.toLocaleString()}
                          </div>
                          <div className="text-xs text-muted-foreground">per year</div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="text-sm text-foreground">
                            ₦{policy.maxCoverage.toLocaleString()}
                          </div>
                          <div className="text-xs text-muted-foreground">max coverage</div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-1">
                            {getRatingStars(policy.rating)}
                            <span className="text-sm text-muted-foreground">({policy.rating})</span>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex gap-2">
                            <Button variant="outline" size="sm">
                              <Info className="h-4 w-4" />
                            </Button>
                            <Button size="sm">
                              <Calculator className="h-4 w-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        )}

        {/* No Results */}
        {filteredPolicies.length === 0 && (
          <Card className="text-center py-12 border border-border">
            <div className="text-muted-foreground mb-4">
              <Shield className="h-16 w-16 mx-auto" />
            </div>
            <h3 className="text-lg font-medium text-foreground mb-2">No Policies Found</h3>
            <p className="text-muted-foreground mb-4">
              Try adjusting your filters to find insurance policies that match your criteria.
            </p>
            <Button onClick={() => {
              const defaultFilters = {
                cropType: "All Crops",
                farmSize: "Small (0-2 hectares)",
                location: "All Locations",
                budget: "Any Budget",
                coverageType: "All Coverage"
              }
              setFilters(defaultFilters)
            }}>
              Reset Filters
            </Button>
          </Card>
        )}

        {/* Help Section */}
        <Card className="border border-border">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base font-medium">
              <Info className="h-4 w-4 text-primary" />
              Need Help Choosing?
            </CardTitle>
            <CardDescription>
              Get expert advice on selecting the right insurance for your farm
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center p-4 border border-border rounded-lg">
                <Calculator className="h-8 w-8 text-primary mx-auto mb-2" />
                <h4 className="font-medium text-foreground mb-1">Premium Calculator</h4>
                <p className="text-sm text-muted-foreground">Calculate your insurance costs</p>
              </div>
              <div className="text-center p-4 border border-border rounded-lg">
                <FileText className="h-8 w-8 text-success mx-auto mb-2" />
                <h4 className="font-medium text-foreground mb-1">Policy Guide</h4>
                <p className="text-sm text-muted-foreground">Understand different coverage types</p>
              </div>
              <div className="text-center p-4 border border-border rounded-lg">
                <Users className="h-8 w-8 text-accent mx-auto mb-2" />
                <h4 className="font-medium text-foreground mb-1">Expert Consultation</h4>
                <p className="text-sm text-muted-foreground">Talk to insurance specialists</p>
              </div>
            </div>
            <div className="flex justify-center">
              <Button variant="outline">
                <Info className="h-4 w-4 mr-2" />
                Get Expert Advice
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}
