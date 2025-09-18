const router = require('express').Router()
const { authenticate } = require('../middlewares/auth.middleware')
const ctrl = require('../controllers/harvest.controller')

router.get('/', authenticate, ctrl.getHarvests)
router.get('/stats', authenticate, ctrl.getHarvestStats)
router.get('/analytics', authenticate, ctrl.getHarvestAnalytics)
router.get('/export', authenticate, ctrl.exportHarvests)
router.post('/', authenticate, ctrl.createHarvest)
router.put('/:id', authenticate, ctrl.updateHarvest)
router.get('/id/:id', authenticate, ctrl.getHarvestById)
router.get('/verification/:batchId', ctrl.getHarvestVerification)
router.get('/provenance/:batchId', authenticate, ctrl.getProvenance)
router.delete('/:id', authenticate, ctrl.deleteHarvest)
router.get('/:batchId', authenticate, ctrl.getProvenance)

module.exports = router


