/**
 * Assigns loan applications to verified partner microfinance institutions (MFIs).
 * In Nigeria, agricultural loans are typically routed through cooperatives,
 * extension agencies, or registered MFIs — not directly to farmers.
 */

const Partner = require('../models/partner.model')
const User = require('../models/user.model')
const LoanApplication = require('../models/loan-application.model')

const LENDING_SERVICE_KEYWORDS = ['lending', 'microfinance', 'loan', 'credit', 'finance']

function partnerOffersLending(partner) {
  if (!partner || partner.status !== 'active') return false
  if (partner.lendingEnabled) return true
  if (['microfinance', 'bank', 'cooperative'].includes(partner.type)) return true
  return (partner.services || []).some(s =>
    LENDING_SERVICE_KEYWORDS.some(k => s.toLowerCase().includes(k))
  )
}

async function resolveLenderForFarmer(farmerId) {
  const farmer = await User.findById(farmerId).select('partner name')

  if (farmer?.partner) {
    const partnerOrg = await Partner.findById(farmer.partner)
    if (partnerOrg && partnerOffersLending(partnerOrg)) {
      return {
        lenderPartner: partnerOrg._id,
        lenderName: partnerOrg.organization || partnerOrg.name,
        lenderType: partnerOrg.type === 'cooperative' ? 'cooperative' : 'partner_mfi'
      }
    }
  }

  const eligibleMfis = await Partner.find({
    status: 'active',
    $or: [
      { lendingEnabled: true },
      { type: { $in: ['microfinance', 'cooperative'] } },
      { services: { $regex: /lending|microfinance|loan/i } }
    ]
  }).select('_id organization name type')

  // Fair distribution: route to whichever eligible lender currently has the
  // fewest open (pending/approved) applications, rather than a static sort
  // that always picks the same partner — a fixed sort order would entrench
  // one lender further with every unattached farmer routed to it.
  let platformMfi = null
  if (eligibleMfis.length > 0) {
    const loadCounts = await LoanApplication.aggregate([
      { $match: { lenderPartner: { $in: eligibleMfis.map(m => m._id) }, status: { $in: ['pending', 'approved'] } } },
      { $group: { _id: '$lenderPartner', count: { $sum: 1 } } }
    ])
    const loadMap = new Map(loadCounts.map(l => [l._id.toString(), l.count]))
    platformMfi = eligibleMfis.reduce((least, candidate) => {
      const candidateLoad = loadMap.get(candidate._id.toString()) || 0
      const leastLoad = loadMap.get(least._id.toString()) || 0
      return candidateLoad < leastLoad ? candidate : least
    })
  }

  if (platformMfi) {
    return {
      lenderPartner: platformMfi._id,
      lenderName: platformMfi.organization || platformMfi.name,
      lenderType: platformMfi.type === 'cooperative' ? 'cooperative' : 'platform_mfi'
    }
  }

  return {
    lenderPartner: null,
    lenderName: 'GroChain Agricultural Finance',
    lenderType: 'platform_mfi'
  }
}

async function notifyLenderOfApplication(loanApplication, lenderPartnerId) {
  if (!lenderPartnerId) return

  try {
    const notificationService = require('./notification.service')
    const partnerUsers = await User.find({
      role: 'partner',
      partner: lenderPartnerId,
      status: 'active'
    }).select('_id')

    const notifications = partnerUsers.map(user => ({
      user: user._id,
      type: 'loan_application',
      title: 'New Loan Application',
      message: `A farmer has submitted a loan application for ₦${loanApplication.amount.toLocaleString()}. Review and approve in the partner dashboard.`,
      data: { loanApplicationId: loanApplication._id, amount: loanApplication.amount },
      priority: 'high'
    }))

    for (const n of notifications) {
      await notificationService.createNotification(n)
    }
  } catch (err) {
    console.error('Failed to notify lender of loan application:', err.message)
  }
}

module.exports = {
  resolveLenderForFarmer,
  notifyLenderOfApplication,
  partnerOffersLending
}
