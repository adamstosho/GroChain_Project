const nodemailer = require('nodemailer')

class EmailQueueService {
  constructor() {
    this.queue = []
    this.isProcessing = false
    this.maxRetries = Number(process.env.EMAIL_MAX_RETRIES || 5)
    this.baseDelayMs = Number(process.env.EMAIL_BASE_RETRY_DELAY_MS || 2000)

    // Initialize transporters based on env (respect EMAIL_PROVIDER setting)
    this.transport = null
    this.sendgrid = null

    // Debug environment variables
    console.log('🔍 EmailQueue Debug:', {
      EMAIL_PROVIDER: process.env.EMAIL_PROVIDER,
      SENDGRID_API_KEY_EXISTS: !!process.env.SENDGRID_API_KEY,
      SENDGRID_FROM_EMAIL: process.env.SENDGRID_FROM_EMAIL,
      SMTP_HOST_EXISTS: !!process.env.SMTP_HOST,
      SMTP_USER_EXISTS: !!process.env.SMTP_USER,
      SMTP_PASS_EXISTS: !!process.env.SMTP_PASS
    })

    // Check EMAIL_PROVIDER setting first
    if (process.env.EMAIL_PROVIDER === 'sendgrid' && process.env.SENDGRID_API_KEY) {
      try {
        const sgMail = require('@sendgrid/mail')
        sgMail.setApiKey(process.env.SENDGRID_API_KEY)
        this.sendgrid = sgMail
        console.log('✅ EmailQueue: SendGrid initialized (EMAIL_PROVIDER=sendgrid)')
      } catch (e) {
        console.warn('⚠️ EmailQueue: Failed to init SendGrid:', e.message)
      }
    } else if (process.env.EMAIL_PROVIDER === 'smtp' && process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
      this.transport = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: Number(process.env.SMTP_PORT || 587),
        secure: String(process.env.SMTP_SECURE) === 'true',
        auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
      })
      console.log('✅ EmailQueue: SMTP transporter initialized (EMAIL_PROVIDER=smtp)')
      
      // Test SMTP connection
      this.transport.verify((error, success) => {
        if (error) {
          console.error('❌ EmailQueue: SMTP connection failed:', error.message)
        } else {
          console.log('✅ EmailQueue: SMTP connection verified successfully')
        }
      })
    } else {
      console.warn('⚠️ EmailQueue: No email provider configured; emails will be logged only')
      console.warn('⚠️ EmailQueue: Check EMAIL_PROVIDER, SENDGRID_API_KEY, or SMTP settings')
    }

    // Start processor loop
    const interval = Number(process.env.EMAIL_QUEUE_INTERVAL_MS || 1000)
    setInterval(() => this.processQueue(), interval)
  }

  enqueue({ to, subject, html, text }) {
    const job = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
      to,
      subject,
      html,
      text,
      attempt: 0,
      lastError: null
    }
    this.queue.push(job)
    return job.id
  }

  async processQueue() {
    if (this.isProcessing) return
    if (this.queue.length === 0) return
    this.isProcessing = true
    try {
      const job = this.queue[0]
      try {
        await this.send(job)
        this.queue.shift()
      } catch (err) {
        job.attempt += 1
        job.lastError = err?.message || String(err)
        const shouldRetry = job.attempt < this.maxRetries
        const delay = this.baseDelayMs * Math.pow(2, job.attempt - 1)
        console.warn('📧 EmailQueue: send failed,', { to: job.to, attempt: job.attempt, shouldRetry, delay })
        if (shouldRetry) {
          // Backoff: move job to end after delay
          this.queue.shift()
          setTimeout(() => this.queue.push(job), delay)
        } else {
          console.error('📧 EmailQueue: dropping email after max retries', { to: job.to, subject: job.subject, error: job.lastError })
          this.queue.shift()
        }
      }
    } finally {
      this.isProcessing = false
    }
  }

  async send(job) {
    console.log('📧 EmailQueue: Attempting to send email to:', job.to)
    
    if (this.sendgrid) {
      console.log('📧 EmailQueue: Using SendGrid to send email')
      const msg = {
        to: job.to,
        from: {
          email: process.env.SENDGRID_FROM_EMAIL || 'grochain.ng@gmail.com',
          name: process.env.SENDGRID_FROM_NAME || 'GroChain'
        },
        subject: job.subject,
        html: job.html,
        text: job.text
      }
      console.log('📧 EmailQueue: SendGrid message config:', {
        to: msg.to,
        from: msg.from.email,
        subject: msg.subject
      })
      await this.sendgrid.send(msg)
      console.log('✅ EmailQueue: SendGrid email sent successfully to:', job.to)
      return
    }

    if (this.transport) {
      console.log('📧 EmailQueue: Using SMTP to send email')
      const mailOptions = {
        from: process.env.SMTP_FROM || process.env.SMTP_USER,
        to: job.to,
        subject: job.subject,
        html: job.html,
        text: job.text
      }
      console.log('📧 EmailQueue: SMTP mail options:', {
        from: mailOptions.from,
        to: mailOptions.to,
        subject: mailOptions.subject
      })
      await this.transport.sendMail(mailOptions)
      console.log('✅ EmailQueue: SMTP email sent successfully to:', job.to)
      return
    }

    // Dev fallback: log only
    console.log('[DEV-EMAIL-QUEUE] No provider configured, logging email:', { to: job.to, subject: job.subject })
    console.log('[DEV-EMAIL-QUEUE] Email HTML content:', job.html)
  }
}

module.exports = new EmailQueueService()


