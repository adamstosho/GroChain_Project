const mongoose = require('mongoose')
// Removed mongoose-paginate to avoid potential circular references
// const mongoosePaginate = require('mongoose-paginate-v2')

const favoriteSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  listing: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Listing',
    required: true
  },
  addedAt: {
    type: Date,
    default: Date.now
  },
  notes: {
    type: String,
    maxlength: 500
  }
}, {
  timestamps: true
})

// Compound index to prevent duplicate favorites
favoriteSchema.index({ user: 1, listing: 1 }, { unique: true })

// Removed pagination plugin to avoid potential circular references
// favoriteSchema.plugin(mongoosePaginate)

// Remove the virtual that causes circular references
// favoriteSchema.virtual('favoriteCount').get(function() {
//   return this.model('Favorite').countDocuments({ user: this.user })
// })

// Ensure virtual fields are serialized
favoriteSchema.set('toJSON', {
  // virtuals: true, // Disable virtuals to avoid circular references
  transform: function(doc, ret) {
    // Remove circular references and unnecessary fields
    delete ret.__v
    if (ret.listing && typeof ret.listing === 'object') {
      if (ret.listing.farmer && typeof ret.listing.farmer === 'object') {
        delete ret.listing.farmer.__v
      }
      if (ret.listing.harvest && typeof ret.listing.harvest === 'object') {
        delete ret.listing.harvest.__v
      }
    }
    return ret
  }
})
favoriteSchema.set('toObject', {
  // virtuals: true, // Disable virtuals to avoid circular references
  transform: function(doc, ret) {
    // Remove circular references and unnecessary fields
    delete ret.__v
    if (ret.listing && typeof ret.listing === 'object') {
      if (ret.listing.farmer && typeof ret.listing.farmer === 'object') {
        delete ret.listing.farmer.__v
      }
      if (ret.listing.harvest && typeof ret.listing.harvest === 'object') {
        delete ret.listing.harvest.__v
      }
    }
    return ret
  }
})

// Removed static method that used pagination plugin to avoid circular references
// favoriteSchema.statics.getUserFavorites = function(userId, page = 1, limit = 20) {
//   return this.paginate(
//     { user: userId },
//     {
//       page,
//       limit,
//       populate: [
//         {
//           path: 'listing',
//           populate: [
//             { path: 'farmer', select: 'name location' },
//             { path: 'harvest', select: 'batchId cropType quality' }
//           ]
//         }
//       ],
//       sort: { addedAt: -1 }
//     }
//   )
// }

// Static method to check if item is favorited
favoriteSchema.statics.isFavorited = function(userId, listingId) {
  return this.exists({ user: userId, listing: listingId })
}

// Static method to get favorite count for a listing
favoriteSchema.statics.getFavoriteCount = function(listingId) {
  return this.countDocuments({ listing: listingId })
}

// Static method to get popular listings based on favorites
favoriteSchema.statics.getPopularListings = function(limit = 10) {
  return this.aggregate([
    {
      $group: {
        _id: '$listing',
        favoriteCount: { $sum: 1 }
      }
    },
    {
      $sort: { favoriteCount: -1 }
    },
    {
      $limit: limit
    },
    {
      $lookup: {
        from: 'listings',
        localField: '_id',
        foreignField: '_id',
        as: 'listing'
      }
    },
    {
      $unwind: '$listing'
    },
    {
      $lookup: {
        from: 'users',
        localField: 'listing.farmer',
        foreignField: '_id',
        as: 'farmer'
      }
    },
    {
      $unwind: '$farmer'
    },
    {
      $project: {
        _id: '$listing._id',
        cropName: '$listing.cropName',
        price: '$listing.price',
        location: '$listing.location',
        quality: '$listing.quality',
        images: '$listing.images',
        favoriteCount: 1,
        farmer: {
          _id: '$farmer._id',
          name: '$farmer.name',
          location: '$farmer.location'
        }
      }
    }
  ])
}

module.exports = mongoose.model('Favorite', favoriteSchema)

