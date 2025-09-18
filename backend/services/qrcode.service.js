const QRCode = require('qrcode')
const crypto = require('crypto')
const Harvest = require('../models/harvest.model')
const Listing = require('../models/listing.model')
const Shipment = require('../models/shipment.model')

class QRCodeService {
  constructor() {
    this.secretKey = process.env.QR_SECRET_KEY || 'grochain-qr-secret-2024'
  }

  // Generate QR code for harvest
  async generateHarvestQR(harvestId, harvestData) {
    try {
      const qrData = {
        type: 'harvest',
        id: harvestId,
        batchId: harvestData.batchId,
        cropType: harvestData.cropType,
        farmer: harvestData.farmer,
        location: harvestData.location,
        timestamp: new Date().toISOString(),
        signature: this.generateSignature(harvestId, harvestData.batchId)
      }

      const qrString = JSON.stringify(qrData)
      const qrCodeBuffer = await QRCode.toBuffer(qrString, {
        errorCorrectionLevel: 'H',
        type: 'image/png',
        quality: 0.92,
        margin: 1,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        }
      })

      const qrCodeDataURL = await QRCode.toDataURL(qrString, {
        errorCorrectionLevel: 'H',
        type: 'image/png',
        quality: 0.92,
        margin: 1,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        }
      })

      return {
        qrCodeBuffer,
        qrCodeDataURL,
        qrData: qrString,
        metadata: qrData
      }
    } catch (error) {
      console.error('Error generating harvest QR code:', error)
      throw error
    }
  }

  // Generate QR code for product listing
  async generateListingQR(listingId, listingData) {
    try {
      const qrData = {
        type: 'listing',
        id: listingId,
        cropName: listingData.cropName,
        price: listingData.price,
        quality: listingData.quality,
        farmer: listingData.farmer,
        location: listingData.location,
        timestamp: new Date().toISOString(),
        signature: this.generateSignature(listingId, listingData.cropName)
      }

      const qrString = JSON.stringify(qrData)
      const qrCodeBuffer = await QRCode.toBuffer(qrString, {
        errorCorrectionLevel: 'H',
        type: 'image/png',
        quality: 0.92,
        margin: 1,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        }
      })

      const qrCodeDataURL = await QRCode.toDataURL(qrString, {
        errorCorrectionLevel: 'H',
        type: 'image/png',
        quality: 0.92,
        margin: 1,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        }
      })

      return {
        qrCodeBuffer,
        qrCodeDataURL,
        qrData: qrString,
        metadata: qrData
      }
    } catch (error) {
      console.error('Error generating listing QR code:', error)
      throw error
    }
  }

  // Generate QR code for shipment
  async generateShipmentQR(shipmentId, shipmentData) {
    try {
      const qrData = {
        type: 'shipment',
        id: shipmentId,
        shipmentNumber: shipmentData.shipmentNumber,
        trackingNumber: shipmentData.trackingNumber,
        origin: shipmentData.origin.city,
        destination: shipmentData.destination.city,
        status: shipmentData.status,
        timestamp: new Date().toISOString(),
        signature: this.generateSignature(shipmentId, shipmentData.shipmentNumber)
      }

      const qrString = JSON.stringify(qrData)
      const qrCodeBuffer = await QRCode.toBuffer(qrString, {
        errorCorrectionLevel: 'H',
        type: 'image/png',
        quality: 0.92,
        margin: 1,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        }
      })

      const qrCodeDataURL = await QRCode.toDataURL(qrString, {
        errorCorrectionLevel: 'H',
        type: 'image/png',
        quality: 0.92,
        margin: 1,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        }
      })

      return {
        qrCodeBuffer,
        qrCodeDataURL,
        qrData: qrString,
        metadata: qrData
      }
    } catch (error) {
      console.error('Error generating shipment QR code:', error)
      throw error
    }
  }

  // Generate QR code for user profile
  async generateUserQR(userId, userData) {
    try {
      const qrData = {
        type: 'user',
        id: userId,
        name: userData.name,
        role: userData.role,
        location: userData.location,
        verified: userData.emailVerified,
        timestamp: new Date().toISOString(),
        signature: this.generateSignature(userId, userData.email)
      }

      const qrString = JSON.stringify(qrData)
      const qrCodeBuffer = await QRCode.toBuffer(qrString, {
        errorCorrectionLevel: 'H',
        type: 'image/png',
        quality: 0.92,
        margin: 1,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        }
      })

      const qrCodeDataURL = await QRCode.toDataURL(qrString, {
        errorCorrectionLevel: 'H',
        type: 'image/png',
        quality: 0.92,
        margin: 1,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        }
      })

      return {
        qrCodeBuffer,
        qrCodeDataURL,
        qrData: qrString,
        metadata: qrData
      }
    } catch (error) {
      console.error('Error generating user QR code:', error)
      throw error
    }
  }

  // Generate QR code for payment
  async generatePaymentQR(paymentId, paymentData) {
    try {
      const qrData = {
        type: 'payment',
        id: paymentId,
        amount: paymentData.amount,
        currency: paymentData.currency,
        reference: paymentData.reference,
        status: paymentData.status,
        timestamp: new Date().toISOString(),
        signature: this.generateSignature(paymentId, paymentData.reference)
      }

      const qrString = JSON.stringify(qrData)
      const qrCodeBuffer = await QRCode.toBuffer(qrString, {
        errorCorrectionLevel: 'H',
        type: 'image/png',
        quality: 0.92,
        margin: 1,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        }
      })

      const qrCodeDataURL = await QRCode.toDataURL(qrString, {
        errorCorrectionLevel: 'H',
        type: 'image/png',
        quality: 0.92,
        margin: 1,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        }
      })

      return {
        qrCodeBuffer,
        qrCodeDataURL,
        qrData: qrString,
        metadata: qrData
      }
    } catch (error) {
      console.error('Error generating payment QR code:', error)
      throw error
    }
  }

  // Validate QR code
  async validateQRCode(qrDataString) {
    try {
      const qrData = JSON.parse(qrDataString)
      
      // Check if signature is valid
      if (!this.verifySignature(qrData.id, qrData.signature, qrData)) {
        return {
          valid: false,
          error: 'Invalid signature'
        }
      }

      // Check if QR code is not expired (24 hours)
      const qrTimestamp = new Date(qrData.timestamp)
      const now = new Date()
      const hoursDiff = (now - qrTimestamp) / (1000 * 60 * 60)
      
      if (hoursDiff > 24) {
        return {
          valid: false,
          error: 'QR code expired'
        }
      }

      // Get additional data based on type
      let additionalData = null
      
      switch (qrData.type) {
        case 'harvest':
          additionalData = await Harvest.findById(qrData.id)
            .populate('farmer', 'name email phone')
            .select('cropType quantity quality status location images')
          break
          
        case 'listing':
          additionalData = await Listing.findById(qrData.id)
            .populate('farmer', 'name email phone')
            .select('cropName price quantity quality status location images')
          break
          
        case 'shipment':
          additionalData = await Shipment.findById(qrData.id)
            .populate('buyer seller', 'name email phone')
            .select('shipmentNumber trackingNumber status origin destination')
          break
          
        case 'user':
          additionalData = await require('../models/user.model').findById(qrData.id)
            .select('name email role location emailVerified phoneVerified')
          break
          
        case 'payment':
          additionalData = await require('../models/transaction.model').findById(qrData.id)
            .select('amount currency reference status')
          break
      }

      return {
        valid: true,
        qrData,
        additionalData
      }
    } catch (error) {
      console.error('Error validating QR code:', error)
      return {
        valid: false,
        error: 'Invalid QR code format'
      }
    }
  }

  // Generate signature for QR code
  generateSignature(id, additionalData) {
    const data = `${id}-${additionalData}-${this.secretKey}`
    return crypto.createHash('sha256').update(data).digest('hex').substring(0, 16)
  }

  // Verify signature
  verifySignature(id, signature, qrData) {
    let additionalData = ''
    
    switch (qrData.type) {
      case 'harvest':
        additionalData = qrData.batchId
        break
      case 'listing':
        additionalData = qrData.cropName
        break
      case 'shipment':
        additionalData = qrData.shipmentNumber
        break
      case 'user':
        additionalData = qrData.email
        break
      case 'payment':
        additionalData = qrData.reference
        break
    }
    
    const expectedSignature = this.generateSignature(id, additionalData)
    return signature === expectedSignature
  }

  // Generate bulk QR codes
  async generateBulkQRCodes(items, type) {
    try {
      const qrCodes = []
      
      for (const item of items) {
        let qrCode = null
        
        switch (type) {
          case 'harvest':
            qrCode = await this.generateHarvestQR(item._id, item)
            break
          case 'listing':
            qrCode = await this.generateListingQR(item._id, item)
            break
          case 'shipment':
            qrCode = await this.generateShipmentQR(item._id, item)
            break
          case 'user':
            qrCode = await this.generateUserQR(item._id, item)
            break
          case 'payment':
            qrCode = await this.generatePaymentQR(item._id, item)
            break
        }
        
        if (qrCode) {
          qrCodes.push({
            itemId: item._id,
            qrCode: qrCode
          })
        }
      }
      
      return qrCodes
    } catch (error) {
      console.error('Error generating bulk QR codes:', error)
      throw error
    }
  }

  // Generate QR code with custom styling
  async generateCustomQR(data, options = {}) {
    try {
      const defaultOptions = {
        errorCorrectionLevel: 'H',
        type: 'image/png',
        quality: 0.92,
        margin: 1,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        },
        width: 256,
        height: 256
      }

      const finalOptions = { ...defaultOptions, ...options }
      
      const qrString = typeof data === 'string' ? data : JSON.stringify(data)
      const qrCodeBuffer = await QRCode.toBuffer(qrString, finalOptions)
      const qrCodeDataURL = await QRCode.toDataURL(qrString, finalOptions)

      return {
        qrCodeBuffer,
        qrCodeDataURL,
        qrData: qrString
      }
    } catch (error) {
      console.error('Error generating custom QR code:', error)
      throw error
    }
  }

  // Generate QR code for tracking URL
  async generateTrackingQR(trackingUrl) {
    try {
      const qrData = {
        type: 'tracking',
        url: trackingUrl,
        timestamp: new Date().toISOString(),
        signature: this.generateSignature(trackingUrl, 'tracking')
      }

      const qrString = JSON.stringify(qrData)
      const qrCodeBuffer = await QRCode.toBuffer(qrString, {
        errorCorrectionLevel: 'H',
        type: 'image/png',
        quality: 0.92,
        margin: 1,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        }
      })

      const qrCodeDataURL = await QRCode.toDataURL(qrString, {
        errorCorrectionLevel: 'H',
        type: 'image/png',
        quality: 0.92,
        margin: 1,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        }
      })

      return {
        qrCodeBuffer,
        qrCodeDataURL,
        qrData: qrString,
        metadata: qrData
      }
    } catch (error) {
      console.error('Error generating tracking QR code:', error)
      throw error
    }
  }

  // Get QR code statistics
  async getQRCodeStats() {
    try {
      const [harvestCount, listingCount, shipmentCount, userCount, paymentCount] = await Promise.all([
        Harvest.countDocuments({ qrData: { $exists: true, $ne: '' } }),
        Listing.countDocuments({ qrData: { $exists: true, $ne: '' } }),
        Shipment.countDocuments({ qrData: { $exists: true, $ne: '' } }),
        require('../models/user.model').countDocuments({ qrData: { $exists: true, $ne: '' } }),
        require('../models/transaction.model').countDocuments({ qrData: { $exists: true, $ne: '' } })
      ])

      return {
        total: harvestCount + listingCount + shipmentCount + userCount + paymentCount,
        byType: {
          harvest: harvestCount,
          listing: listingCount,
          shipment: shipmentCount,
          user: userCount,
          payment: paymentCount
        }
      }
    } catch (error) {
      console.error('Error getting QR code stats:', error)
      throw error
    }
  }
}

module.exports = new QRCodeService()
