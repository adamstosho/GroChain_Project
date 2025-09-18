const express = require('express')
const router = express.Router()
const { uploadController, upload } = require('../controllers/upload.controller')
const { authenticate } = require('../middlewares/auth.middleware')

// Upload single image
router.post('/image', authenticate, upload.single('file'), uploadController.uploadImage)

// Upload multiple images
router.post('/images', authenticate, upload.array('files', 10), uploadController.uploadImages)

// Delete image
router.delete('/image/:public_id', authenticate, uploadController.deleteImage)

module.exports = router

