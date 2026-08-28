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

// Partner-facing: request a payout (records payout details, does not pay)
router.post('/payout-request',
  authorize(['partner', 'admin']),
  commissionController.requestCommissionPayout
)

// Admin-only: actually execute the payout (marks paid + creates the ledger entry)
router.post('/payout',
  authorize(['admin']),
  commissionController.processCommissionPayout
)

module.exports = router
