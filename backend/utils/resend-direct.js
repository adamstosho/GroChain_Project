const RESEND_API = 'https://api.resend.com/emails'
const MAX_RETRIES = 2
const { resolveResendFromEmail } = require('./email-config')

/** @deprecated Use resolveResendFromEmail from email-config.js */
function resolveFromEmail() {
  return resolveResendFromEmail()
}

/**
 * Send email using Resend HTTP API directly
 * This bypasses SMTP port blocking and provides better error handling
 * Resend is free for up to 100 emails/day
 */
async function sendEmailViaResend(to, subject, html) {
  const RESEND_API_KEY = process.env.RESEND_API_KEY
  const EMAIL_FROM = resolveResendFromEmail()

  if (!RESEND_API_KEY) {
    throw new Error('Missing RESEND_API_KEY in environment variables')
  }
  if (!EMAIL_FROM) {
    throw new Error('Missing EMAIL_FROM in environment variables')
  }

  const payload = {
    from: EMAIL_FROM,
    to: [to],
    subject: subject,
    html: html,
  }

  console.log('📧 Resend: Preparing to send email to:', to)
  console.log('📧 Resend: From:', EMAIL_FROM)

  let attempt = 0
  let lastError = null

  while (attempt <= MAX_RETRIES) {
    attempt += 1
    
    try {
      console.log(`📧 Resend: Attempt ${attempt}/${MAX_RETRIES + 1}...`)
      
      const resp = await fetch(RESEND_API, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${RESEND_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      })

      const text = await resp.text().catch(() => '')
      
      if (resp.ok) {
        let parsed = {}
        try { parsed = text ? JSON.parse(text) : {} } catch {}
        console.log('✅ Resend: Email sent successfully')
        return { 
          ok: true, 
          status: resp.status,
          messageId: parsed.id || 'unknown'
        }
      } else {
        let parsedBody = text
        try { parsedBody = text ? JSON.parse(text) : text } catch {}
        
        lastError = { 
          status: resp.status, 
          body: parsedBody
        }
        
        console.error(`❌ Resend: HTTP ${resp.status}:`, parsedBody)
        
        // Permanent client errors — do not retry
        if (resp.status === 401) {
          throw new Error('Resend authentication failed - check RESEND_API_KEY')
        }
        if (resp.status === 403) {
          const msg =
            typeof parsedBody === 'object' && parsedBody?.message
              ? parsedBody.message
              : 'Resend forbidden — verify domain or use account owner email in test mode'
          throw new Error(msg)
        }
        if (resp.status === 400) {
          throw new Error(`Resend bad request: ${JSON.stringify(parsedBody)}`)
        }
        if (resp.status === 422) {
          throw new Error(`Resend validation error: ${JSON.stringify(parsedBody)}`)
        }

        // Don't retry on other 4xx except rate limits
        if (resp.status >= 400 && resp.status < 500 && resp.status !== 429) {
          break
        }
        
        // For rate limits and 5xx, retry with backoff
        if (attempt <= MAX_RETRIES) {
          const delay = 500 * attempt
          console.log(`⏳ Resend: Waiting ${delay}ms before retry...`)
          await new Promise((r) => setTimeout(r, delay))
        }
      }
    } catch (err) {
      lastError = err
      console.error('❌ Resend: Network error:', err.message)
      
      // Network-level error, retry
      if (attempt <= MAX_RETRIES) {
        const delay = 500 * attempt
        console.log(`⏳ Resend: Waiting ${delay}ms before retry...`)
        await new Promise((r) => setTimeout(r, delay))
      }
    }
  }

  // All retries exhausted
  console.error('❌ Resend: All retry attempts failed')
  throw new Error(`Resend send failed after ${attempt} attempts: ${JSON.stringify(lastError)}`)
}

module.exports = { sendEmailViaResend, resolveFromEmail }
