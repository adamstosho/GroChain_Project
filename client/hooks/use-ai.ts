import { useState } from 'react'
import { apiService } from '@/lib/api'
import { useToast } from './use-toast'

export interface TrustScoreData {
  score: number
  grade: string
  confidence?: number
  metrics: {
    successRate: number | null
    avgRating: number | string | null
    totalTransactions: number
    reviewCount?: number
    verificationStatus: string
    verificationFactors?: string[]
  }
  factors?: Record<string, number>
  summary: string
  disclaimer?: string
  method?: string
  engine?: string
}

export interface PricePulseData {
  cropType: string
  suggestedPrice: number | null
  priceRange: {
    min: number
    max: number
  } | null
  trend: 'rising' | 'falling' | 'stable'
  confidence: number
  sampleSize?: number
  marketInsights: string
  disclaimer?: string
}

export interface ScanResult {
  analysisId: string
  qualityGrade: string
  confidence: number
  findings: string[]
  recommendations: string
  cropGuess?: string
  disclaimer?: string
}

function unwrap(response: any) {
  // Supports both { success, data } and { status: 'success', data }
  if (response?.data && (response.success === true || response.status === 'success')) {
    return response.data
  }
  return null
}

export function useAi() {
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()

  const getTrustScore = async (
    userId: string,
    options?: { silent?: boolean }
  ): Promise<TrustScoreData | null> => {
    if (!options?.silent) setLoading(true)
    try {
      const response = await apiService.get(`/ai/trust-score/${userId}`)
      const data = unwrap(response)
      if (data) return data
      throw new Error(response?.message || 'Failed to fetch trust score')
    } catch (error: any) {
      if (!options?.silent) {
        toast({
          title: 'Trust score unavailable',
          description: error.message,
          variant: 'destructive',
        })
      }
      return null
    } finally {
      if (!options?.silent) setLoading(false)
    }
  }

  const getPricePulse = async (cropType: string, location?: string): Promise<PricePulseData | null> => {
    setLoading(true)
    try {
      const q = encodeURIComponent(cropType)
      const loc = location ? `&location=${encodeURIComponent(location)}` : ''
      const response = await apiService.get(`/ai/price-pulse?cropType=${q}${loc}`)
      return unwrap(response)
    } catch (error: any) {
      console.error('PricePulse Error:', error)
      return null
    } finally {
      setLoading(false)
    }
  }

  const getShipmentRisk = async (shipmentId: string): Promise<any | null> => {
    try {
      const response = await apiService.get(`/ai/shipment-risk/${shipmentId}`)
      return unwrap(response)
    } catch (error: any) {
      console.error('ShipmentRisk Error:', error)
      return null
    }
  }

  const scanCropQuality = async (imageUrl: string): Promise<ScanResult | null> => {
    setLoading(true)
    try {
      const response = await apiService.post('/ai/scan-quality', { imageUrl })
      const data = unwrap(response)
      if (data) {
        toast({
          title: 'Scan complete',
          description: 'Advisory crop quality analysis is ready. Confirm with a human inspector.',
        })
        return data
      }
      throw new Error(response?.message || 'Failed to analyze crop')
    } catch (error: any) {
      const message = error?.message || 'Failed to analyze crop'
      const unavailable =
        error?.status === 501 ||
        /not (yet )?configured|not yet available|VISION_NOT_CONFIGURED|501/i.test(message)

      toast({
        title: unavailable ? 'Vision AI not configured' : 'Vision AI error',
        description: unavailable
          ? 'Crop scanning needs GEMINI_API_KEY on the server. You can still grade harvests manually.'
          : message,
        variant: unavailable ? 'default' : 'destructive',
      })
      return null
    } finally {
      setLoading(false)
    }
  }

  const getGrowthForecast = async (): Promise<{
    forecastedRevenue: number
    confidence: number
    growthIndicator: 'rising' | 'falling'
    insights: string[]
    disclaimer?: string
    sampleSize?: number
  } | null> => {
    setLoading(true)
    try {
      const response = await apiService.get('/ai/forecast')
      return unwrap(response)
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
    scanCropQuality,
  }
}
