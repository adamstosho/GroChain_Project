const { NIGERIAN_STATES } = require('./nigerian-states.util')

const SHIPPING_METHODS = {
  'road_standard': { baseRate: 5, weightMultiplier: 10, timeMultiplier: 1, minCost: 200, maxCost: 2000 },
  'road_express': { baseRate: 8, weightMultiplier: 15, timeMultiplier: 1.2, minCost: 300, maxCost: 3000 },
  'air': { baseRate: 15, weightMultiplier: 30, timeMultiplier: 1.5, minCost: 500, maxCost: 5000 },
  'courier': { baseRate: 10, weightMultiplier: 20, timeMultiplier: 1.3, minCost: 400, maxCost: 4000 }
}

function calculateDistance(location1, location2) {
  const state1 = NIGERIAN_STATES[location1.state]
  const state2 = NIGERIAN_STATES[location2.state]

  if (state1 && state2) {
    const R = 6371
    const dLat = (state2.lat - state1.lat) * Math.PI / 180
    const dLng = (state2.lng - state1.lng) * Math.PI / 180
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos(state1.lat * Math.PI / 180) * Math.cos(state2.lat * Math.PI / 180) *
              Math.sin(dLng / 2) * Math.sin(dLng / 2)
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
    return R * c
  }

  if (location1.state === location2.state) {
    return 50
  }

  return 200
}

function calculateShippingCost(origin, destination, weight, methodId) {
  const method = SHIPPING_METHODS[methodId] || SHIPPING_METHODS['road_standard']
  const distance = calculateDistance(origin, destination)

  const baseCost = distance * method.baseRate
  const weightCost = weight * method.weightMultiplier
  let totalCost = baseCost + weightCost

  totalCost *= method.timeMultiplier
  totalCost = Math.max(method.minCost, Math.min(method.maxCost, totalCost))

  return Math.round(totalCost)
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
  calculateDistance,
  calculateShippingCost,
  resolveSellerLocation
}
