const Harvest = require('../models/harvest.model')
const Listing = require('../models/listing.model')
const User = require('../models/user.model')
const Partner = require('../models/partner.model')
const Shipment = require('../models/shipment.model')

class SearchService {
  constructor() {
    this.searchIndexes = {
      harvest: ['cropType', 'description', 'location.city', 'location.state'],
      listing: ['cropName', 'description', 'location.city', 'location.state'],
      user: ['name', 'email', 'location.city', 'location.state'],
      partner: ['name', 'description', 'services', 'location.city', 'location.state']
    }
  }

  // Advanced search with multiple criteria
  async advancedSearch(query, options = {}) {
    try {
      const {
        type = 'all',
        filters = {},
        sort = { createdAt: -1 },
        page = 1,
        limit = 20,
        includeDeleted = false
      } = options

      let searchQuery = {}
      let results = []

      // Build search query based on type
      switch (type) {
        case 'harvest':
          results = await this.searchHarvests(query, filters, sort, page, limit, includeDeleted)
          break
        case 'listing':
          results = await this.searchListings(query, filters, sort, page, limit, includeDeleted)
          break
        case 'user':
          results = await this.searchUsers(query, filters, sort, page, limit, includeDeleted)
          break
        case 'partner':
          results = await this.searchPartners(query, filters, sort, page, limit, includeDeleted)
          break
        case 'shipment':
          results = await this.searchShipments(query, filters, sort, page, limit, includeDeleted)
          break
        case 'all':
          results = await this.searchAll(query, filters, sort, page, limit, includeDeleted)
          break
        default:
          throw new Error(`Invalid search type: ${type}`)
      }

      return {
        success: true,
        data: results.data,
        pagination: results.pagination,
        total: results.total,
        query,
        filters,
        type
      }
    } catch (error) {
      console.error('Advanced search error:', error)
      throw error
    }
  }

  // Search harvests with advanced filtering
  async searchHarvests(query, filters = {}, sort = { createdAt: -1 }, page = 1, limit = 20, includeDeleted = false) {
    try {
      const searchQuery = this.buildHarvestSearchQuery(query, filters, includeDeleted)
      const skip = (page - 1) * limit

      const [harvests, total] = await Promise.all([
        Harvest.find(searchQuery)
          .populate('farmer', 'name email phone location')
          .sort(sort)
          .skip(skip)
          .limit(limit)
          .lean(),
        Harvest.countDocuments(searchQuery)
      ])

      return {
        data: harvests,
        total,
        pagination: {
          page,
          limit,
          pages: Math.ceil(total / limit),
          hasNext: page * limit < total,
          hasPrev: page > 1
        }
      }
    } catch (error) {
      console.error('Harvest search error:', error)
      throw error
    }
  }

  // Search listings with advanced filtering
  async searchListings(query, filters = {}, sort = { createdAt: -1 }, page = 1, limit = 20, includeDeleted = false) {
    try {
      const searchQuery = this.buildListingSearchQuery(query, filters, includeDeleted)
      const skip = (page - 1) * limit

      const [listings, total] = await Promise.all([
        Listing.find(searchQuery)
          .populate('farmer', 'name email phone location')
          .populate('harvest', 'cropType quality images')
          .sort(sort)
          .skip(skip)
          .limit(limit)
          .lean(),
        Listing.countDocuments(searchQuery)
      ])

      return {
        data: listings,
        total,
        pagination: {
          page,
          limit,
          pages: Math.ceil(total / limit),
          hasNext: page * limit < total,
          hasPrev: page > 1
        }
      }
    } catch (error) {
      console.error('Listing search error:', error)
      throw error
    }
  }

  // Search users with advanced filtering
  async searchUsers(query, filters = {}, sort = { createdAt: -1 }, page = 1, limit = 20, includeDeleted = false) {
    try {
      const searchQuery = this.buildUserSearchQuery(query, filters, includeDeleted)
      const skip = (page - 1) * limit

      const [users, total] = await Promise.all([
        User.find(searchQuery)
          .select('-password -pin')
          .sort(sort)
          .skip(skip)
          .limit(limit)
          .lean(),
        User.countDocuments(searchQuery)
      ])

      return {
        data: users,
        total,
        pagination: {
          page,
          limit,
          pages: Math.ceil(total / limit),
          hasNext: page * limit < total,
          hasPrev: page > 1
        }
      }
    } catch (error) {
      console.error('User search error:', error)
      throw error
    }
  }

  // Search partners with advanced filtering
  async searchPartners(query, filters = {}, sort = { createdAt: -1 }, page = 1, limit = 20, includeDeleted = false) {
    try {
      const searchQuery = this.buildPartnerSearchQuery(query, filters, includeDeleted)
      const skip = (page - 1) * limit

      const [partners, total] = await Promise.all([
        Partner.find(searchQuery)
          .populate('contactPerson', 'name email phone')
          .sort(sort)
          .skip(skip)
          .limit(limit)
          .lean(),
        Partner.countDocuments(searchQuery)
      ])

      return {
        data: partners,
        total,
        pagination: {
          page,
          limit,
          pages: Math.ceil(total / limit),
          hasNext: page * limit < total,
          hasPrev: page > 1
        }
      }
    } catch (error) {
      console.error('Partner search error:', error)
      throw error
    }
  }

  // Search shipments with advanced filtering
  async searchShipments(query, filters = {}, sort = { createdAt: -1 }, page = 1, limit = 20, includeDeleted = false) {
    try {
      const searchQuery = this.buildShipmentSearchQuery(query, filters, includeDeleted)
      const skip = (page - 1) * limit

      const [shipments, total] = await Promise.all([
        Shipment.find(searchQuery)
          .populate('buyer', 'name email phone')
          .populate('seller', 'name email phone')
          .sort(sort)
          .skip(skip)
          .limit(limit)
          .lean(),
        Shipment.countDocuments(searchQuery)
      ])

      return {
        data: shipments,
        total,
        pagination: {
          page,
          limit,
          pages: Math.ceil(total / limit),
          hasNext: page * limit < total,
          hasPrev: page > 1
        }
      }
    } catch (error) {
      console.error('Shipment search error:', error)
      throw error
    }
  }

  // Search across all types
  async searchAll(query, filters = {}, sort = { createdAt: -1 }, page = 1, limit = 20, includeDeleted = false) {
    try {
      const [harvests, listings, users, partners, shipments] = await Promise.all([
        this.searchHarvests(query, filters, sort, page, Math.ceil(limit / 5), includeDeleted),
        this.searchListings(query, filters, sort, page, Math.ceil(limit / 5), includeDeleted),
        this.searchUsers(query, filters, sort, page, Math.ceil(limit / 5), includeDeleted),
        this.searchPartners(query, filters, sort, page, Math.ceil(limit / 5), includeDeleted),
        this.searchShipments(query, filters, sort, page, Math.ceil(limit / 5), includeDeleted)
      ])

      // Combine and sort results
      const allResults = [
        ...harvests.data.map(item => ({ ...item, type: 'harvest' })),
        ...listings.data.map(item => ({ ...item, type: 'listing' })),
        ...users.data.map(item => ({ ...item, type: 'user' })),
        ...partners.data.map(item => ({ ...item, type: 'partner' })),
        ...shipments.data.map(item => ({ ...item, type: 'shipment' }))
      ]

      // Sort combined results
      const sortedResults = this.sortCombinedResults(allResults, sort)

      // Apply pagination to combined results
      const startIndex = (page - 1) * limit
      const endIndex = startIndex + limit
      const paginatedResults = sortedResults.slice(startIndex, endIndex)

      const total = harvests.total + listings.total + users.total + partners.total + shipments.total

      return {
        data: paginatedResults,
        total,
        pagination: {
          page,
          limit,
          pages: Math.ceil(total / limit),
          hasNext: page * limit < total,
          hasPrev: page > 1
        }
      }
    } catch (error) {
      console.error('All search error:', error)
      throw error
    }
  }

  // Build harvest search query
  buildHarvestSearchQuery(query, filters, includeDeleted) {
    const searchQuery = {}

    // Text search
    if (query) {
      searchQuery.$or = [
        { cropType: { $regex: query, $options: 'i' } },
        { description: { $regex: query, $options: 'i' } },
        { 'location.city': { $regex: query, $options: 'i' } },
        { 'location.state': { $regex: query, $options: 'i' } },
        { batchId: { $regex: query, $options: 'i' } }
      ]
    }

    // Apply filters
    if (filters.cropType) {
      searchQuery.cropType = { $in: Array.isArray(filters.cropType) ? filters.cropType : [filters.cropType] }
    }

    if (filters.quality) {
      searchQuery.quality = { $in: Array.isArray(filters.quality) ? filters.quality : [filters.quality] }
    }

    if (filters.status) {
      searchQuery.status = { $in: Array.isArray(filters.status) ? filters.status : [filters.status] }
    }

    if (filters.minQuantity || filters.maxQuantity) {
      searchQuery.quantity = {}
      if (filters.minQuantity) searchQuery.quantity.$gte = parseFloat(filters.minQuantity)
      if (filters.maxQuantity) searchQuery.quantity.$lte = parseFloat(filters.maxQuantity)
    }

    if (filters.location) {
      searchQuery['location.city'] = { $regex: filters.location, $options: 'i' }
    }

    if (filters.state) {
      searchQuery['location.state'] = { $regex: filters.state, $options: 'i' }
    }

    if (filters.organic !== undefined) {
      searchQuery['sustainability.organicCertified'] = filters.organic === 'true'
    }

    if (filters.startDate || filters.endDate) {
      searchQuery.date = {}
      if (filters.startDate) searchQuery.date.$gte = new Date(filters.startDate)
      if (filters.endDate) searchQuery.date.$lte = new Date(filters.endDate)
    }

    if (filters.farmerId) {
      searchQuery.farmer = filters.farmerId
    }

    // Geo-spatial search
    if (filters.near && filters.near.lat && filters.near.lng && filters.near.radius) {
      searchQuery.geoLocation = {
        $near: {
          $geometry: {
            type: 'Point',
            coordinates: [parseFloat(filters.near.lng), parseFloat(filters.near.lat)]
          },
          $maxDistance: parseFloat(filters.near.radius) * 1000 // Convert km to meters
        }
      }
    }

    // Include deleted items if requested
    if (!includeDeleted) {
      searchQuery.deletedAt = { $exists: false }
    }

    return searchQuery
  }

  // Build listing search query
  buildListingSearchQuery(query, filters, includeDeleted) {
    const searchQuery = {}

    // Text search
    if (query) {
      searchQuery.$or = [
        { cropName: { $regex: query, $options: 'i' } },
        { description: { $regex: query, $options: 'i' } },
        { 'location.city': { $regex: query, $options: 'i' } },
        { 'location.state': { $regex: query, $options: 'i' } }
      ]
    }

    // Apply filters
    if (filters.cropName) {
      searchQuery.cropName = { $regex: filters.cropName, $options: 'i' }
    }

    if (filters.minPrice || filters.maxPrice) {
      searchQuery.price = {}
      if (filters.minPrice) searchQuery.price.$gte = parseFloat(filters.minPrice)
      if (filters.maxPrice) searchQuery.price.$lte = parseFloat(filters.maxPrice)
    }

    if (filters.quality) {
      searchQuery.quality = { $in: Array.isArray(filters.quality) ? filters.quality : [filters.quality] }
    }

    if (filters.status) {
      searchQuery.status = { $in: Array.isArray(filters.status) ? filters.status : [filters.status] }
    }

    if (filters.location) {
      searchQuery['location.city'] = { $regex: filters.location, $options: 'i' }
    }

    if (filters.state) {
      searchQuery['location.state'] = { $regex: filters.state, $options: 'i' }
    }

    if (filters.deliveryMethod) {
      searchQuery['deliveryOptions.method'] = { $in: Array.isArray(filters.deliveryMethod) ? filters.deliveryMethod : [filters.deliveryMethod] }
    }

    if (filters.farmerId) {
      searchQuery.farmer = filters.farmerId
    }

    // Include deleted items if requested
    if (!includeDeleted) {
      searchQuery.deletedAt = { $exists: false }
    }

    return searchQuery
  }

  // Build user search query
  buildUserSearchQuery(query, filters, includeDeleted) {
    const searchQuery = {}

    // Text search
    if (query) {
      searchQuery.$or = [
        { name: { $regex: query, $options: 'i' } },
        { email: { $regex: query, $options: 'i' } },
        { 'location.city': { $regex: query, $options: 'i' } },
        { 'location.state': { $regex: query, $options: 'i' } }
      ]
    }

    // Apply filters
    if (filters.role) {
      searchQuery.role = { $in: Array.isArray(filters.role) ? filters.role : [filters.role] }
    }

    if (filters.verified !== undefined) {
      searchQuery.emailVerified = filters.verified === 'true'
    }

    if (filters.location) {
      searchQuery['location.city'] = { $regex: filters.location, $options: 'i' }
    }

    if (filters.state) {
      searchQuery['location.state'] = { $regex: filters.state, $options: 'i' }
    }

    if (filters.startDate || filters.endDate) {
      searchQuery.createdAt = {}
      if (filters.startDate) searchQuery.createdAt.$gte = new Date(filters.startDate)
      if (filters.endDate) searchQuery.createdAt.$lte = new Date(filters.endDate)
    }

    // Include deleted items if requested
    if (!includeDeleted) {
      searchQuery.deletedAt = { $exists: false }
    }

    return searchQuery
  }

  // Build partner search query
  buildPartnerSearchQuery(query, filters, includeDeleted) {
    const searchQuery = {}

    // Text search
    if (query) {
      searchQuery.$or = [
        { name: { $regex: query, $options: 'i' } },
        { description: { $regex: query, $options: 'i' } },
        { 'location.city': { $regex: query, $options: 'i' } },
        { 'location.state': { $regex: query, $options: 'i' } }
      ]
    }

    // Apply filters
    if (filters.type) {
      searchQuery.type = { $in: Array.isArray(filters.type) ? filters.type : [filters.type] }
    }

    if (filters.services) {
      searchQuery.services = { $in: Array.isArray(filters.services) ? filters.services : [filters.services] }
    }

    if (filters.location) {
      searchQuery['location.city'] = { $regex: filters.location, $options: 'i' }
    }

    if (filters.state) {
      searchQuery['location.state'] = { $regex: filters.state, $options: 'i' }
    }

    if (filters.certified !== undefined) {
      searchQuery.certifications = { $exists: true, $ne: [] }
    }

    // Include deleted items if requested
    if (!includeDeleted) {
      searchQuery.deletedAt = { $exists: false }
    }

    return searchQuery
  }

  // Build shipment search query
  buildShipmentSearchQuery(query, filters, includeDeleted) {
    const searchQuery = {}

    // Text search
    if (query) {
      searchQuery.$or = [
        { shipmentNumber: { $regex: query, $options: 'i' } },
        { trackingNumber: { $regex: query, $options: 'i' } },
        { 'origin.city': { $regex: query, $options: 'i' } },
        { 'destination.city': { $regex: query, $options: 'i' } }
      ]
    }

    // Apply filters
    if (filters.status) {
      searchQuery.status = { $in: Array.isArray(filters.status) ? filters.status : [filters.status] }
    }

    if (filters.carrier) {
      searchQuery.carrier = { $regex: filters.carrier, $options: 'i' }
    }

    if (filters.origin) {
      searchQuery['origin.city'] = { $regex: filters.origin, $options: 'i' }
    }

    if (filters.destination) {
      searchQuery['destination.city'] = { $regex: filters.destination, $options: 'i' }
    }

    if (filters.startDate || filters.endDate) {
      searchQuery.createdAt = {}
      if (filters.startDate) searchQuery.createdAt.$gte = new Date(filters.startDate)
      if (filters.endDate) searchQuery.createdAt.$lte = new Date(filters.endDate)
    }

    if (filters.buyerId) {
      searchQuery.buyer = filters.buyerId
    }

    if (filters.sellerId) {
      searchQuery.seller = filters.sellerId
    }

    // Include deleted items if requested
    if (!includeDeleted) {
      searchQuery.deletedAt = { $exists: false }
    }

    return searchQuery
  }

  // Sort combined results from different collections
  sortCombinedResults(results, sort) {
    const sortField = Object.keys(sort)[0]
    const sortOrder = sort[sortField]

    return results.sort((a, b) => {
      let aValue = a[sortField]
      let bValue = b[sortField]

      // Handle date fields
      if (aValue instanceof Date) aValue = aValue.getTime()
      if (bValue instanceof Date) bValue = bValue.getTime()

      // Handle string fields
      if (typeof aValue === 'string') aValue = aValue.toLowerCase()
      if (typeof bValue === 'string') bValue = bValue.toLowerCase()

      if (sortOrder === 1) {
        return aValue > bValue ? 1 : -1
      } else {
        return aValue < bValue ? 1 : -1
      }
    })
  }

  // Get search suggestions
  async getSearchSuggestions(query, type = 'all', limit = 10) {
    try {
      const suggestions = []

      if (type === 'all' || type === 'harvest') {
        const harvestSuggestions = await Harvest.distinct('cropType', {
          cropType: { $regex: query, $options: 'i' }
        }).limit(limit)
        suggestions.push(...harvestSuggestions.map(s => ({ text: s, type: 'harvest' })))
      }

      if (type === 'all' || type === 'listing') {
        const listingSuggestions = await Listing.distinct('cropName', {
          cropName: { $regex: query, $options: 'i' }
        }).limit(limit)
        suggestions.push(...listingSuggestions.map(s => ({ text: s, type: 'listing' })))
      }

      if (type === 'all' || type === 'location') {
        const locationSuggestions = await Harvest.distinct('location.city', {
          'location.city': { $regex: query, $options: 'i' }
        }).limit(limit)
        suggestions.push(...locationSuggestions.map(s => ({ text: s, type: 'location' })))
      }

      return suggestions.slice(0, limit)
    } catch (error) {
      console.error('Search suggestions error:', error)
      return []
    }
  }

  // Get search statistics
  async getSearchStats() {
    try {
      const [harvestCount, listingCount, userCount, partnerCount, shipmentCount] = await Promise.all([
        Harvest.countDocuments({ deletedAt: { $exists: false } }),
        Listing.countDocuments({ deletedAt: { $exists: false } }),
        User.countDocuments({ deletedAt: { $exists: false } }),
        Partner.countDocuments({ deletedAt: { $exists: false } }),
        Shipment.countDocuments({ deletedAt: { $exists: false } })
      ])

      return {
        total: harvestCount + listingCount + userCount + partnerCount + shipmentCount,
        byType: {
          harvest: harvestCount,
          listing: listingCount,
          user: userCount,
          partner: partnerCount,
          shipment: shipmentCount
        }
      }
    } catch (error) {
      console.error('Search stats error:', error)
      throw error
    }
  }

  // Export search results
  async exportSearchResults(query, type, filters, format = 'csv') {
    try {
      let results
      
      switch (type) {
        case 'harvest':
          results = await this.searchHarvests(query, filters, {}, 1, 10000, false)
          break
        case 'listing':
          results = await this.searchListings(query, filters, {}, 1, 10000, false)
          break
        case 'user':
          results = await this.searchUsers(query, filters, {}, 1, 10000, false)
          break
        case 'partner':
          results = await this.searchPartners(query, filters, {}, 1, 10000, false)
          break
        case 'shipment':
          results = await this.searchShipments(query, filters, {}, 1, 10000, false)
          break
        default:
          throw new Error(`Invalid export type: ${type}`)
      }

      if (format === 'csv') {
        return this.convertToCSV(results.data)
      } else if (format === 'json') {
        return JSON.stringify(results.data, null, 2)
      } else {
        throw new Error(`Unsupported export format: ${format}`)
      }
    } catch (error) {
      console.error('Export search results error:', error)
      throw error
    }
  }

  // Convert data to CSV format
  convertToCSV(data) {
    if (!data || data.length === 0) return ''

    const headers = Object.keys(data[0])
    const csvRows = [headers.join(',')]

    for (const row of data) {
      const values = headers.map(header => {
        const value = row[header]
        if (value === null || value === undefined) return ''
        if (typeof value === 'object') return JSON.stringify(value)
        return String(value).replace(/"/g, '""')
      })
      csvRows.push(values.join(','))
    }

    return csvRows.join('\n')
  }
}

module.exports = new SearchService()
