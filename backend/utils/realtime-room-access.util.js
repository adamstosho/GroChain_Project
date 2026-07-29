'use strict'

const mongoose = require('mongoose')
const Order = require('../models/order.model')
const User = require('../models/user.model')
const Shipment = require('../models/shipment.model')
const Referral = require('../models/referral.model')
const Commission = require('../models/commission.model')

const REFERRAL_ACTIVE_STATUSES = ['pending', 'active', 'completed']

/** Query that matches no documents (used when a role has zero accessible shipments). */
const MATCH_NONE = { _id: { $exists: false } }

function userIdString(user) {
  if (!user) return ''
  const v = user.id != null ? user.id : user._id
  return v != null ? String(v) : ''
}

/**
 * Partner org (Partner document _id) is linked to a farmer user if:
 * - farmer.user.partner matches, or
 * - an active-style Referral exists (farmer + partner).
 */
async function partnerOrgLinkedToFarmer(partnerOrgId, farmerUserId) {
  if (!partnerOrgId || !farmerUserId) return false
  const pid = partnerOrgId.toString()
  const farmer = await User.findById(farmerUserId).select('partner').lean()
  if (farmer?.partner?.toString() === pid) return true
  const ref = await Referral.findOne({
    farmer: farmerUserId,
    partner: partnerOrgId,
    status: { $in: REFERRAL_ACTIVE_STATUSES }
  })
    .select('_id')
    .lean()
  return !!ref
}

/**
 * Partner org is linked to an order if the seller farmer is linked, or a commission row exists for that order + partner.
 */
async function partnerOrgLinkedToOrder(partnerOrgId, orderLean) {
  if (!partnerOrgId || !orderLean?._id) return false
  if (await partnerOrgLinkedToFarmer(partnerOrgId, orderLean.seller)) return true
  const comm = await Commission.findOne({ order: orderLean._id, partner: partnerOrgId }).select('_id').lean()
  return !!comm
}

/**
 * Whether a user may subscribe to Socket.IO room `order:<orderId>` (no mocks; DB-backed).
 */
async function userCanJoinOrderRoom(user, orderIdHex) {
  if (!user || !orderIdHex) return false
  const uid = userIdString(user)
  if (!uid) return false
  if (user.role === 'admin') return true

  const order = await Order.findById(orderIdHex).select('buyer seller').lean()
  if (!order) return false

  if (order.buyer?.toString() === uid || order.seller?.toString() === uid) return true

  if (user.role === 'partner') {
    if (!user.partner) return false
    return partnerOrgLinkedToOrder(user.partner, order)
  }

  if (user.role === 'carrier') {
    const assigned = await Shipment.exists({
      order: orderIdHex,
      assignedLogisticsUser: uid
    })
    return !!assigned
  }

  return false
}

/**
 * Whether a user may subscribe to Socket.IO room `shipment:<shipmentId>` (no mocks; DB-backed).
 */
async function userCanJoinShipmentRoom(user, shipmentIdHex) {
  if (!user || !shipmentIdHex) return false
  const uid = userIdString(user)
  if (!uid) return false
  if (user.role === 'admin') return true

  const shipment = await Shipment.findById(shipmentIdHex).select('buyer seller order assignedLogisticsUser').lean()
  if (!shipment) return false

  if (shipment.assignedLogisticsUser?.toString() === uid) return true

  if (shipment.buyer?.toString() === uid || shipment.seller?.toString() === uid) return true

  if (user.role === 'partner') {
    if (!user.partner) return false
    if (shipment.order) {
      const order = await Order.findById(shipment.order).select('_id buyer seller').lean()
      if (order && (await partnerOrgLinkedToOrder(user.partner, order))) return true
    }
    return partnerOrgLinkedToFarmer(user.partner, shipment.seller)
  }

  if (user.role === 'carrier') {
    return shipment.assignedLogisticsUser?.toString() === uid
  }

  return false
}

/**
 * Partner may assign logistics only on shipments they are allowed to manage (same as room join).
 */
async function partnerMayManageShipmentAssignment(user, shipmentIdHex) {
  if (!user || !shipmentIdHex) return false
  if (user.role === 'admin') return true
  if (user.role !== 'partner' || !user.partner) return false
  return userCanJoinShipmentRoom(user, shipmentIdHex)
}

/**
 * MongoDB filter for shipments visible to a partner org (same rules as Socket.IO rooms).
 */
async function buildPartnerShipmentFilter(partnerOrgId) {
  if (!partnerOrgId) return MATCH_NONE

  const [farmersFromPartner, referrals, commissions] = await Promise.all([
    User.find({ partner: partnerOrgId }).select('_id').lean(),
    Referral.find({
      partner: partnerOrgId,
      status: { $in: REFERRAL_ACTIVE_STATUSES }
    })
      .select('farmer')
      .lean(),
    Commission.find({ partner: partnerOrgId }).select('order').lean()
  ])

  const sellerIds = new Set()
  farmersFromPartner.forEach((u) => sellerIds.add(String(u._id)))
  referrals.forEach((r) => {
    if (r.farmer) sellerIds.add(String(r.farmer))
  })

  const orderIds = [...new Set(commissions.map((c) => String(c.order)).filter(Boolean))]

  const or = []
  if (sellerIds.size > 0) {
    or.push({
      seller: { $in: [...sellerIds].map((id) => new mongoose.Types.ObjectId(id)) }
    })
  }
  if (orderIds.length > 0) {
    or.push({
      order: { $in: orderIds.map((id) => new mongoose.Types.ObjectId(id)) }
    })
  }

  if (or.length === 0) return MATCH_NONE
  return { $or: or }
}

/**
 * Role-based shipment list filter (REST list/search/stats — aligned with realtime ACL).
 */
async function buildShipmentAccessFilter(user) {
  const uid = userIdString(user)
  if (!user || !uid) return MATCH_NONE
  if (user.role === 'admin') return {}
  if (user.role === 'buyer') return { buyer: new mongoose.Types.ObjectId(uid) }
  if (user.role === 'farmer') return { seller: new mongoose.Types.ObjectId(uid) }
  if (user.role === 'partner') {
    if (!user.partner) return MATCH_NONE
    return buildPartnerShipmentFilter(user.partner)
  }
  if (user.role === 'carrier') {
    return { assignedLogisticsUser: new mongoose.Types.ObjectId(uid) }
  }
  return MATCH_NONE
}

/** Combine access filter with search/status filters. */
function mergeShipmentQueries(...clauses) {
  const parts = clauses.filter((c) => c && Object.keys(c).length > 0)
  if (parts.length === 0) return {}
  if (parts.length === 1) return parts[0]
  return { $and: parts }
}

function toAclUser(reqUser) {
  if (!reqUser) return null
  return {
    _id: reqUser.id || reqUser._id,
    id: reqUser.id || reqUser._id,
    role: reqUser.role,
    partner: reqUser.partner
  }
}

module.exports = {
  partnerOrgLinkedToFarmer,
  partnerOrgLinkedToOrder,
  userCanJoinOrderRoom,
  userCanJoinShipmentRoom,
  partnerMayManageShipmentAssignment,
  buildPartnerShipmentFilter,
  buildShipmentAccessFilter,
  mergeShipmentQueries,
  toAclUser,
  MATCH_NONE
}
