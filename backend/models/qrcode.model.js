const mongoose = require('mongoose')

const QRCodeScanSchema = new mongoose.Schema({
  scannedAt: { type: Date, default: Date.now },
  scannedBy: {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    userType: { type: String, enum: ['farmer', 'buyer', 'partner', 'admin'] },
    name: String,
    location: String
  },
  verificationResult: {
    type: String,
    enum: ['success', 'failed', 'tampered'],
    default: 'success'
  },
  deviceInfo: {
    userAgent: String,
    ipAddress: String,
    coordinates: {
      lat: Number,
      lng: Number
    }
  },
  notes: String
})

const QRCodeSchema = new mongoose.Schema({
  // Reference to the harvest this QR code is for
  harvest: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Harvest',
    required: true
  },

  // Farmer who owns this QR code
  farmer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },

  // Unique QR code identifier
  code: {
    type: String,
    required: true
  },

  // Batch information
  batchId: {
    type: String,
    required: true
  },

  // QR code data
  qrImage: {
    type: String, // Data URL of the QR code image
    required: true
  },

  qrData: {
    type: mongoose.Schema.Types.Mixed, // Structured data embedded in QR
    required: true
  },

  // Status
  status: {
    type: String,
    enum: ['active', 'expired', 'revoked', 'verified'],
    default: 'active'
  },

  // Expiration
  expiresAt: {
    type: Date,
    default: () => new Date(Date.now() + 365 * 24 * 60 * 60 * 1000) // 1 year from now
  },

  // Scan tracking
  scanCount: {
    type: Number,
    default: 0
  },

  lastScanned: {
    type: Date
  },

  scans: [QRCodeScanSchema],

  // Metadata
  metadata: {
    cropType: String,
    quantity: Number,
    quality: String,
    harvestDate: Date,
    location: {
      farmName: String,
      city: String,
      state: String,
      coordinates: {
        lat: Number,
        lng: Number
      }
    }
  },

  // Download tracking
  downloadCount: {
    type: Number,
    default: 0
  },

  lastDownloaded: {
    type: Date
  }
}, {
  timestamps: true
})

// Indexes for performance
QRCodeSchema.index({ farmer: 1 })
QRCodeSchema.index({ harvest: 1 })
QRCodeSchema.index({ code: 1 }, { unique: true })
QRCodeSchema.index({ status: 1 })
QRCodeSchema.index({ expiresAt: 1 })
QRCodeSchema.index({ createdAt: -1 })

// Virtual for checking if expired
QRCodeSchema.virtual('isExpired').get(function() {
  return this.expiresAt < new Date()
})

// Pre-save middleware to update status if expired
QRCodeSchema.pre('save', function(next) {
  if (this.isExpired && this.status === 'active') {
    this.status = 'expired'
  }
  next()
})

// Static method to get stats
QRCodeSchema.statics.getStats = async function(farmerId) {
  const mongoose = require('mongoose')
  const farmerObjectId = new mongoose.Types.ObjectId(farmerId)

  const stats = await this.aggregate([
    { $match: { farmer: farmerObjectId } },
    {
      $group: {
        _id: null,
        totalCodes: { $sum: 1 },
        activeCodes: { $sum: { $cond: [{ $eq: ['$status', 'active'] }, 1, 0] } },
        expiredCodes: { $sum: { $cond: [{ $eq: ['$status', 'expired'] }, 1, 0] } },
        revokedCodes: { $sum: { $cond: [{ $eq: ['$status', 'revoked'] }, 1, 0] } },
        verifiedCodes: { $sum: { $cond: [{ $eq: ['$status', 'verified'] }, 1, 0] } },
        totalScans: { $sum: '$scanCount' },
        totalDownloads: { $sum: '$downloadCount' }
      }
    }
  ])

  return stats[0] || {
    totalCodes: 0,
    activeCodes: 0,
    expiredCodes: 0,
    revokedCodes: 0,
    verifiedCodes: 0,
    totalScans: 0,
    totalDownloads: 0
  }
}

module.exports = mongoose.model('QRCode', QRCodeSchema)

