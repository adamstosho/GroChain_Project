// Legal next states per current order status. 'refunded' is deliberately
// never reachable through this map — it can only be set by the dedicated
// refund flow (refundOrderCore in payment.controller.js), which actually
// calls the payment provider and updates paymentStatus in the same
// operation. Terminal states (delivered, cancelled, refunded) have no
// further transitions.
const ORDER_STATUS_TRANSITIONS = {
  pending: ['confirmed', 'cancelled'],
  confirmed: ['paid', 'cancelled'],
  paid: ['processing', 'cancelled'],
  processing: ['shipped', 'cancelled'],
  shipped: ['delivered', 'cancelled'],
  delivered: [],
  cancelled: [],
  refunded: []
}

// Shipment status -> the Order status it should drive, when that transition
// is legal for the order's current state. Only forward-moving, unambiguous
// mappings are included; shipment 'failed'/'returned'/'confirmed' don't map
// to a specific Order status and are left for a human (or the refund flow)
// to resolve.
const SHIPMENT_TO_ORDER_STATUS = {
  in_transit: 'shipped',
  out_for_delivery: 'shipped',
  delivered: 'delivered'
}

module.exports = { ORDER_STATUS_TRANSITIONS, SHIPMENT_TO_ORDER_STATUS }
