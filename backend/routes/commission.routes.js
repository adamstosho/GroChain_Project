const router = require('express').Router()
const { authenticate, authorize } = require('../middlewares/auth.middleware')
const commissionController = require('../controllers/commission.controller')

// Apply authentication to all routes
router.use(authenticate)

// Commission Management
router.get('/', 
  authorize(['partner', 'admin']), 
  commissionController.getCommissions
)

router.get('/stats', 
  authorize(['partner', 'admin']), 
  commissionController.getCommissionStats
)

router.get('/summary/:partnerId', 
  authorize(['partner', 'admin']), 
  commissionController.getPartnerCommissionSummary
)

router.get('/:id', 
  authorize(['partner', 'admin']), 
  commissionController.getCommissionById
)

router.post('/', 
  authorize(['admin', 'system']), 
  commissionController.createCommission
)

router.put('/:id/status', 
  authorize(['partner', 'admin']), 
  commissionController.updateCommissionStatus
)

router.post('/payout', 
  authorize(['partner', 'admin']), 
  commissionController.processCommissionPayout
)

module.exports = router
