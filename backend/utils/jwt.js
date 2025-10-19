const jwt = require('jsonwebtoken')

function signAccess(payload) {
  return jwt.sign(payload, process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-this-in-production', { expiresIn: process.env.JWT_EXPIRES_IN || '24h' })
}

function signRefresh(payload) {
  return jwt.sign(payload, process.env.JWT_REFRESH_SECRET || 'your-super-secret-refresh-key-change-this-in-production', { expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '30d' })
}

function verifyAccess(token) {
  return jwt.verify(token, process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-this-in-production')
}

function verifyRefresh(token) {
  return jwt.verify(token, process.env.JWT_REFRESH_SECRET || 'your-super-secret-refresh-key-change-this-in-production')
}

module.exports = { signAccess, signRefresh, verifyAccess, verifyRefresh }

