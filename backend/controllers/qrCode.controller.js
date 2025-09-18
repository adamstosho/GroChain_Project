const QRCodeLib = require('qrcode')
const QRCodeModel = require('../models/qrcode.model')
const Harvest = require('../models/harvest.model')
const User = require('../models/user.model')

const qrCodeController = {
  // Get user's QR codes with detailed information
  async getUserQRCodes(req, res) {
    try {
      const userId = req.user.id
      const { page = 1, limit = 50, status, cropType, search } = req.query

      let query = { farmer: userId }

      // Apply filters
      if (status && status !== 'all') {
        query.status = status
      }

      if (cropType && cropType !== 'all') {
        query['metadata.cropType'] = cropType
      }

      if (search) {
        query.$or = [
          { code: new RegExp(search, 'i') },
          { batchId: new RegExp(search, 'i') },
          { 'metadata.cropType': new RegExp(search, 'i') }
        ]
      }

      const qrCodes = await QRCodeModel.find(query)
        .populate('harvest', 'cropType quantity status')
        .sort({ createdAt: -1 })
        .limit(limit * 1)
        .skip((page - 1) * limit)

      const total = await QRCodeModel.countDocuments(query)

      const formattedQRCodes = qrCodes.map(qr => ({
        id: qr._id,
        code: qr.code,
        batchId: qr.batchId,
        harvestId: qr.harvest,
        cropType: qr.metadata.cropType,
        quantity: qr.metadata.quantity,
        quality: qr.metadata.quality,
        harvestDate: qr.metadata.harvestDate,
        location: qr.metadata.location?.city || 'Unknown',
        status: qr.status,
        createdAt: qr.createdAt,
        lastScanned: qr.lastScanned,
        scanCount: qr.scanCount,
        downloadCount: qr.downloadCount,
        metadata: {
          farmerId: qr.farmer,
          farmName: qr.metadata.location?.farmName || 'Unknown Farm',
          coordinates: qr.metadata.location?.coordinates || { lat: 0, lng: 0 },
          batchNumber: qr.batchId,
          location: {
            city: qr.metadata.location?.city || 'Unknown',
            state: qr.metadata.location?.state || 'Unknown State',
            farmName: qr.metadata.location?.farmName || 'Unknown Farm'
          }
        }
      }))

      res.json({
        status: 'success',
        data: formattedQRCodes,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit)
        }
      })
    } catch (error) {
      console.error('Error getting user QR codes:', error)
      res.status(500).json({
        status: 'error',
        message: 'Failed to get QR codes'
      })
    }
  },

  // Generate new QR code for existing harvest
  async generateNewQRCode(req, res) {
    try {
      const userId = req.user.id
      const { harvestId, customData } = req.body

      if (!harvestId) {
        return res.status(400).json({
          status: 'error',
          message: 'Harvest ID is required'
        })
      }

      // Find the harvest - accept both approved and listed harvests
      const harvest = await Harvest.findOne({
        _id: harvestId,
        farmer: userId,
        $or: [
          { status: 'approved' },
          { status: 'listed' }
        ]
      })

      if (!harvest) {
        return res.status(404).json({
          status: 'error',
          message: 'Harvest not found'
        })
      }

      // Check if QR code already exists for this harvest
      const existingQR = await QRCodeModel.findOne({ harvest: harvestId })
      if (existingQR) {
        return res.status(400).json({
          status: 'error',
          message: 'QR code already exists for this harvest'
        })
      }

      // Generate unique code
      const timestamp = Date.now()
      const randomString = Math.random().toString(36).substring(2, 8).toUpperCase()
      const qrCodeString = `QR-${harvest.batchId}-${randomString}`

      // Generate QR code data
      const qrData = {
        batchId: harvest.batchId,
        cropType: harvest.cropType,
        farmerId: harvest.farmer.toString(),
        harvestDate: harvest.harvestDate,
        verificationUrl: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/verify/${harvest.batchId}`,
        timestamp,
        ...customData
      }

      // Generate QR code image
      const qrImage = await QRCodeLib.toDataURL(JSON.stringify(qrData))

      // Create QR code record
      // Parse location string - handle various formats
      let city = 'Unknown City'
      let state = 'Unknown State'

      if (harvest.location && typeof harvest.location === 'string') {
        const locationStr = harvest.location.trim()

        // Check if it contains comma (format: "City, State")
        if (locationStr.includes(',')) {
          const parts = locationStr.split(',')
          if (parts.length >= 2) {
            city = parts[0].trim()
            state = parts[1].trim()
          } else {
            city = locationStr
          }
        } else {
          // Handle single location strings like "Lagos", "Abuja", etc.
          city = locationStr
          state = 'Nigeria' // Default state for Nigerian cities
        }
      } else if (harvest.location && typeof harvest.location === 'object') {
        city = harvest.location.city || 'Unknown City'
        state = harvest.location.state || 'Unknown State'
      }

      const qrCodeRecord = new QRCodeModel({
        harvest: harvestId,
        farmer: userId,
        code: qrCodeString,
        batchId: harvest.batchId,
        qrImage,
        qrData,
        metadata: {
          cropType: harvest.cropType,
          quantity: harvest.quantity,
          quality: harvest.qualityGrade || 'Standard',
          harvestDate: harvest.date || harvest.harvestDate, // Use harvest.date field
          location: {
            farmName: city + ' Farm',
            city: city,
            state: state,
            coordinates: harvest.location?.coordinates || { lat: 0, lng: 0 }
          }
        }
      })

      await qrCodeRecord.save()

      // Update harvest with QR code reference
      harvest.qrCode = qrImage
      harvest.qrCodeData = qrData
      await harvest.save()

      res.json({
        status: 'success',
        data: {
          id: qrCodeRecord._id,
          code: qrCodeString,
          qrImage,
          qrData,
          message: 'QR code generated successfully'
        }
      })
    } catch (error) {
      console.error('Error generating QR code:', error)
      res.status(500).json({
        status: 'error',
        message: 'Failed to generate QR code'
      })
    }
  },

  // Get comprehensive QR code statistics
  async getQRCodeStats(req, res) {
    try {
      const userId = req.user.id

      const stats = await QRCodeModel.getStats(userId)

      // Get monthly trend data
      const mongoose = require('mongoose')
      const farmerObjectId = new mongoose.Types.ObjectId(userId)

      const monthlyTrend = await QRCodeModel.aggregate([
        { $match: { farmer: farmerObjectId } },
        {
          $group: {
            _id: {
              year: { $year: '$createdAt' },
              month: { $month: '$createdAt' }
            },
            generated: { $sum: 1 },
            scanned: { $sum: '$scanCount' },
            verified: {
              $sum: {
                $cond: [{ $eq: ['$status', 'verified'] }, 1, 0]
              }
            }
          }
        },
        { $sort: { '_id.year': -1, '_id.month': -1 } },
        { $limit: 12 }
      ])

      // Get recent activity
      const recentActivity = await QRCodeModel.find({ farmer: farmerObjectId })
        .sort({ updatedAt: -1 })
        .limit(5)
        .select('code batchId metadata.cropType status updatedAt')

      // Calculate monthly growth
      const lastMonthStats = await QRCodeModel.aggregate([
        {
          $match: {
            farmer: farmerObjectId,
            createdAt: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) }
          }
        },
        {
          $group: {
            _id: null,
            count: { $sum: 1 }
          }
        }
      ])

      const monthlyGrowth = lastMonthStats[0]?.count || 0

      const formattedStats = {
        totalCodes: stats.totalCodes,
        activeCodes: stats.activeCodes,
        verifiedCodes: stats.verifiedCodes,
        revokedCodes: stats.revokedCodes,
        expiredCodes: stats.expiredCodes,
        totalScans: stats.totalScans,
        totalDownloads: stats.totalDownloads,
        monthlyGrowth,
        monthlyTrend: monthlyTrend.map(item => ({
          month: `${item._id.year}-${String(item._id.month).padStart(2, '0')}`,
          generated: item.generated,
          scanned: item.scanned,
          verified: item.verified
        })),
        recentActivity: recentActivity.map(activity => ({
          code: activity.code,
          batchId: activity.batchId,
          cropType: activity.metadata.cropType,
          status: activity.status,
          updatedAt: activity.updatedAt
        })),
        lastUpdated: new Date()
      }

      res.json({
        status: 'success',
        data: formattedStats
      })
    } catch (error) {
      console.error('Error getting QR code stats:', error)
      res.status(500).json({
        status: 'error',
        message: 'Failed to get QR code statistics'
      })
    }
  },

  // Get specific QR code details with scan history
  async getQRCodeById(req, res) {
    try {
      const userId = req.user.id
      const { id } = req.params

      const qrCode = await QRCodeModel.findOne({
        _id: id,
        farmer: userId
      }).populate('harvest', 'cropType quantity status location')

      if (!qrCode) {
        return res.status(404).json({
          status: 'error',
          message: 'QR code not found'
        })
      }

      res.json({
        status: 'success',
        data: {
          id: qrCode._id,
          code: qrCode.code,
          batchId: qrCode.batchId,
          harvestId: qrCode.harvest,
          cropType: qrCode.metadata.cropType,
          quantity: qrCode.metadata.quantity,
          quality: qrCode.metadata.quality,
          harvestDate: qrCode.metadata.harvestDate,
          location: qrCode.metadata.location.city,
          status: qrCode.status,
          qrImage: qrCode.qrImage,
          qrData: qrCode.qrData,
          createdAt: qrCode.createdAt,
          lastScanned: qrCode.lastScanned,
          scanCount: qrCode.scanCount,
          downloadCount: qrCode.downloadCount,
          scans: qrCode.scans,
          metadata: {
            farmerId: qrCode.farmer,
            farmName: qrCode.metadata.location.farmName,
            coordinates: qrCode.metadata.location.coordinates,
            batchNumber: qrCode.batchId
          }
        }
      })
    } catch (error) {
      console.error('Error getting QR code by ID:', error)
      res.status(500).json({
        status: 'error',
        message: 'Failed to get QR code'
      })
    }
  },

  // Download QR code
  async downloadQRCode(req, res) {
    try {
      const userId = req.user.id
      const { id } = req.params

      const qrCode = await QRCodeModel.findOne({
        _id: id,
        farmer: userId
      })

      if (!qrCode) {
        return res.status(404).json({
          status: 'error',
          message: 'QR code not found'
        })
      }

      // Increment download count
      qrCode.downloadCount += 1
      qrCode.lastDownloaded = new Date()
      await qrCode.save()

      // Convert data URL to buffer for download
      const base64Data = qrCode.qrImage.split(',')[1]
      const buffer = Buffer.from(base64Data, 'base64')

      res.setHeader('Content-Type', 'image/png')
      res.setHeader('Content-Disposition', `attachment; filename="${qrCode.code}.png"`)
      res.send(buffer)
    } catch (error) {
      console.error('Error downloading QR code:', error)
      res.status(500).json({
        status: 'error',
        message: 'Failed to download QR code'
      })
    }
  },

  // Revoke QR code
  async revokeQRCode(req, res) {
    try {
      const userId = req.user.id
      const { id } = req.params

      const qrCode = await QRCodeModel.findOne({
        _id: id,
        farmer: userId
      })

      if (!qrCode) {
        return res.status(404).json({
          status: 'error',
          message: 'QR code not found'
        })
      }

      if (qrCode.status !== 'active') {
        return res.status(400).json({
          status: 'error',
          message: 'QR code is not active'
        })
      }

      qrCode.status = 'revoked'
      await qrCode.save()

      res.json({
        status: 'success',
        message: 'QR code revoked successfully'
      })
    } catch (error) {
      console.error('Error revoking QR code:', error)
      res.status(500).json({
        status: 'error',
        message: 'Failed to revoke QR code'
      })
    }
  },

  // Record QR code scan
  async recordQRScan(req, res) {
    try {
      const { qrCodeId, scanData } = req.body

      const qrCode = await QRCodeModel.findById(qrCodeId)
      if (!qrCode) {
        return res.status(404).json({
          status: 'error',
          message: 'QR code not found'
        })
      }

      // Add scan record
      qrCode.scans.push({
        scannedAt: new Date(),
        scannedBy: {
          userId: req.user?.id,
          userType: req.user?.role || 'anonymous',
          name: scanData?.name || 'Unknown',
          location: scanData?.location || 'Unknown'
        },
        verificationResult: scanData?.verificationResult || 'success',
        deviceInfo: {
          userAgent: req.get('User-Agent'),
          ipAddress: req.ip,
          coordinates: scanData?.coordinates
        },
        notes: scanData?.notes
      })

      qrCode.scanCount += 1
      qrCode.lastScanned = new Date()
      await qrCode.save()

      res.json({
        status: 'success',
        message: 'Scan recorded successfully'
      })
    } catch (error) {
      console.error('Error recording QR scan:', error)
      res.status(500).json({
        status: 'error',
        message: 'Failed to record scan'
      })
    }
  },

  // Delete QR code
  async deleteQRCode(req, res) {
    try {
      const userId = req.user.id
      const { id } = req.params

      const qrCode = await QRCodeModel.findOne({
        _id: id,
        farmer: userId
      })

      if (!qrCode) {
        return res.status(404).json({
          status: 'error',
          message: 'QR code not found'
        })
      }

      // Delete the QR code record
      await QRCodeModel.findByIdAndDelete(id)

      // Also remove QR code reference from harvest
      await Harvest.findByIdAndUpdate(qrCode.harvest, {
        $unset: { qrCode: 1, qrCodeData: 1 }
      })

      res.json({
        status: 'success',
        message: 'QR code deleted successfully'
      })
    } catch (error) {
      console.error('Error deleting QR code:', error)
      res.status(500).json({
        status: 'error',
        message: 'Failed to delete QR code'
      })
    }
  }
}

module.exports = qrCodeController

