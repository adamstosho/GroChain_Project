const multer = require('multer')
const path = require('path')
const fs = require('fs')
const crypto = require('crypto')

const ALLOWED_EXTS = ['.jpg', '.jpeg', '.png', '.webp', '.gif']
const ALLOWED_MIMES = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif'
])

function getAllowedExt(originalname) {
  const ext = path.extname(originalname || '').toLowerCase()
  return ALLOWED_EXTS.includes(ext) ? ext : null
}

function hasValidMagicBytes(filePath) {
  try {
    const fd = fs.openSync(filePath, 'r')
    const buf = Buffer.alloc(12)
    const bytesRead = fs.readSync(fd, buf, 0, 12, 0)
    fs.closeSync(fd)
    if (bytesRead < 3) return false
    // JPEG
    if (buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) return true
    // PNG
    if (buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4e && buf[3] === 0x47) return true
    // GIF
    if (buf[0] === 0x47 && buf[1] === 0x49 && buf[2] === 0x46) return true
    // WEBP (RIFF....WEBP)
    if (
      buf[0] === 0x52 && buf[1] === 0x49 && buf[2] === 0x46 && buf[3] === 0x46 &&
      buf[8] === 0x57 && buf[9] === 0x45 && buf[10] === 0x42 && buf[11] === 0x50
    ) return true
    return false
  } catch {
    return false
  }
}

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = 'uploads/avatars'
    // Create directory if it doesn't exist
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true })
    }
    cb(null, uploadDir)
  },
  filename: function (req, file, cb) {
    const ext = getAllowedExt(file.originalname)
    if (!ext) {
      return cb(new Error('Invalid file extension'))
    }
    const unique = crypto.randomBytes(16).toString('hex')
    cb(null, 'avatar-' + unique + ext)
  }
})

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  },
  fileFilter: function (req, file, cb) {
    const ext = getAllowedExt(file.originalname)
    if (!ext) {
      return cb(new Error('Only .jpg, .jpeg, .png, .webp, .gif files are allowed'), false)
    }
    if (!ALLOWED_MIMES.has(file.mimetype)) {
      return cb(new Error('Only JPEG, PNG, WebP, and GIF images are allowed'), false)
    }
    cb(null, true)
  }
})

// Post-multer magic-byte check (call after upload.single/array)
upload.validateMagicBytes = function validateMagicBytes(req, res, next) {
  const files = []
  if (req.file) files.push(req.file)
  if (Array.isArray(req.files)) files.push(...req.files)
  else if (req.files && typeof req.files === 'object') {
    Object.values(req.files).forEach((arr) => {
      if (Array.isArray(arr)) files.push(...arr)
    })
  }
  for (const file of files) {
    if (!file?.path) continue
    if (!hasValidMagicBytes(file.path)) {
      try { fs.unlinkSync(file.path) } catch (_) { /* ignore */ }
      return res.status(400).json({
        status: 'error',
        message: 'Invalid image content'
      })
    }
  }
  next()
}

module.exports = upload
