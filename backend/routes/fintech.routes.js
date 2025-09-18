const express = require('express')
const router = express.Router()
const ctrl = require('../controllers/fintech.controller')
const { authenticate, authorizeRoles } = require('../middlewares/auth.middleware')

// Public routes
router.get('/loan-referrals', authenticate, ctrl.getLoanReferrals)
router.get('/loan-stats', authenticate, ctrl.getLoanStats)
router.get('/insurance-policies', authenticate, ctrl.getInsurancePolicies)
router.get('/insurance-stats', authenticate, ctrl.getInsuranceStats)
router.get('/insurance-quotes', authenticate, ctrl.getInsuranceQuotes)
router.get('/insurance-claims', authenticate, ctrl.getInsuranceClaims)

// Protected routes (require authentication)
router.use(authenticate)

// Financial dashboard - main endpoint
router.get('/dashboard', ctrl.getFinancialDashboard)

// Financial health and analysis
router.get('/financial-health/:farmerId', ctrl.getFinancialHealth)
router.get('/financial-health/me', ctrl.getFinancialHealth)
router.get('/crop-financials', ctrl.getCropFinancials)
router.get('/financial-projections', ctrl.getFinancialProjections)
router.get('/financial-goals/:farmerId', ctrl.getFinancialGoals)
router.get('/financial-goals/me', ctrl.getFinancialGoals)

// Credit score routes
router.get('/credit-score/me', authenticate, ctrl.getCreditScore)
router.get('/credit-score/:farmerId', ctrl.getCreditScore)
router.post('/credit-score', ctrl.createCreditScore)
router.put('/credit-score/:id', ctrl.updateCreditScore)

// Loan application routes
router.get('/loan-applications', ctrl.getLoanApplications)
router.get('/loan-applications/me', ctrl.getLoanApplications)
router.post('/loan-applications', ctrl.createLoanApplication)
router.get('/loan-applications/:id', ctrl.getLoanApplication)
router.put('/loan-applications/:id', ctrl.updateLoanApplication)
router.delete('/loan-applications/:id', ctrl.deleteLoanApplication)

// Insurance routes
router.post('/insurance-policies', ctrl.createInsurancePolicy)
router.get('/insurance-policies/:id', ctrl.getInsurancePolicy)
router.get('/insurance-policies/me', ctrl.getInsurancePolicies)
router.put('/insurance-policies/:id', ctrl.updateInsurancePolicy)
router.delete('/insurance-policies/:id', ctrl.deleteInsurancePolicy)

// Claims routes
router.post('/insurance-claims', ctrl.createInsuranceClaim)
router.get('/insurance-claims/:id', ctrl.getInsuranceClaim)
router.put('/insurance-claims/:id', ctrl.updateInsuranceClaim)

module.exports = router

