const Commission = require('../models/commission.model')
const Partner = require('../models/partner.model')

/**
 * Create a commission once per (partner, farmer, order, listing).
 * Relies on compound unique index; safe under concurrent verify/webhook.
 */
async function createCommissionIdempotent(commissionData, incrementAmount) {
  try {
    const commission = await Commission.create(commissionData)
    if (incrementAmount > 0) {
      await Partner.findByIdAndUpdate(commissionData.partner, {
        $inc: { totalCommissions: incrementAmount },
      })
    }
    return { commission, created: true }
  } catch (error) {
    if (error?.code === 11000) {
      const existing = await Commission.findOne({
        partner: commissionData.partner,
        farmer: commissionData.farmer,
        order: commissionData.order,
        listing: commissionData.listing,
      })
      return { commission: existing, created: false }
    }
    throw error
  }
}

module.exports = { createCommissionIdempotent }
