/**
 * Shipping Cost Calculator for GroChain
 * Calculates shipping costs based on distance, weight, and shipping method
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
  baseRate: number // Base rate per km
  weightMultiplier: number // Additional cost per kg
  timeMultiplier: number // Express delivery multiplier
  minCost: number // Minimum shipping cost
  maxCost: number // Maximum shipping cost
  estimatedDays: number
}

export interface ShippingCalculation {
  method: string
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

// Nigerian states and their approximate coordinates
const NIGERIAN_STATES = {
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
  'Zamfara': { lat: 12.1333, lng: 6.6667 }
}

// Shipping methods available in Nigeria
export const SHIPPING_METHODS: ShippingMethod[] = [
  {
    id: 'road_standard',
    name: 'Road Transport (Standard)',
    baseRate: 5, // ₦5 per km
    weightMultiplier: 10, // ₦10 per kg
    timeMultiplier: 1,
    minCost: 200,
    maxCost: 2000,
    estimatedDays: 3
  },
  {
    id: 'road_express',
    name: 'Road Transport (Express)',
    baseRate: 8, // ₦8 per km
    weightMultiplier: 15, // ₦15 per kg
    timeMultiplier: 1.2,
    minCost: 300,
    maxCost: 3000,
    estimatedDays: 2
  },
  {
    id: 'air',
    name: 'Air Freight',
    baseRate: 15, // ₦15 per km
    weightMultiplier: 30, // ₦30 per kg
    timeMultiplier: 1.5,
    minCost: 500,
    maxCost: 5000,
    estimatedDays: 1
  },
  {
    id: 'courier',
    name: 'Courier Service',
    baseRate: 10, // ₦10 per km
    weightMultiplier: 20, // ₦20 per kg
    timeMultiplier: 1.3,
    minCost: 400,
    maxCost: 4000,
    estimatedDays: 2
  }
]

/**
 * Calculate distance between two locations using Haversine formula
 */
function calculateDistance(location1: ShippingLocation, location2: ShippingLocation): number {
  // If we have coordinates, use Haversine formula
  if (location1.coordinates && location2.coordinates) {
    const R = 6371 // Earth's radius in kilometers
    const dLat = (location2.coordinates.lat - location1.coordinates.lat) * Math.PI / 180
    const dLng = (location2.coordinates.lng - location1.coordinates.lng) * Math.PI / 180
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(location1.coordinates.lat * Math.PI / 180) * Math.cos(location2.coordinates.lat * Math.PI / 180) *
              Math.sin(dLng/2) * Math.sin(dLng/2)
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))
    return R * c
  }
  
  // Fallback: Use state-based distance estimation
  const state1 = NIGERIAN_STATES[location1.state as keyof typeof NIGERIAN_STATES]
  const state2 = NIGERIAN_STATES[location2.state as keyof typeof NIGERIAN_STATES]
  
  if (state1 && state2) {
    const R = 6371
    const dLat = (state2.lat - state1.lat) * Math.PI / 180
    const dLng = (state2.lng - state1.lng) * Math.PI / 180
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(state1.lat * Math.PI / 180) * Math.cos(state2.lat * Math.PI / 180) *
              Math.sin(dLng/2) * Math.sin(dLng/2)
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))
    return R * c
  }
  
  // If same state, assume 50km average distance
  if (location1.state === location2.state) {
    return 50
  }
  
  // Default distance for inter-state
  return 200
}

/**
 * Calculate shipping cost for a given order
 */
export function calculateShippingCost(
  origin: ShippingLocation,
  destination: ShippingLocation,
  weight: number, // in kg
  methodId: string = 'road_standard'
): ShippingCalculation {
  const method = SHIPPING_METHODS.find(m => m.id === methodId) || SHIPPING_METHODS[0]
  const distance = calculateDistance(origin, destination)
  
  // Calculate base cost based on distance
  const baseCost = distance * method.baseRate
  
  // Calculate weight cost
  const weightCost = weight * method.weightMultiplier
  
  // Calculate total cost
  let totalCost = baseCost + weightCost
  
  // Apply time multiplier for express services
  totalCost *= method.timeMultiplier
  
  // Apply min/max constraints
  totalCost = Math.max(method.minCost, Math.min(method.maxCost, totalCost))
  
  return {
    method: method.name,
    distance: Math.round(distance),
    weight,
    baseCost: Math.round(baseCost),
    weightCost: Math.round(weightCost),
    totalCost: Math.round(totalCost),
    estimatedDays: method.estimatedDays,
    breakdown: {
      distance: Math.round(distance),
      weight: Math.round(weightCost),
      method: Math.round(totalCost - baseCost - weightCost),
      total: Math.round(totalCost)
    }
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
