const User = require('../models/user.model')
const axios = require('axios')

// BVN verification service configuration
const BVN_SERVICE_CONFIG = {
  baseURL: process.env.BVN_SERVICE_URL || 'https://api.flutterwave.com/v3',
  secretKey: process.env.FLUTTERWAVE_SECRET_KEY,
  timeout: 30000
}

// Verify BVN with Flutterwave API
exports.verifyBVN = async (req, res) => {
  try {
    const { bvn, firstName, lastName, dateOfBirth } = req.body

    if (!bvn || !firstName || !lastName || !dateOfBirth) {
      return res.status(400).json({
        status: 'error',
        message: 'BVN, firstName, lastName, and dateOfBirth are required'
      })
    }

    // Validate BVN format (11 digits)
    if (!/^\d{11}$/.test(bvn)) {
      return res.status(400).json({
        status: 'error',
        message: 'BVN must be exactly 11 digits'
      })
    }

    // Validate date format
    const birthDate = new Date(dateOfBirth)
    if (isNaN(birthDate.getTime())) {
      return res.status(400).json({
        status: 'error',
        message: 'Invalid date of birth format'
      })
    }

    // Check if BVN is already verified for another user
    const existingUser = await User.findOne({ 
      'bvnVerification.bvn': bvn,
      'bvnVerification.verified': true,
      _id: { $ne: req.user.id }
    })

    if (existingUser) {
      return res.status(409).json({
        status: 'error',
        message: 'BVN is already verified for another user'
      })
    }

    // Call Flutterwave BVN verification API
    const verificationResponse = await axios.post(
      `${BVN_SERVICE_CONFIG.baseURL}/kyc/bvn`,
      {
        bvn,
        firstname: firstName,
        lastname: lastName,
        date_of_birth: dateOfBirth
      },
      {
        headers: {
          'Authorization': `Bearer ${BVN_SERVICE_CONFIG.secretKey}`,
          'Content-Type': 'application/json'
        },
        timeout: BVN_SERVICE_CONFIG.timeout
      }
    )

    const { data } = verificationResponse.data

    if (data.status === 'success') {
      const bvnData = data.data

      // Update user's BVN verification status
      await User.findByIdAndUpdate(req.user.id, {
        'bvnVerification.bvn': bvn,
        'bvnVerification.verified': true,
        'bvnVerification.verifiedAt': new Date(),
        'bvnVerification.verificationData': {
          firstName: bvnData.first_name,
          lastName: bvnData.last_name,
          middleName: bvnData.middle_name,
          dateOfBirth: bvnData.date_of_birth,
          phoneNumber: bvnData.phone_number,
          registrationDate: bvnData.registration_date,
          enrollmentBank: bvnData.enrollment_bank,
          enrollmentBranch: bvnData.enrollment_branch
        },
        'bvnVerification.status': 'verified'
      })

      return res.json({
        status: 'success',
        message: 'BVN verification successful',
        data: {
          bvn: bvnData.bvn,
          firstName: bvnData.first_name,
          lastName: bvnData.last_name,
          middleName: bvnData.middle_name,
          dateOfBirth: bvnData.date_of_birth,
          phoneNumber: bvnData.phone_number,
          enrollmentBank: bvnData.enrollment_bank
        }
      })
    } else {
      // Update user's BVN verification status as failed
      await User.findByIdAndUpdate(req.user.id, {
        'bvnVerification.bvn': bvn,
        'bvnVerification.verified': false,
        'bvnVerification.verifiedAt': new Date(),
        'bvnVerification.status': 'failed',
        'bvnVerification.failureReason': 'API verification failed'
      })

      return res.status(400).json({
        status: 'error',
        message: 'BVN verification failed',
        data: {
          reason: 'The provided BVN details do not match our records'
        }
      })
    }
  } catch (error) {
    console.error('BVN verification error:', error)

    // Update user's BVN verification status as failed
    if (req.user && req.body.bvn) {
      await User.findByIdAndUpdate(req.user.id, {
        'bvnVerification.bvn': req.body.bvn,
        'bvnVerification.verified': false,
        'bvnVerification.verifiedAt': new Date(),
        'bvnVerification.status': 'failed',
        'bvnVerification.failureReason': error.message || 'Verification service error'
      })
    }

    if (error.response) {
      // API error response
      return res.status(error.response.status).json({
        status: 'error',
        message: 'BVN verification service error',
        data: {
          reason: error.response.data?.message || 'Service temporarily unavailable'
        }
      })
    }

    if (error.code === 'ECONNABORTED') {
      return res.status(408).json({
        status: 'error',
        message: 'BVN verification request timeout',
        data: {
          reason: 'Service is taking too long to respond'
        }
      })
    }

    return res.status(500).json({
      status: 'error',
      message: 'Internal server error during BVN verification'
    })
  }
}

// Get BVN verification status
exports.getBVNStatus = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('bvnVerification')

    if (!user) {
      return res.status(404).json({
        status: 'error',
        message: 'User not found'
      })
    }

    return res.json({
      status: 'success',
      data: {
        bvn: user.bvnVerification?.bvn || null,
        verified: user.bvnVerification?.verified || false,
        status: user.bvnVerification?.status || 'not_verified',
        verifiedAt: user.bvnVerification?.verifiedAt || null,
        failureReason: user.bvnVerification?.failureReason || null
      }
    })
  } catch (error) {
    console.error('Get BVN status error:', error)
    return res.status(500).json({
      status: 'error',
      message: 'Internal server error while getting BVN status'
    })
  }
}

// Resend BVN verification
exports.resendBVNVerification = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('bvnVerification')

    if (!user) {
      return res.status(404).json({
        status: 'error',
        message: 'User not found'
      })
    }

    if (!user.bvnVerification?.bvn) {
      return res.status(400).json({
        status: 'error',
        message: 'No BVN found for verification'
      })
    }

    if (user.bvnVerification.verified) {
      return res.status(400).json({
        status: 'error',
        message: 'BVN is already verified'
      })
    }

    // Check if enough time has passed since last attempt (24 hours)
    const lastAttempt = user.bvnVerification.verifiedAt
    const hoursSinceLastAttempt = lastAttempt ? 
      (Date.now() - new Date(lastAttempt).getTime()) / (1000 * 60 * 60) : 24

    if (hoursSinceLastAttempt < 24) {
      return res.status(429).json({
        status: 'error',
        message: 'Please wait 24 hours before attempting BVN verification again',
        data: {
          nextAttemptTime: new Date(lastAttempt.getTime() + 24 * 60 * 60 * 1000)
        }
      })
    }

    // Reset verification status for new attempt
    await User.findByIdAndUpdate(req.user.id, {
      'bvnVerification.status': 'pending',
      'bvnVerification.failureReason': null
    })

    return res.json({
      status: 'success',
      message: 'BVN verification reset successfully. You can now attempt verification again.',
      data: {
        bvn: user.bvnVerification.bvn,
        status: 'pending'
      }
    })
  } catch (error) {
    console.error('Resend BVN verification error:', error)
    return res.status(500).json({
      status: 'error',
      message: 'Internal server error while resetting BVN verification'
    })
  }
}

// Update BVN information
exports.updateBVN = async (req, res) => {
  try {
    const { bvn, firstName, lastName, dateOfBirth } = req.body

    if (!bvn || !firstName || !lastName || !dateOfBirth) {
      return res.status(400).json({
        status: 'error',
        message: 'BVN, firstName, lastName, and dateOfBirth are required'
      })
    }

    // Validate BVN format
    if (!/^\d{11}$/.test(bvn)) {
      return res.status(400).json({
        status: 'error',
        message: 'BVN must be exactly 11 digits'
      })
    }

    // Check if new BVN is already verified for another user
    const existingUser = await User.findOne({ 
      'bvnVerification.bvn': bvn,
      'bvnVerification.verified': true,
      _id: { $ne: req.user.id }
    })

    if (existingUser) {
      return res.status(409).json({
        status: 'error',
        message: 'BVN is already verified for another user'
      })
    }

    // Update user's BVN information
    await User.findByIdAndUpdate(req.user.id, {
      'bvnVerification.bvn': bvn,
      'bvnVerification.verified': false,
      'bvnVerification.verifiedAt': null,
      'bvnVerification.status': 'pending',
      'bvnVerification.verificationData': null,
      'bvnVerification.failureReason': null
    })

    return res.json({
      status: 'success',
      message: 'BVN information updated successfully',
      data: {
        bvn,
        status: 'pending',
        message: 'Please verify your BVN with the new information'
      }
    })
  } catch (error) {
    console.error('Update BVN error:', error)
    return res.status(500).json({
      status: 'error',
      message: 'Internal server error while updating BVN information'
    })
  }
}

// Get BVN verification statistics (admin only)
exports.getBVNStats = async (req, res) => {
  try {
    const stats = await User.aggregate([
      {
        $group: {
          _id: '$bvnVerification.status',
          count: { $sum: 1 },
          users: { $push: { _id: '$id', email: '$email', name: '$name' } }
        }
      }
    ])

    const totalUsers = await User.countDocuments()
    const verifiedUsers = await User.countDocuments({ 'bvnVerification.verified': true })
    const pendingUsers = await User.countDocuments({ 'bvnVerification.status': 'pending' })
    const failedUsers = await User.countDocuments({ 'bvnVerification.status': 'failed' })

    return res.json({
      status: 'success',
      data: {
        total: totalUsers,
        verified: verifiedUsers,
        pending: pendingUsers,
        failed: failedUsers,
        verificationRate: totalUsers > 0 ? (verifiedUsers / totalUsers * 100).toFixed(2) : 0,
        breakdown: stats
      }
    })
  } catch (error) {
    console.error('Get BVN stats error:', error)
    return res.status(500).json({
      status: 'error',
      message: 'Internal server error while getting BVN statistics'
    })
  }
}

// Bulk BVN verification (admin only)
//
// Unlike the single-user flow above (which genuinely calls Flutterwave's
// BVN API), this used to just flip status to 'pending' and report success —
// no verification ever happened. It can't be made real as-is: the actual
// verification API call requires firstName/lastName/dateOfBirth, which are
// only ever submitted transiently in a single verifyBVN request body and
// are never persisted anywhere on the user record for a later retry to use.
// Making this genuinely functional needs those fields to be stored
// alongside bvnVerification.bvn at submission time — a real schema/flow
// change, not something to bolt on silently here. No frontend page calls
// this endpoint today, so it's marked honestly unimplemented instead.
exports.bulkBVNVerification = async (req, res) => {
  return res.status(501).json({
    status: 'error',
    message: 'Bulk BVN verification is not yet implemented — retrying verification requires each user\'s BVN details, which aren\'t currently stored for reuse. Use single-user verification for now.'
  })
}

