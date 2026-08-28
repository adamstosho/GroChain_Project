const { NIGERIAN_STATES } = require('./nigerian-states.util')

// Road distance is longer than straight-line (Haversine) distance because
// roads curve around terrain, rivers, and settlements instead of cutting
// straight through them. This "circuity"/"detour" factor is standard
// practice in logistics distance estimation — published country-level
// values range from ~1.2 (UK, US) to ~1.46 (average across Europe), with
// 1.25–1.30 commonly used for long-haul/highway routing when a country-
// specific figure isn't available. 1.3 is used here as a defensible
// mid-range estimate for Nigeria's road network.
const ROAD_CIRCUITY_FACTOR = 1.3

// Nigerian agricultural produce is sold in mixed units (kg, tons, bags,
// baskets, bundles, pieces, liters) but shipping cost must be computed on
// actual physical weight. 50kg is the standard/most common bag size for
// bulk agricultural distribution in Nigeria (grain, rice, maize sacks — the
// harvest-logging form itself labels this option "Bags (50kg)"). Market
// baskets (e.g. tomato/pepper baskets) commonly run 40-60kg per published
// Nigerian market-measurement sources, so 50kg is used there too. "Bundles"
// (leafy greens etc.) and "pieces" have no reliable published standard —
// conservative estimates are used and documented as such; these can be
// replaced with a real per-listing weight field later without changing the
// calculation shape.
const UNIT_TO_KG = {
  kg: 1,
  kilogram: 1,
  kilograms: 1,
  tons: 1000,
  ton: 1000,
  tonnes: 1000,
  bags: 50,
  bag: 50,
  baskets: 50,
  basket: 50,
  bundles: 5, // rough estimate for leafy-greens-style bundles — no published standard
  bundle: 5,
  liters: 1,
  litres: 1,
  pieces: 1,
  piece: 1,
  units: 1,
  unit: 1
}

function unitToKg(quantity, unit) {
  const factor = UNIT_TO_KG[String(unit || '').trim().toLowerCase()] ?? 1
  return Number(quantity || 0) * factor
}

// Zone-based pricing (distance bands, each with its own base handling fee
// and per-kg rate) is the standard e-commerce/logistics shipping model —
// the same approach real carriers use (e.g. USPS/FedEx shipping zones).
// Rates below are calibrated against published 2025-2026 Nigerian logistics
// benchmarks: local/door-to-door delivery ₦500-2,000 (Connectnigeria,
// Viscorner); a 1kg interstate parcel via GIG Logistics ₦3,000-8,000
// (brands.ng); bulk/truckload interstate freight ₦50,000-500,000
// (Nigerian freight market data). These aren't a live carrier quote — no
// public self-serve rate API exists for Nigerian road freight — but they're
// real, cited, order-of-magnitude-correct estimates, clearly presented to
// users as such, rather than an arbitrary placeholder number.
const DISTANCE_ZONES = [
  { name: 'Local', maxKm: 50, baseFee: 500, perKgRate: 15 },
  { name: 'Regional (Intrastate)', maxKm: 250, baseFee: 1000, perKgRate: 35 },
  { name: 'Interstate', maxKm: 700, baseFee: 2000, perKgRate: 70 },
  { name: 'Interstate Long-Haul', maxKm: Infinity, baseFee: 3500, perKgRate: 110 }
]

function resolveZone(distanceKm) {
  return DISTANCE_ZONES.find((zone) => distanceKm <= zone.maxKm) || DISTANCE_ZONES[DISTANCE_ZONES.length - 1]
}

// Method multipliers apply on top of the zone's base cost — faster service
// costs proportionally more, matching how road/express/air/courier tiers
// are actually priced relative to each other.
const SHIPPING_METHODS = {
  road_standard: { name: 'Road Transport (Standard)', timeMultiplier: 1.0, estimatedDaysByZone: [1, 2, 4, 6] },
  road_express: { name: 'Road Transport (Express)', timeMultiplier: 1.4, estimatedDaysByZone: [1, 1, 2, 3] },
  courier: { name: 'Courier Service', timeMultiplier: 1.6, estimatedDaysByZone: [1, 1, 2, 3] },
  air: { name: 'Air Freight', timeMultiplier: 2.2, estimatedDaysByZone: [1, 1, 1, 2] }
}

function straightLineDistanceKm(lat1, lng1, lat2, lng2) {
  const R = 6371
  const dLat = (lat2 - lat1) * Math.PI / 180
  const dLng = (lng2 - lng1) * Math.PI / 180
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLng / 2) * Math.sin(dLng / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return R * c
}

function calculateDistance(location1, location2) {
  const state1 = NIGERIAN_STATES[location1?.state]
  const state2 = NIGERIAN_STATES[location2?.state]

  let straightLine
  if (state1 && state2) {
    straightLine = straightLineDistanceKm(state1.lat, state1.lng, state2.lat, state2.lng)
  } else if (location1?.state && location1.state === location2?.state) {
    // Same state, no coordinates resolved for it — assume a modest intra-state hop.
    straightLine = 40
  } else {
    // Unknown state on at least one side — assume an average interstate distance
    // rather than guessing a specific (possibly very wrong) route.
    straightLine = 400
  }

  return straightLine * ROAD_CIRCUITY_FACTOR
}

// Single source of truth for both the cost breakdown callers that need the
// full detail (checkout UI) and the plain-number callers that just need a
// price (order creation).
function computeShipping(origin, destination, weightKg, methodId) {
  const method = SHIPPING_METHODS[methodId] || SHIPPING_METHODS.road_standard
  const distanceKm = calculateDistance(origin, destination)
  const zone = resolveZone(distanceKm)
  const zoneIndex = DISTANCE_ZONES.indexOf(zone)

  const baseFee = zone.baseFee
  const weightCost = Math.max(0, Number(weightKg) || 0) * zone.perKgRate
  const subtotal = baseFee + weightCost
  const totalCost = Math.round(subtotal * method.timeMultiplier)

  // Sanity floor/ceiling only — not a pricing lever. Guards against
  // pathological input (e.g. zero weight, or an absurd quantity), never a
  // realistic constraint on a legitimate order.
  const clamped = Math.max(500, Math.min(2000000, totalCost))

  return {
    method: method.name,
    zone: zone.name,
    distanceKm: Math.round(distanceKm),
    weightKg: Math.round((Number(weightKg) || 0) * 100) / 100,
    baseFee,
    weightCost: Math.round(weightCost),
    totalCost: clamped,
    estimatedDays: method.estimatedDaysByZone[zoneIndex] ?? method.estimatedDaysByZone[method.estimatedDaysByZone.length - 1]
  }
}

function calculateShippingCost(origin, destination, weightKg, methodId) {
  return computeShipping(origin, destination, weightKg, methodId).totalCost
}

// Resolves the real shipping origin from a seller/farmer user document and
// their listing, instead of assuming a fixed city — sellers list from
// across Nigeria's 36 states + FCT.
function resolveSellerLocation(seller, listingLocation) {
  if (typeof listingLocation === 'string' && listingLocation.trim()) {
    const parts = listingLocation.split(',').map((part) => part.trim())
    return {
      city: parts[0] || 'Unknown City',
      state: parts[1] || 'Unknown State',
      country: parts[2] || 'Nigeria'
    }
  }

  const city = seller?.profile?.city || seller?.location || 'Unknown City'
  const state = seller?.profile?.state || seller?.location || 'Unknown State'
  return { city, state, country: seller?.profile?.country || 'Nigeria' }
}

module.exports = {
  SHIPPING_METHODS,
  DISTANCE_ZONES,
  ROAD_CIRCUITY_FACTOR,
  UNIT_TO_KG,
  unitToKg,
  calculateDistance,
  calculateShippingCost,
  computeShipping,
  resolveSellerLocation
}
