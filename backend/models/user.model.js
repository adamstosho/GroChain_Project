const mongoose = require('mongoose')
const bcrypt = require('bcryptjs')

const UserSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  phone: { type: String },
  password: { type: String, required: true },
  role: { type: String, enum: ['farmer', 'partner', 'admin', 'buyer'], required: true },
  status: { type: String, enum: ['active', 'inactive', 'suspended'], default: 'active' },
  partner: { type: mongoose.Schema.Types.ObjectId, ref: 'Partner' },
  emailVerified: { type: Boolean, default: false },
  phoneVerified: { type: Boolean, default: false },
  location: { type: String },
  gender: { type: String, enum: ['male', 'female', 'other'] },
  age: { type: Number, min: 18, max: 120 },
  education: { type: String },
  company: { type: String },
  businessType: { type: String },
  website: { type: String },
  suspensionReason: { type: String },
  suspendedAt: { type: Date },
  suspendedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  resetPasswordToken: { type: String },
  resetPasswordExpires: { type: Date },
  emailVerificationToken: { type: String },
  emailVerificationExpires: { type: Date },
  smsOtpToken: { type: String },
  smsOtpExpires: { type: Date },
  smsOtpAttempts: { type: Number, default: 0 },
  pushToken: { type: String },
  notificationPreferences: {
    websocket: { type: Boolean, default: true },
    email: { type: Boolean, default: true },
    sms: { type: Boolean, default: false },
    push: { type: Boolean, default: true },
    categories: [{
      type: String,
      enum: [
        'harvest', 
        'marketplace', 
        'financial', 
        'system', 
        'weather', 
        'shipment', 
        'payment', 
        'partner'
      ]
    }],
    priorityThreshold: {
      type: String,
      enum: ['low', 'normal', 'high', 'urgent'],
      default: 'normal'
    },
    lastUpdated: { type: Date, default: Date.now }
  },
  profile: {
    avatar: { type: String },
    bio: { type: String },
    farmName: { type: String },
    phone: { type: String },
    address: { type: String },
    city: { type: String },
    state: { type: String },
    country: { type: String, default: 'Nigeria' },
    postalCode: { type: String },
    coordinates: {
      lat: { type: Number },
      lng: { type: Number }
    }
  },
  settings: {
    language: { type: String, default: 'en' },
    timezone: { type: String, default: 'Africa/Lagos' },
    currency: { type: String, default: 'NGN' },
    theme: { type: String, enum: ['light', 'dark', 'auto'], default: 'auto' },
    notifications: { type: Boolean, default: true },
    marketing: { type: Boolean, default: false }
  },
  preferences: {
    cropTypes: [{ type: String }],
    locations: [{ type: String }],
    priceRange: {
      min: { type: Number },
      max: { type: Number }
    },
    qualityPreferences: [{ type: String }],
    organicPreference: { type: Boolean, default: false }
  },
  stats: {
    totalHarvests: { type: Number, default: 0 },
    totalListings: { type: Number, default: 0 },
    totalOrders: { type: Number, default: 0 },
    totalRevenue: { type: Number, default: 0 },
    lastActive: { type: Date, default: Date.now }
  }
}, { timestamps: true })

// Indexes
UserSchema.index({ phone: 1 })
UserSchema.index({ role: 1 })
UserSchema.index({ status: 1 })
UserSchema.index({ partner: 1 })
UserSchema.index({ location: 1 })
UserSchema.index({ createdAt: -1 })

// Pre-save middleware to hash password
UserSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next()
  
  try {
    const salt = await bcrypt.genSalt(12)
    this.password = await bcrypt.hash(this.password, salt)
    next()
  } catch (error) {
    next(error)
  }
})

// Method to compare password
UserSchema.methods.comparePassword = async function(candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password)
}

// Method to get public profile (without sensitive data)
UserSchema.methods.getPublicProfile = function() {
  const userObject = this.toObject()
  delete userObject.password
  delete userObject.resetPasswordToken
  delete userObject.resetPasswordExpires
  delete userObject.emailVerificationToken
  delete userObject.emailVerificationExpires
  delete userObject.smsOtpToken
  delete userObject.smsOtpExpires
  return userObject
}

// Method to get auth user data (for JWT tokens and middleware)
UserSchema.methods.getAuthData = function() {
  return {
    id: String(this._id),
    name: this.name,
    email: this.email,
    role: this.role,
    status: this.status
  }
}

// Static method to find user by ID with auth data
UserSchema.statics.findAuthUser = function(userId) {
  return this.findById(userId).select('name email role status')
}

// Transform to remove circular references and sensitive data
UserSchema.set('toJSON', {
  transform: function(doc, ret) {
    delete ret.password
    delete ret.resetPasswordToken
    delete ret.resetPasswordExpires
    delete ret.emailVerificationToken
    delete ret.emailVerificationExpires
    delete ret.smsOtpToken
    delete ret.smsOtpExpires
    delete ret.__v
    return ret
  }
})

UserSchema.set('toObject', {
  transform: function(doc, ret) {
    delete ret.password
    delete ret.resetPasswordToken
    delete ret.resetPasswordExpires
    delete ret.emailVerificationToken
    delete ret.emailVerificationExpires
    delete ret.smsOtpToken
    delete ret.smsOtpExpires
    delete ret.__v
    return ret
  }
})

module.exports = mongoose.model('User', UserSchema)
