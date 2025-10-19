const express = require('express')
const router = express.Router()

// Debug endpoint to check production environment
router.get('/debug', (req, res) => {
  const debugInfo = {
    timestamp: new Date().toISOString(),
    environment: {
      NODE_ENV: process.env.NODE_ENV,
      PORT: process.env.PORT,
    },
    email: {
      EMAIL_PROVIDER: process.env.EMAIL_PROVIDER,
      SENDGRID_API_KEY_EXISTS: !!process.env.SENDGRID_API_KEY,
      SENDGRID_API_KEY_LENGTH: process.env.SENDGRID_API_KEY ? process.env.SENDGRID_API_KEY.length : 0,
      SENDGRID_FROM_EMAIL: process.env.SENDGRID_FROM_EMAIL,
      SENDGRID_FROM_NAME: process.env.SENDGRID_FROM_NAME,
      SMTP_HOST_EXISTS: !!process.env.SMTP_HOST,
      SMTP_USER_EXISTS: !!process.env.SMTP_USER,
      SMTP_PASS_EXISTS: !!process.env.SMTP_PASS,
      SMTP_HOST: process.env.SMTP_HOST,
      SMTP_PORT: process.env.SMTP_PORT,
      SMTP_SECURE: process.env.SMTP_SECURE,
    },
    urls: {
      FRONTEND_URL: process.env.FRONTEND_URL,
      CORS_ORIGIN: process.env.CORS_ORIGIN,
    },
    database: {
      MONGODB_URI_EXISTS: !!process.env.MONGODB_URI,
    }
  }
  
  res.json({
    status: 'success',
    message: 'Debug information',
    debug: debugInfo
  })
})

// Test email service endpoint
router.post('/test-email', async (req, res) => {
  try {
    const { email } = req.body
    
    if (!email) {
      return res.status(400).json({ status: 'error', message: 'Email is required' })
    }

    // Test email queue service
    const emailQueue = require('../services/email-queue.service')
    
    const jobId = emailQueue.enqueue({
      to: email,
      subject: 'Test Email from Production',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #2563eb;">Production Email Test</h2>
          <p>This is a test email sent from your production environment.</p>
          <p>If you receive this email, your email service is working correctly!</p>
          <p>Timestamp: ${new Date().toISOString()}</p>
          <p>Best regards,<br>GroChain Team</p>
        </div>
      `
    })

    res.json({
      status: 'success',
      message: 'Test email queued successfully',
      jobId: jobId,
      emailQueueStatus: {
        hasSendGrid: !!emailQueue.sendgrid,
        hasSMTP: !!emailQueue.transport,
        queueLength: emailQueue.queue.length
      }
    })
  } catch (error) {
    console.error('Test email error:', error)
    res.status(500).json({
      status: 'error',
      message: 'Failed to send test email',
      error: error.message
    })
  }
})

module.exports = router
