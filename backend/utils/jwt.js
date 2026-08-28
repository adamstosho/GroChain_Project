const jwt = require('jsonwebtoken')

const WEAK_ACCESS_FALLBACK = 'your-super-secret-jwt-key-change-this-in-production'
const WEAK_REFRESH_FALLBACK = 'your-super-secret-refresh-key-change-this-in-production'

function resolveSecret(envValue, fallback, name) {
  const secret = envValue || (process.env.NODE_ENV === 'production' ? null : fallback)
  if (!secret) {
    throw new Error(`${name} must be set in production`)
  }
  if (process.env.NODE_ENV === 'production' && (secret === fallback || secret.length < 32)) {
    throw new Error(`${name} is missing or too weak for production (min 32 chars)`)
  }
  if (!envValue && process.env.NODE_ENV !== 'production') {
    console.warn(`⚠️  ${name} not set — using insecure development fallback`)
  }
  return secret
}

function getAccessSecret() {
  return resolveSecret(process.env.JWT_SECRET, WEAK_ACCESS_FALLBACK, 'JWT_SECRET')
}

function getRefreshSecret() {
  return resolveSecret(process.env.JWT_REFRESH_SECRET, WEAK_REFRESH_FALLBACK, 'JWT_REFRESH_SECRET')
}

function signAccess(payload) {
  return jwt.sign(payload, getAccessSecret(), { expiresIn: process.env.JWT_EXPIRES_IN || '24h' })
}

function signRefresh(payload) {
  return jwt.sign(payload, getRefreshSecret(), { expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '30d' })
}

function verifyAccess(token) {
  return jwt.verify(token, getAccessSecret())
}

function verifyRefresh(token) {
  return jwt.verify(token, getRefreshSecret())
}

// Signature-verified decode that tolerates an expired token — used only for
// logout, so we can trust the token's `id` claim (rejecting forgeries) even
// if the access token happened to expire right before the logout call.
function verifyAccessAllowExpired(token) {
  return jwt.verify(token, getAccessSecret(), { ignoreExpiration: true })
}

module.exports = { signAccess, signRefresh, verifyAccess, verifyRefresh, verifyAccessAllowExpired }
