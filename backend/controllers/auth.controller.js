const Joi = require('joi')
const User = require('../models/user.model')
const { signAccess, signRefresh, verifyRefresh } = require('../utils/jwt')
const nodemailer = require('nodemailer')
const { sendEmailViaSendGrid } = require('../utils/sendgrid-direct')
// crypto is built-in to Node.js, no need to require it

const registerSchema = Joi.object({
  name: Joi.string().required(),
  email: Joi.string().email().required(),
  phone: Joi.string().optional(),
  password: Joi.string().min(8).required(),
  role: Joi.string().valid('admin','partner','farmer','buyer').default('farmer'),
  location: Joi.string().optional(),
}).unknown(true)

const tempTokens = new Map()
const tempSmsOtps = new Map()

async function sendEmail(to, subject, html) {
  console.log('📧 Attempting to send email to:', to)
  console.log('📧 Email provider setting:', process.env.EMAIL_PROVIDER)
  console.log('📧 SendGrid API key exists:', !!process.env.SENDGRID_API_KEY)
  console.log('📧 SMTP host exists:', !!process.env.SMTP_HOST)
  
  try {
    // PRIORITY: Try SendGrid HTTP API first (works on Render, bypasses port blocking)
    if (process.env.SENDGRID_API_KEY) {
      console.log('📧 Using SendGrid HTTP API (direct)...')
      try {
        await sendEmailViaSendGrid(to, subject, html)
        console.log('✅ SendGrid HTTP API email sent successfully to:', to)
        return true
      } catch (sgError) {
        console.error('❌ SendGrid HTTP API failed:', sgError.message)
        console.log('📧 Falling back to SMTP or @sendgrid/mail...')
        // Fall through to try other methods
      }
    }
    
    // FALLBACK 1: Try @sendgrid/mail package
    if (process.env.EMAIL_PROVIDER === 'sendgrid' && process.env.SENDGRID_API_KEY) {
      console.log('📧 Using @sendgrid/mail package...')
      try {
        const sgMail = require('@sendgrid/mail')
        sgMail.setApiKey(process.env.SENDGRID_API_KEY)
        
        const msg = {
          to,
          from: {
            email: process.env.SENDGRID_FROM_EMAIL || 'grochain.ng@gmail.com',
            name: process.env.SENDGRID_FROM_NAME || 'GroChain'
          },
          subject,
          html
        }
        
        await sgMail.send(msg)
        console.log('✅ @sendgrid/mail email sent successfully to:', to)
        return true
      } catch (sgError) {
        console.error('❌ @sendgrid/mail failed:', sgError.message)
        // Don't throw, try SMTP next
      }
    }
    
    // FALLBACK 2: Try SMTP (Gmail or other)
    if (process.env.EMAIL_PROVIDER !== 'sendgrid' && process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
      console.log('📧 Using SMTP (Gmail)...')
      const transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: Number(process.env.SMTP_PORT || 587),
        secure: String(process.env.SMTP_SECURE) === 'true',
        auth: { 
          user: process.env.SMTP_USER, 
          pass: process.env.SMTP_PASS 
        },
        // Add connection timeout to detect blocking quickly
        connectionTimeout: 5000,
        greetingTimeout: 5000
      })
      
      const mailOptions = {
        from: process.env.SMTP_FROM || process.env.SMTP_USER,
        to,
        subject,
        html
      }
      
      console.log('📧 SMTP mail options:', {
        from: mailOptions.from,
        to: mailOptions.to,
        subject: mailOptions.subject
      })
      
      try {
        await transporter.sendMail(mailOptions)
        console.log('✅ SMTP email sent successfully to:', to)
        return true
      } catch (smtpError) {
        // If SMTP fails with connection/timeout error, log and throw
        console.error('❌ SMTP connection failed:', smtpError.message)
        throw smtpError
      }
    }
    
    // If we get here, no email method worked
    console.error('❌ All email sending methods failed')
    
    // Development fallback - log the verification link
    const verificationLink = html.match(/href="([^"]+)"/)?.[1] || 'NO_LINK_FOUND'
    console.log('[DEV-EMAIL] Verification link:', verificationLink)
    console.log('[DEV-EMAIL] Full HTML:', html)
    return false
  } catch (error) {
    console.error('❌ Email sending failed:', error.message)
    console.error('❌ Full error:', error)
    
    // Log the verification link for development purposes
    const verificationLink = html.match(/href="([^"]+)"/)?.[1] || 'NO_LINK_FOUND'
    console.log('[DEV-EMAIL] Verification link (due to error):', verificationLink)
    
    throw error
  }
}
// Export for external use (tests/other modules) while keeping local identifier available
exports.sendEmail = sendEmail

exports.register = async (req, res) => {
  try {
    const { error, value } = registerSchema.validate(req.body)
    if (error) return res.status(400).json({ status: 'error', message: error.details[0].message })
    
    // Check if user already exists
    const exists = await User.findOne({ email: value.email })
    if (exists) {
      // If email exists but not verified, resend verification instead of blocking
      if (!exists.emailVerified) {
        try {
          const token = require('crypto').randomBytes(32).toString('hex')
          tempTokens.set(token, { id: exists._id, email: exists.email, exp: Date.now() + 1000 * 60 * 60 })
          const verificationLink = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/verify-email?token=${token}`
          const emailHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #4CAF50;">Complete your GroChain signup</h2>
        <p>Hi ${exists.name || 'there'},</p>
        <p>It looks like you tried to sign up before but didn\'t verify your email. Click below to verify and finish setting up your account:</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${verificationLink}" 
             style="background-color: #4CAF50; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
            Verify Email Address
          </a>
        </div>
        <p>Or copy and paste this link into your browser:</p>
        <p style="word-break: break-all; color: #6b7280;">${verificationLink}</p>
        <p>This link will expire in 1 hour.</p>
        <p>Best regards,<br>The GroChain Team</p>
      </div>
    `
          try { await sendEmail(exists.email, 'Verify your GroChain account', emailHtml) } catch (emailError) { console.error('Resend on register failed:', emailError?.message || emailError) }
        } catch (genErr) {
          console.error('Token generation failed during re-register:', genErr)
        }
        return res.status(200).json({ 
          status: 'success', 
          message: 'Account exists but is not verified yet. We\'ve sent a new verification link to your email.',
          requiresVerification: true
        })
      }
      return res.status(409).json({ status: 'error', message: 'Email already exists' })
    }
    
    const user = await User.create(value)
    const token = require('crypto').randomBytes(32).toString('hex')
    tempTokens.set(token, { id: user._id, email: user.email, exp: Date.now() + 1000 * 60 * 60 })
    
    // Send verification email
    const verificationLink = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/verify-email?token=${token}`
    const emailHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #4CAF50;">Welcome to GroChain!</h2>
        <p>Hi ${user.name},</p>
        <p>Thank you for registering with GroChain. To complete your registration, please verify your email address by clicking the button below:</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${verificationLink}" 
             style="background-color: #4CAF50; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
            Verify Email Address
          </a>
        </div>
        <p>Or copy and paste this link into your browser:</p>
        <p style="word-break: break-all; color: #6b7280;">${verificationLink}</p>
        <p>This link will expire in 1 hour.</p>
        <p>If you didn't create this account, please ignore this email.</p>
        <p>Best regards,<br>The GroChain Team</p>
      </div>
    `
    
    // Enqueue the verification email; do not block the request
    try {
      const emailQueue = require('../services/email-queue.service')
      emailQueue.enqueue({ to: user.email, subject: 'Verify your GroChain account', html: emailHtml })
    } catch (emailError) {
      console.error('Registration: enqueue email failed:', emailError && emailError.message ? emailError.message : emailError)
    }
    
    return res.status(201).json({ 
      status: 'success', 
      message: 'Registration successful! Please check your email to verify your account.',
      requiresVerification: true,
      user: { _id: user._id, email: user.email, role: user.role, emailVerified: false } 
    })
  } catch (e) {
    console.error('Registration error:', e)
    return res.status(500).json({ status: 'error', message: 'Server error' })
  }
}

exports.verifyEmail = async (req, res) => {
  try {
    const { token } = req.body || {}
    if (!token) return res.status(400).json({ status: 'error', message: 'Token required' })
    
    const entry = tempTokens.get(token)
    if (!entry) return res.status(400).json({ status: 'error', message: 'Invalid token' })
    if (entry.exp < Date.now()) {
      tempTokens.delete(token)
      return res.status(400).json({ status: 'error', message: 'Token expired' })
    }
    
    const user = await User.findByIdAndUpdate(entry.id, { emailVerified: true }, { new: true })
    if (!user) return res.status(404).json({ status: 'error', message: 'User not found' })
    
    tempTokens.delete(token)
    
    return res.json({ 
      status: 'success', 
      message: 'Email verified successfully! You can now login to your account.',
      user: { _id: user._id, email: user.email, role: user.role, emailVerified: true } 
    })
  } catch (e) {
    console.error('Email verification error:', e)
    return res.status(500).json({ status: 'error', message: 'Server error' })
  }
}

// GET endpoint for email verification (better for cross-browser compatibility)
exports.verifyEmailGet = async (req, res) => {
  try {
    const { token } = req.params
    if (!token) return res.status(400).json({ status: 'error', message: 'Token required' })
    
    const entry = tempTokens.get(token)
    if (!entry) return res.status(400).json({ status: 'error', message: 'Invalid token' })
    if (entry.exp < Date.now()) {
      tempTokens.delete(token)
      return res.status(400).json({ status: 'error', message: 'Token expired' })
    }
    
    const user = await User.findByIdAndUpdate(entry.id, { emailVerified: true }, { new: true })
    if (!user) return res.status(404).json({ status: 'error', message: 'User not found' })
    
    tempTokens.delete(token)
    
    // For GET requests, redirect to frontend with success message
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000'
    const redirectUrl = `${frontendUrl}/verify-email?success=true&email=${encodeURIComponent(user.email)}`
    
    return res.redirect(redirectUrl)
  } catch (e) {
    console.error('Email verification GET error:', e)
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000'
    const redirectUrl = `${frontendUrl}/verify-email?error=verification_failed&message=${encodeURIComponent('Verification failed. Please try again.')}`
    return res.redirect(redirectUrl)
  }
}

exports.sendSmsOtp = async (req, res) => {
  try {
    const { phone } = req.body || {}
    if (!phone) return res.status(400).json({ status: 'error', message: 'Phone required' })
    const code = (Math.floor(100000 + Math.random() * 900000)).toString()
    tempSmsOtps.set(phone, { code, exp: Date.now() + 5 * 60 * 1000, attempts: 0 })
    const sms = require('../utils/sms.util')
    await sms.sendSMS(phone, `Your GroChain verification code is ${code}`)
    return res.json({ status: 'success', message: 'OTP sent' })
  } catch (e) {
    return res.status(500).json({ status: 'error', message: 'Server error' })
  }
}

exports.verifySmsOtp = async (req, res) => {
  try {
    const { phone, code } = req.body || {}
    if (!phone || !code) return res.status(400).json({ status: 'error', message: 'Phone and code required' })
    const entry = tempSmsOtps.get(phone)
    if (!entry) return res.status(400).json({ status: 'error', message: 'OTP not found' })
    if (entry.exp < Date.now()) return res.status(400).json({ status: 'error', message: 'OTP expired' })
    entry.attempts += 1
    if (entry.attempts > 5) return res.status(429).json({ status: 'error', message: 'Too many attempts' })
    if (entry.code !== code) return res.status(400).json({ status: 'error', message: 'Invalid code' })
    await User.findOneAndUpdate({ phone }, { phoneVerified: true })
    tempSmsOtps.delete(phone)
    return res.json({ status: 'success', message: 'Phone verified' })
  } catch (e) {
    return res.status(500).json({ status: 'error', message: 'Server error' })
  }
}

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body || {}
    if (!email || !password) {
      return res.status(400).json({ status: 'error', message: 'Email and password required' })
    }
    
    const user = await User.findOne({ email })
    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({ status: 'error', message: 'Invalid credentials' })
    }
    
    // Check if user is suspended
    if (user.status === 'suspended') {
      return res.status(403).json({ 
        status: 'error', 
        message: 'Account suspended. Please contact support.',
        suspensionReason: user.suspensionReason 
      })
    }
    
    // Check if email is verified (allow bypass in relaxed mode)
    const relaxedSecurity = process.env.RELAXED_SECURITY === 'true' || process.env.NODE_ENV !== 'production'
    if (!user.emailVerified && !relaxedSecurity && process.env.DISABLE_EMAIL_VERIFICATION !== 'true') {
      return res.status(403).json({ 
        status: 'error', 
        message: 'Please verify your email address before logging in. Check your inbox for a verification link.',
        requiresVerification: true,
        user: { _id: user._id, email: user.email, role: user.role, emailVerified: false }
      })
    }
    
    // Update lastLogin timestamp and lastActive in stats
    user.lastLogin = new Date()
    user.stats = user.stats || {}
    user.stats.lastActive = new Date()
    await user.save()
    
    // Use the getAuthData method for consistent JWT payload
    const userAuthData = user.getAuthData()

    const accessToken = signAccess({
      id: userAuthData.id,
      role: userAuthData.role,
      email: userAuthData.email,
      name: userAuthData.name
    })
    const refreshToken = signRefresh({
      id: userAuthData.id,
      role: userAuthData.role,
      email: userAuthData.email,
      name: userAuthData.name
    })
    
    // Set HTTP-only cookies for authentication
    res.cookie('auth_token', accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 1000, // 1 hour
      path: '/'
    })
    
    res.cookie('refresh_token', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
      path: '/'
    })
    
    return res.json({ 
      status: 'success', 
      message: 'Login successful',
      data: { user, accessToken, refreshToken } 
    })
  } catch (e) {
    console.error('Login error:', e)
    return res.status(500).json({ status: 'error', message: 'Server error' })
  }
}

exports.resendVerification = async (req, res) => {
  try {
    const { email } = req.body || {}
    if (!email) return res.status(400).json({ status: 'error', message: 'Email required' })
    
    const user = await User.findOne({ email })
    if (!user) return res.json({ status: 'success', message: 'If account exists, verification email sent' })
    if (user.emailVerified) return res.json({ status: 'success', message: 'Email already verified' })
    
    // Generate new token
    const token = require('crypto').randomBytes(32).toString('hex')
    tempTokens.set(token, { id: user._id, email: user.email, exp: Date.now() + 1000 * 60 * 60 })
    
    // Send verification email
    const verificationLink = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/verify-email?token=${token}`
    const emailHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #4CAF50;">GroChain Email Verification</h2>
        <p>Hi ${user.name},</p>
        <p>You requested a new verification email. Please click the button below to verify your email address:</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${verificationLink}" 
             style="background-color: #4CAF50; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
            Verify Email Address
          </a>
        </div>
        <p>Or copy and paste this link into your browser:</p>
        <p style="word-break: break-all; color: #6b7280;">${verificationLink}</p>
        <p>This link will expire in 1 hour.</p>
        <p>If you didn't request this email, please ignore it.</p>
        <p>Best regards,<br>The GroChain Team</p>
      </div>
    `
    
    try {
      const emailQueue = require('../services/email-queue.service')
      emailQueue.enqueue({ to: user.email, subject: 'Verify your GroChain account', html: emailHtml })
    } catch (emailError) {
      console.error('Resend verification: enqueue email failed:', emailError && emailError.message ? emailError.message : emailError)
    }
    
    return res.json({ status: 'success', message: 'Verification email sent' })
  } catch (e) {
    console.error('Resend verification error:', e)
    return res.status(500).json({ status: 'error', message: 'Server error' })
  }
}

exports.refresh = async (req, res) => {
  try {
    const { refreshToken } = req.body || {}
    if (!refreshToken) return res.status(400).json({ status: 'error', message: 'refreshToken required' })
    const decoded = verifyRefresh(refreshToken)
    const accessToken = signAccess({
      id: decoded.id,
      role: decoded.role,
      email: decoded.email,
      name: decoded.name
    })
    const newRefreshToken = signRefresh({
      id: decoded.id,
      role: decoded.role,
      email: decoded.email,
      name: decoded.name
    })
    return res.json({ status: 'success', data: { accessToken, refreshToken: newRefreshToken } })
  } catch (e) {
    return res.status(401).json({ status: 'error', message: 'Invalid refresh token' })
  }
}

exports.logout = async (req, res) => {
  try {
    // Clear the auth token cookie
    res.clearCookie('auth_token', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/'
    })
    
    // Clear the refresh token cookie
    res.clearCookie('refresh_token', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/'
    })
    
    return res.json({ 
      status: 'success', 
      message: 'Logged out successfully',
      data: { loggedOut: true }
    })
  } catch (error) {
    console.error('Logout error:', error)
    // Even if there's an error, we should still clear cookies
    res.clearCookie('auth_token')
    res.clearCookie('refresh_token')
    return res.json({ 
      status: 'success', 
      message: 'Logged out successfully',
      data: { loggedOut: true }
    })
  }
}

exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body
    if (!email) return res.status(400).json({ status: 'error', message: 'Email required' })
    
    // Check if user exists
    const user = await User.findOne({ email })
    if (!user) {
      // Don't reveal if email exists or not for security
      return res.json({ status: 'success', message: 'If account exists, password reset email sent' })
    }
    
    // Generate reset token
    const resetToken = require('crypto').randomBytes(32).toString('hex')
    tempTokens.set(resetToken, { 
      id: user._id, 
      email: user.email, 
      type: 'password_reset',
      exp: Date.now() + 1000 * 60 * 60 // 1 hour
    })
    
    // Send reset email (enqueue)
    const resetLink = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/reset-password?token=${resetToken}`
    const emailHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #4CAF50;">Password Reset Request</h2>
        <p>Hi ${user.name},</p>
        <p>You requested a password reset for your GroChain account. Click the button below to reset your password:</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${resetLink}" 
             style="background-color: #4CAF50; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
            Reset Password
          </a>
        </div>
        <p>Or copy and paste this link into your browser:</p>
        <p style="word-break: break-all; color: #6b7280;">${resetLink}</p>
        <p>This link will expire in 1 hour.</p>
        <p>If you didn't request this password reset, please ignore this email.</p>
        <p>Best regards,<br>The GroChain Team</p>
      </div>
    `
    
    try {
      const emailQueue = require('../services/email-queue.service')
      emailQueue.enqueue({ to: user.email, subject: 'Reset your GroChain password', html: emailHtml })
    } catch (emailError) {
      console.error('Password reset: enqueue email failed:', emailError && emailError.message ? emailError.message : emailError)
    }
    
    return res.json({ status: 'success', message: 'If account exists, password reset email sent' })
  } catch (e) {
    console.error('Forgot password error:', e)
    return res.status(500).json({ status: 'error', message: 'Server error' })
  }
}

exports.resetPassword = async (req, res) => {
  try {
    const { token, password } = req.body
    if (!token || !password) return res.status(400).json({ status: 'error', message: 'Token and password required' })
    
    // Validate password
    if (password.length < 8) {
      return res.status(400).json({ status: 'error', message: 'Password must be at least 8 characters long' })
    }
    
    // Check token
    const entry = tempTokens.get(token)
    if (!entry) return res.status(400).json({ status: 'error', message: 'Invalid or expired token' })
    
    if (entry.exp < Date.now()) {
      tempTokens.delete(token)
      return res.status(400).json({ status: 'error', message: 'Token expired' })
    }
    
    if (entry.type !== 'password_reset') {
      return res.status(400).json({ status: 'error', message: 'Invalid token type' })
    }
    
    // Update user password
    const bcrypt = require('bcryptjs')
    const hashedPassword = await bcrypt.hash(password, 10)
    
    const user = await User.findByIdAndUpdate(
      entry.id, 
      { password: hashedPassword }, 
      { new: true }
    )
    
    if (!user) return res.status(404).json({ status: 'error', message: 'User not found' })
    
    // Clean up token
    tempTokens.delete(token)
    
    return res.json({ status: 'success', message: 'Password reset successfully' })
  } catch (e) {
    console.error('Reset password error:', e)
    return res.status(500).json({ status: 'error', message: 'Server error' })
  }
}

