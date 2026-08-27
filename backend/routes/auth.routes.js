const router = require('express').Router()
const ctrl = require('../controllers/auth.controller')

router.post('/register', ctrl.register)
router.post('/verify-email', ctrl.verifyEmail)
// GET endpoint for email verification links (better for cross-browser compatibility)
router.get('/verify-email/:token', ctrl.verifyEmailGet)
router.post('/login', ctrl.login)
router.post('/refresh', ctrl.refresh)
router.post('/logout', ctrl.logout)
router.post('/forgot-password', ctrl.forgotPassword)
router.post('/reset-password', ctrl.resetPassword)
router.post('/resend-verification', ctrl.resendVerification)

// SMS OTP
router.post('/send-sms-otp', ctrl.sendSmsOtp)
router.post('/verify-sms-otp', ctrl.verifySmsOtp)

module.exports = router

