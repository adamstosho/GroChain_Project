const router = require('express').Router()
const googleAuthController = require('../controllers/googleAuth.controller')

// Google OAuth callback route
router.post('/callback', googleAuthController.handleGoogleCallback)

// Direct Google OAuth route (for testing)
router.post('/', googleAuthController.handleGoogleAuth)

module.exports = router
