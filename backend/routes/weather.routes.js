const express = require('express')
const router = express.Router()
const weatherController = require('../controllers/weather.controller')
const { authenticate } = require('../middlewares/auth.middleware')
const { validateWeather } = require('../middlewares/validation.middleware')

// Get current weather data
router.get('/current/:location', (req, res) => {
  // Handle coordinate-based location (lat,lng format)
  if (req.params.location.includes(',')) {
    const [lat, lng] = req.params.location.split(',')
    req.query.lat = lat
    req.query.lng = lng
  }
  return weatherController.getCurrentWeather(req, res)
})

// Get weather forecast
router.get('/forecast/:location', (req, res) => {
  // Handle coordinate-based location (lat,lng format)
  if (req.params.location.includes(',')) {
    const [lat, lng] = req.params.location.split(',')
    req.query.lat = lat
    req.query.lng = lng
  }
  return weatherController.getWeatherForecast(req, res)
})

// Alias: agricultural (docs)
router.get('/agricultural', weatherController.getAgriculturalInsights)

// Get agricultural weather insights
router.get('/agricultural-insights', weatherController.getAgriculturalInsights)

// Get weather alerts
router.get('/alerts', weatherController.getWeatherAlerts)

// Get historical weather data
router.get('/historical', weatherController.getHistoricalWeather)

// Coordinates shortcut
router.get('/coordinates/:lat/:lng', (req, res) => {
  req.query.lat = req.params.lat
  req.query.lng = req.params.lng
  return weatherController.getCurrentWeather(req, res)
})

// Reverse geocoding endpoint
router.get('/reverse-geocode', 
  validateWeather.reverseGeocode,
  weatherController.reverseGeocode
)

// IP-based location fallback endpoint
router.get('/ip-location', weatherController.getIPLocation)

// Regional statistics stub
router.get('/statistics/:region', async (req, res) => {
  return res.json({ status: 'success', data: { region: req.params.region, stats: {}, message: 'Not yet implemented' } })
})

// Regional alerts stub
router.get('/regional-alerts', async (req, res) => {
  return res.json({ status: 'success', data: { alerts: [], message: 'Not yet implemented' } })
})

// Climate summary stub
router.get('/climate-summary', async (req, res) => {
  return res.json({ status: 'success', data: { summary: {}, message: 'Not yet implemented' } })
})

// Subscribe to weather alerts (requires authentication)
router.post('/subscribe', 
  authenticate, 
  weatherController.subscribeToAlerts
)

module.exports = router


