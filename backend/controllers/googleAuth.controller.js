const { OAuth2Client } = require('google-auth-library')
const bcrypt = require('bcryptjs')
const User = require('../models/user.model')
const { signAccess, signRefresh } = require('../utils/jwt')

const client = new OAuth2Client(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.GOOGLE_REDIRECT_URI || 'http://localhost:3000/auth/google/callback'
)

function buildAuthUser(user) {
  return {
    _id: user._id,
    id: user._id,
    email: user.email,
    name: user.name,
    role: user.role,
    avatar: user.profile?.avatar,
    emailVerified: !!user.emailVerified,
    // Legacy alias for older clients
    isEmailVerified: !!user.emailVerified,
    status: user.status,
    phone: user.phone,
    location: user.location
  }
}

function setAuthCookies(res, accessToken, refreshToken) {
  res.cookie('auth_token', accessToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 1000,
    path: '/'
  })
  res.cookie('refresh_token', refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 30 * 24 * 60 * 60 * 1000,
    path: '/'
  })
}

function issueTokens(user) {
  const payload = {
    id: user._id.toString(),
    role: user.role,
    email: user.email,
    name: user.name,
    tokenVersion: user.tokenVersion || 0
  }
  return {
    accessToken: signAccess(payload),
    refreshToken: signRefresh(payload)
  }
}

function sendAuthSuccess(res, user, message = 'Google authentication successful') {
  const { accessToken, refreshToken } = issueTokens(user)
  setAuthCookies(res, accessToken, refreshToken)
  const authUser = buildAuthUser(user)

  return res.json({
    status: 'success',
    message,
    // Canonical shape (matches email login)
    data: { user: authUser, accessToken, refreshToken },
    // Backward-compatible flat fields for older Google callback clients
    token: accessToken,
    user: authUser
  })
}

async function findOrCreateGoogleUser({ googleId, email, name, picture }) {
  let user = await User.findOne({
    $or: [{ email }, { googleId }]
  })

  if (user) {
    let dirty = false
    if (!user.googleId) {
      user.googleId = googleId
      dirty = true
    }
    if (picture && !user.profile?.avatar) {
      user.profile = user.profile || {}
      user.profile.avatar = picture
      dirty = true
    }
    if (!user.emailVerified) {
      user.emailVerified = true
      dirty = true
    }
    if (dirty) await user.save()
    return user
  }

  user = new User({
    email,
    name: name || email.split('@')[0],
    googleId,
    profile: { avatar: picture },
    role: 'buyer',
    emailVerified: true,
    status: 'active',
    password: await bcrypt.hash(`${googleId}-${Date.now()}-${Math.random()}`, 12)
  })
  await user.save()
  return user
}

const googleAuthController = {
  async handleGoogleCallback(req, res) {
    try {
      const { code, redirectUri } = req.body

      if (!code) {
        return res.status(400).json({
          status: 'error',
          message: 'Authorization code is required'
        })
      }

      const { tokens } = await client.getToken({
        code,
        redirect_uri: redirectUri || process.env.GOOGLE_REDIRECT_URI || 'http://localhost:3000/auth/google/callback'
      })

      client.setCredentials(tokens)

      const ticket = await client.verifyIdToken({
        idToken: tokens.id_token,
        audience: process.env.GOOGLE_CLIENT_ID
      })

      const payload = ticket.getPayload()
      const { sub: googleId, email, name, picture } = payload

      const user = await findOrCreateGoogleUser({ googleId, email, name, picture })
      return sendAuthSuccess(res, user)
    } catch (error) {
      console.error('Google OAuth callback error:', error.message)
      return res.status(500).json({
        status: 'error',
        message: 'Google authentication failed'
      })
    }
  },

  async handleGoogleAuth(req, res) {
    try {
      const { googleId, email, name, image, accessToken } = req.body

      if (!googleId || !email) {
        return res.status(400).json({
          status: 'error',
          message: 'Google ID and email are required'
        })
      }

      if (!accessToken) {
        return res.status(400).json({
          status: 'error',
          message: 'Google access token is required'
        })
      }

      let googleProfile
      try {
        const verifyResponse = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
          headers: { Authorization: `Bearer ${accessToken}` }
        })
        if (!verifyResponse.ok) {
          throw new Error(`Google userinfo request failed: ${verifyResponse.status}`)
        }
        googleProfile = await verifyResponse.json()
      } catch (verifyError) {
        console.error('Google access token verification failed:', verifyError.message)
        return res.status(401).json({
          status: 'error',
          message: 'Invalid or expired Google access token'
        })
      }

      const verifiedEmail = (googleProfile.email || '').toLowerCase()
      const claimedEmail = (email || '').toLowerCase()
      if (googleProfile.sub !== googleId || verifiedEmail !== claimedEmail) {
        return res.status(401).json({
          status: 'error',
          message: 'Google identity verification failed'
        })
      }

      const user = await findOrCreateGoogleUser({
        googleId,
        email,
        name,
        picture: image || googleProfile.picture
      })
      return sendAuthSuccess(res, user)
    } catch (error) {
      console.error('Google OAuth error:', error.message)
      return res.status(500).json({
        status: 'error',
        message: 'Google authentication failed'
      })
    }
  }
}

module.exports = googleAuthController
