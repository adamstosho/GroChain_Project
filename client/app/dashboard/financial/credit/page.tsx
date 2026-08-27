"use client"

import { useState, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { DashboardLayout } from "@/components/dashboard/dashboard-layout"
import { apiService } from "@/lib/api"
import { formatCompactCurrency } from "@/lib/format"
import { useToast } from "@/hooks/use-toast"
import {
  CreditCard,
  TrendingUp,
  TrendingDown,
  CheckCircle,
  XCircle,
  Clock,
  FileText,
  Download,
  RefreshCw,
  Target,
  Shield
} from "lucide-react"

interface CreditScore {
  score: number
  grade: 'A' | 'B' | 'C' | 'D' | 'E' | 'F'
  status: 'excellent' | 'good' | 'fair' | 'poor' | 'very_poor'
  lastUpdated: string
  factors: Array<{
    key: string
    label: string
    value: number
    impact: 'positive' | 'negative' | 'neutral'
  }>
  history: Array<{
    score: number
    reason: string
    updatedAt: string
    change: number | null
  }>
  recommendations: string[]
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

const factorLabels: Record<string, string> = {
  paymentHistory: 'Payment History',
  harvestConsistency: 'Harvest Consistency',
  businessStability: 'Business Stability',
  marketReputation: 'Market Reputation',
  financialDiscipline: 'Financial Discipline',
  collateralValue: 'Collateral Value'
}

const getFactorImpact = (value: number): 'positive' | 'negative' | 'neutral' => {
  if (value >= 70) return 'positive'
  if (value < 40) return 'negative'
  return 'neutral'
}

const creditGrades = {
  'A': { label: 'Excellent', color: 'bg-success', textColor: 'text-success', bgColor: 'bg-success/10' },
  'B': { label: 'Good', color: 'bg-primary', textColor: 'text-primary', bgColor: 'bg-primary/10' },
  'C': { label: 'Fair', color: 'bg-warning', textColor: 'text-warning', bgColor: 'bg-warning/10' },
  'D': { label: 'Poor', color: 'bg-warning', textColor: 'text-warning', bgColor: 'bg-warning/10' },
  'E': { label: 'Very Poor', color: 'bg-destructive', textColor: 'text-destructive', bgColor: 'bg-destructive/10' },
  'F': { label: 'Critical', color: 'bg-destructive', textColor: 'text-destructive', bgColor: 'bg-destructive/10' }
}

const statusColors = {
  excellent: 'bg-success/10 text-success border-success/10',
  good: 'bg-primary/10 text-primary border-primary/10',
  fair: 'bg-warning/10 text-warning border-warning/10',
  poor: 'bg-warning/10 text-warning border-warning/10',
  very_poor: 'bg-destructive/10 text-destructive border-destructive/10'
}

export default function CreditScorePage() {
  const [creditScore, setCreditScore] = useState<CreditScore | null>(null)
  const [loading, setLoading] = useState(true)
  const { toast } = useToast()

  const fetchCreditScore = useCallback(async () => {
    try {
      setLoading(true)

      // Fetch real data from backend API
      const creditScoreResponse = await apiService.getMyCreditScore()

      if (creditScoreResponse.status === 'success' && creditScoreResponse.data) {
        const data = creditScoreResponse.data as any

        // Transform backend data to match frontend interface
        const factorsObj = data.factors || {}
        const history = (data.history || []).slice().sort((a: any, b: any) =>
          new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime())

        const transformedCreditScore: CreditScore = {
          score: data.score ?? 0,
          grade: data.grade || 'C',
          status: data.status || 'fair',
          lastUpdated: data.lastUpdated || data.createdAt,
          factors: Object.keys(factorLabels)
            .filter((key) => factorsObj[key] !== undefined)
            .map((key) => ({
              key,
              label: factorLabels[key],
              value: factorsObj[key],
              impact: getFactorImpact(factorsObj[key])
            })),
          history: history.map((entry: any, index: number) => ({
            score: entry.score,
            reason: entry.reason || 'Score recalculated',
            updatedAt: entry.updatedAt,
            change: index > 0 ? entry.score - history[index - 1].score : null
          })),
          recommendations: data.recommendations || [],
          eligibility: {
            loans: data.eligibility?.loans ?? false,
            insurance: data.eligibility?.insurance ?? false,
            marketplace: data.eligibility?.marketplace ?? false,
            limits: {
              loanAmount: data.eligibility?.limits?.loanAmount || 0,
              insuranceCoverage: data.eligibility?.limits?.insuranceCoverage || 0
            }
          }
        }

        setCreditScore(transformedCreditScore)
      } else {
        throw new Error('Failed to fetch credit score data')
      }
    } catch (error: any) {
      console.error("Failed to fetch credit score:", error)
      setCreditScore(null)
      toast({
        title: "Error",
        description: "Failed to load credit score data. Please try again.",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }, [toast])

  useEffect(() => {
    fetchCreditScore()
  }, [fetchCreditScore])

  const handleRefresh = async () => {
    await fetchCreditScore()
    toast({
      title: "Credit Score Updated",
      description: "Your credit score has been refreshed successfully.",
      variant: "default"
    })
  }

  const handleDownloadReport = async () => {
    if (!creditScore) return

    try {
      const printWindow = window.open('', '_blank')
      if (!printWindow) {
        throw new Error('Unable to open print window. Please allow popups.')
      }

      const formatDate = (value: string) => value ? new Date(value).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : 'N/A'

      const factorsRows = creditScore.factors.map(factor => `
        <tr>
          <td>${factor.label}</td>
          <td style="text-transform: capitalize;">${factor.impact}</td>
          <td>${factor.value}/100</td>
        </tr>
      `).join('')

      const recommendationsRows = creditScore.recommendations.map(rec => `
        <tr>
          <td>${rec}</td>
        </tr>
      `).join('')

      const html = `
        <!DOCTYPE html>
        <html>
        <head>
          <title>Credit Report</title>
          <meta charset="utf-8" />
          <style>
            body { font-family: Arial, sans-serif; padding: 32px; color: #111827; }
            h1 { font-size: 22px; margin-bottom: 4px; }
            h2 { font-size: 16px; margin-top: 28px; margin-bottom: 8px; }
            table { width: 100%; border-collapse: collapse; margin-top: 8px; }
            th, td { text-align: left; padding: 8px; border-bottom: 1px solid #e5e7eb; font-size: 13px; }
            th { background: #f9fafb; }
            .score { font-size: 40px; font-weight: bold; }
            .meta { color: #6b7280; font-size: 13px; }
          </style>
        </head>
        <body>
          <h1>GroChain Credit Report</h1>
          <div class="meta">Generated ${formatDate(new Date().toISOString())}</div>
          <div class="score">${creditScore.score}</div>
          <div class="meta">Grade ${creditScore.grade} &middot; ${creditScore.status.replace('_', ' ')} &middot; Last updated ${formatDate(creditScore.lastUpdated)}</div>

          <h2>Eligibility</h2>
          <table>
            <tr><th>Service</th><th>Eligible</th><th>Limit</th></tr>
            <tr><td>Loans</td><td>${creditScore.eligibility.loans ? 'Yes' : 'No'}</td><td>&#8358;${creditScore.eligibility.limits.loanAmount.toLocaleString()}</td></tr>
            <tr><td>Insurance</td><td>${creditScore.eligibility.insurance ? 'Yes' : 'No'}</td><td>&#8358;${creditScore.eligibility.limits.insuranceCoverage.toLocaleString()}</td></tr>
            <tr><td>Marketplace</td><td>${creditScore.eligibility.marketplace ? 'Yes' : 'No'}</td><td>-</td></tr>
          </table>

          <h2>Score Factors</h2>
          <table>
            <tr><th>Factor</th><th>Impact</th><th>Weight</th><th>Description</th></tr>
            ${factorsRows || '<tr><td colspan="4">No factor data available</td></tr>'}
          </table>

          <h2>Recommendations</h2>
          <table>
            <tr><th>Recommendation</th><th>Priority</th><th>Description</th></tr>
            ${recommendationsRows || '<tr><td colspan="3">No recommendations available</td></tr>'}
          </table>
        </body>
        </html>
      `

      printWindow.document.open()
      printWindow.document.write(html)
      printWindow.document.close()

      window.setTimeout(() => {
        printWindow.focus()
        printWindow.print()
      }, 400)

      toast({
        title: "Report Ready",
        description: "Your credit report has been opened for printing/saving as PDF.",
        variant: "default"
      })
    } catch (error) {
      console.error("Failed to generate credit report:", error)
      toast({
        title: "Download Failed",
        description: "Failed to download credit report. Please try again.",
        variant: "destructive"
      })
    }
  }

  const getScoreColor = (score: number) => {
    if (score >= 800) return 'text-success'
    if (score >= 700) return 'text-primary'
    if (score >= 600) return 'text-warning'
    if (score >= 500) return 'text-warning'
    return 'text-destructive'
  }

  const getScoreBackground = (score: number) => {
    if (score >= 800) return 'bg-success/10'
    if (score >= 700) return 'bg-primary/10'
    if (score >= 600) return 'bg-warning/10'
    if (score >= 500) return 'bg-warning/10'
    return 'bg-destructive/10'
  }

  if (loading) {
    return (
      <DashboardLayout pageTitle="Credit Score">
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {[...Array(3)].map((_, i) => (
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

  if (!creditScore) {
    return (
      <DashboardLayout pageTitle="Credit Score">
        <div className="text-center py-12">
          <CreditCard className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-medium text-foreground mb-2">Credit Score Not Available</h3>
          <p className="text-muted-foreground">
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
            <h1 className="text-2xl font-semibold text-foreground">Credit Score</h1>
            <p className="text-muted-foreground">
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
            <Card className="border border-border">
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
                    <span className="text-muted-foreground">Poor</span>
                    <span className="text-muted-foreground">Excellent</span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-3">
                    <div
                      className={`h-3 rounded-full ${getScoreBackground(creditScore.score)}`}
                      style={{ width: `${(creditScore.score / 850) * 100}%` }}
                    ></div>
                  </div>
                  <div className="flex justify-between text-xs text-muted-foreground">
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
            <Card className="border border-border mt-6">
              <CardHeader>
                <CardTitle className="text-lg font-medium">Score History</CardTitle>
                <CardDescription>
                  Track your credit score progress over time
                </CardDescription>
              </CardHeader>
              <CardContent>
                {creditScore.history.length > 0 ? (
                  <div className="space-y-4">
                    {creditScore.history.map((entry, index) => (
                      <div key={index} className="flex items-center justify-between p-3 border border-border rounded-lg">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                            <span className="text-sm font-medium text-primary">{entry.score}</span>
                          </div>
                          <div>
                            <div className="font-medium text-sm">{new Date(entry.updatedAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</div>
                            <div className="text-xs text-muted-foreground">{entry.reason}</div>
                          </div>
                        </div>
                        {entry.change !== null && (
                          <div className="flex items-center gap-2">
                            {entry.change > 0 ? (
                              <TrendingUp className="h-4 w-4 text-success" />
                            ) : entry.change < 0 ? (
                              <TrendingDown className="h-4 w-4 text-destructive" />
                            ) : (
                              <div className="w-4 h-4 text-muted-foreground">-</div>
                            )}
                            <span className={`text-sm font-medium ${entry.change > 0 ? 'text-success' : entry.change < 0 ? 'text-destructive' : 'text-muted-foreground'}`}>
                              {entry.change > 0 ? '+' : ''}{entry.change}
                            </span>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-6">No score history yet.</p>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Eligibility Status */}
            <Card className="border border-border">
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
            <Card className="border border-border">
              <CardHeader>
                <CardTitle className="text-base font-medium">Credit Limits</CardTitle>
                <CardDescription>
                  Maximum amounts you can access
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Loan Amount</span>
                    <span className="text-sm font-medium">{formatCompactCurrency(creditScore.eligibility.limits.loanAmount)}</span>
                  </div>
                  <Progress value={75} className="h-2" />
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Insurance Coverage</span>
                    <span className="text-sm font-medium">{formatCompactCurrency(creditScore.eligibility.limits.insuranceCoverage)}</span>
                  </div>
                  <Progress value={60} className="h-2" />
                </div>
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card className="border border-border">
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
        <Card className="border border-border">
          <CardHeader>
            <CardTitle className="text-lg font-medium">Credit Score Factors</CardTitle>
            <CardDescription>
              Understanding what influences your credit score
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {creditScore.factors.map((factor) => (
                <div key={factor.key} className="p-4 border border-border rounded-lg">
                  <div className="flex items-start justify-between mb-2">
                    <h4 className="font-medium text-sm">{factor.label}</h4>
                    <div className="flex items-center gap-2">
                      {factor.impact === 'positive' ? (
                        <CheckCircle className="h-4 w-4 text-success" />
                      ) : factor.impact === 'negative' ? (
                        <XCircle className="h-4 w-4 text-destructive" />
                      ) : (
                        <Clock className="h-4 w-4 text-muted-foreground" />
                      )}
                      <span className="text-xs font-medium text-muted-foreground">{factor.value}/100</span>
                    </div>
                  </div>
                  <div className="mt-2">
                    <div className="w-full bg-muted rounded-full h-2">
                      <div
                        className={`h-2 rounded-full ${factor.impact === 'positive' ? 'bg-success' :
                          factor.impact === 'negative' ? 'bg-destructive' : 'bg-secondary'
                          }`}
                        style={{ width: `${factor.value}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Recommendations */}
        <Card className="border border-border">
          <CardHeader>
            <CardTitle className="text-lg font-medium">Improvement Recommendations</CardTitle>
            <CardDescription>
              Actionable steps to improve your credit score
            </CardDescription>
          </CardHeader>
          <CardContent>
            {creditScore.recommendations.length > 0 ? (
              <div className="space-y-4">
                {creditScore.recommendations.map((recommendation, index) => (
                  <div key={index} className="flex items-start gap-4 p-4 border border-border rounded-lg">
                    <div className="w-8 h-8 rounded-full flex items-center justify-center bg-primary/10 text-primary">
                      <Target className="h-4 w-4" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm text-muted-foreground">{recommendation}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-6">No recommendations available yet.</p>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}
