"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { TrendingUp, AlertCircle, CheckCircle, Clock } from "lucide-react"
import { apiService } from "@/lib/api"
import type { CreditScore } from "@/lib/types"

export default function CreditScorePage() {
  const [creditScore, setCreditScore] = useState<CreditScore | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchCreditScore()
  }, [])

  const fetchCreditScore = async () => {
    try {
      setLoading(true)
      const response: any = await apiService.getMyCreditScore()
      const data = response?.data || response
      setCreditScore(data as any)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch credit score")
    } finally {
      setLoading(false)
    }
  }

  const getScoreColor = (score: number) => {
    if (score >= 750) return "text-green-600"
    if (score >= 650) return "text-yellow-600"
    return "text-red-600"
  }

  const getScoreLabel = (score: number) => {
    if (score >= 750) return "Excellent"
    if (score >= 650) return "Good"
    if (score >= 550) return "Fair"
    return "Poor"
  }

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-48 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardContent className="flex items-center justify-center h-48">
            <div className="text-center">
              <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
              <p className="text-red-600">{error}</p>
              <Button onClick={fetchCreditScore} className="mt-4">
                Try Again
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Credit Score</h1>
          <p className="text-gray-600">Monitor and improve your financial health</p>
        </div>
        <Button onClick={fetchCreditScore} variant="outline">
          Refresh Score
        </Button>
      </div>

      {creditScore && (
        <>
          {/* Credit Score Overview */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card className="col-span-1 md:col-span-2">
              <CardHeader>
                <CardTitle>Your Credit Score</CardTitle>
                <CardDescription>
                  Last updated: {new Date(creditScore.lastUpdated).toLocaleDateString()}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-center">
                  <div className="relative">
                    <div className="w-32 h-32 rounded-full border-8 border-gray-200 flex items-center justify-center">
                      <div className="text-center">
                        <div className={`text-3xl font-bold ${getScoreColor(creditScore.score)}`}>
                          {creditScore.score}
                        </div>
                        <div className="text-sm text-gray-600">{getScoreLabel(creditScore.score)}</div>
                      </div>
                    </div>
                  </div>
                </div>
                <Progress value={(creditScore.score / 850) * 100} className="mt-4" />
                <div className="flex justify-between text-sm text-gray-600 mt-2">
                  <span>300</span>
                  <span>850</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Payment History</CardTitle>
                <CheckCircle className="h-4 w-4 text-green-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{creditScore.factors.paymentHistory}%</div>
                <p className="text-xs text-gray-600">On-time payments</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Harvest Consistency</CardTitle>
                <TrendingUp className="h-4 w-4 text-green-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{creditScore.factors.harvestConsistency}%</div>
                <p className="text-xs text-gray-600">Regular harvests</p>
              </CardContent>
            </Card>
          </div>

          {/* Detailed Analysis */}
          <Tabs defaultValue="factors" className="space-y-4">
            <TabsList>
              <TabsTrigger value="factors">Score Factors</TabsTrigger>
              <TabsTrigger value="recommendations">Recommendations</TabsTrigger>
              <TabsTrigger value="history">Score History</TabsTrigger>
            </TabsList>

            <TabsContent value="factors" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Score Breakdown</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-sm">Payment History</span>
                        <span className="font-medium">{creditScore.factors.paymentHistory}%</span>
                      </div>
                      <Progress value={creditScore.factors.paymentHistory} />
                    </div>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-sm">Harvest Consistency</span>
                        <span className="font-medium">{creditScore.factors.harvestConsistency}%</span>
                      </div>
                      <Progress value={creditScore.factors.harvestConsistency} />
                    </div>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-sm">Business Stability</span>
                        <span className="font-medium">{creditScore.factors.businessStability}%</span>
                      </div>
                      <Progress value={creditScore.factors.businessStability} />
                    </div>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-sm">Market Reputation</span>
                        <span className="font-medium">{creditScore.factors.marketReputation}%</span>
                      </div>
                      <Progress value={creditScore.factors.marketReputation} />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Score Impact</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex items-center space-x-3">
                        <CheckCircle className="h-5 w-5 text-green-600" />
                        <div>
                          <p className="font-medium">Consistent Payments</p>
                          <p className="text-sm text-gray-600">Positive impact on score</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-3">
                        <TrendingUp className="h-5 w-5 text-green-600" />
                        <div>
                          <p className="font-medium">Regular Harvests</p>
                          <p className="text-sm text-gray-600">Shows business stability</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-3">
                        <Clock className="h-5 w-5 text-yellow-600" />
                        <div>
                          <p className="font-medium">Account Age</p>
                          <p className="text-sm text-gray-600">Building credit history</p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="recommendations" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Improvement Recommendations</CardTitle>
                  <CardDescription>Follow these tips to improve your credit score</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {creditScore.recommendations.map((recommendation, index) => (
                      <div key={index} className="flex items-start space-x-3 p-4 bg-blue-50 rounded-lg">
                        <div className="flex-shrink-0">
                          <Badge variant="secondary">{index + 1}</Badge>
                        </div>
                        <p className="text-sm">{recommendation}</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="history" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Score History</CardTitle>
                  <CardDescription>Track your credit score changes over time</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-12">
                    <TrendingUp className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600">Score history will appear here as data becomes available</p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </>
      )}
    </div>
  )
}
