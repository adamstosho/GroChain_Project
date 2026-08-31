import { useState } from 'react'
import { apiService } from '@/lib/api'
import { getErrorMessage, getErrorStatus, asRecord } from '@/lib/error-utils'
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

function unwrap<T>(response: unknown): T | null {
  const rec = asRecord(response)
  if (rec.data && (rec.success === true || rec.status === 'success')) {
    return rec.data as T
  }
  return null
}

function responseMessage(response: unknown, fallback: string): string {
  const rec = asRecord(response)
  return typeof rec.message === 'string' ? rec.message : fallback
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
      const data = unwrap<TrustScoreData>(response)
      if (data) return data
      throw new Error(responseMessage(response, 'Failed to fetch trust score'))
    } catch (error: unknown) {
      if (!options?.silent) {
        toast({
          title: 'Trust score unavailable',
          description: getErrorMessage(error),
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
      return unwrap<PricePulseData>(response)
    } catch (error: unknown) {
      console.error('PricePulse Error:', error)
      return null
    } finally {
      setLoading(false)
    }
  }

  const getShipmentRisk = async (shipmentId: string): Promise<Record<string, unknown> | null> => {
    try {
      const response = await apiService.get(`/ai/shipment-risk/${shipmentId}`)
      return unwrap<Record<string, unknown>>(response)
    } catch (error: unknown) {
      console.error('ShipmentRisk Error:', error)
      return null
    }
  }

  const scanCropQuality = async (imageUrl: string): Promise<ScanResult | null> => {
    setLoading(true)
    try {
      const response = await apiService.post('/ai/scan-quality', { imageUrl })
      const data = unwrap<ScanResult>(response)
      if (data) {
        toast({
          title: 'Scan complete',
          description: 'Advisory crop quality analysis is ready. Confirm with a human inspector.',
        })
        return data
      }
      throw new Error(responseMessage(response, 'Failed to analyze crop'))
    } catch (error: unknown) {
      const message = getErrorMessage(error, 'Failed to analyze crop')
      const unavailable =
        getErrorStatus(error) === 501 ||
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
      return unwrap<{
        forecastedRevenue: number
        confidence: number
        growthIndicator: 'rising' | 'falling'
        insights: string[]
        disclaimer?: string
        sampleSize?: number
      }>(response)
    } catch (error: unknown) {
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
