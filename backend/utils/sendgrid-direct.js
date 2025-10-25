const SENDGRID_API = 'https://api.sendgrid.com/v3/mail/send'
const MAX_RETRIES = 2

/**
 * Send email using SendGrid HTTP API directly
 * This bypasses port blocking issues and provides better error handling
 */
async function sendEmailViaSendGrid(to, subject, html) {
  const SENDGRID_API_KEY = process.env.SENDGRID_API_KEY
  const EMAIL_FROM = process.env.SENDGRID_FROM_EMAIL || process.env.EMAIL_FROM || 'grochain.ng@gmail.com'
  const FROM_NAME = process.env.SENDGRID_FROM_NAME || 'GroChain'

  if (!SENDGRID_API_KEY) {
    throw new Error('Missing SENDGRID_API_KEY in environment variables')
  }
  if (!EMAIL_FROM) {
    throw new Error('Missing EMAIL_FROM in environment variables')
  }

  const payload = {
    personalizations: [
      {
        to: [{ email: to }],
        subject: subject,
      },
    ],
    from: { 
      email: EMAIL_FROM,
      name: FROM_NAME
    },
    content: [
      {
        type: 'text/html',
        value: html,
      },
    ],
  }

  console.log('📧 SendGrid: Preparing to send email to:', to)
  console.log('📧 SendGrid: From:', EMAIL_FROM, FROM_NAME)

  let attempt = 0
  let lastError = null

  while (attempt <= MAX_RETRIES) {
    attempt += 1
    
    try {
      console.log(`📧 SendGrid: Attempt ${attempt}/${MAX_RETRIES + 1}...`)
      
      const resp = await fetch(SENDGRID_API, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${SENDGRID_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      })

      const text = await resp.text().catch(() => '')
      
      if (resp.ok) {
        console.log('✅ SendGrid: Email sent successfully')
        return { 
          ok: true, 
          status: resp.status,
          messageId: resp.headers.get('x-message-id')
        }
      } else {
        let parsedBody = text
        try { parsedBody = text ? JSON.parse(text) : text } catch {}
        
        lastError = { 
          status: resp.status, 
          body: parsedBody,
          headers: Object.fromEntries(resp.headers.entries())
        }
        
        console.error(`❌ SendGrid: HTTP ${resp.status}:`, parsedBody)
        
        // 4xx likely permanent; break on authentication or bad request
        if (resp.status === 401) {
          throw new Error('SendGrid authentication failed - check SENDGRID_API_KEY')
        }
        if (resp.status === 403) {
          throw new Error('SendGrid authorization failed - sender not verified or sender not allowed')
        }
        if (resp.status === 400) {
          throw new Error(`SendGrid bad request: ${JSON.stringify(parsedBody)}`)
        }
        
        // Don't retry on 4xx except for rate limits
        if (resp.status >= 400 && resp.status < 500 && resp.status !== 429) {
          break
        }
        
        // For rate limits and 5xx, retry with backoff
        if (attempt <= MAX_RETRIES) {
          const delay = 500 * attempt
          console.log(`⏳ SendGrid: Waiting ${delay}ms before retry...`)
          await new Promise((r) => setTimeout(r, delay))
        }
      }
    } catch (err) {
      lastError = err
      console.error('❌ SendGrid: Network error:', err.message)
      
      // Network-level error, retry
      if (attempt <= MAX_RETRIES) {
        const delay = 500 * attempt
        console.log(`⏳ SendGrid: Waiting ${delay}ms before retry...`)
        await new Promise((r) => setTimeout(r, delay))
      }
    }
  }

  // All retries exhausted
  console.error('❌ SendGrid: All retry attempts failed')
  throw new Error(`SendGrid send failed after ${attempt} attempts: ${JSON.stringify(lastError)}`)
}

module.exports = { sendEmailViaSendGrid }
