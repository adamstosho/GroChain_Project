const router = require('express').Router()
const { authenticate, authorize } = require('../middlewares/auth.middleware')
const referralController = require('../controllers/referral.controller')

// Apply authentication to all routes
router.use(authenticate)

// Referral Management
router.get('/', 
  authorize(['partner', 'admin']), 
  referralController.getReferrals
)

router.post('/', 
  authorize(['partner']), 
  referralController.createReferral
)

router.get('/:id', 
  authorize(['partner', 'admin']), 
  referralController.getReferralById
)

router.put('/:id', 
  authorize(['partner', 'admin']), 
  referralController.updateReferral
)

router.delete('/:id', 
  authorize(['admin']), 
  referralController.deleteReferral
)

// Referral Statistics
router.get('/stats/overview', 
  authorize(['partner', 'admin']), 
  referralController.getReferralStats
)

router.get('/stats/performance', 
  authorize(['partner', 'admin']), 
  referralController.getPerformanceStats
)

// Commission Management
router.get('/commissions/pending',
  authorize(['partner', 'admin']),
  referralController.getPendingCommissions
)

router.get('/commissions/paid',
  authorize(['partner', 'admin']),
  referralController.getPaidCommissions
)

// Sync farmer-partner relationships
router.post('/sync-partners',
  authorize(['partner', 'admin']),
  referralController.syncFarmerPartners
)

module.exports = router

