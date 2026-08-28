const Joi = require('joi')
const User = require('../models/user.model')
const { signAccess, signRefresh, verifyRefresh, verifyAccessAllowExpired } = require('../utils/jwt')
const nodemailer = require('nodemailer')
const { sendEmailViaSendGrid } = require('../utils/sendgrid-direct')
const { sendEmailViaResend } = require('../utils/resend-direct')

// 'admin' is deliberately excluded — public self-registration must never be
// able to grant admin access. Admin accounts are created out-of-band (by an
// existing admin, or direct DB/seed access), never through this endpoint.
const registerSchema = Joi.object({
  name: Joi.string().required(),
  email: Joi.string().email().required(),
  phone: Joi.string().optional(),
  password: Joi.string().min(8).required(),
  role: Joi.string().valid('partner','farmer','buyer').default('farmer'),
  location: Joi.string().optional(),
}).unknown(true)

const tempTokens = new Map()
const tempSmsOtps = new Map()
const tempEmailOtpMeta = new Map()

const EMAIL_OTP_EXPIRY_MS = Number(process.env.EMAIL_VERIFICATION_OTP_EXPIRY_MS || 15 * 60 * 1000)
const EMAIL_OTP_MAX_ATTEMPTS = Number(process.env.EMAIL_VERIFICATION_OTP_MAX_ATTEMPTS || 5)

const generateEmailOtp = () => String(Math.floor(100000 + Math.random() * 900000))

const buildVerificationOtpEmailHtml = (name, code) => `
  <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px;">
    <h2 style="color: #166534; margin-bottom: 8px;">Verify your GroChain account</h2>
    <p>Hi ${name || 'there'},</p>
    <p>Use this one-time verification code to complete your signup:</p>
    <div style="text-align: center; margin: 32px 0;">
      <span style="display: inline-block; letter-spacing: 8px; font-size: 32px; font-weight: bold; color: #166534; background: #f0fdf4; padding: 16px 24px; border-radius: 8px; border: 2px dashed #166534;">
        ${code}
      </span>
    </div>
    <p style="color: #6b7280; font-size: 14px;">This code expires in 15 minutes. Do not share it with anyone.</p>
    <p style="color: #6b7280; font-size: 14px;">If you didn't create a GroChain account, you can safely ignore this email.</p>
    <p>Best regards,<br>The GroChain Team</p>
  </div>
`

async function issueEmailVerificationOtp(user) {
  const code = generateEmailOtp()
  const expiresAt = new Date(Date.now() + EMAIL_OTP_EXPIRY_MS)

  await User.findByIdAndUpdate(user._id, {
    emailVerificationToken: code,
    emailVerificationExpires: expiresAt
  })

  tempEmailOtpMeta.set(String(user._id), { attempts: 0, exp: expiresAt.getTime() })

  const html = buildVerificationOtpEmailHtml(user.name, code)

  try {
    await sendEmail(user.email, 'Your GroChain verification code', html)
  } catch (emailError) {
    console.error('Failed to send verification OTP email:', emailError?.message || emailError)
    if (process.env.NODE_ENV !== 'production') {
      console.log('[DEV-EMAIL-OTP] Verification code for', user.email, ':', code)
    }
    throw emailError
  }

  if (process.env.NODE_ENV !== 'production') {
    console.log('[DEV-EMAIL-OTP] Verification code for', user.email, ':', code)
  }

  return code
}

async function sendEmail(to, subject, html) {
  console.log('📧 Attempting to send email to:', to)
  console.log('📧 Email provider setting:', process.env.EMAIL_PROVIDER)
  console.log('📧 SendGrid API key exists:', !!process.env.SENDGRID_API_KEY)
  console.log('📧 SMTP host exists:', !!process.env.SMTP_HOST)
  
  try {
    // PRIORITY 1: Try Resend (FREE, works on Render, best option)
    if (process.env.EMAIL_PROVIDER === 'resend' && process.env.RESEND_API_KEY) {
      console.log('📧 Using Resend HTTP API (direct)...')
      try {
        await sendEmailViaResend(to, subject, html)
        console.log('✅ Resend HTTP API email sent successfully to:', to)
        return true
      } catch (resendError) {
        console.error('❌ Resend HTTP API failed:', resendError.message)
        console.log('📧 Falling back to SendGrid...')
        // Fall through to try SendGrid
      }
    }
    
    // PRIORITY 2: Try SendGrid HTTP API (works on Render, bypasses port blocking)
    if (process.env.EMAIL_PROVIDER === 'sendgrid' && process.env.SENDGRID_API_KEY) {
      console.log('📧 Using SendGrid HTTP API (direct)...')
      try {
        await sendEmailViaSendGrid(to, subject, html)
        console.log('✅ SendGrid HTTP API email sent successfully to:', to)
        return true
      } catch (sgError) {
        console.error('❌ SendGrid HTTP API failed:', sgError.message)
        console.log('📧 Falling back to SMTP...')
        // Fall through to try other methods
      }
    }
    
    // FALLBACK: Try Resend if SendGrid is configured as primary but fails
    if (process.env.EMAIL_PROVIDER === 'sendgrid' && process.env.RESEND_API_KEY) {
      console.log('📧 SendGrid failed, trying Resend as fallback...')
      try {
        await sendEmailViaResend(to, subject, html)
        console.log('✅ Resend fallback email sent successfully to:', to)
        return true
      } catch (resendError) {
        console.error('❌ Resend fallback failed:', resendError.message)
        // Continue to other fallbacks
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
    
    // Development fallback - log OTP or link from email body
    const otpMatch = html.match(/>(\d{6})</)
    if (otpMatch) {
      console.log('[DEV-EMAIL] Verification OTP:', otpMatch[1])
    }
    const verificationLink = html.match(/href="([^"]+)"/)?.[1]
    if (verificationLink) console.log('[DEV-EMAIL] Verification link:', verificationLink)
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
    const exists = await User.findOne({ email: value.email.toLowerCase().trim() })
    if (exists) {
      // If email exists but not verified, resend OTP instead of blocking
      if (!exists.emailVerified) {
        try {
          await issueEmailVerificationOtp(exists)
        } catch (genErr) {
          console.error('OTP generation failed during re-register:', genErr)
        }
        return res.status(200).json({
          status: 'success',
          message: 'Account exists but is not verified yet. We\'ve sent a new 6-digit code to your email.',
          requiresVerification: true,
          user: { _id: exists._id, email: exists.email, role: exists.role, emailVerified: false }
        })
      }
      return res.status(409).json({ status: 'error', message: 'Email already exists' })
    }

    const user = await User.create({ ...value, email: value.email.toLowerCase().trim() })

    try {
      await issueEmailVerificationOtp(user)
    } catch (emailError) {
      console.error('Registration: verification OTP email failed:', emailError?.message || emailError)
    }

    return res.status(201).json({
      status: 'success',
      message: 'Registration successful! Check your email for a 6-digit verification code.',
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
    const { email, code, token } = req.body || {}

    // Legacy link/token verification (backward compatible)
    if (token && !code) {
      const entry = tempTokens.get(token)
      if (!entry) return res.status(400).json({ status: 'error', message: 'Invalid or expired verification link' })
      if (entry.exp < Date.now()) {
        tempTokens.delete(token)
        return res.status(400).json({ status: 'error', message: 'Verification link expired' })
      }

      const user = await User.findByIdAndUpdate(
        entry.id,
        { emailVerified: true, emailVerificationToken: null, emailVerificationExpires: null },
        { new: true }
      )
      if (!user) return res.status(404).json({ status: 'error', message: 'User not found' })

      tempTokens.delete(token)
      return res.json({
        status: 'success',
        message: 'Email verified successfully! You can now login to your account.',
        user: { _id: user._id, email: user.email, role: user.role, emailVerified: true }
      })
    }

    if (!email || !code) {
      return res.status(400).json({ status: 'error', message: 'Email and 6-digit verification code are required' })
    }

    const normalizedCode = String(code).replace(/\D/g, '').trim()
    if (normalizedCode.length !== 6) {
      return res.status(400).json({ status: 'error', message: 'Enter the 6-digit code from your email' })
    }

    const user = await User.findOne({ email: email.toLowerCase().trim() })
    if (!user) {
      return res.status(400).json({ status: 'error', message: 'Invalid verification code' })
    }

    if (user.emailVerified) {
      return res.json({
        status: 'success',
        message: 'Email already verified. You can sign in.',
        user: { _id: user._id, email: user.email, role: user.role, emailVerified: true }
      })
    }

    if (!user.emailVerificationToken || !user.emailVerificationExpires) {
      return res.status(400).json({ status: 'error', message: 'No verification code found. Request a new one.' })
    }

    if (user.emailVerificationExpires < new Date()) {
      return res.status(400).json({ status: 'error', message: 'Verification code expired. Request a new one.' })
    }

    const meta = tempEmailOtpMeta.get(String(user._id)) || { attempts: 0 }
    meta.attempts += 1
    tempEmailOtpMeta.set(String(user._id), meta)

    if (meta.attempts > EMAIL_OTP_MAX_ATTEMPTS) {
      return res.status(429).json({ status: 'error', message: 'Too many attempts. Request a new code.' })
    }

    if (user.emailVerificationToken !== normalizedCode) {
      return res.status(400).json({ status: 'error', message: 'Invalid verification code' })
    }

    user.emailVerified = true
    user.emailVerificationToken = undefined
    user.emailVerificationExpires = undefined
    await user.save()
    tempEmailOtpMeta.delete(String(user._id))

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
    const redirectUrl = `${frontendUrl}/verify-email?email=${encodeURIComponent(user.email)}&verified=1`
    
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
        message: 'Please verify your email address before logging in. Check your inbox for your 6-digit code.',
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
      name: userAuthData.name,
      tokenVersion: userAuthData.tokenVersion
    })
    const refreshToken = signRefresh({
      id: userAuthData.id,
      role: userAuthData.role,
      email: userAuthData.email,
      name: userAuthData.name,
      tokenVersion: userAuthData.tokenVersion
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

    const user = await User.findOne({ email: email.toLowerCase().trim() })
    if (!user) return res.json({ status: 'success', message: 'If account exists, verification code sent' })
    if (user.emailVerified) return res.json({ status: 'success', message: 'Email already verified' })

    try {
      await issueEmailVerificationOtp(user)
    } catch (emailError) {
      console.error('Resend verification OTP failed:', emailError?.message || emailError)
    }

    return res.json({ status: 'success', message: 'Verification code sent' })
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

    // Reject refresh tokens issued before the user's last logout/password
    // change — without this check, a revoked refresh token could keep
    // minting valid access tokens forever, defeating revocation entirely.
    const user = await User.findById(decoded.id)
    if (!user) return res.status(401).json({ status: 'error', message: 'Invalid refresh token' })
    if ((decoded.tokenVersion || 0) !== (user.tokenVersion || 0)) {
      return res.status(401).json({ status: 'error', message: 'Session expired, please log in again' })
    }

    const accessToken = signAccess({
      id: decoded.id,
      role: decoded.role,
      email: decoded.email,
      name: decoded.name,
      tokenVersion: decoded.tokenVersion || 0
    })
    const newRefreshToken = signRefresh({
      id: decoded.id,
      role: decoded.role,
      email: decoded.email,
      name: decoded.name,
      tokenVersion: decoded.tokenVersion || 0
    })
    return res.json({ status: 'success', data: { accessToken, refreshToken: newRefreshToken } })
  } catch (e) {
    return res.status(401).json({ status: 'error', message: 'Invalid refresh token' })
  }
}

exports.logout = async (req, res) => {
  try {
    // Best-effort: invalidate every outstanding token for this user by
    // bumping tokenVersion, so a leaked/stolen token stops working
    // immediately instead of remaining valid until natural expiry. A
    // missing/invalid token still results in a successful logout (cookies
    // are cleared below regardless) — we just can't revoke what we can't
    // identify.
    try {
      const header = req.headers.authorization || ''
      const token = (header.startsWith('Bearer ') ? header.slice(7) : null) || req.cookies?.auth_token || null
      if (token) {
        const decoded = verifyAccessAllowExpired(token)
        if (decoded?.id) {
          await User.findByIdAndUpdate(decoded.id, { $inc: { tokenVersion: 1 } })
        }
      }
    } catch (revokeError) {
      console.error('Logout token revocation skipped:', revokeError.message || revokeError)
    }

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
        <h2 style="color: #166534;">Password Reset Request</h2>
        <p>Hi ${user.name},</p>
        <p>You requested a password reset for your GroChain account. Click the button below to reset your password:</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${resetLink}" 
             style="background-color: #166534; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
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
      { password: hashedPassword, $inc: { tokenVersion: 1 } },
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

