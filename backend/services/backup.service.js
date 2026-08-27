const fs = require('fs')
const path = require('path')
const User = require('../models/user.model')
const Harvest = require('../models/harvest.model')
const Order = require('../models/order.model')
const Listing = require('../models/listing.model')
const Transaction = require('../models/transaction.model')
const Partner = require('../models/partner.model')
const Referral = require('../models/referral.model')
const Commission = require('../models/commission.model')
const Shipment = require('../models/shipment.model')
const Notification = require('../models/notification.model')
const Payment = require('../models/payment.model')
const Review = require('../models/review.model')
const Onboarding = require('../models/onboarding.model')
const QRCode = require('../models/qrcode.model')
const AdminSettings = require('../models/admin-settings.model')
const Product = require('../models/product.model')
const Favorite = require('../models/favorite.model')

const BACKUP_DIR = path.join(__dirname, '..', 'backups')
const INDEX_FILE = path.join(BACKUP_DIR, 'index.json')

const COLLECTION_MODELS = {
  users: User,
  harvests: Harvest,
  orders: Order,
  listings: Listing,
  products: Product,
  transactions: Transaction,
  partners: Partner,
  referrals: Referral,
  commissions: Commission,
  shipments: Shipment,
  notifications: Notification,
  payments: Payment,
  reviews: Review,
  onboardings: Onboarding,
  qrcodes: QRCode,
  favorites: Favorite,
  adminSettings: AdminSettings,
}

const FULL_COLLECTIONS = Object.keys(COLLECTION_MODELS)

function ensureBackupDir() {
  if (!fs.existsSync(BACKUP_DIR)) {
    fs.mkdirSync(BACKUP_DIR, { recursive: true })
  }
}

function readIndex() {
  ensureBackupDir()
  if (!fs.existsSync(INDEX_FILE)) return []
  try {
    const raw = JSON.parse(fs.readFileSync(INDEX_FILE, 'utf8'))
    return Array.isArray(raw) ? raw : []
  } catch {
    return []
  }
}

function writeIndex(entries) {
  ensureBackupDir()
  fs.writeFileSync(INDEX_FILE, JSON.stringify(entries, null, 2), 'utf8')
}

function formatBytes(bytes) {
  if (!bytes || bytes <= 0) return '0 B'
  const units = ['B', 'KB', 'MB', 'GB']
  const i = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1)
  const value = bytes / Math.pow(1024, i)
  return `${value.toFixed(i === 0 ? 0 : 1)} ${units[i]}`
}

function backupFilePath(backupId) {
  return path.join(BACKUP_DIR, `${backupId}.json`)
}

async function exportCollection(name, Model, sinceDate) {
  const query = sinceDate ? { updatedAt: { $gte: sinceDate } } : {}
  // Keep auth hashes in stored backups so restore can reinstate accounts.
  // Strip ephemeral OTP fields only.
  const cursor =
    name === 'users'
      ? Model.find(query).select('-otp -otpExpires -resetPasswordToken -resetPasswordExpires').lean()
      : Model.find(query).lean()
  return cursor
}

async function createBackup({
  type = 'full',
  description,
  createdBy = 'system',
  collections,
} = {}) {
  ensureBackupDir()
  const backupId = `backup_${Date.now()}`
  const selected =
    Array.isArray(collections) && collections.length
      ? collections.filter((c) => COLLECTION_MODELS[c])
      : FULL_COLLECTIONS

  let sinceDate = null
  if (type === 'incremental') {
    const previous = readIndex()
      .filter((b) => b.status === 'completed')
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))[0]
    if (previous?.createdAt) sinceDate = new Date(previous.createdAt)
  }

  const data = {}
  const counts = {}
  for (const name of selected) {
    const Model = COLLECTION_MODELS[name]
    const rows = await exportCollection(name, Model, sinceDate)
    data[name] = rows
    counts[name] = rows.length
  }

  const payload = {
    id: backupId,
    type,
    description:
      description ||
      `${type} backup created on ${new Date().toLocaleString()}`,
    status: 'completed',
    createdAt: new Date().toISOString(),
    createdBy,
    collections: selected,
    counts,
    data,
  }

  const filePath = backupFilePath(backupId)
  fs.writeFileSync(filePath, JSON.stringify(payload), 'utf8')
  const sizeBytes = fs.statSync(filePath).size

  const meta = {
    id: backupId,
    type,
    description: payload.description,
    status: 'completed',
    size: formatBytes(sizeBytes),
    sizeBytes,
    createdAt: payload.createdAt,
    createdBy,
    collections: selected,
    counts,
    downloadUrl: `/api/admin/system/backups/${backupId}/download`,
  }

  const index = readIndex().filter((b) => b.id !== backupId)
  index.unshift(meta)
  writeIndex(index)

  await enforceRetention()
  return meta
}

function listBackups() {
  ensureBackupDir()
  const index = readIndex()
  // Drop index entries whose files are missing
  const existing = index.filter((b) => fs.existsSync(backupFilePath(b.id)))
  if (existing.length !== index.length) writeIndex(existing)
  return existing
}

function getBackupMeta(backupId) {
  return listBackups().find((b) => b.id === backupId) || null
}

function getBackupFilePath(backupId) {
  const filePath = backupFilePath(backupId)
  if (!fs.existsSync(filePath)) return null
  return filePath
}

async function restoreBackup(backupId, collections = []) {
  const filePath = getBackupFilePath(backupId)
  if (!filePath) {
    const err = new Error('Backup file not found')
    err.statusCode = 404
    throw err
  }

  const payload = JSON.parse(fs.readFileSync(filePath, 'utf8'))
  const available = payload.collections || Object.keys(payload.data || {})
  const targets =
    Array.isArray(collections) && collections.length
      ? collections.filter((c) => available.includes(c) && COLLECTION_MODELS[c])
      : available.filter((c) => COLLECTION_MODELS[c])

  const restored = {}
  for (const name of targets) {
    const Model = COLLECTION_MODELS[name]
    const rows = Array.isArray(payload.data?.[name]) ? payload.data[name] : []
    await Model.deleteMany({})
    if (rows.length) {
      await Model.insertMany(rows, { ordered: false })
    }
    restored[name] = rows.length
  }

  return {
    restoreId: `restore_${Date.now()}`,
    backupId,
    status: 'completed',
    collections: targets,
    restored,
    restoredAt: new Date().toISOString(),
  }
}

async function enforceRetention() {
  try {
    const settings = await AdminSettings.findOne().lean()
    const retentionDays = settings?.data?.retentionPeriod || settings?.retentionPeriod || 365
    if (!retentionDays || retentionDays <= 0) return

    const cutoff = Date.now() - retentionDays * 24 * 60 * 60 * 1000
    const index = readIndex()
    const kept = []
    for (const entry of index) {
      const created = new Date(entry.createdAt).getTime()
      if (created >= cutoff) {
        kept.push(entry)
      } else {
        const fp = backupFilePath(entry.id)
        if (fs.existsSync(fp)) fs.unlinkSync(fp)
      }
    }
    writeIndex(kept)
  } catch (err) {
    console.warn('Backup retention cleanup skipped:', err.message)
  }
}

async function runScheduledBackupIfDue() {
  try {
    const settingsDoc = await AdminSettings.findOne().lean()
    const data = settingsDoc?.data || settingsDoc || {}
    if (data.autoBackup === false) return null

    const frequency = data.backupFrequency || 'daily'
    const intervalMs = {
      hourly: 60 * 60 * 1000,
      daily: 24 * 60 * 60 * 1000,
      weekly: 7 * 24 * 60 * 60 * 1000,
      monthly: 30 * 24 * 60 * 60 * 1000,
    }[frequency] || 24 * 60 * 60 * 1000

    const latest = listBackups().find((b) => b.createdBy === 'scheduler' || b.type === 'full' || b.type === 'incremental')
    if (latest?.createdAt) {
      const age = Date.now() - new Date(latest.createdAt).getTime()
      if (age < intervalMs) return null
    }

    return createBackup({
      type: frequency === 'hourly' ? 'incremental' : 'full',
      description: `Automatic ${frequency} backup`,
      createdBy: 'scheduler',
    })
  } catch (err) {
    console.error('Scheduled backup failed:', err)
    return null
  }
}

function startBackupScheduler(intervalMs = 60 * 60 * 1000) {
  // Run once shortly after boot, then on interval
  setTimeout(() => {
    runScheduledBackupIfDue().catch(() => {})
  }, 30 * 1000)

  return setInterval(() => {
    runScheduledBackupIfDue().catch(() => {})
  }, intervalMs)
}

module.exports = {
  BACKUP_DIR,
  FULL_COLLECTIONS,
  createBackup,
  listBackups,
  getBackupMeta,
  getBackupFilePath,
  restoreBackup,
  runScheduledBackupIfDue,
  startBackupScheduler,
  enforceRetention,
}
