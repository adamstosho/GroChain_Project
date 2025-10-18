#!/usr/bin/env node

const migrateOrderNumbers = require('./scripts/migrate-order-numbers')

console.log('🚀 Running order number migration...')
migrateOrderNumbers()
  .then(() => {
    console.log('✅ Migration completed successfully!')
    process.exit(0)
  })
  .catch((error) => {
    console.error('❌ Migration failed:', error)
    process.exit(1)
  })


