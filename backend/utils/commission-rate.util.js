const Referral = require('../models/referral.model')

const DEFAULT_COMMISSION_RATE = 0.02

// A referral's negotiated rate takes priority over the farmer's direct
// partner rate; fall back to the platform default (2%) only when neither
// specifies one. Both are stored as 0-1 fractions. Kept as the single
// source of truth so callers (commission-realtime.service.js at payment
// time, fintech.controller.js for dashboard estimates) never drift apart.
async function resolveFarmerCommissionRate(farmer) {
  if (!farmer) return { partner: null, referral: null, commissionRate: 0, commissionType: 'none' }

  const referral = await Referral.findOne({
    farmer: farmer._id || farmer,
    status: { $in: ['active', 'completed'] },
    expiresAt: { $gt: new Date() }
  }).populate('partner')

  if (referral && referral.partner) {
    return {
      partner: referral.partner,
      referral,
      commissionRate: referral.commissionRate || DEFAULT_COMMISSION_RATE,
      commissionType: 'referral'
    }
  }

  if (farmer.partner) {
    return {
      partner: farmer.partner,
      referral: null,
      commissionRate: farmer.partner.commissionRate || DEFAULT_COMMISSION_RATE,
      commissionType: 'direct'
    }
  }

  return { partner: null, referral: null, commissionRate: 0, commissionType: 'none' }
}

module.exports = { resolveFarmerCommissionRate, DEFAULT_COMMISSION_RATE }
