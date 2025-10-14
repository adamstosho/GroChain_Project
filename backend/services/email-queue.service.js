const nodemailer = require('nodemailer')

class EmailQueueService {
  constructor() {
    this.queue = []
    this.isProcessing = false
    this.maxRetries = Number(process.env.EMAIL_MAX_RETRIES || 5)
    this.baseDelayMs = Number(process.env.EMAIL_BASE_RETRY_DELAY_MS || 2000)

    // Initialize transporters based on env (SMTP preferred, SendGrid fallback)
    this.transport = null
    this.sendgrid = null

    if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
      this.transport = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: Number(process.env.SMTP_PORT || 587),
        secure: String(process.env.SMTP_SECURE) === 'true',
        auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
      })
      console.log('✅ EmailQueue: SMTP transporter initialized')
    } else if (process.env.EMAIL_PROVIDER === 'sendgrid' && process.env.SENDGRID_API_KEY) {
      try {
        const sgMail = require('@sendgrid/mail')
        sgMail.setApiKey(process.env.SENDGRID_API_KEY)
        this.sendgrid = sgMail
        console.log('✅ EmailQueue: SendGrid initialized')
      } catch (e) {
        console.warn('⚠️ EmailQueue: Failed to init SendGrid:', e.message)
      }
    } else {
      console.warn('⚠️ EmailQueue: No email provider configured; emails will be logged only')
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
    if (this.sendgrid) {
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
      await this.sendgrid.send(msg)
      return
    }

    if (this.transport) {
      const mailOptions = {
        from: process.env.SMTP_FROM || process.env.SMTP_USER,
        to: job.to,
        subject: job.subject,
        html: job.html,
        text: job.text
      }
      await this.transport.sendMail(mailOptions)
      return
    }

    // Dev fallback: log only
    console.log('[DEV-EMAIL-QUEUE] No provider, logging email:', { to: job.to, subject: job.subject })
  }
}

module.exports = new EmailQueueService()


