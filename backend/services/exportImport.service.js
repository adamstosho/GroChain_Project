const fs = require('fs').promises
const path = require('path')
const csv = require('csv-parser')
const createCsvWriter = require('csv-writer').createObjectCsvWriter
const ExcelJS = require('exceljs')
const Harvest = require('../models/harvest.model')
const Listing = require('../models/listing.model')
const User = require('../models/user.model')
const Partner = require('../models/partner.model')
const Shipment = require('../models/shipment.model')
const Transaction = require('../models/transaction.model')
const Payment = require('../models/payment.model')
const Analytics = require('../models/analytics.model')

class ExportImportService {
  constructor() {
    this.exportDir = path.join(__dirname, '../exports')
    this.importDir = path.join(__dirname, '../imports')
    this.supportedFormats = ['csv', 'excel', 'json']
    this.maxExportSize = 100000 // Maximum records per export
    
    this.initDirectories()
  }

  // Initialize export and import directories
  async initDirectories() {
    try {
      await fs.mkdir(this.exportDir, { recursive: true })
      await fs.mkdir(this.importDir, { recursive: true })
    } catch (error) {
      console.error('Error creating directories:', error)
    }
  }

  // Export data with multiple format support
  async exportData(data, options = {}) {
    try {
      const {
        format = 'csv',
        filename = null,
        includeHeaders = true,
        customFields = null,
        filters = {}
      } = options

      if (!this.supportedFormats.includes(format)) {
        throw new Error(`Unsupported format: ${format}`)
      }

      let exportData = data
      
      // Apply custom field filtering
      if (customFields && Array.isArray(customFields)) {
        exportData = this.filterCustomFields(data, customFields)
      }

      // Apply additional filters
      if (filters && Object.keys(filters).length > 0) {
        exportData = this.applyDataFilters(exportData, filters)
      }

      // Generate filename if not provided
      const finalFilename = filename || this.generateFilename(format)

      let result
      switch (format) {
        case 'csv':
          result = await this.exportToCSV(exportData, finalFilename, includeHeaders)
          break
        case 'excel':
          result = await this.exportToExcel(exportData, finalFilename, includeHeaders)
          break
        case 'json':
          result = await this.exportToJSON(exportData, finalFilename)
          break
        default:
          throw new Error(`Format ${format} not implemented`)
      }

      return {
        success: true,
        filename: finalFilename,
        format,
        recordCount: exportData.length,
        filePath: result.filePath,
        fileSize: result.fileSize
      }
    } catch (error) {
      console.error('Export data error:', error)
      throw error
    }
  }

  // Export harvests
  async exportHarvests(filters = {}, format = 'csv', options = {}) {
    try {
      const query = this.buildHarvestQuery(filters)
      const harvests = await Harvest.find(query)
        .populate('farmer', 'name email phone location')
        .lean()

      const exportData = harvests.map(harvest => ({
        id: harvest._id,
        batchId: harvest.batchId,
        cropType: harvest.cropType,
        quantity: harvest.quantity,
        unit: harvest.unit,
        quality: harvest.quality,
        status: harvest.status,
        location: harvest.location?.city,
        state: harvest.location?.state,
        farmerName: harvest.farmer?.name,
        farmerEmail: harvest.farmer?.email,
        farmerPhone: harvest.farmer?.phone,
        date: harvest.date,
        organic: harvest.sustainability?.organicCertified,
        fairTrade: harvest.sustainability?.fairTrade,
        description: harvest.description,
        createdAt: harvest.createdAt,
        updatedAt: harvest.updatedAt
      }))

      return await this.exportData(exportData, { format, ...options })
    } catch (error) {
      console.error('Export harvests error:', error)
      throw error
    }
  }

  // Export listings
  async exportListings(filters = {}, format = 'csv', options = {}) {
    try {
      const query = this.buildListingQuery(filters)
      const listings = await Listing.find(query)
        .populate('farmer', 'name email phone location')
        .populate('harvest', 'cropType quality')
        .lean()

      const exportData = listings.map(listing => ({
        id: listing._id,
        cropName: listing.cropName,
        price: listing.price,
        currency: listing.currency,
        quantity: listing.quantity,
        unit: listing.unit,
        quality: listing.quality,
        status: listing.status,
        location: listing.location?.city,
        state: listing.location?.state,
        farmerName: listing.farmer?.name,
        farmerEmail: listing.farmer?.email,
        farmerPhone: listing.farmer?.phone,
        description: listing.description,
        minimumOrder: listing.minimumOrder,
        createdAt: listing.createdAt,
        updatedAt: listing.updatedAt
      }))

      return await this.exportData(exportData, { format, ...options })
    } catch (error) {
      console.error('Export listings error:', error)
      throw error
    }
  }

  // Export users
  async exportUsers(filters = {}, format = 'csv', options = {}) {
    try {
      const query = this.buildUserQuery(filters)
      const users = await User.find(query)
        .select('-password -pin')
        .lean()

      const exportData = users.map(user => ({
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        location: user.location?.city,
        state: user.location?.state,
        emailVerified: user.emailVerified,
        phoneVerified: user.phoneVerified,
        status: user.status,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt
      }))

      return await this.exportData(exportData, { format, ...options })
    } catch (error) {
      console.error('Export users error:', error)
      throw error
    }
  }

  // Export partners
  async exportPartners(filters = {}, format = 'csv', options = {}) {
    try {
      const query = this.buildPartnerQuery(filters)
      const partners = await Partner.find(query)
        .populate('contactPerson', 'name email phone')
        .lean()

      const exportData = partners.map(partner => ({
        id: partner._id,
        name: partner.name,
        type: partner.type,
        services: partner.services?.join(', '),
        location: partner.location?.city,
        state: partner.location?.state,
        contactName: partner.contactPerson?.name,
        contactEmail: partner.contactPerson?.email,
        contactPhone: partner.contactPerson?.phone,
        certifications: partner.certifications?.join(', '),
        status: partner.status,
        createdAt: partner.createdAt,
        updatedAt: partner.updatedAt
      }))

      return await this.exportData(exportData, { format, ...options })
    } catch (error) {
      console.error('Export partners error:', error)
      throw error
    }
  }

  // Export shipments
  async exportShipments(filters = {}, format = 'csv', options = {}) {
    try {
      const query = this.buildShipmentQuery(filters)
      const shipments = await Shipment.find(query)
        .populate('buyer', 'name email phone')
        .populate('seller', 'name email phone')
        .lean()

      const exportData = shipments.map(shipment => ({
        id: shipment._id,
        shipmentNumber: shipment.shipmentNumber,
        trackingNumber: shipment.trackingNumber,
        status: shipment.status,
        origin: shipment.origin?.city,
        destination: shipment.destination?.city,
        buyerName: shipment.buyer?.name,
        buyerEmail: shipment.buyer?.email,
        sellerName: shipment.seller?.name,
        sellerEmail: shipment.seller?.email,
        carrier: shipment.carrier,
        shippingMethod: shipment.shippingMethod,
        estimatedDelivery: shipment.estimatedDelivery,
        createdAt: shipment.createdAt,
        updatedAt: shipment.updatedAt
      }))

      return await this.exportData(exportData, { format, ...options })
    } catch (error) {
      console.error('Export shipments error:', error)
      throw error
    }
  }

  // Export transactions
  async exportTransactions(filters = {}, format = 'csv', options = {}) {
    try {
      const query = this.buildTransactionQuery(filters)
      const transactions = await Transaction.find(query)
        .populate('sender', 'name email')
        .populate('recipient', 'name email')
        .lean()

      const exportData = transactions.map(transaction => ({
        id: transaction._id,
        type: transaction.type,
        amount: transaction.amount,
        currency: transaction.currency,
        status: transaction.status,
        senderName: transaction.sender?.name,
        senderEmail: transaction.sender?.email,
        recipientName: transaction.recipient?.name,
        recipientEmail: transaction.recipient?.email,
        provider: transaction.provider,
        reference: transaction.reference,
        createdAt: transaction.createdAt,
        updatedAt: transaction.updatedAt
      }))

      return await this.exportData(exportData, { format, ...options })
    } catch (error) {
      console.error('Export transactions error:', error)
      throw error
    }
  }

  // Export analytics data
  async exportAnalytics(filters = {}, format = 'csv', options = {}) {
    try {
      const query = this.buildAnalyticsQuery(filters)
      const analytics = await Analytics.find(query).lean()

      const exportData = analytics.map(analytics => ({
        id: analytics._id,
        type: analytics.type,
        period: analytics.period,
        date: analytics.date,
        totalUsers: analytics.metrics?.totalUsers,
        totalHarvests: analytics.metrics?.totalHarvests,
        totalListings: analytics.metrics?.totalListings,
        totalOrders: analytics.metrics?.totalOrders,
        totalRevenue: analytics.metrics?.totalRevenue,
        createdAt: analytics.createdAt,
        updatedAt: analytics.updatedAt
      }))

      return await this.exportData(exportData, { format, ...options })
    } catch (error) {
      console.error('Export analytics error:', error)
      throw error
    }
  }

  // Export buyer-specific data
  async exportBuyerData(userId, filters = {}, format = 'csv', options = {}) {
    try {
      const Order = require('../models/order.model')
      const Payment = require('../models/payment.model')
      
      // Get buyer's orders
      const orders = await Order.find({ buyer: userId })
        .populate('items.listing', 'cropName price')
        .sort({ createdAt: -1 })
        .lean()

      // Get buyer's payments
      const payments = await Payment.find({ userId })
        .sort({ createdAt: -1 })
        .lean()

      // Create flat array for CSV export
      const exportData = []
      
      // Add orders data
      orders.forEach(order => {
        exportData.push({
          type: 'order',
          id: order._id,
          orderNumber: order.orderNumber,
          status: order.status,
          paymentStatus: order.paymentStatus,
          totalAmount: order.total,
          itemCount: order.items.length,
          createdAt: order.createdAt,
          // Flatten items for better CSV structure
          items: order.items.map(item => ({
            cropName: item.listing?.cropName || 'Unknown',
            quantity: item.quantity,
            price: item.price,
            total: item.total
          }))
        })
      })

      // Add payments data
      payments.forEach(payment => {
        exportData.push({
          type: 'payment',
          id: payment._id,
          amount: payment.amount,
          currency: payment.currency,
          status: payment.status,
          method: payment.paymentMethod,
          reference: payment.reference,
          createdAt: payment.createdAt
        })
      })

      // Add summary data
      const totalOrders = orders.length
      const totalSpent = orders.reduce((sum, order) => sum + (order.total || 0), 0)
      const totalPayments = payments.length
      const averageOrderValue = totalOrders > 0 ? totalSpent / totalOrders : 0

      exportData.push({
        type: 'summary',
        totalOrders,
        totalSpent,
        totalPayments,
        averageOrderValue,
        generatedAt: new Date().toISOString()
      })

      return await this.exportData(exportData, { format, ...options })
    } catch (error) {
      console.error('Export buyer data error:', error)
      throw error
    }
  }

  // Export farmer-specific data
  async exportFarmerData(userId, filters = {}, format = 'csv', options = {}) {
    try {
      const Harvest = require('../models/harvest.model')
      const Listing = require('../models/listing.model')
      
      // Get farmer's harvests
      const harvests = await Harvest.find({ farmer: userId })
        .sort({ createdAt: -1 })
        .lean()

      // Get farmer's listings
      const listings = await Listing.find({ farmer: userId })
        .sort({ createdAt: -1 })
        .lean()

      // Create flat array for CSV export
      const exportData = []
      
      // Add harvests data
      harvests.forEach(harvest => {
        exportData.push({
          type: 'harvest',
          id: harvest._id,
          cropType: harvest.cropType,
          quantity: harvest.quantity,
          unit: harvest.unit,
          quality: harvest.quality,
          status: harvest.status,
          location: harvest.location,
          createdAt: harvest.createdAt
        })
      })

      // Add listings data
      listings.forEach(listing => {
        exportData.push({
          type: 'listing',
          id: listing._id,
          cropName: listing.cropName,
          price: listing.price,
          quantity: listing.quantity,
          unit: listing.unit,
          status: listing.status,
          createdAt: listing.createdAt
        })
      })

      // Add summary data
      const totalHarvests = harvests.length
      const totalListings = listings.length
      const totalRevenue = listings.reduce((sum, listing) => sum + (listing.price || 0), 0)

      exportData.push({
        type: 'summary',
        totalHarvests,
        totalListings,
        totalRevenue,
        generatedAt: new Date().toISOString()
      })

      return await this.exportData(exportData, { format, ...options })
    } catch (error) {
      console.error('Export farmer data error:', error)
      throw error
    }
  }

  // Export partner-specific data
  async exportPartnerData(userId, filters = {}, format = 'csv', options = {}) {
    try {
      const User = require('../models/user.model')
      const Commission = require('../models/commission.model')
      
      // Get partner's farmers
      const farmers = await User.find({ partner: userId })
        .select('name email phone location createdAt')
        .lean()

      // Get partner's commissions
      const commissions = await Commission.find({ partner: userId })
        .populate('order', 'orderNumber total')
        .sort({ createdAt: -1 })
        .lean()

      // Create flat array for CSV export
      const exportData = []
      
      // Add farmers data
      farmers.forEach(farmer => {
        exportData.push({
          type: 'farmer',
          id: farmer._id,
          name: farmer.name,
          email: farmer.email,
          phone: farmer.phone,
          location: farmer.location,
          joinedDate: farmer.createdAt
        })
      })

      // Add commissions data
      commissions.forEach(commission => {
        exportData.push({
          type: 'commission',
          id: commission._id,
          amount: commission.amount,
          status: commission.status,
          orderNumber: commission.order?.orderNumber,
          orderTotal: commission.order?.total,
          createdAt: commission.createdAt
        })
      })

      // Add summary data
      const totalFarmers = farmers.length
      const totalCommissions = commissions.length
      const totalEarned = commissions.reduce((sum, commission) => sum + (commission.amount || 0), 0)

      exportData.push({
        type: 'summary',
        totalFarmers,
        totalCommissions,
        totalEarned,
        generatedAt: new Date().toISOString()
      })

      return await this.exportData(exportData, { format, ...options })
    } catch (error) {
      console.error('Export partner data error:', error)
      throw error
    }
  }

  // Export to CSV format
  async exportToCSV(data, filename, includeHeaders = true) {
    try {
      if (!data || data.length === 0) {
        throw new Error('No data to export')
      }

      const filePath = path.join(this.exportDir, filename)
      
      // Flatten complex objects for CSV export
      const flattenedData = data.map(item => this.flattenObject(item))
      const headers = Object.keys(flattenedData[0])

      const csvWriter = createCsvWriter({
        path: filePath,
        header: headers.map(header => ({
          id: header,
          title: header.charAt(0).toUpperCase() + header.slice(1)
        }))
      })

      await csvWriter.writeRecords(flattenedData)

      const stats = await fs.stat(filePath)
      return {
        filePath,
        fileSize: stats.size
      }
    } catch (error) {
      console.error('CSV export error:', error)
      throw error
    }
  }

  // Helper method to flatten objects for CSV export
  flattenObject(obj, prefix = '') {
    const flattened = {}
    
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        const newKey = prefix ? `${prefix}_${key}` : key
        
        if (obj[key] !== null && typeof obj[key] === 'object' && !Array.isArray(obj[key])) {
          // Recursively flatten nested objects
          Object.assign(flattened, this.flattenObject(obj[key], newKey))
        } else if (Array.isArray(obj[key])) {
          // Convert arrays to JSON strings for CSV
          flattened[newKey] = JSON.stringify(obj[key])
        } else {
          // Keep primitive values as is
          flattened[newKey] = obj[key]
        }
      }
    }
    
    return flattened
  }

  // Export to Excel format
  async exportToExcel(data, filename, includeHeaders = true) {
    try {
      if (!data || data.length === 0) {
        throw new Error('No data to export')
      }

      const filePath = path.join(this.exportDir, filename)
      const workbook = new ExcelJS.Workbook()
      const worksheet = workbook.addWorksheet('Data')

      // Flatten complex objects for Excel export
      const flattenedData = data.map(item => this.flattenObject(item))

      // Add headers
      if (includeHeaders && flattenedData.length > 0) {
        const headers = Object.keys(flattenedData[0])
        worksheet.addRow(headers)
        
        // Style headers
        const headerRow = worksheet.getRow(1)
        headerRow.font = { bold: true }
        headerRow.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FFE0E0E0' }
        }
      }

      // Add data rows
      flattenedData.forEach(row => {
        const values = Object.values(row)
        worksheet.addRow(values)
      })

      // Auto-fit columns
      worksheet.columns.forEach(column => {
        column.width = Math.max(
          column.header ? column.header.length : 10,
          ...column.values.map(v => v ? v.toString().length : 0)
        )
      })

      await workbook.xlsx.writeFile(filePath)

      const stats = await fs.stat(filePath)
      return {
        filePath,
        fileSize: stats.size
      }
    } catch (error) {
      console.error('Excel export error:', error)
      throw error
    }
  }

  // Export to JSON format
  async exportToJSON(data, filename) {
    try {
      if (!data || data.length === 0) {
        throw new Error('No data to export')
      }

      const filePath = path.join(this.exportDir, filename)
      const jsonData = JSON.stringify(data, null, 2)
      
      await fs.writeFile(filePath, jsonData, 'utf8')

      const stats = await fs.stat(filePath)
      return {
        filePath,
        fileSize: stats.size
      }
    } catch (error) {
      console.error('JSON export error:', error)
      throw error
    }
  }

  // Import data from file
  async importData(filePath, options = {}) {
    try {
      const {
        type = 'auto',
        validateData = true,
        updateExisting = false,
        skipErrors = false
      } = options

      const fileExt = path.extname(filePath).toLowerCase()
      let data

      // Read data based on file type
      switch (fileExt) {
        case '.csv':
          data = await this.readCSVFile(filePath)
          break
        case '.xlsx':
        case '.xls':
          data = await this.readExcelFile(filePath)
          break
        case '.json':
          data = await this.readJSONFile(filePath)
          break
        default:
          throw new Error(`Unsupported file type: ${fileExt}`)
      }

      if (!data || data.length === 0) {
        throw new Error('No data found in file')
      }

      // Determine data type if auto
      const dataType = type === 'auto' ? this.detectDataType(data) : type

      // Validate data if requested
      if (validateData) {
        const validationResult = await this.validateImportData(data, dataType)
        if (!validationResult.valid) {
          throw new Error(`Data validation failed: ${validationResult.errors.join(', ')}`)
        }
      }

      // Import data
      const result = await this.processImportData(data, dataType, { updateExisting, skipErrors })

      return {
        success: true,
        imported: result.imported,
        updated: result.updated,
        errors: result.errors,
        total: data.length
      }
    } catch (error) {
      console.error('Import data error:', error)
      throw error
    }
  }

  // Read CSV file
  async readCSVFile(filePath) {
    try {
      const data = []
      const fileContent = await fs.readFile(filePath, 'utf8')
      
      return new Promise((resolve, reject) => {
        const stream = require('stream')
        const readable = stream.Readable.from(fileContent)
        
        readable
          .pipe(csv())
          .on('data', (row) => data.push(row))
          .on('end', () => resolve(data))
          .on('error', reject)
      })
    } catch (error) {
      console.error('CSV read error:', error)
      throw error
    }
  }

  // Read Excel file
  async readExcelFile(filePath) {
    try {
      const workbook = new ExcelJS.Workbook()
      await workbook.xlsx.readFile(filePath)
      
      const worksheet = workbook.getWorksheet(1)
      const data = []
      
      worksheet.eachRow((row, rowNumber) => {
        if (rowNumber === 1) return // Skip header row
        
        const rowData = {}
        row.eachCell((cell, colNumber) => {
          const header = worksheet.getRow(1).getCell(colNumber).value
          rowData[header] = cell.value
        })
        data.push(rowData)
      })
      
      return data
    } catch (error) {
      console.error('Excel read error:', error)
      throw error
    }
  }

  // Read JSON file
  async readJSONFile(filePath) {
    try {
      const fileContent = await fs.readFile(filePath, 'utf8')
      return JSON.parse(fileContent)
    } catch (error) {
      console.error('JSON read error:', error)
      throw error
    }
  }

  // Detect data type from content
  detectDataType(data) {
    if (!data || data.length === 0) return 'unknown'

    const sample = data[0]
    const fields = Object.keys(sample)

    if (fields.includes('cropType') || fields.includes('batchId')) return 'harvest'
    if (fields.includes('cropName') || fields.includes('price')) return 'listing'
    if (fields.includes('email') && fields.includes('role')) return 'user'
    if (fields.includes('services') && fields.includes('type')) return 'partner'
    if (fields.includes('shipmentNumber') || fields.includes('trackingNumber')) return 'shipment'
    if (fields.includes('amount') && fields.includes('type')) return 'transaction'

    return 'unknown'
  }

  // Validate import data
  async validateImportData(data, type) {
    try {
      const errors = []
      
      for (let i = 0; i < data.length; i++) {
        const row = data[i]
        const rowErrors = await this.validateRow(row, type, i + 1)
        errors.push(...rowErrors)
      }

      return {
        valid: errors.length === 0,
        errors
      }
    } catch (error) {
      console.error('Data validation error:', error)
      throw error
    }
  }

  // Validate individual row
  async validateRow(row, type, rowNumber) {
    const errors = []

    switch (type) {
      case 'harvest':
        if (!row.cropType) errors.push(`Row ${rowNumber}: cropType is required`)
        if (!row.quantity || isNaN(row.quantity)) errors.push(`Row ${rowNumber}: quantity must be a valid number`)
        break
      case 'listing':
        if (!row.cropName) errors.push(`Row ${rowNumber}: cropName is required`)
        if (!row.price || isNaN(row.price)) errors.push(`Row ${rowNumber}: price must be a valid number`)
        break
      case 'user':
        if (!row.email) errors.push(`Row ${rowNumber}: email is required`)
        if (!row.name) errors.push(`Row ${rowNumber}: name is required`)
        break
      case 'partner':
        if (!row.name) errors.push(`Row ${rowNumber}: name is required`)
        if (!row.type) errors.push(`Row ${rowNumber}: type is required`)
        break
      case 'shipment':
        if (!row.shipmentNumber) errors.push(`Row ${rowNumber}: shipmentNumber is required`)
        break
      case 'transaction':
        if (!row.amount || isNaN(row.amount)) errors.push(`Row ${rowNumber}: amount must be a valid number`)
        break
    }

    return errors
  }

  // Process import data
  async processImportData(data, type, options = {}) {
    try {
      const { updateExisting = false, skipErrors = false } = options
      let imported = 0
      let updated = 0
      const errors = []

      for (let i = 0; i < data.length; i++) {
        try {
          const row = data[i]
          const result = await this.importRow(row, type, updateExisting)
          
          if (result.imported) imported++
          if (result.updated) updated++
        } catch (error) {
          const errorMsg = `Row ${i + 1}: ${error.message}`
          errors.push(errorMsg)
          
          if (!skipErrors) {
            throw new Error(errorMsg)
          }
        }
      }

      return { imported, updated, errors }
    } catch (error) {
      console.error('Process import error:', error)
      throw error
    }
  }

  // Import individual row
  async importRow(row, type, updateExisting = false) {
    try {
      switch (type) {
        case 'harvest':
          return await this.importHarvestRow(row, updateExisting)
        case 'listing':
          return await this.importListingRow(row, updateExisting)
        case 'user':
          return await this.importUserRow(row, updateExisting)
        case 'partner':
          return await this.importPartnerRow(row, updateExisting)
        case 'shipment':
          return await this.importShipmentRow(row, updateExisting)
        case 'transaction':
          return await this.importTransactionRow(row, updateExisting)
        default:
          throw new Error(`Unknown data type: ${type}`)
      }
    } catch (error) {
      console.error('Import row error:', error)
      throw error
    }
  }

  // Import harvest row
  async importHarvestRow(row, updateExisting = false) {
    try {
      const harvestData = {
        cropType: row.cropType,
        quantity: parseFloat(row.quantity),
        unit: row.unit || 'kg',
        quality: row.quality || 'good',
        status: row.status || 'pending',
        location: {
          city: row.location || '',
          state: row.state || '',
          country: 'Nigeria'
        },
        description: row.description || ''
      }

      if (updateExisting && row.id) {
        const existing = await Harvest.findById(row.id)
        if (existing) {
          await Harvest.findByIdAndUpdate(row.id, harvestData)
          return { imported: false, updated: true }
        }
      }

      const harvest = new Harvest(harvestData)
      await harvest.save()
      return { imported: true, updated: false }
    } catch (error) {
      throw new Error(`Harvest import failed: ${error.message}`)
    }
  }

  // Import listing row
  async importListingRow(row, updateExisting = false) {
    try {
      const listingData = {
        cropName: row.cropName,
        price: parseFloat(row.price),
        currency: row.currency || 'NGN',
        quantity: parseFloat(row.quantity),
        unit: row.unit || 'kg',
        quality: row.quality || 'good',
        status: row.status || 'active',
        location: {
          city: row.location || '',
          state: row.state || '',
          country: 'Nigeria'
        },
        description: row.description || ''
      }

      if (updateExisting && row.id) {
        const existing = await Listing.findById(row.id)
        if (existing) {
          await Listing.findByIdAndUpdate(row.id, listingData)
          return { imported: false, updated: true }
        }
      }

      const listing = new Listing(listingData)
      await listing.save()
      return { imported: true, updated: false }
    } catch (error) {
      throw new Error(`Listing import failed: ${error.message}`)
    }
  }

  // Import user row
  async importUserRow(row, updateExisting = false) {
    try {
      const userData = {
        name: row.name,
        email: row.email,
        phone: row.phone || '',
        role: row.role || 'farmer',
        location: {
          city: row.location || '',
          state: row.state || '',
          country: 'Nigeria'
        },
        emailVerified: row.emailVerified === 'true',
        phoneVerified: row.phoneVerified === 'true'
      }

      if (updateExisting && row.id) {
        const existing = await User.findById(row.id)
        if (existing) {
          await User.findByIdAndUpdate(row.id, userData)
          return { imported: false, updated: true }
        }
      }

      const user = new User(userData)
      await user.save()
      return { imported: true, updated: false }
    } catch (error) {
      throw new Error(`User import failed: ${error.message}`)
    }
  }

  // Import partner row
  async importPartnerRow(row, updateExisting = false) {
    try {
      const partnerData = {
        name: row.name,
        type: row.type,
        services: row.services ? row.services.split(',').map(s => s.trim()) : [],
        location: {
          city: row.location || '',
          state: row.state || '',
          country: 'Nigeria'
        },
        description: row.description || ''
      }

      if (updateExisting && row.id) {
        const existing = await Partner.findById(row.id)
        if (existing) {
          await Partner.findByIdAndUpdate(row.id, partnerData)
          return { imported: false, updated: true }
        }
      }

      const partner = new Partner(partnerData)
      await partner.save()
      return { imported: true, updated: false }
    } catch (error) {
      throw new Error(`Partner import failed: ${error.message}`)
    }
  }

  // Import shipment row
  async importShipmentRow(row, updateExisting = false) {
    try {
      const shipmentData = {
        shipmentNumber: row.shipmentNumber,
        trackingNumber: row.trackingNumber || '',
        status: row.status || 'pending',
        origin: {
          city: row.origin || '',
          state: '',
          country: 'Nigeria'
        },
        destination: {
          city: row.destination || '',
          state: '',
          country: 'Nigeria'
        },
        carrier: row.carrier || '',
        shippingMethod: row.shippingMethod || 'standard'
      }

      if (updateExisting && row.id) {
        const existing = await Shipment.findById(row.id)
        if (existing) {
          await Shipment.findByIdAndUpdate(row.id, shipmentData)
          return { imported: false, updated: true }
        }
      }

      const shipment = new Shipment(shipmentData)
      await shipment.save()
      return { imported: true, updated: false }
    } catch (error) {
      throw new Error(`Shipment import failed: ${error.message}`)
    }
  }

  // Import transaction row
  async importTransactionRow(row, updateExisting = false) {
    try {
      const transactionData = {
        type: row.type || 'payment',
        amount: parseFloat(row.amount),
        currency: row.currency || 'NGN',
        status: row.status || 'pending',
        provider: row.provider || 'system',
        reference: row.reference || `TXN-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
      }

      if (updateExisting && row.id) {
        const existing = await Transaction.findById(row.id)
        if (existing) {
          await Transaction.findByIdAndUpdate(row.id, transactionData)
          return { imported: false, updated: true }
        }
      }

      const transaction = new Transaction(transactionData)
      await transaction.save()
      return { imported: true, updated: false }
    } catch (error) {
      throw new Error(`Transaction import failed: ${error.message}`)
    }
  }

  // Build query filters for exports
  buildHarvestQuery(filters) {
    const query = {}
    
    if (filters.cropType) query.cropType = filters.cropType
    if (filters.status) query.status = filters.status
    if (filters.quality) query.quality = filters.quality
    if (filters.farmerId) query.farmer = filters.farmerId
    if (filters.startDate || filters.endDate) {
      query.date = {}
      if (filters.startDate) query.date.$gte = new Date(filters.startDate)
      if (filters.endDate) query.date.$lte = new Date(filters.endDate)
    }

    return query
  }

  buildListingQuery(filters) {
    const query = {}
    
    if (filters.cropName) query.cropName = filters.cropName
    if (filters.status) query.status = filters.status
    if (filters.quality) query.quality = filters.quality
    if (filters.farmerId) query.farmer = filters.farmerId
    if (filters.minPrice || filters.maxPrice) {
      query.price = {}
      if (filters.minPrice) query.price.$gte = parseFloat(filters.minPrice)
      if (filters.maxPrice) query.price.$lte = parseFloat(filters.maxPrice)
    }

    return query
  }

  buildUserQuery(filters) {
    const query = {}
    
    if (filters.role) query.role = filters.role
    if (filters.status) query.status = filters.status
    if (filters.verified !== undefined) query.emailVerified = filters.verified === 'true'

    return query
  }

  buildPartnerQuery(filters) {
    const query = {}
    
    if (filters.type) query.type = filters.type
    if (filters.status) query.status = filters.status
    if (filters.services) query.services = { $in: filters.services }

    return query
  }

  buildShipmentQuery(filters) {
    const query = {}
    
    if (filters.status) query.status = filters.status
    if (filters.carrier) query.carrier = filters.carrier
    if (filters.buyerId) query.buyer = filters.buyerId
    if (filters.sellerId) query.seller = filters.sellerId

    return query
  }

  buildTransactionQuery(filters) {
    const query = {}
    
    if (filters.type) query.type = filters.type
    if (filters.status) query.status = filters.status
    if (filters.provider) query.provider = filters.provider

    return query
  }

  buildAnalyticsQuery(filters) {
    const query = {}
    
    if (filters.type) query.type = filters.type
    if (filters.period) query.period = filters.period
    if (filters.startDate || filters.endDate) {
      query.date = {}
      if (filters.startDate) query.date.$gte = new Date(filters.startDate)
      if (filters.endDate) query.date.$lte = new Date(filters.endDate)
    }

    return query
  }

  // Filter custom fields
  filterCustomFields(data, customFields) {
    return data.map(item => {
      const filtered = {}
      customFields.forEach(field => {
        if (item.hasOwnProperty(field)) {
          filtered[field] = item[field]
        }
      })
      return filtered
    })
  }

  // Apply data filters
  applyDataFilters(data, filters) {
    let filteredData = [...data]

    if (filters.limit && filters.limit < filteredData.length) {
      filteredData = filteredData.slice(0, filters.limit)
    }

    if (filters.offset) {
      filteredData = filteredData.slice(filters.offset)
    }

    return filteredData
  }

  // Generate filename
  generateFilename(format) {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
    return `export-${timestamp}.${format}`
  }

  // Get export statistics
  async getExportStats() {
    try {
      const files = await fs.readdir(this.exportDir)
      const stats = {
        totalFiles: files.length,
        byFormat: {},
        totalSize: 0
      }

      for (const file of files) {
        const filePath = path.join(this.exportDir, file)
        const fileStat = await fs.stat(filePath)
        const ext = path.extname(file).toLowerCase().substring(1)
        
        if (!stats.byFormat[ext]) {
          stats.byFormat[ext] = { count: 0, size: 0 }
        }
        
        stats.byFormat[ext].count++
        stats.byFormat[ext].size += fileStat.size
        stats.totalSize += fileStat.size
      }

      return stats
    } catch (error) {
      console.error('Export stats error:', error)
      throw error
    }
  }

  // Clean up old export files
  async cleanupOldExports(maxAge = 7 * 24 * 60 * 60 * 1000) { // 7 days
    try {
      const files = await fs.readdir(this.exportDir)
      const now = Date.now()
      let cleaned = 0

      for (const file of files) {
        const filePath = path.join(this.exportDir, file)
        const fileStat = await fs.stat(filePath)
        
        if (now - fileStat.mtime.getTime() > maxAge) {
          await fs.unlink(filePath)
          cleaned++
        }
      }

      return { cleaned, total: files.length }
    } catch (error) {
      console.error('Cleanup error:', error)
      throw error
    }
  }
}

module.exports = new ExportImportService()
