/**
 * Shipping Cost Calculator for GroChain
 *
 * This mirrors backend/utils/shipping-calculator.util.js number-for-number —
 * the frontend uses it to show an estimate before checkout, but the backend
 * always recomputes the actual charge server-side from authoritative data
 * (never trusts what the client submits). Keep both files numerically in
 * sync; see the backend file for full citations behind the rate figures.
 */

export interface ShippingLocation {
  city: string
  state: string
  country: string
  coordinates?: {
    lat: number
    lng: number
  }
}

export interface ShippingMethod {
  id: string
  name: string
  estimatedDays: number
  timeMultiplier: number
}

export interface ShippingCalculation {
  method: string
  zone: string
  distance: number
  weight: number
  baseCost: number
  weightCost: number
  totalCost: number
  estimatedDays: number
  breakdown: {
    distance: number
    weight: number
    method: number
    total: number
  }
}

// Road distance is longer than straight-line (Haversine) distance — roads
// curve around terrain and settlements. Published circuity/detour factors
// range ~1.2 (UK/US) to ~1.46 (Europe average); 1.3 is a defensible
// mid-range estimate used here for Nigeria's road network.
const ROAD_CIRCUITY_FACTOR = 1.3

// 50kg is the standard bag size for bulk agricultural distribution in
// Nigeria (grain/rice/maize sacks, and market baskets run a published
// 40-60kg). "Bundles" and "pieces" have no reliable published standard —
// conservative estimates are used pending a real per-listing weight field.
const UNIT_TO_KG: Record<string, number> = {
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
  bundles: 5,
  bundle: 5,
  liters: 1,
  litres: 1,
  pieces: 1,
  piece: 1,
  units: 1,
  unit: 1,
}

export function unitToKg(quantity: number, unit?: string): number {
  const factor = UNIT_TO_KG[String(unit || '').trim().toLowerCase()] ?? 1
  return (Number(quantity) || 0) * factor
}

// Zone-based pricing — the same model real carriers use (e.g. shipping
// zones). Rates are calibrated against published 2025-2026 Nigerian
// logistics benchmarks: local/door-to-door ₦500-2,000; a 1kg interstate
// parcel via a major courier ₦3,000-8,000; bulk/truckload interstate
// freight ₦50,000-500,000. These are real, cited, order-of-magnitude
// estimates — not a live carrier quote (no public self-serve Nigerian road
// freight rate API exists) — and are shown to users as an estimate.
interface DistanceZone {
  name: string
  maxKm: number
  baseFee: number
  perKgRate: number
}

const DISTANCE_ZONES: DistanceZone[] = [
  { name: 'Local', maxKm: 50, baseFee: 500, perKgRate: 15 },
  { name: 'Regional (Intrastate)', maxKm: 250, baseFee: 1000, perKgRate: 35 },
  { name: 'Interstate', maxKm: 700, baseFee: 2000, perKgRate: 70 },
  { name: 'Interstate Long-Haul', maxKm: Infinity, baseFee: 3500, perKgRate: 110 },
]

function resolveZone(distanceKm: number): { zone: DistanceZone; index: number } {
  const index = DISTANCE_ZONES.findIndex((zone) => distanceKm <= zone.maxKm)
  const safeIndex = index === -1 ? DISTANCE_ZONES.length - 1 : index
  return { zone: DISTANCE_ZONES[safeIndex], index: safeIndex }
}

interface MethodDef {
  name: string
  timeMultiplier: number
  estimatedDaysByZone: number[]
}

const METHOD_DEFS: Record<string, MethodDef> = {
  road_standard: { name: 'Road Transport (Standard)', timeMultiplier: 1.0, estimatedDaysByZone: [1, 2, 4, 6] },
  road_express: { name: 'Road Transport (Express)', timeMultiplier: 1.4, estimatedDaysByZone: [1, 1, 2, 3] },
  courier: { name: 'Courier Service', timeMultiplier: 1.6, estimatedDaysByZone: [1, 1, 2, 3] },
  air: { name: 'Air Freight', timeMultiplier: 2.2, estimatedDaysByZone: [1, 1, 1, 2] },
}

export const SHIPPING_METHODS: ShippingMethod[] = Object.entries(METHOD_DEFS).map(([id, def]) => ({
  id,
  name: def.name,
  timeMultiplier: def.timeMultiplier,
  // Displayed as the standard/mid-zone estimate in method-picker lists; the
  // actual per-order value is computed per zone in calculateShippingCost.
  estimatedDays: def.estimatedDaysByZone[2],
}))

// Nigerian states and their approximate coordinates
const NIGERIAN_STATES: Record<string, { lat: number; lng: number }> = {
  'Abia': { lat: 5.5320, lng: 7.4860 },
  'Adamawa': { lat: 9.3265, lng: 12.3988 },
  'Akwa Ibom': { lat: 4.9057, lng: 7.8537 },
  'Anambra': { lat: 6.2209, lng: 7.0722 },
  'Bauchi': { lat: 10.3103, lng: 9.8439 },
  'Bayelsa': { lat: 4.7719, lng: 6.1036 },
  'Benue': { lat: 7.3369, lng: 8.7404 },
  'Borno': { lat: 11.8333, lng: 13.1500 },
  'Cross River': { lat: 5.8702, lng: 8.5988 },
  'Delta': { lat: 5.5320, lng: 5.8980 },
  'Ebonyi': { lat: 6.2649, lng: 8.0137 },
  'Edo': { lat: 6.3350, lng: 5.6037 },
  'Ekiti': { lat: 7.6000, lng: 5.2000 },
  'Enugu': { lat: 6.4413, lng: 7.4988 },
  'FCT': { lat: 9.0765, lng: 7.3986 },
  'Gombe': { lat: 10.2897, lng: 11.1710 },
  'Imo': { lat: 5.4980, lng: 7.0266 },
  'Jigawa': { lat: 12.2280, lng: 9.5616 },
  'Kaduna': { lat: 10.5200, lng: 7.4383 },
  'Kano': { lat: 12.0022, lng: 8.5920 },
  'Katsina': { lat: 12.9855, lng: 7.6171 },
  'Kebbi': { lat: 12.4500, lng: 4.1994 },
  'Kogi': { lat: 7.8000, lng: 6.7333 },
  'Kwara': { lat: 8.5000, lng: 4.5500 },
  'Lagos': { lat: 6.5244, lng: 3.3792 },
  'Nasarawa': { lat: 8.5000, lng: 8.2000 },
  'Niger': { lat: 9.6000, lng: 6.5500 },
  'Ogun': { lat: 6.8167, lng: 3.3500 },
  'Ondo': { lat: 7.2500, lng: 5.2000 },
  'Osun': { lat: 7.7667, lng: 4.5667 },
  'Oyo': { lat: 7.3775, lng: 3.9470 },
  'Plateau': { lat: 9.9167, lng: 8.9000 },
  'Rivers': { lat: 4.8156, lng: 7.0498 },
  'Sokoto': { lat: 13.0667, lng: 5.2333 },
  'Taraba': { lat: 8.8833, lng: 11.3667 },
  'Yobe': { lat: 12.0000, lng: 11.5000 },
  'Zamfara': { lat: 12.1333, lng: 6.6667 },
}

function straightLineDistanceKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371
  const dLat = (lat2 - lat1) * Math.PI / 180
  const dLng = (lng2 - lng1) * Math.PI / 180
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLng / 2) * Math.sin(dLng / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return R * c
}

/**
 * Calculate real (road-approximated) distance between two locations.
 */
function calculateDistance(location1: ShippingLocation, location2: ShippingLocation): number {
  let straightLine: number

  if (location1.coordinates && location2.coordinates) {
    straightLine = straightLineDistanceKm(
      location1.coordinates.lat, location1.coordinates.lng,
      location2.coordinates.lat, location2.coordinates.lng
    )
  } else {
    const state1 = NIGERIAN_STATES[location1.state]
    const state2 = NIGERIAN_STATES[location2.state]

    if (state1 && state2) {
      straightLine = straightLineDistanceKm(state1.lat, state1.lng, state2.lat, state2.lng)
    } else if (location1.state && location1.state === location2.state) {
      straightLine = 40
    } else {
      straightLine = 400
    }
  }

  return straightLine * ROAD_CIRCUITY_FACTOR
}

/**
 * Calculate shipping cost for a given order. weight is in kg — use
 * unitToKg() first if you have quantity + unit (bags, tons, etc).
 */
export function calculateShippingCost(
  origin: ShippingLocation,
  destination: ShippingLocation,
  weight: number,
  methodId: string = 'road_standard'
): ShippingCalculation {
  const method = METHOD_DEFS[methodId] || METHOD_DEFS.road_standard
  const distance = calculateDistance(origin, destination)
  const { zone, index } = resolveZone(distance)

  const baseCost = zone.baseFee
  const weightCost = Math.max(0, weight) * zone.perKgRate
  const subtotal = baseCost + weightCost
  const rawTotal = subtotal * method.timeMultiplier

  // Sanity floor/ceiling only — not a pricing lever.
  const totalCost = Math.max(500, Math.min(2000000, Math.round(rawTotal)))

  return {
    method: method.name,
    zone: zone.name,
    distance: Math.round(distance),
    weight,
    baseCost: Math.round(baseCost),
    weightCost: Math.round(weightCost),
    totalCost,
    estimatedDays: method.estimatedDaysByZone[index],
    breakdown: {
      distance: Math.round(baseCost),
      weight: Math.round(weightCost),
      method: Math.round(totalCost - subtotal),
      total: totalCost,
    },
  }
}

/**
 * Get all available shipping methods with costs
 */
export function getAllShippingOptions(
  origin: ShippingLocation,
  destination: ShippingLocation,
  weight: number
): ShippingCalculation[] {
  return SHIPPING_METHODS.map(method =>
    calculateShippingCost(origin, destination, weight, method.id)
  )
}

/**
 * Get the cheapest shipping option
 */
export function getCheapestShippingOption(
  origin: ShippingLocation,
  destination: ShippingLocation,
  weight: number
): ShippingCalculation {
  const options = getAllShippingOptions(origin, destination, weight)
  return options.reduce((cheapest, current) =>
    current.totalCost < cheapest.totalCost ? current : cheapest
  )
}

/**
 * Get the fastest shipping option
 */
export function getFastestShippingOption(
  origin: ShippingLocation,
  destination: ShippingLocation,
  weight: number
): ShippingCalculation {
  const options = getAllShippingOptions(origin, destination, weight)
  return options.reduce((fastest, current) =>
    current.estimatedDays < fastest.estimatedDays ? current : fastest
  )
}

/**
 * Format shipping cost for display
 */
export function formatShippingCost(cost: number): string {
  return `₦${cost.toLocaleString()}`
}

/**
 * Format estimated delivery time
 */
export function formatDeliveryTime(days: number): string {
  if (days === 1) return 'Same day'
  if (days === 2) return 'Next day'
  return `${days} days`
}
