const express = require('express')
const router = express.Router()
const languageController = require('../controllers/language.controller')
const { authenticate, authorize } = require('../middlewares/auth.middleware')
const { languageMiddleware } = require('../middlewares/language.middleware')

router.use(languageMiddleware.detect)

// Public / authenticated language info
router.get('/', languageController.getSupportedLanguages)
router.get('/current', languageController.getCurrentLanguage)
router.get('/content/:contentType/:contentId?', languageController.getLocalizedContent)
router.post('/detect', languageController.detectLanguage)
router.post('/format', languageController.formatData)

// Authenticated preference updates
router.put('/preference', authenticate, languageController.updateUserLanguage)

// Admin
router.get('/stats', authenticate, authorize('admin'), languageController.getLanguageStats)
router.post('/bulk-update', authenticate, authorize(['admin']), languageController.bulkLanguageUpdate)

module.exports = router
