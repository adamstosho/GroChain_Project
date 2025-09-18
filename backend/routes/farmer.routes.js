const router = require('express').Router()
const { authenticate, authorize } = require('../middlewares/auth.middleware')
const farmerController = require('../controllers/farmer.controller')

// Apply authentication to all routes
router.use(authenticate)

// Farmer Search (for partners to find farmers)
router.get('/search', 
  authorize(['partner', 'admin']), 
  farmerController.searchFarmers
)

// Farmer Profile & Settings
router.get('/profile/me', 
  authorize(['farmer']), 
  farmerController.getMyProfile
)

router.put('/profile/me', 
  authorize(['farmer']), 
  farmerController.updateMyProfile
)

router.get('/preferences/me', 
  authorize(['farmer']), 
  farmerController.getMyPreferences
)

router.put('/preferences/me', 
  authorize(['farmer']), 
  farmerController.updateMyPreferences
)

router.get('/settings/me', 
  authorize(['farmer']), 
  farmerController.getMySettings
)

router.put('/settings/me', 
  authorize(['farmer']), 
  farmerController.updateMySettings
)

// Farmer Dashboard Data
router.get('/dashboard', 
  authorize(['farmer']), 
  farmerController.getDashboardData
)

router.get('/harvests/summary', 
  authorize(['farmer']), 
  farmerController.getHarvestSummary
)

router.get('/earnings/summary', 
  authorize(['farmer']), 
  farmerController.getEarningsSummary
)

// Farmer's marketplace data
router.get('/listings', 
  authorize(['farmer']), 
  farmerController.getMyListings
)

router.get('/orders', 
  authorize(['farmer']), 
  farmerController.getMyOrders
)

module.exports = router

