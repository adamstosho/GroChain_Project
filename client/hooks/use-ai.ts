import { useState } from 'react'
import { apiService } from '@/lib/api'
import { useToast } from './use-toast'

export interface TrustScoreData {
  score: number
  grade: string
  metrics: {
    successRate: number
    avgRating: string
    totalTransactions: number
    verificationStatus: string
  }
  summary: string
}

export interface PricePulseData {
  cropType: string
  suggestedPrice: number
  priceRange: {
    min: number
    max: number
  }
  trend: 'rising' | 'falling' | 'stable'
  confidence: number
  marketInsights: string
}

export interface ScanResult {
  analysisId: string
  qualityGrade: string
  confidence: number
  findings: string[]
  recommendations: string
}

export function useAi() {
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()

  /**
   * Fetch AI Trust Score for a user
   */
  const getTrustScore = async (userId: string): Promise<TrustScoreData | null> => {
    setLoading(true)
    try {
      const response = await apiService.get(`/ai/trust-score/${userId}`)
      if (response.success) {
        return response.data
      }
      throw new Error(response.message || 'Failed to fetch trust score')
    } catch (error: any) {
      toast({
        title: "AI Analysis Error",
        description: error.message,
        variant: "destructive",
      })
      return null
    } finally {
      setLoading(false)
    }
  }

  /**
   * Fetch PricePulse advisory for a crop
   */
  const getPricePulse = async (cropType: string, location?: string): Promise<PricePulseData | null> => {
    setLoading(true)
    try {
      const response = await apiService.get(`/ai/price-pulse?cropType=${cropType}${location ? `&location=${location}` : ''}`)
      if (response.success) {
        return response.data
      }
      throw new Error(response.message || 'Failed to fetch price advisory')
    } catch (error: any) {
      console.error('PricePulse Error:', error)
      return null
    } finally {
      setLoading(false)
    }
  }

  /**
   * Fetch AI Shipment Risk Analysis
   */
  const getShipmentRisk = async (shipmentId: string): Promise<any | null> => {
    try {
      const response = await apiService.get(`/ai/shipment-risk/${shipmentId}`)
      if (response.success) {
        return response.data
      }
      return null
    } catch (error: any) {
      console.error('ShipmentRisk Error:', error)
      return null
    }
  }

  /**
   * Execute GroScan (Vision AI) for crop quality
   */
  const scanCropQuality = async (imageUrl: string): Promise<ScanResult | null> => {
    setLoading(true)
    try {
      const response = await apiService.post('/ai/scan-quality', { imageUrl })
      if (response.success) {
        toast({
          title: "Scan Complete",
          description: "AI Vision analysis successfully processed.",
        })
        return response.data
      }
      throw new Error(response.message || 'Failed to analyze crop')
    } catch (error: any) {
      toast({
        title: "Vision AI Error",
        description: error.message,
        variant: "destructive",
      })
      return null
    } finally {
      setLoading(false)
    }
  }

  /**
   * Fetch AI Growth Forecast for the logged-in farmer
   */
  const getGrowthForecast = async (): Promise<{
    forecastedRevenue: number
    confidence: number
    growthIndicator: 'rising' | 'falling'
    insights: string[]
  } | null> => {
    setLoading(true)
    try {
      const response = await apiService.get('/ai/forecast')
      if (response.success) {
        return response.data
      }
      return null
    } catch (error: any) {
      console.error('Forecast Error:', error)
      return null
    } finally {
      setLoading(false)
    }
  }

  return {
    loading,
    getTrustScore,
    getPricePulse,
    getShipmentRisk,
    getGrowthForecast,
    scanCropQuality
  }
}
