const mongoose = require('mongoose')

const OnboardingSchema = new mongoose.Schema({
  // Farmer reference
  farmer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },

  // Partner who manages this onboarding
  assignedPartner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Partner',
    required: true
  },

  // Agent assigned to this onboarding
  assignedAgent: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },

  // Onboarding status
  status: {
    type: String,
    enum: ['pending', 'in_progress', 'completed', 'rejected', 'on_hold'],
    default: 'pending'
  },

  // Current stage in onboarding process
  stage: {
    type: String,
    enum: ['registration', 'documentation', 'training', 'verification', 'activation'],
    default: 'registration'
  },

  // Priority level
  priority: {
    type: String,
    enum: ['low', 'medium', 'high'],
    default: 'medium'
  },

  // Document uploads
  documents: {
    idCard: {
      url: String,
      uploadedAt: Date,
      verified: { type: Boolean, default: false },
      verifiedAt: Date,
      verifiedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
    },
    passportPhoto: {
      url: String,
      uploadedAt: Date,
      verified: { type: Boolean, default: false },
      verifiedAt: Date,
      verifiedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
    },
    landDocument: {
      url: String,
      uploadedAt: Date,
      verified: { type: Boolean, default: false },
      verifiedAt: Date,
      verifiedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
    },
    bankStatement: {
      url: String,
      uploadedAt: Date,
      verified: { type: Boolean, default: false },
      verifiedAt: Date,
      verifiedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
    }
  },

  // Training progress
  training: {
    completedModules: [{
      moduleId: String,
      moduleName: String,
      completedAt: Date,
      score: Number
    }],
    currentModule: {
      moduleId: String,
      moduleName: String,
      startedAt: Date,
      progress: { type: Number, default: 0, min: 0, max: 100 }
    },
    certificates: [{
      moduleId: String,
      moduleName: String,
      issuedAt: Date,
      certificateUrl: String
    }],
    lastTrainingDate: Date,
    totalTrainingHours: { type: Number, default: 0 }
  },

  // Communication history
  communications: [{
    type: {
      type: String,
      enum: ['sms', 'email', 'call', 'visit'],
      required: true
    },
    subject: String,
    content: String,
    sentAt: Date,
    sentBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    status: {
      type: String,
      enum: ['sent', 'delivered', 'failed', 'pending'],
      default: 'pending'
    },
    notes: String
  }],

  // Notes and follow-ups
  notes: [{
    content: String,
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    createdAt: { type: Date, default: Date.now },
    type: {
      type: String,
      enum: ['general', 'follow_up', 'issue', 'resolution'],
      default: 'general'
    }
  }],

  // Follow-up scheduling
  nextFollowUp: Date,
  followUpHistory: [{
    scheduledAt: Date,
    completedAt: Date,
    type: {
      type: String,
      enum: ['call', 'visit', 'training', 'verification'],
      required: true
    },
    notes: String,
    outcome: String
  }],

  // Estimated completion dates
  estimatedCompletionDate: Date,
  actualCompletionDate: Date,

  // Rejection details (if rejected)
  rejectionReason: String,
  rejectedAt: Date,
  rejectedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },

  // On-hold details
  holdReason: String,
  holdStartedAt: Date,
  holdExpectedResolution: Date,

  // Quality scores and metrics
  qualityScore: {
    documentation: { type: Number, min: 0, max: 100 },
    training: { type: Number, min: 0, max: 100 },
    verification: { type: Number, min: 0, max: 100 },
    overall: { type: Number, min: 0, max: 100 }
  },

  // Tags and categories for filtering
  tags: [String],
  categories: [String],

  // Geographic data
  location: {
    state: String,
    lga: String,
    village: String,
    coordinates: {
      latitude: Number,
      longitude: Number
    }
  },

  // Performance metrics
  metrics: {
    timeInStage: { type: Number, default: 0 }, // days in current stage
    totalTime: { type: Number, default: 0 }, // total days in onboarding
    interactionsCount: { type: Number, default: 0 },
    documentsUploaded: { type: Number, default: 0 },
    trainingModulesCompleted: { type: Number, default: 0 }
  }
}, {
  timestamps: true
})

// Indexes for efficient querying
OnboardingSchema.index({ farmer: 1 })
OnboardingSchema.index({ assignedPartner: 1 })
OnboardingSchema.index({ assignedAgent: 1 })
OnboardingSchema.index({ status: 1 })
OnboardingSchema.index({ stage: 1 })
OnboardingSchema.index({ priority: 1 })
OnboardingSchema.index({ 'location.state': 1 })
OnboardingSchema.index({ createdAt: -1 })
OnboardingSchema.index({ nextFollowUp: 1 })

// Virtual for completion percentage
OnboardingSchema.virtual('completionPercentage').get(function() {
  const stages = ['registration', 'documentation', 'training', 'verification', 'activation']
  const currentIndex = stages.indexOf(this.stage)
  return Math.round(((currentIndex + 1) / stages.length) * 100)
})

// Pre-save middleware to update metrics
OnboardingSchema.pre('save', function(next) {
  if (this.isModified()) {
    // Update document count
    const documentFields = ['documents.idCard', 'documents.passportPhoto', 'documents.landDocument', 'documents.bankStatement']
    this.metrics.documentsUploaded = documentFields.filter(field => {
      const fieldParts = field.split('.')
      let value = this
      for (const part of fieldParts) {
        value = value[part]
      }
      return value && value.url
    }).length

    // Update training modules count
    this.metrics.trainingModulesCompleted = this.training.completedModules.length
  }
  next()
})

module.exports = mongoose.model('Onboarding', OnboardingSchema)
