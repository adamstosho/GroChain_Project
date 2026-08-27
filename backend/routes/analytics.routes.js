const express = require('express')
const router = express.Router()
const ctrl = require('../controllers/analytics.controller')
const { authenticate, authorize } = require('../middlewares/auth.middleware')

// Platform totals (users/revenue) — admin only
router.get('/dashboard', authenticate, authorize('admin'), ctrl.getDashboardMetrics)
router.get('/financial', authenticate, authorize('admin'), ctrl.getFinancialAnalytics)
// Aggregate marketplace/harvest stats — any authenticated role (no longer public)
router.get('/harvests', authenticate, ctrl.getHarvestAnalytics)
router.get('/marketplace', authenticate, ctrl.getMarketplaceAnalytics)

// Advanced analytics - all now fully aggregated
router.get('/transactions', authenticate, ctrl.getTransactionAnalytics)
router.get('/fintech', authenticate, ctrl.getFintechAnalytics)
router.get('/impact', authenticate, ctrl.getImpactAnalytics)
router.get('/weather', authenticate, ctrl.getWeatherAnalytics)
router.get('/reports', authenticate, ctrl.getReportsList)
router.get('/export', authenticate, ctrl.exportAnalytics)
router.post('/compare', authenticate, ctrl.compareAnalytics)
router.post('/regional', authenticate, ctrl.getRegionalAnalytics)
router.get('/predictive', authenticate, ctrl.getPredictiveAnalytics)
router.get('/summary', authenticate, ctrl.getAnalyticsSummary)

// Protected routes (require authentication)
router.use(authenticate)

// "Me" endpoints for authenticated users to get their own analytics
router.get('/farmers/me', ctrl.getFarmerAnalytics)
router.get('/farmers/me/crops', ctrl.getFarmerCropAnalytics)
router.get('/farmers/me/marketplace', ctrl.getFarmerMarketplaceAnalytics)
router.get('/buyers/me', ctrl.getBuyerAnalytics)
router.get('/partners/me', ctrl.getPartnerAnalytics)

// Specific user analytics (for admin purposes)
router.get('/farmers/:farmerId', ctrl.getFarmerAnalytics)
router.get('/farmers/:farmerId/crops', ctrl.getFarmerCropAnalytics)
router.get('/farmers/:farmerId/marketplace', ctrl.getFarmerMarketplaceAnalytics)
router.get('/partners/:partnerId', ctrl.getPartnerAnalytics)
router.get('/buyers/:buyerId', ctrl.getBuyerAnalytics)
router.post('/report', ctrl.generateReport)

module.exports = router

