const { OAuth2Client } = require('google-auth-library')
const jwt = require('jsonwebtoken')
const User = require('../models/user.model')
const bcrypt = require('bcryptjs')

const client = new OAuth2Client(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.GOOGLE_REDIRECT_URI || 'http://localhost:3000/auth/google/callback'
)

const googleAuthController = {
  // Handle Google OAuth callback
  async handleGoogleCallback(req, res) {
    try {
      console.log('Google OAuth callback received:', req.body)
      const { code, state, redirectUri } = req.body

      if (!code) {
        console.log('No authorization code provided')
        return res.status(400).json({
          status: 'error',
          message: 'Authorization code is required'
        })
      }

      // Exchange code for tokens
      const { tokens } = await client.getToken({
        code,
        redirect_uri: redirectUri || process.env.GOOGLE_REDIRECT_URI || 'http://localhost:3000/auth/google/callback'
      })

      client.setCredentials(tokens)

      // Get user info from Google
      const ticket = await client.verifyIdToken({
        idToken: tokens.id_token,
        audience: process.env.GOOGLE_CLIENT_ID
      })

      const payload = ticket.getPayload()
      const { sub: googleId, email, name, picture } = payload

      // Check if user exists
      let user = await User.findOne({ 
        $or: [
          { email },
          { googleId }
        ]
      })

      if (user) {
        // Update existing user with Google info if not already set
        if (!user.googleId) {
          user.googleId = googleId
          user.avatar = picture
          await user.save()
        }
      } else {
        // Create new user
        user = new User({
          email,
          name,
          googleId,
          avatar: picture,
          role: 'buyer', // Default role for Google sign-ups
          isEmailVerified: true, // Google emails are pre-verified
          isActive: true,
          password: await bcrypt.hash(googleId + Date.now(), 12) // Random password for Google users
        })

        await user.save()
      }

      // Generate JWT token
      const token = jwt.sign(
        { 
          id: user._id, 
          email: user.email, 
          role: user.role 
        },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
      )

      res.json({
        status: 'success',
        message: 'Google authentication successful',
        token,
        user: {
          id: user._id,
          email: user.email,
          name: user.name,
          role: user.role,
          avatar: user.avatar,
          isEmailVerified: user.isEmailVerified
        }
      })

    } catch (error) {
      console.error('Google OAuth callback error:', error)
      console.error('Error details:', error.message)
      console.error('Error stack:', error.stack)
      res.status(500).json({
        status: 'error',
        message: 'Google authentication failed',
        error: error.message
      })
    }
  },

  // Handle direct Google OAuth (for testing)
  async handleGoogleAuth(req, res) {
    try {
      const { googleId, email, name, image, accessToken, refreshToken } = req.body

      if (!googleId || !email) {
        return res.status(400).json({
          status: 'error',
          message: 'Google ID and email are required'
        })
      }

      // Check if user exists
      let user = await User.findOne({ 
        $or: [
          { email },
          { googleId }
        ]
      })

      if (user) {
        // Update existing user with Google info if not already set
        if (!user.googleId) {
          user.googleId = googleId
          user.avatar = image
          await user.save()
        }
      } else {
        // Create new user
        user = new User({
          email,
          name,
          googleId,
          avatar: image,
          role: 'buyer', // Default role for Google sign-ups
          isEmailVerified: true, // Google emails are pre-verified
          isActive: true,
          password: await bcrypt.hash(googleId + Date.now(), 12) // Random password for Google users
        })

        await user.save()
      }

      // Generate JWT token
      const token = jwt.sign(
        { 
          id: user._id, 
          email: user.email, 
          role: user.role 
        },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
      )

      res.json({
        status: 'success',
        message: 'Google authentication successful',
        token,
        user: {
          id: user._id,
          email: user.email,
          name: user.name,
          role: user.role,
          avatar: user.avatar,
          isEmailVerified: user.isEmailVerified
        }
      })

    } catch (error) {
      console.error('Google OAuth error:', error)
      res.status(500).json({
        status: 'error',
        message: 'Google authentication failed',
        error: error.message
      })
    }
  }
}

module.exports = googleAuthController
