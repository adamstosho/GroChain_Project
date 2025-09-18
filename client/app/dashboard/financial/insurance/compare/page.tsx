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
  XCircle, 
  Info, 
  Star, 
  Calculator,
  TrendingUp,
  AlertTriangle,
  FileText,
  Clock,
  Banknote,
  MapPin,
  Users,
  Building
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
  const [policies, setPolicies] = useState<InsurancePolicy[]>([])
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

        setPolicies(transformedPolicies)
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

  // Backend handles filtering now, so we just use the fetched data
  const applyFilters = () => {
    // Since backend handles filtering, we just set filtered policies to all policies
    setFilteredPolicies(policies)
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
      stars.push(<Star key={i} className="h-4 w-4 fill-yellow-400 text-yellow-400" />)
    }

    if (hasHalfStar) {
      stars.push(<Star key="half" className="h-4 w-4 fill-yellow-400 text-yellow-400" />)
    }

    const emptyStars = 5 - Math.ceil(rating)
    for (let i = 0; i < emptyStars; i++) {
      stars.push(<Star key={`empty-${i}`} className="h-4 w-4 text-gray-300" />)
    }

    return stars
  }

  const getFeatureIcon = (feature: string) => {
    if (feature.includes('coverage') || feature.includes('protection')) return <Shield className="h-4 w-4 text-emerald-500" />
    if (feature.includes('support') || feature.includes('consultation')) return <Users className="h-4 w-4 text-blue-500" />
    if (feature.includes('discount') || feature.includes('free')) return <TrendingUp className="h-4 w-4 text-green-500" />
    if (feature.includes('process') || feature.includes('online')) return <FileText className="h-4 w-4 text-purple-500" />
    return <CheckCircle className="h-4 w-4 text-emerald-500" />
  }

  const getExclusionIcon = (exclusion: string) => {
    if (exclusion.includes('pre-existing') || exclusion.includes('poor')) return <AlertTriangle className="h-4 w-4 text-amber-500" />
    if (exclusion.includes('intentional') || exclusion.includes('war')) return <XCircle className="h-4 w-4 text-red-500" />
    return <XCircle className="h-4 w-4 text-gray-500" />
  }

  if (loading) {
    return (
      <DashboardLayout pageTitle="Insurance Comparison">
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(6)].map((_, i) => (
              <Card key={i} className="animate-pulse border border-gray-200">
                <CardHeader className="pb-3">
                  <div className="h-5 bg-gray-200 rounded w-3/4"></div>
                  <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                </CardHeader>
                <CardContent>
                  <div className="h-4 bg-gray-200 rounded mb-3"></div>
                  <div className="h-3 bg-gray-200 rounded w-2/3"></div>
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
              <Button variant="ghost" asChild className="text-gray-600 hover:text-gray-900">
                <Link href="/dashboard/financial" className="flex items-center gap-2">
                  <ArrowLeft className="h-4 w-4" />
                  Back to Financial Services
                </Link>
              </Button>
            </div>
            <h1 className="text-2xl font-semibold text-gray-900">Insurance Comparison</h1>
            <p className="text-gray-600">
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
        <Card className="border border-gray-200">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-medium">Filter Options</CardTitle>
            <CardDescription>
              Narrow down policies based on your specific needs
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Crop Type</label>
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
                <label className="text-sm font-medium text-gray-700">Farm Size</label>
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
                <label className="text-sm font-medium text-gray-700">Location</label>
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
                <label className="text-sm font-medium text-gray-700">Budget</label>
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
                <label className="text-sm font-medium text-gray-700">Coverage Type</label>
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
          <div className="text-sm text-gray-600">
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
              <Card key={policy._id} className={`border border-gray-200 hover:shadow-lg transition-shadow ${
                selectedPolicies.includes(policy._id) ? 'ring-2 ring-blue-500' : ''
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
                          <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200">
                            Recommended
                          </Badge>
                        )}
                      </div>
                      <CardTitle className="text-lg font-semibold">{policy.name}</CardTitle>
                      <CardDescription className="text-sm">{policy.provider}</CardDescription>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-blue-600">
                        ₦{policy.premium.toLocaleString()}
                      </div>
                      <div className="text-xs text-gray-500">per year</div>
                    </div>
                  </div>
                </CardHeader>
                
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Shield className="h-4 w-4 text-blue-500" />
                      <span className="text-sm font-medium">{policy.type}</span>
                    </div>
                    <p className="text-sm text-gray-600">{policy.coverage}</p>
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Max Coverage:</span>
                      <span className="font-medium">₦{policy.maxCoverage.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Deductible:</span>
                      <span className="font-medium">₦{policy.deductible.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Waiting Period:</span>
                      <span className="font-medium">{policy.waitingPeriod} days</span>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <div className="flex">{getRatingStars(policy.rating)}</div>
                      <span className="text-sm text-gray-600">({policy.rating})</span>
                      <span className="text-sm text-gray-500">• {policy.reviews} reviews</span>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <h4 className="text-sm font-medium text-gray-900">Key Features:</h4>
                    <div className="space-y-1">
                      {policy.features.slice(0, 3).map((feature, index) => (
                        <div key={index} className="flex items-center gap-2 text-sm text-gray-600">
                          {getFeatureIcon(feature)}
                          <span>{feature}</span>
                        </div>
                      ))}
                      {policy.features.length > 3 && (
                        <div className="text-xs text-blue-600 cursor-pointer">
                          +{policy.features.length - 3} more features
                        </div>
                      )}
                    </div>
                  </div>

                  {policy.specialOffers.length > 0 && (
                    <div className="space-y-2">
                      <h4 className="text-sm font-medium text-green-700">Special Offers:</h4>
                      <div className="space-y-1">
                        {policy.specialOffers.slice(0, 2).map((offer, index) => (
                          <div key={index} className="flex items-center gap-2 text-sm text-green-600">
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
          <Card className="border border-gray-200">
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b">
                    <tr>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">Policy</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">Provider</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">Type</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">Premium</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">Coverage</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">Rating</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {filteredPolicies.map((policy) => (
                      <tr key={policy._id} className="hover:bg-gray-50">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <Checkbox
                              checked={selectedPolicies.includes(policy._id)}
                              onCheckedChange={() => handlePolicySelection(policy._id)}
                            />
                            <div>
                              <div className="font-medium text-gray-900">{policy.name}</div>
                              {policy.isRecommended && (
                                <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 text-xs">
                                  Recommended
                                </Badge>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-900">{policy.provider}</td>
                        <td className="px-4 py-3 text-sm text-gray-600">{policy.type}</td>
                        <td className="px-4 py-3">
                          <div className="text-sm font-medium text-gray-900">
                            ₦{policy.premium.toLocaleString()}
                          </div>
                          <div className="text-xs text-gray-500">per year</div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="text-sm text-gray-900">
                            ₦{policy.maxCoverage.toLocaleString()}
                          </div>
                          <div className="text-xs text-gray-500">max coverage</div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-1">
                            {getRatingStars(policy.rating)}
                            <span className="text-sm text-gray-600">({policy.rating})</span>
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
          <Card className="text-center py-12 border border-gray-200">
            <div className="text-gray-400 mb-4">
              <Shield className="h-16 w-16 mx-auto" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Policies Found</h3>
            <p className="text-gray-600 mb-4">
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
        <Card className="border border-gray-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base font-medium">
              <Info className="h-4 w-4 text-blue-500" />
              Need Help Choosing?
            </CardTitle>
            <CardDescription>
              Get expert advice on selecting the right insurance for your farm
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center p-4 border border-gray-200 rounded-lg">
                <Calculator className="h-8 w-8 text-blue-500 mx-auto mb-2" />
                <h4 className="font-medium text-gray-900 mb-1">Premium Calculator</h4>
                <p className="text-sm text-gray-600">Calculate your insurance costs</p>
              </div>
              <div className="text-center p-4 border border-gray-200 rounded-lg">
                <FileText className="h-8 w-8 text-green-500 mx-auto mb-2" />
                <h4 className="font-medium text-gray-900 mb-1">Policy Guide</h4>
                <p className="text-sm text-gray-600">Understand different coverage types</p>
              </div>
              <div className="text-center p-4 border border-gray-200 rounded-lg">
                <Users className="h-8 w-8 text-purple-500 mx-auto mb-2" />
                <h4 className="font-medium text-gray-900 mb-1">Expert Consultation</h4>
                <p className="text-sm text-gray-600">Talk to insurance specialists</p>
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
