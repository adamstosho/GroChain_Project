"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { DashboardLayout } from "@/components/dashboard/dashboard-layout"
import { apiService } from "@/lib/api"
import { useToast } from "@/hooks/use-toast"
import {
  CreditCard,
  TrendingUp,
  TrendingDown,
  CheckCircle,
  AlertCircle,
  XCircle,
  Clock,
  Banknote,
  Calendar,
  FileText,
  Download,
  RefreshCw,
  Star,
  Award,
  Target,
  BarChart3,
  PieChart,
  Activity,
  Shield,
  Eye,
  EyeOff
} from "lucide-react"

interface CreditScore {
  score: number
  grade: 'A' | 'B' | 'C' | 'D' | 'E' | 'F'
  status: 'excellent' | 'good' | 'fair' | 'poor' | 'very_poor'
  lastUpdated: string
  factors: Array<{
    name: string
    impact: 'positive' | 'negative' | 'neutral'
    weight: number
    description: string
  }>
  history: Array<{
    date: string
    score: number
    change: number
  }>
  recommendations: Array<{
    title: string
    description: string
    priority: 'high' | 'medium' | 'low'
    impact: number
  }>
  eligibility: {
    loans: boolean
    insurance: boolean
    marketplace: boolean
    limits: {
      loanAmount: number
      insuranceCoverage: number
    }
  }
}

const creditGrades = {
  'A': { label: 'Excellent', color: 'bg-emerald-500', textColor: 'text-emerald-700', bgColor: 'bg-emerald-50' },
  'B': { label: 'Good', color: 'bg-blue-500', textColor: 'text-blue-700', bgColor: 'bg-blue-50' },
  'C': { label: 'Fair', color: 'bg-amber-500', textColor: 'text-amber-700', bgColor: 'bg-amber-50' },
  'D': { label: 'Poor', color: 'bg-orange-500', textColor: 'text-orange-700', bgColor: 'bg-orange-50' },
  'E': { label: 'Very Poor', color: 'bg-red-500', textColor: 'text-red-700', bgColor: 'bg-red-50' },
  'F': { label: 'Critical', color: 'bg-red-600', textColor: 'text-red-800', bgColor: 'bg-red-100' }
}

const statusColors = {
  excellent: 'bg-emerald-100 text-emerald-800 border-emerald-200',
  good: 'bg-blue-100 text-blue-800 border-blue-200',
  fair: 'bg-amber-100 text-amber-800 border-amber-200',
  poor: 'bg-orange-100 text-orange-800 border-orange-200',
  very_poor: 'bg-red-100 text-red-800 border-red-200'
}

export default function CreditScorePage() {
  const [creditScore, setCreditScore] = useState<CreditScore | null>(null)
  const [loading, setLoading] = useState(true)
  const [showDetails, setShowDetails] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    fetchCreditScore()
  }, [])

  const fetchCreditScore = async () => {
    try {
      setLoading(true)

      // Fetch real data from backend API
      const creditScoreResponse = await apiService.getMyCreditScore()

      if (creditScoreResponse.status === 'success' && creditScoreResponse.data) {
        const data = creditScoreResponse.data as any

        // Transform backend data to match frontend interface
        const transformedCreditScore: CreditScore = {
          score: data.score || 650,
          grade: data.grade || 'C',
          status: data.status || 'fair',
          lastUpdated: data.lastUpdated || data.createdAt,
          factors: (data.factors || []).map((factor: any) => ({
            name: factor.name || 'Unknown Factor',
            impact: factor.impact || 'neutral',
            weight: factor.weight || 0,
            description: factor.description || 'No description available'
          })),
          history: (data.history || []).map((entry: any) => ({
            date: entry.date,
            score: entry.score,
            change: entry.change || 0
          })),
          recommendations: (data.recommendations || []).map((rec: any) => ({
            title: rec.title || 'General Recommendation',
            description: rec.description || '',
            priority: rec.priority || 'medium',
            impact: rec.impact || 0
          })),
          eligibility: {
            loans: data.eligibility?.loans !== false,
            insurance: data.eligibility?.insurance !== false,
            marketplace: data.eligibility?.marketplace !== false,
            limits: {
              loanAmount: data.eligibility?.loanAmount || 100000,
              insuranceCoverage: data.eligibility?.insuranceCoverage || 500000
            }
          }
        }

        setCreditScore(transformedCreditScore)
      } else {
        throw new Error('Failed to fetch credit score data')
      }
    } catch (error: any) {
      console.error("Failed to fetch credit score:", error)

      // If API fails, try to get basic info from financial dashboard
      try {
        const dashboardResponse = await apiService.getFinancialDashboard()
        if (dashboardResponse.status === 'success' && dashboardResponse.data) {
          const dashboardData = dashboardResponse.data as any

          // Create a basic credit score from dashboard data
          const basicCreditScore: CreditScore = {
            score: dashboardData.overview?.creditScore || 650,
            grade: (dashboardData.overview?.creditScore || 650) >= 750 ? 'B' : 'C',
            status: (dashboardData.overview?.creditScore || 650) >= 750 ? 'good' : 'fair',
            lastUpdated: new Date().toISOString().split('T')[0],
            factors: [
              {
                name: 'Payment History',
                impact: 'positive',
                weight: 35,
                description: 'Based on your transaction history and loan performance'
              },
              {
                name: 'Credit Utilization',
                impact: 'neutral',
                weight: 30,
                description: 'Your current credit utilization level'
              }
            ],
            history: [
              {
                date: new Date().toISOString().slice(0, 7),
                score: dashboardData.overview?.creditScore || 650,
                change: 0
              }
            ],
            recommendations: [
              {
                title: 'Complete More Transactions',
                description: 'Increase your activity to improve credit scoring data',
                priority: 'medium',
                impact: 10
              }
            ],
            eligibility: {
              loans: true,
              insurance: true,
              marketplace: true,
              limits: {
                loanAmount: 100000,
                insuranceCoverage: 500000
              }
            }
          }

          setCreditScore(basicCreditScore)
        } else {
          throw new Error('No fallback data available')
        }
      } catch (fallbackError) {
        toast({
          title: "Error",
          description: "Failed to load credit score data. Please try again.",
          variant: "destructive"
        })
      }
    } finally {
      setLoading(false)
    }
  }

  const handleRefresh = async () => {
    await fetchCreditScore()
    toast({
      title: "Credit Score Updated",
      description: "Your credit score has been refreshed successfully.",
      variant: "default"
    })
  }

  const handleDownloadReport = async () => {
    try {
      // Mock download - replace with actual API call
      console.log('Downloading credit report...')
      
      toast({
        title: "Download Started",
        description: "Your credit report is being prepared for download.",
        variant: "default"
      })
    } catch (error) {
      toast({
        title: "Download Failed",
        description: "Failed to download credit report. Please try again.",
        variant: "destructive"
      })
    }
  }

  const getScoreColor = (score: number) => {
    if (score >= 800) return 'text-emerald-600'
    if (score >= 700) return 'text-blue-600'
    if (score >= 600) return 'text-amber-600'
    if (score >= 500) return 'text-orange-600'
    return 'text-red-600'
  }

  const getScoreBackground = (score: number) => {
    if (score >= 800) return 'bg-emerald-50'
    if (score >= 700) return 'bg-blue-50'
    if (score >= 600) return 'bg-amber-50'
    if (score >= 500) return 'bg-orange-50'
    return 'bg-red-50'
  }

  if (loading) {
    return (
      <DashboardLayout pageTitle="Credit Score">
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {[...Array(3)].map((_, i) => (
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

  if (!creditScore) {
    return (
      <DashboardLayout pageTitle="Credit Score">
        <div className="text-center py-12">
          <CreditCard className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Credit Score Not Available</h3>
          <p className="text-gray-600">
            Unable to load your credit score information. Please try again.
          </p>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout pageTitle="Credit Score">
      <div className="space-y-6">
        {/* Page Header */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="space-y-1">
            <h1 className="text-2xl font-semibold text-gray-900">Credit Score</h1>
            <p className="text-gray-600">
              Monitor your credit health and eligibility for financial services
            </p>
          </div>
          
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleRefresh}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
            <Button onClick={handleDownloadReport}>
              <Download className="h-4 w-4 mr-2" />
              Download Report
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Credit Score Card */}
          <div className="lg:col-span-2">
            <Card className="border border-gray-200">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-lg font-medium">Your Credit Score</CardTitle>
                    <CardDescription>
                      Last updated: {new Date(creditScore.lastUpdated).toLocaleDateString()}
                    </CardDescription>
                  </div>
                  <Badge className={statusColors[creditScore.status]} variant="outline">
                    {creditScore.status.replace('_', ' ').toUpperCase()}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-center py-6">
                  <div className={`text-6xl font-bold ${getScoreColor(creditScore.score)} mb-2`}>
                    {creditScore.score}
                  </div>
                  <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full ${creditGrades[creditScore.grade].bgColor} ${creditGrades[creditScore.grade].textColor}`}>
                    <div className={`w-3 h-3 rounded-full ${creditGrades[creditScore.grade].color}`}></div>
                    <span className="font-medium">Grade {creditScore.grade} - {creditGrades[creditScore.grade].label}</span>
                  </div>
                </div>

                {/* Score Range */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Poor</span>
                    <span className="text-gray-600">Excellent</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3">
                    <div 
                      className={`h-3 rounded-full ${getScoreBackground(creditScore.score)}`}
                      style={{ width: `${(creditScore.score / 850) * 100}%` }}
                    ></div>
                  </div>
                  <div className="flex justify-between text-xs text-gray-500">
                    <span>300</span>
                    <span>500</span>
                    <span>650</span>
                    <span>750</span>
                    <span>850</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Credit Score History */}
            <Card className="border border-gray-200 mt-6">
              <CardHeader>
                <CardTitle className="text-lg font-medium">Score History</CardTitle>
                <CardDescription>
                  Track your credit score progress over time
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {creditScore.history.map((entry, index) => (
                    <div key={index} className="flex items-center justify-between p-3 border border-gray-100 rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                          <span className="text-sm font-medium text-blue-600">{entry.score}</span>
                        </div>
                        <div>
                          <div className="font-medium text-sm">{new Date(entry.date).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</div>
                          <div className="text-xs text-gray-500">Score: {entry.score}</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {entry.change > 0 ? (
                          <TrendingUp className="h-4 w-4 text-emerald-500" />
                        ) : entry.change < 0 ? (
                          <TrendingDown className="h-4 w-4 text-red-500" />
                        ) : (
                          <div className="w-4 h-4 text-gray-400">-</div>
                        )}
                        <span className={`text-sm font-medium ${entry.change > 0 ? 'text-emerald-600' : entry.change < 0 ? 'text-red-600' : 'text-gray-600'}`}>
                          {entry.change > 0 ? '+' : ''}{entry.change}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Eligibility Status */}
            <Card className="border border-gray-200">
              <CardHeader>
                <CardTitle className="text-base font-medium">Eligibility Status</CardTitle>
                <CardDescription>
                  Your current eligibility for financial services
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Loans</span>
                  <Badge variant={creditScore.eligibility.loans ? 'default' : 'secondary'}>
                    {creditScore.eligibility.loans ? 'Eligible' : 'Not Eligible'}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Insurance</span>
                  <Badge variant={creditScore.eligibility.insurance ? 'default' : 'secondary'}>
                    {creditScore.eligibility.insurance ? 'Eligible' : 'Not Eligible'}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Marketplace Credit</span>
                  <Badge variant={creditScore.eligibility.marketplace ? 'default' : 'secondary'}>
                    {creditScore.eligibility.marketplace ? 'Eligible' : 'Not Eligible'}
                  </Badge>
                </div>
              </CardContent>
            </Card>

            {/* Credit Limits */}
            <Card className="border border-gray-200">
              <CardHeader>
                <CardTitle className="text-base font-medium">Credit Limits</CardTitle>
                <CardDescription>
                  Maximum amounts you can access
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Loan Amount</span>
                    <span className="text-sm font-medium">₦{(creditScore.eligibility.limits.loanAmount / 1000).toFixed(0)}K</span>
                  </div>
                  <Progress value={75} className="h-2" />
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Insurance Coverage</span>
                    <span className="text-sm font-medium">₦{(creditScore.eligibility.limits.insuranceCoverage / 1000000).toFixed(1)}M</span>
                  </div>
                  <Progress value={60} className="h-2" />
                </div>
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card className="border border-gray-200">
              <CardHeader>
                <CardTitle className="text-base font-medium">Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button variant="outline" className="w-full justify-start">
                  <FileText className="h-4 w-4 mr-2" />
                  View Full Report
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <Target className="h-4 w-4 mr-2" />
                  Set Score Goals
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <Shield className="h-4 w-4 mr-2" />
                  Credit Monitoring
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Credit Factors */}
        <Card className="border border-gray-200">
          <CardHeader>
            <CardTitle className="text-lg font-medium">Credit Score Factors</CardTitle>
            <CardDescription>
              Understanding what influences your credit score
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {creditScore.factors.map((factor, index) => (
                <div key={index} className="p-4 border border-gray-100 rounded-lg">
                  <div className="flex items-start justify-between mb-2">
                    <h4 className="font-medium text-sm">{factor.name}</h4>
                    <div className="flex items-center gap-2">
                      {factor.impact === 'positive' ? (
                        <CheckCircle className="h-4 w-4 text-emerald-500" />
                      ) : factor.impact === 'negative' ? (
                        <XCircle className="h-4 w-4 text-red-500" />
                      ) : (
                        <Clock className="h-4 w-4 text-gray-500" />
                      )}
                      <span className="text-xs font-medium text-gray-600">{factor.weight}%</span>
                    </div>
                  </div>
                  <p className="text-xs text-gray-600">{factor.description}</p>
                  <div className="mt-2">
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className={`h-2 rounded-full ${
                          factor.impact === 'positive' ? 'bg-emerald-500' : 
                          factor.impact === 'negative' ? 'bg-red-500' : 'bg-gray-500'
                        }`}
                        style={{ width: `${factor.weight}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Recommendations */}
        <Card className="border border-gray-200">
          <CardHeader>
            <CardTitle className="text-lg font-medium">Improvement Recommendations</CardTitle>
            <CardDescription>
              Actionable steps to improve your credit score
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {creditScore.recommendations.map((recommendation, index) => (
                <div key={index} className="flex items-start gap-4 p-4 border border-gray-100 rounded-lg">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                    recommendation.priority === 'high' ? 'bg-red-100 text-red-600' :
                    recommendation.priority === 'medium' ? 'bg-amber-100 text-amber-600' :
                    'bg-blue-100 text-blue-600'
                  }`}>
                    {recommendation.priority === 'high' ? (
                      <AlertCircle className="h-4 w-4" />
                    ) : recommendation.priority === 'medium' ? (
                      <Clock className="h-4 w-4" />
                    ) : (
                      <Target className="h-4 w-4" />
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <h4 className="font-medium text-sm">{recommendation.title}</h4>
                      <Badge variant="outline" className="text-xs">
                        +{recommendation.impact} points
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-600">{recommendation.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}
