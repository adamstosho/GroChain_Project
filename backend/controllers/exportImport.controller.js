const ExportImportService = require('../services/exportImport.service')
const { validateExportRequest, validateImportRequest } = require('../middlewares/validation.middleware')
const path = require('path')
const fs = require('fs').promises

class ExportImportController {
  // Export harvests
  async exportHarvests(req, res) {
    try {
      const { format = 'csv', filters = {}, options = {} } = req.body

      const result = await ExportImportService.exportHarvests(filters, format, options)

      res.json({
        success: true,
        message: 'Harvests exported successfully',
        data: result
      })
    } catch (error) {
      console.error('Export harvests error:', error)
      res.status(500).json({
        success: false,
        message: 'Failed to export harvests',
        error: error.message
      })
    }
  }

  // Export listings
  async exportListings(req, res) {
    try {
      const { format = 'csv', filters = {}, options = {} } = req.body

      const result = await ExportImportService.exportListings(filters, format, options)

      res.json({
        success: true,
        message: 'Listings exported successfully',
        data: result
      })
    } catch (error) {
      console.error('Export listings error:', error)
      res.status(500).json({
        success: false,
        message: 'Failed to export listings',
        error: error.message
      })
    }
  }

  // Export users
  async exportUsers(req, res) {
    try {
      const { format = 'csv', filters = {}, options = {} } = req.body

      const result = await ExportImportService.exportUsers(filters, format, options)

      res.json({
        success: true,
        message: 'Users exported successfully',
        data: result
      })
    } catch (error) {
      console.error('Export users error:', error)
      res.status(500).json({
        success: false,
        message: 'Failed to export users',
        error: error.message
      })
    }
  }

  // Export partners
  async exportPartners(req, res) {
    try {
      const { format = 'csv', filters = {}, options = {} } = req.body

      const result = await ExportImportService.exportPartners(filters, format, options)

      res.json({
        success: true,
        message: 'Partners exported successfully',
        data: result
      })
    } catch (error) {
      console.error('Export partners error:', error)
      res.status(500).json({
        success: false,
        message: 'Failed to export partners',
        error: error.message
      })
    }
  }

  // Export shipments
  async exportShipments(req, res) {
    try {
      const { format = 'csv', filters = {}, options = {} } = req.body

      const result = await ExportImportService.exportShipments(filters, format, options)

      res.json({
        success: true,
        message: 'Shipments exported successfully',
        data: result
      })
    } catch (error) {
      console.error('Export shipments error:', error)
      res.status(500).json({
        success: false,
        message: 'Failed to export shipments',
        error: error.message
      })
    }
  }

  // Export transactions
  async exportTransactions(req, res) {
    try {
      const { format = 'csv', filters = {}, options = {} } = req.body

      const result = await ExportImportService.exportTransactions(filters, format, options)

      res.json({
        success: true,
        message: 'Transactions exported successfully',
        data: result
      })
    } catch (error) {
      console.error('Export transactions error:', error)
      res.status(500).json({
        success: false,
        message: 'Failed to export transactions',
        error: error.message
      })
    }
  }

  // Export buyer-specific analytics
  async exportBuyerAnalytics(req, res) {
    try {
      const { format = 'csv', filters = {}, options = {} } = req.body
      const userId = req.user._id

      // Validate format
      if (!['csv', 'excel', 'json'].includes(format)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid format. Supported formats: csv, excel, json'
        })
      }

      // Validate user ID
      if (!userId) {
        return res.status(401).json({
          success: false,
          message: 'User ID is required'
        })
      }

      const result = await ExportImportService.exportBuyerData(userId, filters, format, options)

      res.json({
        success: true,
        message: 'Buyer analytics exported successfully',
        data: result
      })
    } catch (error) {
      console.error('Export buyer analytics error:', error)
      
      // Handle specific error types
      if (error.message.includes('No data to export')) {
        return res.status(404).json({
          success: false,
          message: 'No buyer data found for export',
          error: error.message
        })
      }
      
      if (error.message.includes('Unsupported format')) {
        return res.status(400).json({
          success: false,
          message: 'Unsupported export format',
          error: error.message
        })
      }

      res.status(500).json({
        success: false,
        message: 'Failed to export buyer analytics',
        error: error.message
      })
    }
  }

  // Export farmer-specific analytics
  async exportFarmerAnalytics(req, res) {
    try {
      const { format = 'csv', filters = {}, options = {} } = req.body
      const userId = req.user._id

      const result = await ExportImportService.exportFarmerData(userId, filters, format, options)

      res.json({
        success: true,
        message: 'Farmer analytics exported successfully',
        data: result
      })
    } catch (error) {
      console.error('Export farmer analytics error:', error)
      res.status(500).json({
        success: false,
        message: 'Failed to export farmer analytics',
        error: error.message
      })
    }
  }

  // Export partner-specific analytics
  async exportPartnerAnalytics(req, res) {
    try {
      const { format = 'csv', filters = {}, options = {} } = req.body
      const userId = req.user._id

      const result = await ExportImportService.exportPartnerData(userId, filters, format, options)

      res.json({
        success: true,
        message: 'Partner analytics exported successfully',
        data: result
      })
    } catch (error) {
      console.error('Export partner analytics error:', error)
      res.status(500).json({
        success: false,
        message: 'Failed to export partner analytics',
        error: error.message
      })
    }
  }

  // Export analytics
  async exportAnalytics(req, res) {
    try {
      const { format = 'csv', filters = {}, options = {} } = req.body
      const user = req.user

      // Validate format
      if (!['csv', 'excel', 'json'].includes(format)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid format. Supported formats: csv, excel, json'
        })
      }

      // Validate user authentication
      if (!user || !user._id) {
        return res.status(401).json({
          success: false,
          message: 'Authentication required'
        })
      }

      // For non-admin users, we'll export user-specific data instead of system analytics
      if (user.role !== 'admin') {
        // Redirect to appropriate user-specific export based on role
        if (user.role === 'buyer') {
          return await this.exportBuyerAnalytics(req, res)
        } else if (user.role === 'farmer') {
          return await this.exportFarmerAnalytics(req, res)
        } else if (user.role === 'partner') {
          return await this.exportPartnerAnalytics(req, res)
        } else {
          return res.status(403).json({
            success: false,
            message: 'Access denied. Invalid user role for analytics export'
          })
        }
      }

      // Admin users can export system-wide analytics
      const result = await ExportImportService.exportAnalytics(filters, format, options)

      res.json({
        success: true,
        message: 'Analytics exported successfully',
        data: result
      })
    } catch (error) {
      console.error('Export analytics error:', error)
      
      // Handle specific error types
      if (error.message.includes('No data to export')) {
        return res.status(404).json({
          success: false,
          message: 'No analytics data found for the specified criteria',
          error: error.message
        })
      }
      
      if (error.message.includes('Unsupported format')) {
        return res.status(400).json({
          success: false,
          message: 'Unsupported export format',
          error: error.message
        })
      }

      res.status(500).json({
        success: false,
        message: 'Failed to export analytics',
        error: error.message
      })
    }
  }

  // Export custom data
  async exportCustomData(req, res) {
    try {
      const { data, format = 'csv', options = {} } = req.body

      if (!data || !Array.isArray(data) || data.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'Data array is required and must not be empty'
        })
      }

      const result = await ExportImportService.exportData(data, { format, ...options })

      res.json({
        success: true,
        message: 'Custom data exported successfully',
        data: result
      })
    } catch (error) {
      console.error('Export custom data error:', error)
      res.status(500).json({
        success: false,
        message: 'Failed to export custom data',
        error: error.message
      })
    }
  }

  // Import data from file
  async importData(req, res) {
    try {
      const { filePath, options = {} } = req.body

      if (!filePath) {
        return res.status(400).json({
          success: false,
          message: 'File path is required'
        })
      }

      const result = await ExportImportService.importData(filePath, options)

      res.json({
        success: true,
        message: 'Data imported successfully',
        data: result
      })
    } catch (error) {
      console.error('Import data error:', error)
      res.status(500).json({
        success: false,
        message: 'Failed to import data',
        error: error.message
      })
    }
  }

  // Import harvests
  async importHarvests(req, res) {
    try {
      const { filePath, options = {} } = req.body

      if (!filePath) {
        return res.status(400).json({
          success: false,
          message: 'File path is required'
        })
      }

      const result = await ExportImportService.importData(filePath, {
        type: 'harvest',
        ...options
      })

      res.json({
        success: true,
        message: 'Harvests imported successfully',
        data: result
      })
    } catch (error) {
      console.error('Import harvests error:', error)
      res.status(500).json({
        success: false,
        message: 'Failed to import harvests',
        error: error.message
      })
    }
  }

  // Import listings
  async importListings(req, res) {
    try {
      const { filePath, options = {} } = req.body

      if (!filePath) {
        return res.status(400).json({
          success: false,
          message: 'File path is required'
        })
      }

      const result = await ExportImportService.importData(filePath, {
        type: 'listing',
        ...options
      })

      res.json({
        success: true,
        message: 'Listings imported successfully',
        data: result
      })
    } catch (error) {
      console.error('Import listings error:', error)
      res.status(500).json({
        success: false,
        message: 'Failed to import listings',
        error: error.message
      })
    }
  }

  // Import users
  async importUsers(req, res) {
    try {
      const { filePath, options = {} } = req.body

      if (!filePath) {
        return res.status(400).json({
          success: false,
          message: 'File path is required'
        })
      }

      const result = await ExportImportService.importData(filePath, {
        type: 'user',
        ...options
      })

      res.json({
        success: true,
        message: 'Users imported successfully',
        data: result
      })
    } catch (error) {
      console.error('Import users error:', error)
      res.status(500).json({
        success: false,
        message: 'Failed to import users',
        error: error.message
      })
    }
  }

  // Import partners
  async importPartners(req, res) {
    try {
      const { filePath, options = {} } = req.body

      if (!filePath) {
        return res.status(400).json({
          success: false,
          message: 'File path is required'
        })
      }

      const result = await ExportImportService.importData(filePath, {
        type: 'partner',
        ...options
      })

      res.json({
        success: true,
        message: 'Partners imported successfully',
        data: result
      })
    } catch (error) {
      console.error('Import partners error:', error)
      res.status(500).json({
        success: false,
        message: 'Failed to import partners',
        error: error.message
      })
    }
  }

  // Import shipments
  async importShipments(req, res) {
    try {
      const { filePath, options = {} } = req.body

      if (!filePath) {
        return res.status(400).json({
          success: false,
          message: 'File path is required'
        })
      }

      const result = await ExportImportService.importData(filePath, {
        type: 'shipment',
        ...options
      })

      res.json({
        success: true,
        message: 'Shipments imported successfully',
        data: result
      })
    } catch (error) {
      console.error('Import shipments error:', error)
      res.status(500).json({
        success: false,
        message: 'Failed to import shipments',
        error: error.message
      })
    }
  }

  // Import transactions
  async importTransactions(req, res) {
    try {
      const { filePath, options = {} } = req.body

      if (!filePath) {
        return res.status(400).json({
          success: false,
          message: 'File path is required'
        })
      }

      const result = await ExportImportService.importData(filePath, {
        type: 'transaction',
        ...options
      })

      res.json({
        success: true,
        message: 'Transactions imported successfully',
        data: result
      })
    } catch (error) {
      console.error('Import transactions error:', error)
      res.status(500).json({
        success: false,
        message: 'Failed to import transactions',
        error: error.message
      })
    }
  }

  // Get export statistics
  async getExportStats(req, res) {
    try {
      const stats = await ExportImportService.getExportStats()

      res.json({
        success: true,
        message: 'Export statistics retrieved successfully',
        data: stats
      })
    } catch (error) {
      console.error('Get export stats error:', error)
      res.status(500).json({
        success: false,
        message: 'Failed to get export statistics',
        error: error.message
      })
    }
  }

  // Clean up old exports
  async cleanupOldExports(req, res) {
    try {
      const { maxAge } = req.body
      const result = await ExportImportService.cleanupOldExports(maxAge)

      res.json({
        success: true,
        message: 'Old exports cleaned up successfully',
        data: result
      })
    } catch (error) {
      console.error('Cleanup old exports error:', error)
      res.status(500).json({
        success: false,
        message: 'Failed to cleanup old exports',
        error: error.message
      })
    }
  }

  // Download exported file
  async downloadExport(req, res) {
    try {
      const { filename } = req.params

      if (!filename) {
        return res.status(400).json({
          success: false,
          message: 'Filename is required'
        })
      }

      const filePath = path.join(ExportImportService.exportDir, filename)

      // Check if file exists
      try {
        await fs.access(filePath)
      } catch (error) {
        return res.status(404).json({
          success: false,
          message: 'File not found'
        })
      }

      // Set headers for file download
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`)
      res.setHeader('Content-Type', this.getContentType(filename))

      // Stream the file
      const fileStream = fs.createReadStream(filePath)
      fileStream.pipe(res)
    } catch (error) {
      console.error('Download export error:', error)
      res.status(500).json({
        success: false,
        message: 'Failed to download export file',
        error: error.message
      })
    }
  }

  // Get content type based on file extension
  getContentType(filename) {
    const ext = path.extname(filename).toLowerCase()
    
    switch (ext) {
      case '.csv':
        return 'text/csv'
      case '.xlsx':
        return 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      case '.xls':
        return 'application/vnd.ms-excel'
      case '.json':
        return 'application/json'
      default:
        return 'application/octet-stream'
    }
  }

  // Validate export template
  async validateExportTemplate(req, res) {
    try {
      const { template, data } = req.body

      if (!template || !data) {
        return res.status(400).json({
          success: false,
          message: 'Template and data are required'
        })
      }

      // Validate template structure
      const validationResult = await this.validateTemplate(template, data)

      res.json({
        success: true,
        message: 'Template validation completed',
        data: validationResult
      })
    } catch (error) {
      console.error('Validate template error:', error)
      res.status(500).json({
        success: false,
        message: 'Failed to validate template',
        error: error.message
      })
    }
  }

  // Validate template structure
  async validateTemplate(template, data) {
    const errors = []
    const warnings = []

    // Check required fields
    if (template.requiredFields) {
      for (const field of template.requiredFields) {
        if (!data.some(item => item.hasOwnProperty(field))) {
          errors.push(`Required field '${field}' is missing from all data items`)
        }
      }
    }

    // Check field types
    if (template.fieldTypes && data.length > 0) {
      const sample = data[0]
      for (const [field, expectedType] of Object.entries(template.fieldTypes)) {
        if (sample.hasOwnProperty(field)) {
          const actualType = typeof sample[field]
          if (actualType !== expectedType) {
            warnings.push(`Field '${field}' has type '${actualType}' but expected '${expectedType}'`)
          }
        }
      }
    }

    // Check data consistency
    if (data.length > 1) {
      const firstItem = data[0]
      const firstKeys = Object.keys(firstItem)
      
      for (let i = 1; i < data.length; i++) {
        const item = data[i]
        const itemKeys = Object.keys(item)
        
        if (itemKeys.length !== firstKeys.length) {
          warnings.push(`Data item ${i} has different number of fields`)
        }
        
        for (const key of firstKeys) {
          if (!item.hasOwnProperty(key)) {
            warnings.push(`Data item ${i} is missing field '${key}'`)
          }
        }
      }
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings,
      dataCount: data.length,
      fieldCount: data.length > 0 ? Object.keys(data[0]).length : 0
    }
  }

  // Get supported export formats
  async getSupportedFormats(req, res) {
    try {
      const formats = ExportImportService.supportedFormats.map(format => ({
        format,
        extensions: ExportImportController.prototype.getExtensionsForFormat(format),
        description: ExportImportController.prototype.getFormatDescription(format)
      }))

      res.json({
        success: true,
        message: 'Supported formats retrieved successfully',
        data: formats
      })
    } catch (error) {
      console.error('Get supported formats error:', error)
      res.status(500).json({
        success: false,
        message: 'Failed to get supported formats',
        error: error.message
      })
    }
  }

  // Get extensions for format
  getExtensionsForFormat(format) {
    switch (format) {
      case 'csv':
        return ['.csv']
      case 'excel':
        return ['.xlsx', '.xls']
      case 'json':
        return ['.json']
      default:
        return []
    }
  }

  // Get format description
  getFormatDescription(format) {
    switch (format) {
      case 'csv':
        return 'Comma-separated values format, widely supported by spreadsheet applications'
      case 'excel':
        return 'Microsoft Excel format with advanced formatting and multiple worksheets'
      case 'json':
        return 'JavaScript Object Notation, ideal for data exchange and APIs'
      default:
        return 'Unknown format'
    }
  }

  // Get export templates
  async getExportTemplates(req, res) {
    try {
      const templates = {
        harvest: {
          name: 'Harvest Export Template',
          description: 'Standard template for exporting harvest data',
          fields: ['cropType', 'quantity', 'unit', 'quality', 'status', 'location', 'farmerName'],
          required: ['cropType', 'quantity', 'unit'],
          sample: {
            cropType: 'Maize',
            quantity: 1000,
            unit: 'kg',
            quality: 'good',
            status: 'approved',
            location: 'Lagos',
            farmerName: 'John Doe'
          }
        },
        listing: {
          name: 'Listing Export Template',
          description: 'Standard template for exporting product listings',
          fields: ['cropName', 'price', 'currency', 'quantity', 'unit', 'quality', 'status'],
          required: ['cropName', 'price', 'quantity'],
          sample: {
            cropName: 'Fresh Tomatoes',
            price: 5000,
            currency: 'NGN',
            quantity: 100,
            unit: 'kg',
            quality: 'excellent',
            status: 'active'
          }
        },
        user: {
          name: 'User Export Template',
          description: 'Standard template for exporting user data',
          fields: ['name', 'email', 'phone', 'role', 'location', 'status'],
          required: ['name', 'email', 'role'],
          sample: {
            name: 'Jane Smith',
            email: 'jane@example.com',
            phone: '+2348012345678',
            role: 'farmer',
            location: 'Abuja',
            status: 'active'
          }
        }
      }

      res.json({
        success: true,
        message: 'Export templates retrieved successfully',
        data: templates
      })
    } catch (error) {
      console.error('Get export templates error:', error)
      res.status(500).json({
        success: false,
        message: 'Failed to get export templates',
        error: error.message
      })
    }
  }
}

module.exports = new ExportImportController()
