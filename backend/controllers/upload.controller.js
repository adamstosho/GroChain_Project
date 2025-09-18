const cloudinary = require('cloudinary').v2
const multer = require('multer')
const path = require('path')

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
})

// Configure multer for memory storage
const storage = multer.memoryStorage()
const upload = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedImageTypes = /jpeg|jpg|png|gif|webp/
    const allowedDocumentTypes = /pdf/
    const extname = allowedImageTypes.test(path.extname(file.originalname).toLowerCase()) ||
                   allowedDocumentTypes.test(path.extname(file.originalname).toLowerCase())
    const mimetype = allowedImageTypes.test(file.mimetype) || allowedDocumentTypes.test(file.mimetype)

    if (mimetype && extname) {
      return cb(null, true)
    } else {
      cb(new Error('Only image files (JPEG, PNG, GIF, WebP) and PDF documents are allowed!'))
    }
  }
})

const uploadController = {
  // Upload single image
  async uploadImage(req, res) {
    try {
      if (!req.file) {
        return res.status(400).json({
          status: 'error',
          message: 'No image file provided'
        })
      }

      const file = req.file

      // Convert buffer to base64
      const b64 = Buffer.from(file.buffer).toString('base64')
      const dataURI = `data:${file.mimetype};base64,${b64}`

      // Upload to Cloudinary with appropriate settings based on file type
      const isPDF = file.mimetype === 'application/pdf'
      const uploadOptions = {
        folder: 'grochain/documents',
        public_id: `${isPDF ? 'document' : 'image'}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        resource_type: isPDF ? 'raw' : 'image'
      }

      // Only apply transformations to images, not PDFs
      if (!isPDF) {
        uploadOptions.transformation = [
          { width: 1200, height: 1200, crop: 'limit' },
          { quality: 'auto' }
        ]
      }

      const result = await cloudinary.uploader.upload(dataURI, uploadOptions)

      res.json({
        status: 'success',
        url: result.secure_url,
        public_id: result.public_id,
        width: result.width,
        height: result.height,
        format: result.format,
        bytes: result.bytes
      })
    } catch (error) {
      console.error('Image upload error:', error)
      res.status(500).json({
        status: 'error',
        message: 'Failed to upload image',
        error: error.message
      })
    }
  },

  // Upload multiple images
  async uploadImages(req, res) {
    try {
      if (!req.files || req.files.length === 0) {
        return res.status(400).json({
          status: 'error',
          message: 'No image files provided'
        })
      }

      const uploadPromises = req.files.map(async (file) => {
        const b64 = Buffer.from(file.buffer).toString('base64')
        const dataURI = `data:${file.mimetype};base64,${b64}`

        // Upload with appropriate settings based on file type
        const isPDF = file.mimetype === 'application/pdf'
        const uploadOptions = {
          folder: 'grochain/documents',
          public_id: `${isPDF ? 'document' : 'image'}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          resource_type: isPDF ? 'raw' : 'image'
        }

        // Only apply transformations to images, not PDFs
        if (!isPDF) {
          uploadOptions.transformation = [
            { width: 1200, height: 1200, crop: 'limit' },
            { quality: 'auto' }
          ]
        }

        return cloudinary.uploader.upload(dataURI, uploadOptions)
      })

      const results = await Promise.all(uploadPromises)

      const uploadedImages = results.map(result => ({
        url: result.secure_url,
        public_id: result.public_id,
        width: result.width,
        height: result.height,
        format: result.format,
        bytes: result.bytes
      }))

      res.json({
        status: 'success',
        images: uploadedImages,
        count: uploadedImages.length
      })
    } catch (error) {
      console.error('Multiple images upload error:', error)
      res.status(500).json({
        status: 'error',
        message: 'Failed to upload images',
        error: error.message
      })
    }
  },

  // Delete image from Cloudinary
  async deleteImage(req, res) {
    try {
      const { public_id } = req.params

      if (!public_id) {
        return res.status(400).json({
          status: 'error',
          message: 'Public ID is required'
        })
      }

      const result = await cloudinary.uploader.destroy(public_id)

      res.json({
        status: 'success',
        result,
        message: 'Image deleted successfully'
      })
    } catch (error) {
      console.error('Image deletion error:', error)
      res.status(500).json({
        status: 'error',
        message: 'Failed to delete image',
        error: error.message
      })
    }
  }
}

module.exports = {
  uploadController,
  upload
}

