/**
 * Agricultural insurance premium calculations.
 * Based on NAIC (Nigerian Agricultural Insurance Corporation) index-based
 * and commercial agri-insurance pricing models used in Nigeria.
 *
 * Premium = Sum Insured × Base Rate × Location Factor × Farm Size Factor
 * Deductible = typically 10–15% of sum insured for crop policies.
 */

const { roundToDecimals } = require('./number-precision')

const CROP_VALUE_PER_HECTARE = {
  maize: 400000,
  rice: 600000,
  cassava: 300000,
  yam: 350000,
  beans: 450000,
  groundnut: 380000,
  tomato: 500000,
  pepper: 550000,
  onion: 480000,
  cocoa: 800000,
  coffee: 700000,
  sorghum: 320000,
  soybean: 420000,
  default: 400000
}

const FARM_SIZE_HECTARES = {
  'Small (0-2 hectares)': 1.5,
  'Medium (2-10 hectares)': 5,
  'Large (10+ hectares)': 15
}

const LOCATION_RISK = {
  'North East': 1.25,
  'North West': 1.20,
  'North Central': 1.10,
  'South South': 1.15,
  'South East': 1.05,
  'South West': 1.00,
  'All Locations': 1.08
}

const BASE_RATES = {
  crop: 0.035,
  equipment: 0.025,
  livestock: 0.045,
  property: 0.018,
  liability: 0.020
}

const TYPE_MAP = {
  'Crop Insurance': 'crop',
  'Equipment Insurance': 'equipment',
  'Livestock Insurance': 'livestock',
  'Property Insurance': 'property',
  'Liability Insurance': 'liability'
}

function parseCropType(cropType) {
  if (!cropType || cropType === 'All Crops') return 'default'
  const lower = cropType.toLowerCase()
  for (const key of Object.keys(CROP_VALUE_PER_HECTARE)) {
    if (key !== 'default' && lower.includes(key)) return key
  }
  return 'default'
}

function calculateSumInsured(coverageType, cropType, farmSize, maxCoverage) {
  const type = TYPE_MAP[coverageType] || 'crop'
  const hectares = FARM_SIZE_HECTARES[farmSize] || 1.5

  if (type === 'crop') {
    const cropKey = parseCropType(cropType)
    const valuePerHa = CROP_VALUE_PER_HECTARE[cropKey]
    return Math.min(roundToDecimals(hectares * valuePerHa, 0), maxCoverage || 5000000)
  }

  if (type === 'equipment') {
    const equipmentValue = { 1.5: 800000, 5: 2500000, 15: 6000000 }
    return Math.min(equipmentValue[hectares] || 1500000, maxCoverage || 5000000)
  }

  if (type === 'livestock') {
    const herdValue = { 1.5: 600000, 5: 2000000, 15: 5000000 }
    return Math.min(herdValue[hectares] || 1000000, maxCoverage || 5000000)
  }

  return Math.min(hectares * 500000, maxCoverage || 3000000)
}

function calculatePremium(product, filters = {}) {
  const {
    cropType = 'All Crops',
    farmSize = 'Small (0-2 hectares)',
    location = 'All Locations'
  } = filters

  const coverageType = product.category || product.type || 'Crop Insurance'
  const type = TYPE_MAP[coverageType] || 'crop'
  const baseRate = product.terms?.interestRate
    ? product.terms.interestRate / 100
    : (BASE_RATES[type] || 0.035)

  const maxCoverage = product.terms?.maxAmount || 5000000
  const sumInsured = calculateSumInsured(coverageType, cropType, farmSize, maxCoverage)
  const locationFactor = LOCATION_RISK[location] || 1.08

  const sizeFactor = farmSize === 'Large (10+ hectares)' ? 0.92
    : farmSize === 'Medium (2-10 hectares)' ? 0.96
    : 1.0

  const premium = roundToDecimals(sumInsured * baseRate * locationFactor * sizeFactor, 0)
  const deductible = roundToDecimals(sumInsured * 0.10, 0)

  return {
    premium: Math.max(premium, product.terms?.minAmount || 15000),
    sumInsured,
    deductible,
    maxCoverage: Math.min(sumInsured, maxCoverage),
    locationFactor,
    baseRate: roundToDecimals(baseRate * 100, 2)
  }
}

function productToQuote(product, filters, pricing) {
  return {
    _id: product._id,
    productId: product._id,
    name: product.name,
    provider: product.provider,
    type: product.category,
    coverage: product.description,
    premium: pricing.premium,
    deductible: pricing.deductible,
    maxCoverage: pricing.maxCoverage,
    sumInsured: pricing.sumInsured,
    features: (product.features || []).filter(f => f.included).map(f => f.name || f.description),
    exclusions: product.documents?.filter(d => !d.required).map(d => d.description || d.name) || [],
    rating: product.rating?.average || 4.0,
    reviews: product.rating?.count || 0,
    claimProcess: product.approvalTime === 'instant' ? 'Instant digital claims'
      : product.approvalTime === 'same_day' ? 'Same-day claims processing'
      : 'Standard claims with documentation review',
    waitingPeriod: typeToWaitingPeriod(product.category),
    renewalTerms: 'Annual renewal with loyalty discounts for claim-free years',
    contactInfo: {
      phone: product.contactPhone || '',
      email: product.contactEmail || '',
      website: product.website || ''
    },
    logo: product.logo || '/insurance-logo.png',
    isRecommended: product.isRecommended || false,
    specialOffers: product.tags || [],
    cropTypes: product.eligibility?.location || [],
    farmSize: filters.farmSize,
    regions: product.eligibility?.location || ['All Locations'],
    pricingBreakdown: {
      sumInsured: pricing.sumInsured,
      baseRatePercent: pricing.baseRate,
      locationFactor: pricing.locationFactor,
      annualPremium: pricing.premium
    }
  }
}

function typeToWaitingPeriod(category) {
  const map = {
    'Crop Insurance': 14,
    'Equipment Insurance': 7,
    'Livestock Insurance': 21,
    'Property Insurance': 14,
    'Liability Insurance': 30
  }
  return map[category] || 14
}

module.exports = {
  calculatePremium,
  calculateSumInsured,
  productToQuote,
  CROP_VALUE_PER_HECTARE,
  FARM_SIZE_HECTARES,
  LOCATION_RISK,
  BASE_RATES
}
