const mongoose = require('mongoose')
const User = require('../models/user.model')
const Review = require('../models/review.model')
const Order = require('../models/order.model')
const Harvest = require('../models/harvest.model')
const Listing = require('../models/listing.model')
const Shipment = require('../models/shipment.model')
const moment = require('moment')

const ENGINE = {
  id: 'grochain-insights-rules-v2',
  kind: 'deterministic_analytics',
  // Honest label: these endpoints are data-driven heuristics, not a trained neural net.
  disclaimer:
    'Advisory scores from platform transaction data. Not a credit decision, guarantee, or neural-network prediction.'
}

function ok(res, data, extras = {}) {
  return res.json({
    status: 'success',
    success: true,
    data: {
      ...data,
      engine: ENGINE.id,
      method: ENGINE.kind,
      disclaimer: ENGINE.disclaimer,
      generatedAt: new Date().toISOString(),
      ...extras
    }
  })
}

function fail(res, status, message) {
  return res.status(status).json({ status: 'error', success: false, message })
}

function escapeRegex(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

function clamp(n, min, max) {
  return Math.min(Math.max(n, min), max)
}

/** Confidence rises with sample size; never invent high confidence from thin data. */
function sampleConfidence(n, saturatesAt = 40) {
  if (!n || n <= 0) return 0.15
  return clamp(0.2 + (n / saturatesAt) * 0.7, 0.15, 0.92)
}

function isAllowedImageUrl(url) {
  try {
    const u = new URL(url)
    if (u.protocol !== 'https:') return false
    // Block obvious SSRF targets
    const host = u.hostname.toLowerCase()
    if (
      host === 'localhost' ||
      host.endsWith('.local') ||
      host === 'metadata.google.internal' ||
      /^127\./.test(host) ||
      /^10\./.test(host) ||
      /^192\.168\./.test(host) ||
      /^172\.(1[6-9]|2\d|3[0-1])\./.test(host)
    ) {
      return false
    }
    return true
  } catch {
    return false
  }
}

/**
 * GroChain Insights — production advisory analytics.
 * Benchmarked against OWASP GenAI LLM Top 10:2026:
 *  - LLM07 Misinformation: honest method labeling (no fake "neural net")
 *  - LLM06 Unbounded Consumption: route-level rate limit
 *  - LLM10 Improper Output Handling: structured JSON only; vision URL allowlist
 */
class AiController {
  /**
   * Trust score — public reputation for authenticated users (marketplace signal).
   */
  async getTrustScore(req, res) {
    try {
      const { userId } = req.params
      if (!mongoose.Types.ObjectId.isValid(userId)) {
        return fail(res, 400, 'Invalid user id')
      }

      const user = await User.findById(userId).select(
        'name role status emailVerified phoneVerified createdAt partner profile.farmName'
      )
      if (!user) return fail(res, 404, 'User not found')

      const [ordersAsSeller, ordersAsBuyer, reviews] = await Promise.all([
        Order.find({ seller: userId }).select('status paymentStatus').lean(),
        Order.find({ buyer: userId }).select('status paymentStatus').lean(),
        Review.find({ farmer: userId, status: 'approved' }).select('rating').lean()
      ])

      const orders = [...ordersAsSeller, ...ordersAsBuyer]
      const totalOrders = orders.length
      const successfulOrders = orders.filter(
        (o) => o.status === 'delivered' || (o.status === 'paid' && o.paymentStatus === 'paid')
      ).length
      const cancelledOrRefunded = orders.filter(
        (o) => o.status === 'cancelled' || o.status === 'refunded'
      ).length

      const hasOrderHistory = totalOrders > 0
      const successRate = hasOrderHistory ? successfulOrders / totalOrders : null

      const hasReviews = reviews.length > 0
      const avgRating = hasReviews
        ? reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length
        : null

      // Verification uses real schema fields only
      let verificationBoost = 0
      const verificationFactors = []
      if (user.emailVerified) {
        verificationBoost += 12
        verificationFactors.push('email_verified')
      }
      if (user.phoneVerified) {
        verificationBoost += 8
        verificationFactors.push('phone_verified')
      }
      if (user.status === 'active') {
        verificationBoost += 5
        verificationFactors.push('account_active')
      }
      if (user.role === 'farmer' && user.profile?.farmName) {
        verificationBoost += 5
        verificationFactors.push('farm_profile')
      }

      const monthsSinceJoined = Math.max(0, moment().diff(moment(user.createdAt), 'months'))
      const loyaltyBoost = Math.min(monthsSinceJoined * 1.5, 10)

      // Base score: only from real evidence; new users start mid-low, not "Highly Trusted"
      let baseScore = 35
      if (hasOrderHistory) {
        baseScore = successRate * 45
        // Penalize heavy cancel/refund rate
        const cancelRate = cancelledOrRefunded / totalOrders
        baseScore -= cancelRate * 15
      }
      if (hasReviews) {
        baseScore += (avgRating / 5) * 30
      } else if (hasOrderHistory) {
        baseScore += 8 // mild credit for trading without reviews yet
      }

      let finalScore = baseScore + verificationBoost + loyaltyBoost
      finalScore = clamp(finalScore, 0, 100)

      let grade = 'C'
      if (finalScore >= 90) grade = 'A+'
      else if (finalScore >= 80) grade = 'A'
      else if (finalScore >= 70) grade = 'B+'
      else if (finalScore >= 60) grade = 'B'
      else if (finalScore >= 45) grade = 'C+'

      const hasRealHistory = hasOrderHistory || hasReviews
      if (!hasRealHistory && (grade === 'A+' || grade === 'A' || grade === 'B+')) {
        grade = 'B'
      }

      const evidenceCount = totalOrders + reviews.length + verificationFactors.length
      const confidence = sampleConfidence(evidenceCount, 30)

      return ok(res, {
        userId,
        score: Math.round(finalScore),
        grade,
        confidence: Number(confidence.toFixed(2)),
        metrics: {
          successRate: hasOrderHistory ? Math.round(successRate * 100) : null,
          avgRating: hasReviews ? Number(avgRating.toFixed(1)) : null,
          totalTransactions: totalOrders,
          reviewCount: reviews.length,
          verificationStatus: user.status,
          verificationFactors
        },
        factors: {
          transactionWeight: hasOrderHistory ? Math.round(clamp(baseScore, 0, 45)) : 0,
          reviewWeight: hasReviews ? Math.round((avgRating / 5) * 30) : 0,
          verificationBoost,
          loyaltyBoost: Math.round(loyaltyBoost)
        },
        summary: hasRealHistory
          ? `${user.role} trust grade ${grade} from ${totalOrders} orders and ${reviews.length} reviews.`
          : `${user.role} has limited platform history; score reflects verification and account age only.`
      })
    } catch (error) {
      console.error('Trust Score Error:', error.message)
      return fail(res, 500, 'Failed to calculate trust score')
    }
  }

  /**
   * PricePulse — market price advisory from listings + delivered order item prices.
   */
  async getPricePulse(req, res) {
    try {
      const cropType = (req.query.cropType || '').trim()
      const location = (req.query.location || '').trim()
      if (!cropType || cropType.length > 80) {
        return fail(res, 400, 'Crop type is required')
      }

      const cropRegex = new RegExp(escapeRegex(cropType), 'i')
      const listingFilter = {
        cropName: cropRegex,
        status: { $in: ['active', 'sold_out'] }
      }
      if (location) {
        listingFilter.location = new RegExp(escapeRegex(location), 'i')
      }

      const activeListings = await Listing.find(listingFilter)
        .select('basePrice cropName location status availableQuantity')
        .limit(80)
        .lean()

      const listingIds = activeListings.map((l) => l._id)
      // Also find listings by crop name historically (may be inactive)
      const historicalListings = await Listing.find({ cropName: cropRegex })
        .select('_id')
        .limit(100)
        .lean()
      const idSet = new Set([
        ...listingIds.map((id) => id.toString()),
        ...historicalListings.map((l) => l._id.toString())
      ])
      const allListingIds = [...idSet].map((id) => new mongoose.Types.ObjectId(id))

      const deliveredOrders = await Order.find({
        status: 'delivered',
        'items.listing': { $in: allListingIds }
      })
        .select('items total')
        .sort({ createdAt: -1 })
        .limit(40)
        .lean()

      const listingIdStrings = idSet
      const historicalUnitPrices = []
      for (const order of deliveredOrders) {
        for (const item of order.items || []) {
          if (!item.listing) continue
          if (!listingIdStrings.has(item.listing.toString())) continue
          const unit = Number(item.price)
          if (Number.isFinite(unit) && unit > 0) {
            historicalUnitPrices.push(unit)
          }
        }
      }

      const activePrices = activeListings
        .map((l) => Number(l.basePrice))
        .filter((p) => Number.isFinite(p) && p > 0)

      const sampleSize = activePrices.length + historicalUnitPrices.length
      if (sampleSize === 0) {
        return ok(res, {
          cropType,
          suggestedPrice: null,
          priceRange: null,
          trend: 'stable',
          confidence: 0.1,
          sampleSize: 0,
          marketInsights: `Not enough marketplace data for "${cropType}" yet. Add listings or wait for comparable sales.`
        })
      }

      const avg = (arr) => arr.reduce((a, b) => a + b, 0) / arr.length
      const avgActive = activePrices.length ? avg(activePrices) : null
      const avgHistorical = historicalUnitPrices.length ? avg(historicalUnitPrices) : null

      let suggestedPrice
      if (avgActive != null && avgHistorical != null) {
        suggestedPrice = avgActive * 0.4 + avgHistorical * 0.6
      } else {
        suggestedPrice = avgActive ?? avgHistorical
      }

      let trend = 'stable'
      if (avgActive != null && avgHistorical != null) {
        const delta = (avgActive - avgHistorical) / avgHistorical
        if (delta > 0.05) trend = 'rising'
        else if (delta < -0.05) trend = 'falling'
      }

      const confidence = sampleConfidence(sampleSize, 50)

      return ok(res, {
        cropType,
        suggestedPrice: Math.round(suggestedPrice),
        priceRange: {
          min: Math.round(suggestedPrice * 0.85),
          max: Math.round(suggestedPrice * 1.15)
        },
        trend,
        confidence: Number(confidence.toFixed(2)),
        sampleSize,
        marketInsights: `${cropType}: ${trend} based on ${activePrices.length} listing prices and ${historicalUnitPrices.length} delivered sale prices${location ? ` near ${location}` : ''}.`
      })
    } catch (error) {
      console.error('PricePulse Error:', error.message)
      return fail(res, 500, 'Failed to compute price advisory')
    }
  }

  /**
   * Shipment spoilage / delay risk from logistics attributes.
   */
  async getShipmentRisk(req, res) {
    try {
      const { shipmentId } = req.params
      if (!mongoose.Types.ObjectId.isValid(shipmentId)) {
        return fail(res, 400, 'Invalid shipment id')
      }

      const shipment = await Shipment.findById(shipmentId).lean()
      if (!shipment) return fail(res, 404, 'Shipment not found')

      const uid = req.user.id
      const isBuyer = shipment.buyer?.toString() === uid
      const isSeller = shipment.seller?.toString() === uid
      const isLogistics = shipment.assignedLogisticsUser?.toString() === uid
      if (req.user.role !== 'admin' && !isBuyer && !isSeller && !isLogistics) {
        return fail(res, 403, 'Forbidden')
      }

      const oLat = shipment.origin?.coordinates?.lat
      const oLng = shipment.origin?.coordinates?.lng
      const dLat = shipment.destination?.coordinates?.lat
      const dLng = shipment.destination?.coordinates?.lng
      const hasCoords =
        [oLat, oLng, dLat, dLng].every((v) => typeof v === 'number' && Number.isFinite(v))

      let distance = null
      if (hasCoords) {
        const toRad = (v) => (v * Math.PI) / 180
        const R = 6371
        const dLatR = toRad(dLat - oLat)
        const dLonR = toRad(dLng - oLng)
        const a =
          Math.sin(dLatR / 2) ** 2 +
          Math.cos(toRad(oLat)) * Math.cos(toRad(dLat)) * Math.sin(dLonR / 2) ** 2
        distance = R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
      }

      const factors = []
      let riskScore = 0

      if (distance != null) {
        if (distance > 500) {
          riskScore += 30
          factors.push({ code: 'long_haul', points: 30, detail: `${Math.round(distance)}km route` })
        } else if (distance > 200) {
          riskScore += 15
          factors.push({ code: 'medium_haul', points: 15, detail: `${Math.round(distance)}km route` })
        }
      } else {
        riskScore += 10
        factors.push({ code: 'missing_coords', points: 10, detail: 'Origin/destination coordinates incomplete' })
      }

      if (shipment.temperatureControl === false) {
        riskScore += 20
        factors.push({ code: 'no_cold_chain', points: 20, detail: 'No temperature control' })
      }
      if (shipment.fragile) {
        riskScore += 10
        factors.push({ code: 'fragile', points: 10, detail: 'Marked fragile' })
      }
      if (shipment.priority === 'urgent' || shipment.priority === 'high') {
        riskScore += 10
        factors.push({ code: 'priority', points: 10, detail: `Priority: ${shipment.priority}` })
      }
      if (shipment.shippingMethod === 'air') {
        riskScore -= 5 // faster transit slightly lowers spoilage risk from time
      }

      const isDelayed =
        !!shipment.estimatedDelivery &&
        !['delivered', 'returned'].includes(shipment.status) &&
        new Date() > new Date(shipment.estimatedDelivery)
      if (isDelayed) {
        riskScore += 40
        factors.push({ code: 'past_eta', points: 40, detail: 'Past estimated delivery' })
      }

      riskScore = clamp(riskScore, 0, 100)
      let riskLevel = 'Low'
      if (riskScore >= 70) riskLevel = 'Critical'
      else if (riskScore >= 40) riskLevel = 'Moderate'

      const recommendation =
        riskLevel === 'Critical'
          ? 'High loss risk — contact carrier, confirm cold chain, and update the buyer now.'
          : riskLevel === 'Moderate'
            ? 'Elevated risk — monitor tracking closely and prepare contingency delivery.'
            : 'Parameters look normal for this route and cargo profile.'

      return ok(res, {
        shipmentId,
        distance: distance != null ? Math.round(distance) : null,
        riskLevel,
        riskScore,
        isDelayed,
        factors,
        confidence: sampleConfidence(factors.length + (hasCoords ? 2 : 0), 8),
        recommendation
      })
    } catch (error) {
      console.error('ShipmentRisk Error:', error.message)
      return fail(res, 500, 'Failed to analyze shipment risk')
    }
  }

  /**
   * GroScan — optional Gemini vision when GEMINI_API_KEY is configured.
   */
  async analyzeCropQuality(req, res) {
    try {
      const { imageUrl } = req.body || {}
      if (!imageUrl || typeof imageUrl !== 'string') {
        return fail(res, 400, 'Image URL is required')
      }
      if (!isAllowedImageUrl(imageUrl)) {
        return fail(res, 400, 'Image URL must be a valid public HTTPS URL')
      }

      const apiKey =
        process.env.GEMINI_API_KEY ||
        process.env.GOOGLE_GEMINI_API_KEY ||
        process.env.GOOGLE_GENERATIVE_AI_API_KEY
      if (!apiKey) {
        return res.status(501).json({
          status: 'error',
          success: false,
          message:
            'AI crop quality vision is not configured. Set GEMINI_API_KEY (or GOOGLE_GEMINI_API_KEY) to enable GroScan.',
          code: 'VISION_NOT_CONFIGURED'
        })
      }

      // Fetch image with size/time bounds (SSRF mitigated by allowlist above)
      const controller = new AbortController()
      const timeout = setTimeout(() => controller.abort(), 12000)
      let imageBuffer
      let mimeType = 'image/jpeg'
      try {
        const imgRes = await fetch(imageUrl, {
          signal: controller.signal,
          redirect: 'follow',
          headers: { Accept: 'image/*' }
        })
        if (!imgRes.ok) {
          return fail(res, 400, 'Could not fetch image for analysis')
        }
        const ct = imgRes.headers.get('content-type') || ''
        if (!ct.startsWith('image/')) {
          return fail(res, 400, 'URL did not return an image')
        }
        mimeType = ct.split(';')[0]
        const arr = await imgRes.arrayBuffer()
        if (arr.byteLength > 5 * 1024 * 1024) {
          return fail(res, 400, 'Image too large (max 5MB)')
        }
        imageBuffer = Buffer.from(arr)
      } finally {
        clearTimeout(timeout)
      }

      const prompt = `You are an agricultural quality inspector for Nigerian produce.
Analyze this crop image and respond with ONLY valid JSON (no markdown):
{
  "qualityGrade": "A" | "B" | "C" | "D",
  "confidence": number between 0 and 1,
  "findings": string[] (max 5 short bullets),
  "recommendations": string (one short paragraph),
  "cropGuess": string
}`

      const model = process.env.GEMINI_VISION_MODEL || 'gemini-flash-lite-latest'
      // Native Gemini endpoint (supports both legacy AIza and new AQ. auth keys)
      const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`
      const geminiRes = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-goog-api-key': apiKey
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                { text: prompt },
                {
                  inline_data: {
                    mime_type: mimeType,
                    data: imageBuffer.toString('base64')
                  }
                }
              ]
            }
          ],
          generationConfig: {
            temperature: 0.2,
            maxOutputTokens: 512,
            responseMimeType: 'application/json'
          }
        })
      })

      if (!geminiRes.ok) {
        const errText = await geminiRes.text().catch(() => '')
        console.error('Gemini vision error:', geminiRes.status, errText.slice(0, 300))
        return fail(res, 502, 'Vision provider failed — try again later')
      }

      const geminiJson = await geminiRes.json()
      const text =
        geminiJson?.candidates?.[0]?.content?.parts?.map((p) => p.text).join('') || ''
      let parsed
      try {
        parsed = JSON.parse(text)
      } catch {
        const match = text.match(/\{[\s\S]*\}/)
        parsed = match ? JSON.parse(match[0]) : null
      }
      if (!parsed || !parsed.qualityGrade) {
        return fail(res, 502, 'Vision provider returned an unusable response')
      }

      return ok(
        res,
        {
          analysisId: `scan_${Date.now()}`,
          qualityGrade: String(parsed.qualityGrade).toUpperCase().slice(0, 2),
          confidence: clamp(Number(parsed.confidence) || 0.5, 0, 1),
          findings: Array.isArray(parsed.findings) ? parsed.findings.slice(0, 5).map(String) : [],
          recommendations: String(parsed.recommendations || '').slice(0, 500),
          cropGuess: parsed.cropGuess ? String(parsed.cropGuess).slice(0, 80) : undefined
        },
        {
          engine: 'gemini-vision',
          method: 'multimodal_llm',
          disclaimer:
            'Vision grades are advisory only. Confirm with a human inspector before commercial decisions.'
        }
      )
    } catch (error) {
      console.error('GroScan Error:', error.message)
      return fail(res, 500, 'Failed to analyze crop quality')
    }
  }

  /**
   * Farmer growth forecast — transparent heuristic from harvests + listings.
   */
  async getFarmerForecast(req, res) {
    try {
      if (req.user.role !== 'farmer' && req.user.role !== 'admin') {
        return fail(res, 403, 'Forecast is available for farmer accounts')
      }

      const farmerId = req.user.role === 'admin' && req.query.farmerId
        ? req.query.farmerId
        : req.user.id

      if (!mongoose.Types.ObjectId.isValid(farmerId)) {
        return fail(res, 400, 'Invalid farmer id')
      }

      if (req.user.role === 'admin' && farmerId !== req.user.id) {
        // admin may inspect; farmers only self (already gated)
      } else if (farmerId !== req.user.id && req.user.role !== 'admin') {
        return fail(res, 403, 'Forbidden')
      }

      const [harvests, listings, paidOrders] = await Promise.all([
        Harvest.find({ farmer: farmerId }).select('quantity createdAt cropType').lean(),
        Listing.find({ farmer: farmerId, status: 'active' }).select('quantity availableQuantity basePrice cropName').lean(),
        Order.find({ seller: farmerId, paymentStatus: 'paid' })
          .select('total createdAt status')
          .lean()
      ])

      const lastMonthHarvests = harvests.filter((h) =>
        moment(h.createdAt).isAfter(moment().subtract(1, 'month'))
      )
      const previousMonthHarvests = harvests.filter((h) =>
        moment(h.createdAt).isBetween(moment().subtract(2, 'month'), moment().subtract(1, 'month'))
      )

      const lastMonthPaid = paidOrders.filter((o) =>
        moment(o.createdAt).isAfter(moment().subtract(1, 'month'))
      )
      const realizedRevenue = lastMonthPaid.reduce((acc, o) => acc + (Number(o.total) || 0), 0)

      const inventoryValue = listings.reduce(
        (acc, l) => acc + (Number(l.availableQuantity ?? l.quantity) || 0) * (Number(l.basePrice) || 0),
        0
      )

      const lastVol = lastMonthHarvests.reduce((a, h) => a + (Number(h.quantity) || 0), 0)
      const prevVol = previousMonthHarvests.reduce((a, h) => a + (Number(h.quantity) || 0), 0)

      let growthRate = 1
      if (prevVol > 0) growthRate = lastVol / prevVol
      else if (lastVol > 0) growthRate = 1.05

      // Conservative forecast: blend realized revenue trend + partial inventory conversion
      const conversion = sampleConfidence(listings.length + lastMonthPaid.length, 20) * 0.85
      const forecastedRevenue = realizedRevenue * growthRate + inventoryValue * conversion

      const evidence = harvests.length + listings.length + paidOrders.length
      const confidence = sampleConfidence(evidence, 35)

      const growthIndicator = growthRate >= 1 ? 'rising' : 'falling'
      const volumeDeltaPct = Math.round((growthRate - 1) * 100)

      const insights = []
      if (harvests.length === 0 && listings.length === 0) {
        insights.push('Log harvests and publish listings so forecasts can use your own sales data.')
      } else {
        insights.push(
          prevVol > 0
            ? `Harvest volume is ${volumeDeltaPct >= 0 ? '+' : ''}${volumeDeltaPct}% vs the prior month.`
            : 'Not enough prior-month harvest history for a strong volume comparison.'
        )
        insights.push(
          `Active listings represent about ₦${Math.round(inventoryValue).toLocaleString('en-NG')} at listed prices.`
        )
        insights.push(
          lastMonthPaid.length > 0
            ? `You realized ₦${Math.round(realizedRevenue).toLocaleString('en-NG')} in paid sales over the last 30 days.`
            : 'No paid sales in the last 30 days — forecast leans on inventory until sales appear.'
        )
      }

      return ok(res, {
        period: 'Next 30 Days',
        forecastedRevenue: Math.round(Math.max(forecastedRevenue, 0)),
        confidence: Number(confidence.toFixed(2)),
        growthIndicator,
        sampleSize: evidence,
        insights,
        inputs: {
          harvestsLast30d: lastMonthHarvests.length,
          activeListings: listings.length,
          paidOrdersLast30d: lastMonthPaid.length
        }
      })
    } catch (error) {
      console.error('Forecast Error:', error.message)
      return fail(res, 500, 'Failed to compute growth forecast')
    }
  }
}

module.exports = new AiController()
