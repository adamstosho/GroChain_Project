const express = require('express')
const router = express.Router()
const ExportImportController = require('../controllers/exportImport.controller')
const { authenticate, authorize } = require('../middlewares/auth.middleware')
const { rateLimit } = require('../middlewares/rateLimit.middleware')


// Apply rate limiting to all export/import routes
router.use(rateLimit('api'))

// Export routes
router.post('/export/harvests', 
  authenticate, 
  authorize('admin','partner'), 
  ExportImportController.exportHarvests
)

router.post('/export/listings', 
  authenticate, 
  authorize('admin','partner','farmer'), 
  ExportImportController.exportListings
)

router.post('/export/users', 
  authenticate, 
  authorize('admin'), 
  ExportImportController.exportUsers
)

router.post('/export/partners', 
  authenticate, 
  authorize('admin'), 
  ExportImportController.exportPartners
)

router.post('/export/shipments', 
  authenticate, 
  authorize('admin','partner'), 
  ExportImportController.exportShipments
)

router.post('/export/transactions', 
  authenticate, 
  authorize('admin'), 
  ExportImportController.exportTransactions
)

router.post('/export/analytics', 
  authenticate, 
  authorize('admin', 'buyer', 'farmer', 'partner'), 
  ExportImportController.exportAnalytics
)

router.post('/export/custom', 
  authenticate, 
  authorize('admin','partner'), 
  ExportImportController.exportCustomData
)

// Import routes
router.post('/import/data', 
  authenticate, 
  authorize('admin'), 
  ExportImportController.importData
)

router.post('/import/harvests', 
  authenticate, 
  authorize('admin','partner'), 
  ExportImportController.importHarvests
)

router.post('/import/listings', 
  authenticate, 
  authorize('admin','partner'), 
  ExportImportController.importListings
)

router.post('/import/users', 
  authenticate, 
  authorize('admin'), 
  ExportImportController.importUsers
)

router.post('/import/partners', 
  authenticate, 
  authorize('admin'), 
  ExportImportController.importPartners
)

router.post('/import/shipments', 
  authenticate, 
  authorize('admin','partner'), 
  ExportImportController.importShipments
)

router.post('/import/transactions', 
  authenticate, 
  authorize('admin'), 
  ExportImportController.importTransactions
)

// Utility routes
router.get('/formats', 
  ExportImportController.getSupportedFormats
)

router.get('/templates', 
  ExportImportController.getExportTemplates
)

router.post('/validate-template', 
  authenticate, 
  authorize('admin','partner'), 
  ExportImportController.validateExportTemplate
)

router.get('/stats', 
  authenticate, 
  authorize('admin'), 
  ExportImportController.getExportStats
)

router.post('/cleanup', 
  authenticate, 
  authorize('admin'), 
  ExportImportController.cleanupOldExports
)

// File download route
router.get('/download/:filename', 
  authenticate, 
  authorize('admin','partner','farmer','buyer'), 
  ExportImportController.downloadExport
)

// Health check route
router.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'Export/Import service is healthy',
    timestamp: new Date().toISOString(),
    service: 'ExportImportService'
  })
})

module.exports = router
