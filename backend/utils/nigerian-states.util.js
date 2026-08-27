// Approximate lat/lng centroid for each Nigerian state, used as a fallback
// when a user/listing hasn't recorded precise GPS coordinates.
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

// Geographic centroid of Nigeria as a whole — used only when the state itself
// is unknown/unrecognized, so an unmapped location doesn't silently collapse
// onto a specific city like Lagos.
const NIGERIA_CENTROID = { lat: 9.0820, lng: 8.6753 }

function normalizeStateName(state) {
  if (!state || typeof state !== 'string') return null
  const trimmed = state.trim()
  if (NIGERIAN_STATES[trimmed]) return trimmed

  const match = Object.keys(NIGERIAN_STATES).find(
    (name) => name.toLowerCase() === trimmed.toLowerCase()
  )
  return match || null
}

// Returns { lat, lng } for a given state name, or the Nigeria-wide centroid
// if the state can't be matched.
function getCoordinatesForState(state) {
  const matched = normalizeStateName(state)
  return matched ? NIGERIAN_STATES[matched] : NIGERIA_CENTROID
}

module.exports = { NIGERIAN_STATES, NIGERIA_CENTROID, normalizeStateName, getCoordinatesForState }
