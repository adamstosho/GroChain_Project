const { getInsuranceQuotes } = require('../services/fintech-product.service')

async function getInsuranceQuotesHandler(req, res) {
  try {
    const { cropType, farmSize, location, budget, coverageType } = req.query

    const quotes = await getInsuranceQuotes(req.user.id, {
      cropType,
      farmSize,
      location,
      budget,
      coverageType
    })

    res.json({
      status: 'success',
      data: {
        policies: quotes,
        total: quotes.length,
        filters: {
          cropType: cropType || 'All Crops',
          farmSize: farmSize || 'Small (0-2 hectares)',
          location: location || 'All Locations',
          budget: budget || 'Any Budget',
          coverageType: coverageType || 'All Coverage'
        },
        source: 'database',
        calculatedAt: new Date().toISOString()
      }
    })
  } catch (error) {
    console.error('Error getting insurance quotes:', error)
    res.status(500).json({
      status: 'error',
      message: 'Failed to get insurance quotes'
    })
  }
}

module.exports = { getInsuranceQuotesHandler }
