/**
 * Fintech product catalog — insurance & loan products stored in MongoDB.
 * Products are seeded once and quotes are calculated dynamically per farmer profile.
 */

const Fintech = require('../models/fintech.model')
const User = require('../models/user.model')
const { calculatePremium, productToQuote } = require('../utils/insurance-calculations')

const INSURANCE_PRODUCTS = [
  {
    type: 'insurance',
    name: 'NAIC Crop Shield',
    description: 'Index-based crop insurance aligned with NAIC standards — covers drought, flood, pests, and diseases for smallholder farmers.',
    provider: 'Nigerian Agricultural Insurance Corporation (NAIC)',
    category: 'Crop Insurance',
    terms: { minAmount: 20000, maxAmount: 3000000, interestRate: 3.5 },
    features: [
      { name: 'Weather index coverage (drought & excess rainfall)', included: true },
      { name: 'Pest and disease protection', included: true },
      { name: '48-hour claims response', included: true },
      { name: 'Agronomist consultation', included: true },
      { name: 'Market price fluctuation cover', included: false }
    ],
    documents: [
      { name: 'Pre-existing conditions', required: false, description: 'Pre-existing crop conditions' },
      { name: 'War and civil unrest', required: false, description: 'War and civil unrest' }
    ],
    eligibility: { location: ['North Central', 'North East', 'North West', 'South West'] },
    approvalTime: 'same_day',
    successRate: 88,
    rating: { average: 4.8, count: 156 },
    tags: ['NAIC-backed', '20% first-time farmer discount'],
    isRecommended: true,
    isPopular: true,
    contactPhone: '+234 709 872 0001',
    contactEmail: 'info@naic.gov.ng',
    website: 'https://www.naic.gov.ng'
  },
  {
    type: 'insurance',
    name: 'Leadway FarmGuard',
    description: 'Comprehensive farm equipment and machinery insurance for tractors, harvesters, and irrigation systems.',
    provider: 'Leadway Assurance Company Limited',
    category: 'Equipment Insurance',
    terms: { minAmount: 30000, maxAmount: 2500000, interestRate: 2.5 },
    features: [
      { name: 'Equipment breakdown coverage', included: true },
      { name: 'Theft and vandalism protection', included: true },
      { name: 'Replacement cost coverage', included: true },
      { name: 'Emergency repair services', included: true }
    ],
    documents: [
      { name: 'Wear and tear', required: false, description: 'Normal wear and tear' },
      { name: 'Poor maintenance', required: false, description: 'Mechanical breakdown from poor maintenance' }
    ],
    eligibility: { location: ['South West', 'South East', 'South South', 'North Central'] },
    approvalTime: 'next_day',
    successRate: 85,
    rating: { average: 4.6, count: 89 },
    tags: ['15% cooperative member discount'],
    isRecommended: false,
    contactPhone: '+234 1 280 0700',
    contactEmail: 'farmguard@leadway.com',
    website: 'https://www.leadway.com'
  },
  {
    type: 'insurance',
    name: 'AIICO LivestockCare',
    description: 'Livestock mortality and health insurance covering cattle, poultry, goats, and sheep with veterinary network access.',
    provider: 'AIICO Insurance Plc',
    category: 'Livestock Insurance',
    terms: { minAmount: 25000, maxAmount: 4000000, interestRate: 4.5 },
    features: [
      { name: 'Animal mortality coverage', included: true },
      { name: 'Veterinary care reimbursement', included: true },
      { name: 'Breeding stock protection', included: true },
      { name: 'Market value protection', included: true }
    ],
    documents: [
      { name: 'Poor husbandry', required: false, description: 'Diseases from poor husbandry practices' }
    ],
    eligibility: { location: ['All Locations'] },
    approvalTime: '3_days',
    successRate: 82,
    rating: { average: 4.7, count: 124 },
    tags: ['Free veterinary consultation'],
    isRecommended: true,
    contactPhone: '+234 1 280 5500',
    contactEmail: 'livestock@aiico.com',
    website: 'https://www.aiicoplc.com'
  },
  {
    type: 'insurance',
    name: 'Consolidated AgriComplete',
    description: 'Affordable crop insurance designed for smallholder farmers with mobile-first claims processing.',
    provider: 'Consolidated Hallmark Insurance',
    category: 'Crop Insurance',
    terms: { minAmount: 15000, maxAmount: 1000000, interestRate: 4.0 },
    features: [
      { name: 'Drought and flood coverage', included: true },
      { name: 'Basic pest protection', included: true },
      { name: 'Mobile app claims', included: true },
      { name: 'Harvest loss protection', included: true }
    ],
    eligibility: { location: ['North Central', 'South West'] },
    approvalTime: 'same_day',
    successRate: 78,
    rating: { average: 4.2, count: 67 },
    tags: ['Community training included'],
    contactPhone: '+234 1 460 6500',
    contactEmail: 'agricomplete@chi.ng',
    website: 'https://www.chi.ng'
  },
  {
    type: 'insurance',
    name: 'Custodian Equipment Shield',
    description: 'Advanced equipment protection with third-party liability and emergency roadside assistance.',
    provider: 'Custodian & Allied Insurance',
    category: 'Equipment Insurance',
    terms: { minAmount: 40000, maxAmount: 3000000, interestRate: 2.8 },
    features: [
      { name: 'Complete breakdown coverage', included: true },
      { name: 'Third-party liability', included: true },
      { name: '24/7 claims hotline', included: true },
      { name: 'Replacement value coverage', included: true }
    ],
    eligibility: { location: ['All Locations'] },
    approvalTime: 'next_day',
    successRate: 84,
    rating: { average: 4.5, count: 92 },
    tags: ['5% annual payment discount'],
    contactPhone: '+234 1 277 6000',
    contactEmail: 'equipment@caico.ng',
    website: 'https://www.caico.ng'
  },
  {
    type: 'insurance',
    name: 'African Alliance Livestock Guardian',
    description: 'Premium livestock protection with dedicated veterinary assessors and market value guarantee.',
    provider: 'African Alliance Insurance',
    category: 'Livestock Insurance',
    terms: { minAmount: 50000, maxAmount: 5000000, interestRate: 4.0 },
    features: [
      { name: 'Complete mortality coverage', included: true },
      { name: 'Accident and illness protection', included: true },
      { name: 'Veterinary network access', included: true },
      { name: 'Emergency veterinary services', included: true }
    ],
    eligibility: { location: ['North West', 'North East', 'North Central'] },
    approvalTime: '3_days',
    successRate: 90,
    rating: { average: 4.9, count: 203 },
    tags: ['Premium veterinary network', '20% large herd discount'],
    isRecommended: true,
    contactPhone: '+234 1 270 0000',
    contactEmail: 'livestock@aaico.ng',
    website: 'https://www.africanallianceplc.com'
  }
]

const LOAN_PRODUCTS = [
  {
    type: 'loan',
    name: 'GroChain Seasonal Input Loan',
    description: 'Short-term working capital for seeds, fertiliser, and agro-inputs. Repayment aligned to harvest cycle.',
    provider: 'GroChain Partner Microfinance',
    category: 'Working Capital',
    terms: { minAmount: 10000, maxAmount: 500000, minTerm: 3, maxTerm: 12, interestRate: 14 },
    features: [
      { name: 'Harvest-aligned repayment', included: true },
      { name: 'No prepayment penalty', included: true },
      { name: 'Credit score-based pricing', included: true }
    ],
    eligibility: { creditScore: { min: 500, max: 850 } },
    approvalTime: '3_days',
    successRate: 75,
    isRecommended: true,
    isPopular: true
  },
  {
    type: 'loan',
    name: 'Equipment Finance',
    description: 'Medium-term financing for tractors, irrigation systems, and farm machinery.',
    provider: 'GroChain Partner Microfinance',
    category: 'Equipment Purchase',
    terms: { minAmount: 100000, maxAmount: 3000000, minTerm: 12, maxTerm: 36, interestRate: 16 },
    features: [
      { name: 'Asset-backed lending', included: true },
      { name: 'Flexible 12–36 month terms', included: true }
    ],
    eligibility: { creditScore: { min: 550, max: 850 } },
    approvalTime: '1_week',
    successRate: 68
  }
]

let seedPromise = null

async function ensureProductsSeeded() {
  if (seedPromise) return seedPromise

  seedPromise = (async () => {
    const count = await Fintech.countDocuments({ status: 'active' })
    if (count > 0) return

    const admin = await User.findOne({ role: 'admin' }).select('_id')
    const createdBy = admin?._id

    const allProducts = [...INSURANCE_PRODUCTS, ...LOAN_PRODUCTS].map(p => ({
      ...p,
      status: 'active',
      ...(createdBy ? { createdBy } : {})
    }))

    if (createdBy) {
      for (const product of allProducts) {
        await Fintech.findOneAndUpdate(
          { name: product.name, provider: product.provider },
          { ...product, status: 'active', createdBy },
          { upsert: true, setDefaultsOnInsert: true }
        )
      }
      console.log(`✅ Seeded ${allProducts.length} fintech products`)
    }
  })().catch(err => {
    seedPromise = null
    throw err
  })

  return seedPromise
}

async function getInsuranceQuotes(userId, filters = {}) {
  await ensureProductsSeeded()

  const products = await Fintech.find({
    type: 'insurance',
    status: 'active'
  }).sort({ isRecommended: -1, 'rating.average': -1 })

  if (products.length === 0) {
    return INSURANCE_PRODUCTS.map((p, i) => {
      const pricing = calculatePremium(p, filters)
      return productToQuote({ ...p, _id: `fallback_${i}` }, filters, pricing)
    })
  }

  let quotes = products.map(product => {
    const pricing = calculatePremium(product, filters)
    return productToQuote(product, filters, pricing)
  })

  const { cropType, farmSize, location, budget, coverageType } = filters

  if (cropType && cropType !== 'All Crops') {
    const cropKey = cropType.toLowerCase().split(/[(\s,]/)[0]
    quotes = quotes.filter(q =>
      q.type !== 'Crop Insurance' ||
      !q.cropTypes?.length ||
      q.cropTypes.some(r => r.toLowerCase().includes(cropKey)) ||
      q.regions?.includes('All Locations')
    )
  }

  if (farmSize) {
    quotes = quotes.filter(q => !q.farmSize || q.farmSize === farmSize || q.regions?.includes('All Locations'))
  }

  if (location && location !== 'All Locations') {
    quotes = quotes.filter(q =>
      q.regions?.includes(location) || q.regions?.includes('All Locations')
    )
  }

  if (coverageType && coverageType !== 'All Coverage') {
    quotes = quotes.filter(q => q.type === coverageType)
  }

  if (budget && budget !== 'Any Budget') {
    const budgetMap = {
      'Under ₦50,000/year': 50000,
      '₦50,000 - ₦100,000/year': 100000,
      '₦100,000 - ₦200,000/year': 200000,
      'Over ₦200,000/year': 200000
    }
    if (budget in budgetMap) {
      const max = budgetMap[budget]
      quotes = budget === 'Over ₦200,000/year'
        ? quotes.filter(q => q.premium > max)
        : quotes.filter(q => q.premium <= max)
    }
  }

  return quotes
}

async function getLoanProducts() {
  await ensureProductsSeeded()
  return Fintech.find({ type: 'loan', status: 'active' }).sort({ isRecommended: -1 })
}

module.exports = {
  ensureProductsSeeded,
  getInsuranceQuotes,
  getLoanProducts,
  INSURANCE_PRODUCTS,
  LOAN_PRODUCTS
}
