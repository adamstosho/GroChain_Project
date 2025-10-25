const express = require('express')
const router = express.Router()
const net = require('net')

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

// TCP connectivity test function
const tcpConnectTest = (host, port, timeout = 5000) => {
  return new Promise((resolve) => {
    const start = Date.now()
    const socket = new net.Socket()
    let done = false

    const finish = (obj) => {
      if (done) return
      done = true
      try { socket.destroy() } catch {}
      resolve({ ...obj, latencyMs: Date.now() - start })
    }

    socket.setTimeout(timeout)
    socket.once('error', (err) => finish({ reachable: false, error: err.message }))
    socket.once('timeout', () => finish({ reachable: false, error: 'timeout' }))
    socket.connect(port, host, () => finish({ reachable: true }))
  })
}

// Comprehensive email diagnostic endpoint
router.get('/diag-email', async (req, res) => {
  const errors = []
  const now = new Date().toISOString()

  const RESEND_API_KEY = process.env.RESEND_API_KEY
  const SENDGRID_API_KEY = process.env.SENDGRID_API_KEY
  const EMAIL_FROM = process.env.RESEND_FROM_EMAIL || process.env.SENDGRID_FROM_EMAIL || process.env.EMAIL_FROM || 'grochain.ng@gmail.com'
  const APP_URL = process.env.FRONTEND_URL
  const SMTP_HOST = process.env.SMTP_HOST
  const SMTP_PORT = process.env.SMTP_PORT
  const USING_SMTP = !!(SMTP_HOST && SMTP_PORT)

  const result = {
    ok: false,
    timestamp: now,
    env: {
      RESEND_API_KEY_present: Boolean(RESEND_API_KEY),
      RESEND_API_KEY_length: RESEND_API_KEY ? RESEND_API_KEY.length : 0,
      SENDGRID_API_KEY_present: Boolean(SENDGRID_API_KEY),
      SENDGRID_API_KEY_length: SENDGRID_API_KEY ? SENDGRID_API_KEY.length : 0,
      EMAIL_FROM_present: Boolean(EMAIL_FROM),
      EMAIL_FROM_value: EMAIL_FROM,
      APP_URL_present: Boolean(APP_URL),
      APP_URL_value: APP_URL,
      SMTP_HOST,
      SMTP_PORT,
      USING_SMTP,
      EMAIL_PROVIDER: process.env.EMAIL_PROVIDER
    },
    tcpTest: null,
    resendTest: null,
    sendgridTest: null,
    errors: []
  }

  // 1) TCP test only if SMTP vars present
  if (USING_SMTP) {
    try {
      const portNum = Number(SMTP_PORT)
      console.log(`🔍 Testing TCP connection to ${SMTP_HOST}:${portNum}`)
      const tcp = await tcpConnectTest(SMTP_HOST, portNum, 7000)
      result.tcpTest = { host: SMTP_HOST, port: portNum, ...tcp }
      if (!tcp.reachable) {
        errors.push(`SMTP TCP connect failed: ${tcp.error ?? 'unknown'}`)
      } else {
        console.log(`✅ TCP connection successful to ${SMTP_HOST}:${portNum}`)
      }
    } catch (err) {
      result.tcpTest = { 
        host: SMTP_HOST, 
        port: Number(SMTP_PORT), 
        reachable: false, 
        error: err?.message ?? String(err) 
      }
      errors.push(`TCP test exception: ${err?.message ?? String(err)}`)
    }
  }

  // 2) Resend API test (FREE and recommended)
  if (RESEND_API_KEY && EMAIL_FROM) {
    try {
      console.log('📧 Testing Resend API...')
      const body = {
        from: EMAIL_FROM,
        to: [EMAIL_FROM],
        subject: 'Diag: test email from GroChain Backend',
        html: `<p>This is a test email from your GroChain backend.</p><p>Timestamp: ${now}</p>`
      }

      const resp = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${RESEND_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      })

      const text = await resp.text().catch(() => '')
      let parsed = {}
      try { parsed = text ? JSON.parse(text) : {} } catch {}

      result.resendTest = { status: resp.status, body: parsed }
      
      if (resp.ok) {
        console.log('✅ Resend API test successful')
      } else {
        console.error('❌ Resend API error:', resp.status, parsed)
        errors.push(`Resend API returned ${resp.status}: ${JSON.stringify(parsed)}`)
      }
    } catch (err) {
      console.error('❌ Resend API exception:', err.message)
      result.resendTest = { error: err?.message ?? String(err) }
      errors.push(`Resend API error: ${err?.message ?? String(err)}`)
    }
  } else {
    if (!RESEND_API_KEY) {
      console.log('⚠️ RESEND_API_KEY not set (recommended for Render)')
    }
  }

  // 3) SendGrid API test (backup)
  if (SENDGRID_API_KEY && EMAIL_FROM) {
    try {
      console.log('📧 Testing SendGrid API...')
      const body = {
        personalizations: [{ 
          to: [{ email: EMAIL_FROM }], 
          subject: 'Diag: test email from GroChain Backend' 
        }],
        from: { email: EMAIL_FROM },
        content: [{ 
          type: 'text/html', 
          value: `<p>This is a test email from your GroChain backend.</p><p>Timestamp: ${now}</p>` 
        }],
      }

      const resp = await fetch('https://api.sendgrid.com/v3/mail/send', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${SENDGRID_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      })

      const text = await resp.text().catch(() => '')
      let parsed = text
      try { parsed = text ? JSON.parse(text) : text } catch { /* keep text */ }

      result.sendgridTest = { status: resp.status, body: parsed }
      
      if (resp.ok) {
        console.log('✅ SendGrid API test successful')
      } else {
        console.error('❌ SendGrid API error:', resp.status, parsed)
        errors.push(`SendGrid API returned ${resp.status}: ${JSON.stringify(parsed)}`)
      }
    } catch (err) {
      console.error('❌ SendGrid API exception:', err.message)
      result.sendgridTest = { error: err?.message ?? String(err) }
      errors.push(`SendGrid API error: ${err?.message ?? String(err)}`)
    }
  } else {
    if (!SENDGRID_API_KEY && !RESEND_API_KEY) {
      console.log('⚠️ Neither RESEND_API_KEY nor SENDGRID_API_KEY is set')
    }
  }

  result.errors = errors
  // Success if no errors or if Resend is working
  result.ok = errors.length === 0 || (result.resendTest && result.resendTest.status === 200)
  
  console.log('📊 Email diagnostics result:', JSON.stringify(result, null, 2))
  
  res.status(result.ok ? 200 : 500).json(result)
})

module.exports = router
