const PUBLIC_MAILBOX_DOMAINS = [
  'gmail.com',
  'googlemail.com',
  'yahoo.com',
  'hotmail.com',
  'outlook.com',
  'live.com'
]

const DEFAULT_RESEND_FROM = 'GroChain <onboarding@resend.dev>'

function extractEmailAddress(value) {
  if (!value) return ''
  const match = value.match(/<([^>]+)>/) || value.match(/([^\s<>]+@[^\s<>]+)/)
  return (match ? match[1] : value).trim()
}

function extractEmailDomain(value) {
  const email = extractEmailAddress(value)
  return email.split('@')[1]?.toLowerCase() || ''
}

function isPublicMailboxDomain(value) {
  const domain = extractEmailDomain(value)
  if (!domain) return false
  return PUBLIC_MAILBOX_DOMAINS.some(
    (blocked) => domain === blocked || domain.endsWith(`.${blocked}`)
  )
}

/**
 * Resend requires a verified domain or onboarding@resend.dev (test mode).
 * Public mailbox domains (gmail.com, etc.) always fail with HTTP 403.
 */
function resolveResendFromEmail() {
  const configured =
    process.env.RESEND_FROM_EMAIL ||
    process.env.EMAIL_FROM ||
    DEFAULT_RESEND_FROM

  if (isPublicMailboxDomain(configured)) {
    const fallback =
      process.env.RESEND_FALLBACK_FROM_EMAIL || DEFAULT_RESEND_FROM
    console.warn(
      `⚠️ Resend cannot send from ${configured} (public/unverified domain). Using ${fallback}`
    )
    return fallback
  }

  if (configured.includes('<') && configured.includes('>')) {
    return configured
  }

  const name = process.env.RESEND_FROM_NAME || process.env.SENDGRID_FROM_NAME || 'GroChain'
  return `${name} <${configured}>`
}

function getConfiguredEmailProviders() {
  return {
    resend: Boolean(process.env.RESEND_API_KEY),
    sendgrid: Boolean(process.env.SENDGRID_API_KEY),
    smtp: Boolean(
      process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS
    )
  }
}

function validateEmailConfigOnStartup() {
  const warnings = []
  const errors = []

  if (String(process.env.ENABLE_EMAIL).toLowerCase() === 'false') {
    return { ok: true, warnings, errors, providers: {}, primary: null }
  }

  const provider = String(process.env.EMAIL_PROVIDER || 'resend').toLowerCase()
  const providers = getConfiguredEmailProviders()
  const onRender = Boolean(process.env.RENDER)

  if (!providers.resend && !providers.sendgrid && !providers.smtp) {
    warnings.push('No email provider configured (RESEND_API_KEY, SENDGRID_API_KEY, or SMTP)')
  }

  if (providers.resend) {
    const resolvedFrom = resolveResendFromEmail()
    if (resolvedFrom.includes('onboarding@resend.dev')) {
      warnings.push(
        'Resend is using onboarding@resend.dev (test sender). Verify a custom domain at resend.com/domains for production.'
      )
    }
  }

  if (
    process.env.SENDGRID_FROM_EMAIL &&
    isPublicMailboxDomain(process.env.SENDGRID_FROM_EMAIL)
  ) {
    warnings.push(
      `SENDGRID_FROM_EMAIL (${process.env.SENDGRID_FROM_EMAIL}) is a public mailbox — SendGrid requires a verified sender identity.`
    )
  }

  if (onRender && provider === 'smtp') {
    errors.push(
      'EMAIL_PROVIDER=smtp on Render will fail: Render blocks outbound SMTP ports. Use resend or sendgrid (HTTP API).'
    )
  }

  if (onRender && providers.smtp && !providers.resend && !providers.sendgrid) {
    errors.push(
      'Only SMTP is configured on Render — email will fail. Set RESEND_API_KEY or SENDGRID_API_KEY in the Render dashboard.'
    )
  }

  if (provider === 'sendgrid' && !providers.sendgrid && providers.resend) {
    warnings.push(
      'EMAIL_PROVIDER=sendgrid but SENDGRID_API_KEY is missing/invalid — failover will use Resend if configured.'
    )
  }

  return { ok: errors.length === 0, warnings, errors, providers, primary: provider }
}

function logEmailConfigValidation(result) {
  if (result.errors.length) {
    for (const msg of result.errors) {
      console.error(`❌ Email config: ${msg}`)
    }
  }
  if (result.warnings.length) {
    for (const msg of result.warnings) {
      console.warn(`⚠️ Email config: ${msg}`)
    }
  }
  if (result.ok && result.providers.resend) {
    console.log(`✅ Email: Resend ready (from ${resolveResendFromEmail()})`)
  } else if (result.ok && result.providers.sendgrid) {
    console.log('✅ Email: SendGrid HTTP API ready')
  }
}

module.exports = {
  PUBLIC_MAILBOX_DOMAINS,
  DEFAULT_RESEND_FROM,
  extractEmailAddress,
  extractEmailDomain,
  isPublicMailboxDomain,
  resolveResendFromEmail,
  getConfiguredEmailProviders,
  validateEmailConfigOnStartup,
  logEmailConfigValidation
}
