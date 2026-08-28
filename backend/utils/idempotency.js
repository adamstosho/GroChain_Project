/**
 * Shared idempotency helpers for POST create endpoints.
 * Pair with partial unique indexes on { ownerField, idempotencyKey }.
 */

function parseIdempotencyKey(req) {
  const raw = req.get('Idempotency-Key') || req.body?.idempotencyKey || ''
  const key = String(raw).trim().slice(0, 128)
  return key || null
}

/**
 * @returns {Promise<object|null>} existing document or null
 */
async function findIdempotentRecord(Model, ownerFilter, idempotencyKey) {
  if (!idempotencyKey) return null
  return Model.findOne({ ...ownerFilter, idempotencyKey })
}

function idempotentSuccess(res, data, message = 'Already created') {
  return res.status(200).json({
    status: 'success',
    data,
    message,
    idempotent: true,
  })
}

module.exports = {
  parseIdempotencyKey,
  findIdempotentRecord,
  idempotentSuccess,
}
