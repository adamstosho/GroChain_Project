const router = require('express').Router()
const { authenticate } = require('../middlewares/auth.middleware')
const qrCodeController = require('../controllers/qrCode.controller')

/**
 * @route   GET /api/qr-codes
 * @desc    Get user's QR codes with pagination and filters
 * @access  Private (Authenticated users)
 * @query   page, limit, status, cropType, search
 */
router.get('/', authenticate, qrCodeController.getUserQRCodes)

/**
 * @route   POST /api/qr-codes
 * @desc    Generate new QR code for existing harvest
 * @access  Private (Authenticated users)
 * @body    harvestId, customData
 */
router.post('/', authenticate, qrCodeController.generateNewQRCode)

/**
 * @route   GET /api/qr-codes/stats
 * @desc    Get comprehensive QR code statistics
 * @access  Private (Authenticated users)
 */
router.get('/stats', authenticate, qrCodeController.getQRCodeStats)

/**
 * @route   GET /api/qr-codes/:id
 * @desc    Get specific QR code details with scan history
 * @access  Private (Authenticated users)
 */
router.get('/:id', authenticate, qrCodeController.getQRCodeById)

/**
 * @route   GET /api/qr-codes/:id/download
 * @desc    Download QR code image
 * @access  Private (Authenticated users)
 */
router.get('/:id/download', authenticate, qrCodeController.downloadQRCode)

/**
 * @route   PATCH /api/qr-codes/:id/revoke
 * @desc    Revoke QR code
 * @access  Private (Authenticated users)
 */
router.patch('/:id/revoke', authenticate, qrCodeController.revokeQRCode)

/**
 * @route   POST /api/qr-codes/scan
 * @desc    Record QR code scan
 * @access  Private (Authenticated users)
 * @body    qrCodeId, scanData
 */
router.post('/scan', authenticate, qrCodeController.recordQRScan)

/**
 * @route   DELETE /api/qr-codes/:id
 * @desc    Delete QR code
 * @access  Private (Authenticated users)
 */
router.delete('/:id', authenticate, qrCodeController.deleteQRCode)

module.exports = router

