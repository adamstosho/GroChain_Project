// Escapes regex special characters in user-supplied search input before it's
// used to build a MongoDB $regex query. Without this, a crafted search term
// (e.g. nested quantifiers) run against a collection scan on public,
// unauthenticated endpoints is a ReDoS vector.
function escapeRegex(value) {
  return String(value || '').replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

module.exports = { escapeRegex }
