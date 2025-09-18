const jwt = require('jsonwebtoken')

function signAccess(payload) {
  return jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || '24h' })
}

function signRefresh(payload) {
  return jwt.sign(payload, process.env.JWT_REFRESH_SECRET, { expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '30d' })
}

function verifyAccess(token) {
  return jwt.verify(token, process.env.JWT_SECRET)
}

function verifyRefresh(token) {
  return jwt.verify(token, process.env.JWT_REFRESH_SECRET)
}

module.exports = { signAccess, signRefresh, verifyAccess, verifyRefresh }

