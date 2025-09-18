const mongoose = require('mongoose')
const mongoosePaginate = require('mongoose-paginate-v2')

const fintechSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ['loan', 'insurance', 'investment', 'savings'],
    required: true,
    index: true
  },
  name: {
    type: String,
    required: true,
    maxlength: 100
  },
  description: {
    type: String,
    maxlength: 1000
  },
  provider: {
    type: String,
    required: true,
    maxlength: 100
  },
  category: {
    type: String,
    required: true,
    maxlength: 50
  },
  requirements: [{
    field: String,
    type: {
      type: String,
      enum: ['string', 'number', 'boolean', 'file', 'select']
    },
    required: Boolean,
    options: [String], // For select type
    validation: String
  }],
  eligibility: {
    minAge: Number,
    maxAge: Number,
    minIncome: Number,
    maxIncome: Number,
    creditScore: {
      min: Number,
      max: Number
    },
    employmentType: [String],
    location: [String]
  },
  terms: {
    minAmount: Number,
    maxAmount: Number,
    minTerm: Number, // in months
    maxTerm: Number, // in months
    interestRate: {
      type: Number,
      min: 0,
      max: 100
    },
    processingFee: Number,
    lateFee: Number
  },
  features: [{
    name: String,
    description: String,
    included: Boolean
  }],
  documents: [{
    name: String,
    required: Boolean,
    description: String
  }],
  status: {
    type: String,
    enum: ['active', 'inactive', 'draft'],
    default: 'active',
    index: true
  },
  approvalTime: {
    type: String,
    enum: ['instant', 'same_day', 'next_day', '3_days', '1_week', '2_weeks'],
    default: '1_week'
  },
  successRate: {
    type: Number,
    min: 0,
    max: 100,
    default: 75
  },
  rating: {
    average: {
      type: Number,
      min: 0,
      max: 5,
      default: 0
    },
    count: {
      type: Number,
      default: 0
    }
  },
  tags: [String],
  isPopular: {
    type: Boolean,
    default: false
  },
  isRecommended: {
    type: Boolean,
    default: false
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
})

// Indexes for better query performance
fintechSchema.index({ type: 1, category: 1, status: 1 })
fintechSchema.index({ provider: 1, status: 1 })
fintechSchema.index({ isPopular: 1, status: 1 })
fintechSchema.index({ isRecommended: 1, status: 1 })
fintechSchema.index({ tags: 1, status: 1 })

// Add pagination plugin
fintechSchema.plugin(mongoosePaginate)

// Virtual for approval rate
fintechSchema.virtual('approvalRate').get(function() {
  return this.successRate
})

// Ensure virtual fields are serialized
fintechSchema.set('toJSON', { virtuals: true })
fintechSchema.set('toObject', { virtuals: true })

// Static method to get products by type with filters
fintechSchema.statics.getProductsByType = function(type, filters = {}, page = 1, limit = 20) {
  const query = { type, status: 'active', ...filters }
  
  return this.paginate(query, {
    page,
    limit,
    sort: { isPopular: -1, isRecommended: -1, rating: { average: -1 } },
    populate: [
      { path: 'createdBy', select: 'name' },
      { path: 'updatedBy', select: 'name' }
    ]
  })
}

// Static method to get recommended products for a user
fintechSchema.statics.getRecommendedProducts = function(userProfile, limit = 10) {
  const { age, income, creditScore, employmentType, location } = userProfile
  
  return this.aggregate([
    { $match: { status: 'active' } },
    {
      $addFields: {
        eligibilityScore: {
          $sum: [
            // Age eligibility
            {
              $cond: {
                if: {
                  $and: [
                    { $gte: [age, '$eligibility.minAge'] },
                    { $lte: [age, '$eligibility.maxAge'] }
                  ]
                },
                then: 10,
                else: 0
              }
            },
            // Income eligibility
            {
              $cond: {
                if: {
                  $and: [
                    { $gte: [income, '$eligibility.minIncome'] },
                    { $lte: [income, '$eligibility.maxIncome'] }
                  ]
                },
                then: 10,
                else: 0
              }
            },
            // Credit score eligibility
            {
              $cond: {
                if: {
                  $and: [
                    { $gte: [creditScore, '$eligibility.creditScore.min'] },
                    { $lte: [creditScore, '$eligibility.creditScore.max'] }
                  ]
                },
                then: 10,
                else: 0
              }
            },
            // Employment type match
            {
              $cond: {
                if: { $in: [employmentType, '$eligibility.employmentType'] },
                then: 5,
                else: 0
              }
            },
            // Location match
            {
              $cond: {
                if: { $in: [location, '$eligibility.location'] },
                then: 5,
                else: 0
              }
            },
            // Popular bonus
            { $cond: { if: '$isPopular', then: 5, else: 0 } },
            // Recommended bonus
            { $cond: { if: '$isRecommended', then: 5, else: 0 } },
            // Rating bonus
            { $multiply: ['$rating.average', 2] }
          ]
        }
      }
    },
    { $sort: { eligibilityScore: -1 } },
    { $limit: limit },
    {
      $lookup: {
        from: 'users',
        localField: 'createdBy',
        foreignField: '_id',
        as: 'createdBy'
      }
    },
    {
      $unwind: '$createdBy'
    },
    {
      $project: {
        _id: 1,
        type: 1,
        name: 1,
        description: 1,
        provider: 1,
        category: 1,
        terms: 1,
        features: 1,
        approvalTime: 1,
        successRate: 1,
        rating: 1,
        tags: 1,
        eligibilityScore: 1,
        createdBy: {
          _id: '$createdBy._id',
          name: '$createdBy.name'
        }
      }
    }
  ])
}

// Static method to search products
fintechSchema.statics.searchProducts = function(searchTerm, filters = {}, page = 1, limit = 20) {
  const query = {
    status: 'active',
    $or: [
      { name: { $regex: searchTerm, $options: 'i' } },
      { description: { $regex: searchTerm, $options: 'i' } },
      { provider: { $regex: searchTerm, $options: 'i' } },
      { category: { $regex: searchTerm, $options: 'i' } },
      { tags: { $in: [new RegExp(searchTerm, 'i')] } }
    ],
    ...filters
  }
  
  return this.paginate(query, {
    page,
    limit,
    sort: { isPopular: -1, rating: { average: -1 } },
    populate: [
      { path: 'createdBy', select: 'name' }
    ]
  })
}

// Static method to get product statistics
fintechSchema.statics.getProductStats = function() {
  return this.aggregate([
    { $match: { status: 'active' } },
    {
      $group: {
        _id: '$type',
        count: { $sum: 1 },
        avgSuccessRate: { $avg: '$successRate' },
        avgRating: { $avg: '$rating.average' },
        totalRatingCount: { $sum: '$rating.count' }
      }
    },
    {
      $project: {
        type: '$_id',
        count: 1,
        avgSuccessRate: { $round: ['$avgSuccessRate', 2] },
        avgRating: { $round: ['$avgRating', 2] },
        totalRatingCount: 1
      }
    }
  ])
}

// Instance method to update rating
fintechSchema.methods.updateRating = function(newRating) {
  const currentTotal = this.rating.average * this.rating.count
  const newTotal = currentTotal + newRating
  const newCount = this.rating.count + 1
  const newAverage = newTotal / newCount
  
  this.rating.average = Math.round(newAverage * 100) / 100
  this.rating.count = newCount
  
  return this.save()
}

// Pre-save middleware to update updatedBy
fintechSchema.pre('save', function(next) {
  if (this.isModified() && !this.isNew) {
    this.updatedAt = new Date()
  }
  next()
})

module.exports = mongoose.model('Fintech', fintechSchema)

