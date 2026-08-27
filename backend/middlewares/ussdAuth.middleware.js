const crypto = require('crypto')

/**
 * Authenticate inbound USSD provider callbacks.
 * Accepts USSD_CALLBACK_SECRET via:
 *   - header x-ussd-secret
 *   - header x-api-key
 *   - Authorization: Bearer <secret>
 *   - body/query apiKey (Africa's Talking style)
 *
 * Production requires the secret to be configured. Non-production warns and allows
 * through only when the secret is unset (local/dev convenience).
 */
function verifyUssdCallback(req, res, next) {
  const expected = process.env.USSD_CALLBACK_SECRET

  if (!expected) {
    if (process.env.NODE_ENV === 'production') {
      console.error('USSD_CALLBACK_SECRET is not set — rejecting USSD callbacks')
      return res.status(503).json({
        status: 'error',
        message: 'USSD callback authentication is not configured'
      })
    }
    console.warn('⚠️  USSD_CALLBACK_SECRET not set — allowing unauthenticated USSD callbacks in non-production')
    return next()
  }

  const authHeader = req.headers.authorization || ''
  const bearer = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null
  const provided =
    req.headers['x-ussd-secret'] ||
    req.headers['x-api-key'] ||
    bearer ||
    req.body?.apiKey ||
    req.query?.apiKey ||
    null

  if (!provided || typeof provided !== 'string') {
    return res.status(401).json({ status: 'error', message: 'Unauthorized USSD callback' })
  }

  const a = Buffer.from(provided)
  const b = Buffer.from(expected)
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) {
    return res.status(401).json({ status: 'error', message: 'Unauthorized USSD callback' })
  }

  return next()
}

module.exports = { verifyUssdCallback }
