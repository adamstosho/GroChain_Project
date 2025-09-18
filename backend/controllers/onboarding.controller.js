const Onboarding = require('../models/onboarding.model')
const User = require('../models/user.model')
const Partner = require('../models/partner.model')

// Get all onboardings with filters and pagination
exports.getOnboardings = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      status,
      stage,
      priority,
      state,
      searchTerm,
      assignedAgent,
      dateRange
    } = req.query

    // Build filter object
    let filter = {}

    // Apply user role-based filtering
    if (req.user.role === 'partner') {
      // Partners can only see onboardings assigned to them
      filter.assignedPartner = req.user.id
    } else if (req.user.role === 'farmer') {
      // Farmers can only see their own onboarding
      filter.farmer = req.user.id
    }

    if (status && status !== 'all') filter.status = status
    if (stage && stage !== 'all') filter.stage = stage
    if (priority && priority !== 'all') filter.priority = priority
    if (assignedAgent && assignedAgent !== 'all') filter.assignedAgent = assignedAgent

    if (state && state !== 'all') {
      filter['location.state'] = state
    }

    if (dateRange) {
      filter.createdAt = {
        $gte: new Date(dateRange.start),
        $lte: new Date(dateRange.end)
      }
    }

    if (searchTerm) {
      filter.$or = [
        { 'farmer.name': { $regex: searchTerm, $options: 'i' } },
        { 'farmer.email': { $regex: searchTerm, $options: 'i' } },
        { 'farmer.phone': { $regex: searchTerm, $options: 'i' } }
      ]
    }

    const skip = (parseInt(page) - 1) * parseInt(limit)

    const onboardings = await Onboarding.find(filter)
      .populate('farmer', 'name email phone location')
      .populate('assignedPartner', 'name organization')
      .populate('assignedAgent', 'name email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))

    const total = await Onboarding.countDocuments(filter)

    res.json({
      status: 'success',
      data: {
        onboardings,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(total / parseInt(limit)),
          totalItems: total,
          itemsPerPage: parseInt(limit)
        }
      }
    })
  } catch (error) {
    console.error('Error fetching onboardings:', error)
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch onboardings',
      error: error.message
    })
  }
}

// Get onboarding by ID
exports.getOnboardingById = async (req, res) => {
  try {
    const { id } = req.params

    const onboarding = await Onboarding.findById(id)
      .populate('farmer', 'name email phone location farmSize primaryCrops farmingExperience educationLevel householdSize')
      .populate('assignedPartner', 'name organization email phone')
      .populate('assignedAgent', 'name email phone')
      .populate('documents.idCard.verifiedBy', 'name')
      .populate('documents.passportPhoto.verifiedBy', 'name')
      .populate('documents.landDocument.verifiedBy', 'name')
      .populate('documents.bankStatement.verifiedBy', 'name')
      .populate('notes.createdBy', 'name')
      .populate('communications.sentBy', 'name')

    if (!onboarding) {
      return res.status(404).json({
        status: 'error',
        message: 'Onboarding not found'
      })
    }

    // Check if user has permission to view this onboarding
    if (req.user.role === 'partner' && onboarding.assignedPartner.toString() !== req.user.id) {
      return res.status(403).json({
        status: 'error',
        message: 'Access denied'
      })
    }

    if (req.user.role === 'farmer' && onboarding.farmer._id.toString() !== req.user.id) {
      return res.status(403).json({
        status: 'error',
        message: 'Access denied'
      })
    }

    res.json({
      status: 'success',
      data: onboarding
    })
  } catch (error) {
    console.error('Error fetching onboarding:', error)
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch onboarding',
      error: error.message
    })
  }
}

// Create new onboarding
exports.createOnboarding = async (req, res) => {
  try {
    const {
      farmerId,
      assignedPartner,
      assignedAgent,
      priority = 'medium',
      notes,
      estimatedCompletionDate,
      location
    } = req.body

    // Verify farmer exists and is a farmer
    const farmer = await User.findById(farmerId)
    if (!farmer || farmer.role !== 'farmer') {
      return res.status(400).json({
        status: 'error',
        message: 'Invalid farmer'
      })
    }

    // Verify partner exists
    const partner = await Partner.findById(assignedPartner)
    if (!partner) {
      return res.status(400).json({
        status: 'error',
        message: 'Invalid partner'
      })
    }

    // Check if onboarding already exists for this farmer
    const existingOnboarding = await Onboarding.findOne({ farmer: farmerId })
    if (existingOnboarding) {
      return res.status(400).json({
        status: 'error',
        message: 'Onboarding already exists for this farmer'
      })
    }

    const onboarding = new Onboarding({
      farmer: farmerId,
      assignedPartner,
      assignedAgent,
      priority,
      estimatedCompletionDate: estimatedCompletionDate ? new Date(estimatedCompletionDate) : undefined,
      location,
      notes: notes ? [{
        content: notes,
        createdBy: req.user.id,
        type: 'general'
      }] : []
    })

    await onboarding.save()

    const populatedOnboarding = await Onboarding.findById(onboarding._id)
      .populate('farmer', 'name email phone location')
      .populate('assignedPartner', 'name organization')
      .populate('assignedAgent', 'name email')

    res.status(201).json({
      status: 'success',
      message: 'Onboarding created successfully',
      data: populatedOnboarding
    })
  } catch (error) {
    console.error('Error creating onboarding:', error)
    res.status(500).json({
      status: 'error',
      message: 'Failed to create onboarding',
      error: error.message
    })
  }
}

// Update onboarding
exports.updateOnboarding = async (req, res) => {
  try {
    const { id } = req.params
    const updateData = req.body

    const onboarding = await Onboarding.findById(id)
    if (!onboarding) {
      return res.status(404).json({
        status: 'error',
        message: 'Onboarding not found'
      })
    }

    // Check permissions
    if (req.user.role === 'partner' && onboarding.assignedPartner.toString() !== req.user.id) {
      return res.status(403).json({
        status: 'error',
        message: 'Access denied'
      })
    }

    // Update the onboarding
    Object.assign(onboarding, updateData)
    await onboarding.save()

    const updatedOnboarding = await Onboarding.findById(id)
      .populate('farmer', 'name email phone location')
      .populate('assignedPartner', 'name organization')
      .populate('assignedAgent', 'name email')

    res.json({
      status: 'success',
      message: 'Onboarding updated successfully',
      data: updatedOnboarding
    })
  } catch (error) {
    console.error('Error updating onboarding:', error)
    res.status(500).json({
      status: 'error',
      message: 'Failed to update onboarding',
      error: error.message
    })
  }
}

// Update onboarding stage
exports.updateOnboardingStage = async (req, res) => {
  try {
    const { id } = req.params
    const { stage, notes } = req.body

    const onboarding = await Onboarding.findById(id)
    if (!onboarding) {
      return res.status(404).json({
        status: 'error',
        message: 'Onboarding not found'
      })
    }

    // Check permissions
    if (req.user.role === 'partner' && onboarding.assignedPartner.toString() !== req.user.id) {
      return res.status(403).json({
        status: 'error',
        message: 'Access denied'
      })
    }

    onboarding.stage = stage
    onboarding.updatedAt = new Date()

    if (notes) {
      onboarding.notes.push({
        content: notes,
        createdBy: req.user.id,
        type: 'general'
      })
    }

    await onboarding.save()

    const updatedOnboarding = await Onboarding.findById(id)
      .populate('farmer', 'name email phone location')
      .populate('assignedPartner', 'name organization')
      .populate('assignedAgent', 'name email')

    res.json({
      status: 'success',
      message: 'Onboarding stage updated successfully',
      data: updatedOnboarding
    })
  } catch (error) {
    console.error('Error updating onboarding stage:', error)
    res.status(500).json({
      status: 'error',
      message: 'Failed to update onboarding stage',
      error: error.message
    })
  }
}

// Delete onboarding
exports.deleteOnboarding = async (req, res) => {
  try {
    const { id } = req.params

    const onboarding = await Onboarding.findById(id)
    if (!onboarding) {
      return res.status(404).json({
        status: 'error',
        message: 'Onboarding not found'
      })
    }

    // Only allow deletion by partner who owns it or admin
    if (req.user.role === 'partner' && onboarding.assignedPartner.toString() !== req.user.id) {
      return res.status(403).json({
        status: 'error',
        message: 'Access denied'
      })
    }

    await Onboarding.findByIdAndDelete(id)

    res.json({
      status: 'success',
      message: 'Onboarding deleted successfully'
    })
  } catch (error) {
    console.error('Error deleting onboarding:', error)
    res.status(500).json({
      status: 'error',
      message: 'Failed to delete onboarding',
      error: error.message
    })
  }
}

// Get onboarding statistics
exports.getOnboardingStats = async (req, res) => {
  try {
    let filter = {}

    // Apply role-based filtering
    if (req.user.role === 'partner') {
      filter.assignedPartner = req.user.id
    }

    const stats = await Onboarding.aggregate([
      { $match: filter },
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          pending: {
            $sum: { $cond: [{ $eq: ['$status', 'pending'] }, 1, 0] }
          },
          inProgress: {
            $sum: { $cond: [{ $eq: ['$status', 'in_progress'] }, 1, 0] }
          },
          completed: {
            $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] }
          },
          rejected: {
            $sum: { $cond: [{ $eq: ['$status', 'rejected'] }, 1, 0] }
          },
          onHold: {
            $sum: { $cond: [{ $eq: ['$status', 'on_hold'] }, 1, 0] }
          }
        }
      }
    ])

    const result = stats[0] || {
      total: 0,
      pending: 0,
      inProgress: 0,
      completed: 0,
      rejected: 0,
      onHold: 0
    }

    // Calculate success rate
    const completedCount = result.completed
    const totalProcessed = result.completed + result.rejected
    const successRate = totalProcessed > 0 ? Math.round((completedCount / totalProcessed) * 100) : 0

    // Get average completion time (simplified)
    const averageCompletionTime = 28 // Default value, can be calculated from actual data

    // Get regional distribution
    const regionalStats = await Onboarding.aggregate([
      { $match: filter },
      {
        $group: {
          _id: '$location.state',
          count: { $sum: 1 }
        }
      },
      { $sort: { count: -1 } }
    ])

    // Get crop distribution (simplified - would need to join with farmer data)
    const cropDistribution = {
      'Maize': 3,
      'Rice': 2,
      'Cassava': 1,
      'Tomatoes': 1,
      'Yam': 1
    }

    // Get time-based stats
    const now = new Date()
    const startOfWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)

    const timeStats = await Onboarding.aggregate([
      { $match: filter },
      {
        $group: {
          _id: null,
          thisWeek: {
            $sum: {
              $cond: [{ $gte: ['$createdAt', startOfWeek] }, 1, 0]
            }
          },
          thisMonth: {
            $sum: {
              $cond: [{ $gte: ['$createdAt', startOfMonth] }, 1, 0]
            }
          }
        }
      }
    ])

    const timeResult = timeStats[0] || { thisWeek: 0, thisMonth: 0 }

    const comprehensiveStats = {
      total: result.total,
      pending: result.pending,
      inProgress: result.inProgress,
      completed: result.completed,
      rejected: result.rejected,
      onHold: result.onHold,
      thisWeek: timeResult.thisWeek,
      thisMonth: timeResult.thisMonth,
      successRate,
      averageCompletionTime,
      regionalDistribution: regionalStats.reduce((acc, stat) => {
        if (stat._id) acc[stat._id] = stat.count
        return acc
      }, {}),
      cropDistribution
    }

    res.json({
      status: 'success',
      data: comprehensiveStats
    })
  } catch (error) {
    console.error('Error fetching onboarding stats:', error)
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch onboarding statistics',
      error: error.message
    })
  }
}

// Get onboarding progress for a farmer
exports.getOnboardingProgress = async (req, res) => {
  try {
    const { farmerId } = req.params

    const onboarding = await Onboarding.findOne({ farmer: farmerId })
      .populate('farmer', 'name email')

    if (!onboarding) {
      return res.status(404).json({
        status: 'error',
        message: 'Onboarding not found'
      })
    }

    // Check permissions
    if (req.user.role === 'partner' && onboarding.assignedPartner.toString() !== req.user.id) {
      return res.status(403).json({
        status: 'error',
        message: 'Access denied'
      })
    }

    if (req.user.role === 'farmer' && onboarding.farmer._id.toString() !== req.user.id) {
      return res.status(403).json({
        status: 'error',
        message: 'Access denied'
      })
    }

    const stages = ['registration', 'documentation', 'training', 'verification', 'activation']
    const currentStageIndex = stages.indexOf(onboarding.stage)
    const progress = ((currentStageIndex + 1) / stages.length) * 100

    const progressData = {
      farmerId: onboarding.farmer._id,
      farmerName: onboarding.farmer.name,
      currentStage: onboarding.stage,
      currentStageIndex,
      totalStages: stages.length,
      overallProgress: Math.round(progress),
      completedStages: stages.slice(0, currentStageIndex + 1),
      pendingStages: stages.slice(currentStageIndex + 1),
      estimatedCompletionDate: onboarding.estimatedCompletionDate,
      actualCompletionDate: onboarding.actualCompletionDate,
      status: onboarding.status,
      nextFollowUp: onboarding.nextFollowUp,
      trainingProgress: onboarding.training.progress || 0,
      documentsUploaded: onboarding.metrics.documentsUploaded || 0,
      trainingModulesCompleted: onboarding.metrics.trainingModulesCompleted || 0,
      timeInCurrentStage: onboarding.metrics.timeInStage || 0,
      totalTimeInOnboarding: onboarding.metrics.totalTime || 0
    }

    res.json({
      status: 'success',
      data: progressData
    })
  } catch (error) {
    console.error('Error fetching onboarding progress:', error)
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch onboarding progress',
      error: error.message
    })
  }
}

// Bulk operations
exports.bulkUpdateOnboardings = async (req, res) => {
  try {
    const { onboardingIds, updates } = req.body

    if (!Array.isArray(onboardingIds) || onboardingIds.length === 0) {
      return res.status(400).json({
        status: 'error',
        message: 'Invalid onboarding IDs'
      })
    }

    // Check permissions for all onboardings
    if (req.user.role === 'partner') {
      const onboardings = await Onboarding.find({
        _id: { $in: onboardingIds },
        assignedPartner: req.user.id
      })

      if (onboardings.length !== onboardingIds.length) {
        return res.status(403).json({
          status: 'error',
          message: 'Access denied to some onboardings'
        })
      }
    }

    const result = await Onboarding.updateMany(
      { _id: { $in: onboardingIds } },
      {
        ...updates,
        updatedAt: new Date()
      }
    )

    res.json({
      status: 'success',
      message: `Updated ${result.modifiedCount} onboardings`,
      data: {
        modifiedCount: result.modifiedCount,
        matchedCount: result.matchedCount
      }
    })
  } catch (error) {
    console.error('Error bulk updating onboardings:', error)
    res.status(500).json({
      status: 'error',
      message: 'Failed to bulk update onboardings',
      error: error.message
    })
  }
}

// Export onboardings
exports.exportOnboardings = async (req, res) => {
  try {
    const { format = 'csv', filters = {} } = req.body

    let query = {}

    // Apply user role-based filtering
    if (req.user.role === 'partner') {
      query.assignedPartner = req.user.id
    } else if (req.user.role === 'farmer') {
      query.farmer = req.user.id
    }

    // Apply filters
    if (filters.status) query.status = filters.status
    if (filters.stage) query.stage = filters.stage
    if (filters.priority) query.priority = filters.priority

    const onboardings = await Onboarding.find(query)
      .populate('farmer', 'name email phone location farmSize primaryCrops farmingExperience educationLevel householdSize')
      .populate('assignedPartner', 'name organization')
      .populate('assignedAgent', 'name email')
      .sort({ createdAt: -1 })

    if (format === 'csv') {
      const csvData = generateOnboardingCSV(onboardings)
      res.setHeader('Content-Type', 'text/csv')
      res.setHeader('Content-Disposition', 'attachment; filename="onboardings.csv"')
      res.send(csvData)
    } else {
      res.json({
        status: 'success',
        data: onboardings
      })
    }
  } catch (error) {
    console.error('Error exporting onboardings:', error)
    res.status(500).json({
      status: 'error',
      message: 'Failed to export onboardings',
      error: error.message
    })
  }
}

// Helper function to generate CSV
function generateOnboardingCSV(onboardings) {
  const headers = [
    'ID',
    'Farmer Name',
    'Email',
    'Phone',
    'State',
    'LGA',
    'Village',
    'Farm Size',
    'Primary Crops',
    'Status',
    'Stage',
    'Priority',
    'Assigned Agent',
    'Created Date',
    'Estimated Completion',
    'Training Progress',
    'Documents Uploaded'
  ]

  const rows = onboardings.map(onboarding => [
    onboarding._id,
    onboarding.farmer.name,
    onboarding.farmer.email,
    onboarding.farmer.phone,
    onboarding.location?.state || '',
    onboarding.location?.lga || '',
    onboarding.location?.village || '',
    onboarding.farmer.farmSize || '',
    onboarding.farmer.primaryCrops?.join('; ') || '',
    onboarding.status,
    onboarding.stage,
    onboarding.priority,
    onboarding.assignedAgent?.name || '',
    onboarding.createdAt.toISOString().split('T')[0],
    onboarding.estimatedCompletionDate ? onboarding.estimatedCompletionDate.toISOString().split('T')[0] : '',
    onboarding.training.progress || 0,
    onboarding.metrics.documentsUploaded || 0
  ])

  return [headers, ...rows].map(row =>
    row.map(field => `"${field}"`).join(',')
  ).join('\n')
}
