import { apiService } from "./api"
import type { ApiResponse } from "./types"

type ExportRow = Record<string, unknown>
type JsonRecord = Record<string, unknown>

export interface ExportOptions {
  format?: "csv" | "json" | "excel" | "pdf" | "xlsx"
  filename?: string
  includeHeaders?: boolean
  dateRange?: { start: string; end: string } | string
  filters?: Record<string, unknown>
  dataType?: string
  /** Required for exports that run from already-loaded UI data */
  rows?: ExportRow[]
}

export interface ExportResult {
  success: boolean
  filename?: string
  error?: string
}

type ServerExportType =
  | "harvests"
  | "listings"
  | "users"
  | "partners"
  | "shipments"
  | "transactions"
  | "orders"
  | "analytics"
  | "custom"

interface ExportImportRequestBody {
  format: "csv" | "excel" | "json"
  filters: Record<string, unknown>
  options: {
    includeHeaders: boolean
    filename?: string
  }
  data?: ExportRow[]
}

interface ExportImportPayload {
  filename?: string
  data?: { filename?: string }
}

function getErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof Error) return error.message
  if (typeof error === "object" && error !== null && "message" in error) {
    const message = (error as { message: unknown }).message
    if (typeof message === "string") return message
  }
  return fallback
}

function asRecord(value: unknown): JsonRecord {
  return value != null && typeof value === "object" && !Array.isArray(value)
    ? (value as JsonRecord)
    : {}
}

function extractList(res: unknown, ...keys: string[]): unknown[] {
  const root = asRecord(res)
  for (const key of keys) {
    const nested = asRecord(root.data)
    const fromData = nested[key]
    if (Array.isArray(fromData)) return fromData
    const fromRoot = root[key]
    if (Array.isArray(fromRoot)) return fromRoot
  }
  const data = root.data
  if (Array.isArray(data)) return data
  return []
}

function extractData(res: unknown): JsonRecord {
  const root = asRecord(res)
  const data = root.data
  if (data != null && typeof data === "object" && !Array.isArray(data)) {
    return data as JsonRecord
  }
  return root
}

/** Mirrors `res?.data || res || {}` for single-object or array payloads. */
function extractPayload(res: unknown): unknown {
  const root = asRecord(res)
  return root.data ?? root
}

function normalizeFormat(format: string): "csv" | "excel" | "json" {
  const f = (format || "csv").toLowerCase()
  if (f === "xlsx" || f === "excel" || f === "pdf") return "excel"
  if (f === "json") return "json"
  return "csv"
}

function fileExtension(format: string): string {
  const n = normalizeFormat(format)
  if (n === "excel") return "xlsx"
  return n
}

function flattenLite(value: unknown, prefix = ""): ExportRow {
  const out: ExportRow = {}
  if (value == null || typeof value !== "object" || Array.isArray(value)) {
    out[prefix || "value"] = value as unknown
    return out
  }
  for (const [k, v] of Object.entries(value)) {
    const key = prefix ? `${prefix}_${k}` : k
    if (v != null && typeof v === "object" && !Array.isArray(v)) {
      Object.assign(out, flattenLite(v, key))
    } else if (Array.isArray(v)) {
      out[key] = JSON.stringify(v)
    } else {
      out[key] = v
    }
  }
  return out
}

async function apiGet(endpoint: string): Promise<unknown> {
  const path = endpoint.startsWith("/api/") ? endpoint : `/api${endpoint.startsWith("/") ? endpoint : `/${endpoint}`}`
  const response = await apiService.getRaw(path)
  if (!response.ok) {
    throw new Error((await response.text()) || `HTTP ${response.status}`)
  }
  const contentType = response.headers.get("content-type") || ""
  if (contentType.includes("application/json")) return response.json()
  return { raw: await response.text() }
}

function downloadBlob(blob: Blob, filename: string): boolean {
  try {
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.href = url
    link.download = filename
    link.style.display = "none"
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    window.URL.revokeObjectURL(url)
    return true
  } catch (error) {
    console.error("Download failed:", error)
    return false
  }
}

function toCsv(rows: ExportRow[]): string {
  if (!rows.length) return "message\nNo records matched this export."
  const headers = Array.from(
    rows.reduce<Set<string>>((set, row) => {
      Object.keys(row || {}).forEach((k) => set.add(k))
      return set
    }, new Set<string>())
  )
  const escape = (v: unknown) => {
    const s = v == null ? "" : typeof v === "object" ? JSON.stringify(v) : String(v)
    return `"${s.replace(/"/g, '""')}"`
  }
  return [headers.join(","), ...rows.map((row) => headers.map((h) => escape(row[h])).join(","))].join("\n")
}

export class ExportService {
  /** Two-step export via /api/export-import (create file → download). */
  async exportViaImportService(
    type: ServerExportType,
    options: ExportOptions = {}
  ): Promise<ExportResult> {
    try {
      const format = normalizeFormat(options.format || "csv")
      const filters: Record<string, unknown> = { ...(options.filters || {}) }
      if (options.dateRange && typeof options.dateRange === "object") {
        filters.startDate = options.dateRange.start
        filters.endDate = options.dateRange.end
      }

      const body: ExportImportRequestBody = {
        format,
        filters,
        options: {
          includeHeaders: options.includeHeaders !== false,
          filename: options.filename,
        },
      }

      if (type === "custom") {
        if (!options.rows || !options.rows.length) {
          return { success: false, error: "No data to export" }
        }
        body.data = options.rows
      }

      const response: ApiResponse<ExportImportPayload> = await apiService.post(
        `/export-import/export/${type}`,
        body as unknown as JsonRecord
      )
      const ok = response?.success === true || response?.status === "success"
      const payload = response?.data || {}
      const filename = payload.filename || payload.data?.filename

      if (!ok || !filename) {
        throw new Error(response?.message || "Export failed — no file produced")
      }

      const downloadResponse = await apiService.getRaw(`/export-import/download/${filename}`)
      if (!downloadResponse.ok) {
        throw new Error(`Download failed (${downloadResponse.status})`)
      }
      const blob = await downloadResponse.blob()
      const finalName = options.filename || filename

      if (!downloadBlob(blob, finalName)) {
        throw new Error("Failed to trigger download")
      }
      return { success: true, filename: finalName }
    } catch (error: unknown) {
      console.error("Export error:", error)
      return { success: false, error: getErrorMessage(error, "Failed to export data") }
    }
  }

  /** Client-side CSV when server export isn't available or data is already loaded. */
  async exportRowsLocally(rows: ReadonlyArray<ExportRow | object>, options: ExportOptions = {}): Promise<ExportResult> {
    const normalizedRows = [...rows] as ExportRow[]
    try {
      if (!normalizedRows?.length) return { success: false, error: "No data to export" }
      const format = normalizeFormat(options.format || "csv")
      if (format === "json") {
        const name =
          options.filename || `grochain-export-${new Date().toISOString().slice(0, 10)}.json`
        const blob = new Blob([JSON.stringify(normalizedRows, null, 2)], { type: "application/json" })
        if (!downloadBlob(blob, name)) throw new Error("Download failed")
        return { success: true, filename: name }
      }
      // excel → still CSV locally (real xlsx via custom export-import when possible)
      if (format === "excel") {
        return this.exportViaImportService("custom", { ...options, rows: normalizedRows, format: "excel" })
      }
      const name =
        options.filename || `grochain-export-${new Date().toISOString().slice(0, 10)}.csv`
      const blob = new Blob([toCsv(normalizedRows)], { type: "text/csv;charset=utf-8" })
      if (!downloadBlob(blob, name.endsWith(".csv") ? name : `${name}.csv`)) {
        throw new Error("Download failed")
      }
      return { success: true, filename: name }
    } catch (error: unknown) {
      return { success: false, error: getErrorMessage(error, "Failed to export") }
    }
  }

  // —— Specific exporters ——

  async exportFavorites(options: ExportOptions = {}): Promise<ExportResult> {
    if (options.rows?.length) return this.exportRowsLocally(options.rows, options)
    try {
      const res = await apiService.getFavorites()
      const list = extractList(res, "favorites")
      const rows = list.map((item) => {
        const f = asRecord(item)
        const listing = asRecord(f.listing)
        const farmer = asRecord(listing.farmer)
        return {
          listingId: listing._id || f.listingId || f._id,
          cropName: listing.cropName || f.cropName || "",
          price: listing.price ?? f.price ?? "",
          quality: listing.quality || "",
          farmer: farmer.name || "",
          notes: f.notes || "",
          addedAt: f.createdAt || f.addedAt || "",
        }
      })
      return this.exportRowsLocally(rows, {
        ...options,
        filename: options.filename || `favorites-${new Date().toISOString().slice(0, 10)}.csv`,
      })
    } catch (e: unknown) {
      return { success: false, error: getErrorMessage(e, "Failed to export favorites") }
    }
  }

  async exportCommissions(options: ExportOptions = {}): Promise<ExportResult> {
    if (options.rows?.length) return this.exportRowsLocally(options.rows, options)
    try {
      const res = await apiGet("/api/commissions")
      const list = extractList(res, "commissions")
      const rows = list.map((item) => {
        const c = asRecord(item)
        const order = asRecord(c.order)
        const farmer = asRecord(c.farmer)
        const listing = asRecord(c.listing)
        return {
          id: c._id,
          amount: c.amount,
          rate: c.rate,
          status: c.status,
          orderNumber: order.orderNumber,
          farmer: farmer.name,
          crop: listing.cropName,
          createdAt: c.createdAt,
        }
      })
      return this.exportRowsLocally(rows, options)
    } catch (e: unknown) {
      return { success: false, error: getErrorMessage(e, "Failed to export commissions") }
    }
  }

  async exportTransactions(options: ExportOptions = {}, format?: string): Promise<ExportResult> {
    const opts: ExportOptions = {
      ...options,
      format: (format as ExportOptions["format"]) || options.format || "csv",
    }
    if (options.rows?.length) return this.exportRowsLocally(options.rows, opts)
    return this.exportViaImportService("transactions", opts)
  }

  async exportOrders(options: ExportOptions = {}): Promise<ExportResult> {
    if (options.rows?.length) return this.exportRowsLocally(options.rows, options)
    return this.exportViaImportService("orders", options)
  }

  async exportHarvests(options: ExportOptions = {}): Promise<ExportResult> {
    if (options.rows?.length) return this.exportRowsLocally(options.rows, options)
    return this.exportViaImportService("harvests", options)
  }

  async exportShipments(options: ExportOptions = {}): Promise<ExportResult> {
    return this.exportViaImportService("shipments", options)
  }

  async exportListings(options: ExportOptions = {}): Promise<ExportResult> {
    return this.exportViaImportService("listings", options)
  }

  async exportProducts(options: ExportOptions = {}): Promise<ExportResult> {
    return this.exportListings(options)
  }

  async exportUsers(options: ExportOptions = {}): Promise<ExportResult> {
    return this.exportViaImportService("users", options)
  }

  async exportPartners(options: ExportOptions = {}): Promise<ExportResult> {
    return this.exportViaImportService("partners", options)
  }

  async exportFarmers(options: ExportOptions = {}): Promise<ExportResult> {
    if (options.rows?.length) {
      return this.exportRowsLocally(options.rows, { ...options, format: options.format || "excel" })
    }
    return this.exportViaImportService("users", {
      ...options,
      filters: { ...(options.filters || {}), role: "farmer" },
    })
  }

  async exportAnalytics(
    type: string = "all",
    period: string = "30d",
    format: string = "csv"
  ): Promise<ExportResult> {
    try {
      const normalized = format === "excel" || format === "xlsx" || format === "pdf" ? "xlsx" : format === "json" ? "csv" : "csv"
      // Real file stream from analytics report endpoint
      const requestBody = {
        type: type === "all" || type === "partner" || type === "farmer" ? "user" : type,
        period,
        format: normalized,
        filename: `grochain-analytics-${type}-${period}-${new Date().toISOString().slice(0, 10)}`,
      }
      const response = await apiService.postRaw("/api/analytics/report", requestBody)
      if (!response.ok) throw new Error(await response.text() || `HTTP ${response.status}`)
      const blob = await response.blob()
      const ext = normalized === "xlsx" ? "xlsx" : "csv"
      const filename = `${requestBody.filename}.${ext}`
      if (!downloadBlob(blob, filename)) throw new Error("Download failed")
      return { success: true, filename }
    } catch {
      // Fallback to export-import analytics
      return this.exportViaImportService("analytics", {
        format: normalizeFormat(format),
        filters: { type, period },
      })
    }
  }

  async exportReports(options: ExportOptions = {}): Promise<ExportResult> {
    return this.exportViaImportService("analytics", options)
  }

  async exportPayments(options: ExportOptions = {}): Promise<ExportResult> {
    if (options.rows?.length) return this.exportRowsLocally(options.rows, options)
    return this.exportViaImportService("transactions", options)
  }

  async exportReferrals(options: ExportOptions = {}): Promise<ExportResult> {
    if (options.rows?.length) return this.exportRowsLocally(options.rows, options)
    try {
      const res = await apiGet("/api/referrals")
      const list = extractList(res, "referrals")
      return this.exportRowsLocally(Array.isArray(list) ? (list as ExportRow[]) : [], options)
    } catch (e: unknown) {
      return { success: false, error: getErrorMessage(e, "Failed to export referrals") }
    }
  }

  async exportNotifications(options: ExportOptions = {}): Promise<ExportResult> {
    if (options.rows?.length) return this.exportRowsLocally(options.rows, options)
    try {
      const res = await apiGet("/api/notifications")
      const list = extractList(res, "notifications")
      return this.exportRowsLocally(Array.isArray(list) ? (list as ExportRow[]) : [], options)
    } catch (e: unknown) {
      return { success: false, error: getErrorMessage(e, "Failed to export notifications") }
    }
  }

  async exportPriceAlerts(options: ExportOptions = {}): Promise<ExportResult> {
    if (options.rows?.length) return this.exportRowsLocally(options.rows, options)
    try {
      const res = await apiGet("/api/price-alerts")
      const list = extractList(res, "alerts")
      return this.exportRowsLocally(Array.isArray(list) ? (list as ExportRow[]) : [], options)
    } catch (e: unknown) {
      return { success: false, error: getErrorMessage(e, "Failed to export price alerts") }
    }
  }

  async exportWeatherData(options: ExportOptions = {}): Promise<ExportResult> {
    return this.exportWeather(options)
  }

  async exportWeather(options: ExportOptions = {}): Promise<ExportResult> {
    if (options.rows?.length) return this.exportRowsLocally(options.rows, options)
    try {
      const res = await apiGet("/api/weather/current/Lagos")
      const data = extractData(res)
      return this.exportRowsLocally([{ exportedAt: new Date().toISOString(), ...data }], options)
    } catch (e: unknown) {
      return { success: false, error: getErrorMessage(e, "Failed to export weather data") }
    }
  }

  async exportInventory(options: ExportOptions = {}): Promise<ExportResult> {
    return this.exportHarvests(options)
  }

  async exportReviews(options: ExportOptions = {}): Promise<ExportResult> {
    if (options.rows?.length) return this.exportRowsLocally(options.rows, options)
    try {
      const res = await apiGet("/api/reviews/farmer")
      const list = extractList(res, "reviews")
      return this.exportRowsLocally(Array.isArray(list) ? (list as ExportRow[]) : [], options)
    } catch (e: unknown) {
      return { success: false, error: getErrorMessage(e, "Failed to export reviews") }
    }
  }

  async exportFintech(options: ExportOptions = {}): Promise<ExportResult> {
    if (options.rows?.length) return this.exportRowsLocally(options.rows, options)
    try {
      const res = await apiGet("/api/fintech/dashboard")
      const data = extractData(res)
      return this.exportRowsLocally([{ exportedAt: new Date().toISOString(), ...flattenLite(data) }], options)
    } catch (e: unknown) {
      return { success: false, error: getErrorMessage(e, "Failed to export fintech data") }
    }
  }

  async exportLoans(options: ExportOptions = {}): Promise<ExportResult> {
    if (options.rows?.length) return this.exportRowsLocally(options.rows, options)
    try {
      const res = await apiGet("/api/fintech/loan-applications")
      const list = extractList(res, "applications")
      return this.exportRowsLocally(Array.isArray(list) ? (list as ExportRow[]) : [], options)
    } catch (e: unknown) {
      return { success: false, error: getErrorMessage(e, "Failed to export loans") }
    }
  }

  async exportInsurance(options: ExportOptions = {}): Promise<ExportResult> {
    return this.exportInsurancePolicies(options)
  }

  async exportCreditScores(options: ExportOptions = {}): Promise<ExportResult> {
    if (options.rows?.length) return this.exportRowsLocally(options.rows, options)
    try {
      const res = await apiGet("/api/fintech/credit-score/me")
      const data = extractData(res)
      return this.exportRowsLocally([{ exportedAt: new Date().toISOString(), ...data }], options)
    } catch (e: unknown) {
      return { success: false, error: getErrorMessage(e, "Failed to export credit score") }
    }
  }

  async exportFinancialGoals(options: ExportOptions = {}): Promise<ExportResult> {
    if (options.rows?.length) return this.exportRowsLocally(options.rows, options)
    try {
      const res = await apiGet("/api/fintech/financial-goals/me")
      const root = asRecord(res)
      const data = root.data
      const list = asRecord(data).goals ?? data ?? []
      return this.exportRowsLocally(
        Array.isArray(list) ? (list as ExportRow[]) : [list].filter(Boolean) as ExportRow[],
        options
      )
    } catch (e: unknown) {
      return { success: false, error: getErrorMessage(e, "Failed to export financial goals") }
    }
  }

  async exportLoanReferrals(options: ExportOptions = {}): Promise<ExportResult> {
    if (options.rows?.length) return this.exportRowsLocally(options.rows, options)
    return this.exportReferrals(options)
  }

  async exportInsurancePolicies(options: ExportOptions = {}): Promise<ExportResult> {
    if (options.rows?.length) return this.exportRowsLocally(options.rows, options)
    try {
      const res = await apiGet("/api/fintech/dashboard")
      const data = extractData(res)
      const policies = data.insurancePolicies ?? data.policies
      const list = Array.isArray(policies) ? policies : []
      return this.exportRowsLocally(list as ExportRow[], options)
    } catch (e: unknown) {
      return { success: false, error: getErrorMessage(e, "Failed to export insurance policies") }
    }
  }

  async exportBVNVerifications(options: ExportOptions = {}): Promise<ExportResult> {
    if (options.rows?.length) return this.exportRowsLocally(options.rows, options)
    try {
      const res = await apiGet("/api/bvn/status")
      const data = extractData(res)
      return this.exportRowsLocally([{ exportedAt: new Date().toISOString(), ...data }], options)
    } catch (e: unknown) {
      return { success: false, error: getErrorMessage(e, "Failed to export BVN status") }
    }
  }

  async exportQRCodes(options: ExportOptions = {}): Promise<ExportResult> {
    if (options.rows?.length) return this.exportRowsLocally(options.rows, options)
    try {
      const res = await apiService.getQRCodes({ limit: 1000 })
      const list = extractList(res, "qrCodes")
      return this.exportRowsLocally(Array.isArray(list) ? (list as ExportRow[]) : [], options)
    } catch (e: unknown) {
      return { success: false, error: getErrorMessage(e, "Failed to export QR codes") }
    }
  }

  async exportMarketplaceData(options: ExportOptions = {}): Promise<ExportResult> {
    return this.exportListings(options)
  }

  async exportPartnerSettings(options: ExportOptions = {}): Promise<ExportResult> {
    if (options.rows?.length) return this.exportRowsLocally(options.rows, options)
    try {
      const res = await apiGet("/api/users/settings/me")
      const data = extractData(res)
      return this.exportRowsLocally([{ exportedAt: new Date().toISOString(), ...data }], options)
    } catch (e: unknown) {
      return { success: false, error: getErrorMessage(e, "Failed to export partner settings") }
    }
  }

  async exportNotificationPreferences(options: ExportOptions = {}): Promise<ExportResult> {
    if (options.rows?.length) return this.exportRowsLocally(options.rows, options)
    try {
      const res = await apiGet("/api/users/preferences/me")
      const data = extractData(res)
      return this.exportRowsLocally([{ exportedAt: new Date().toISOString(), ...data }], options)
    } catch (e: unknown) {
      return { success: false, error: getErrorMessage(e, "Failed to export notification preferences") }
    }
  }

  async exportHarvestApprovals(options: ExportOptions = {}): Promise<ExportResult> {
    try {
      const format = normalizeFormat(options.format || "csv")
      const qs = new URLSearchParams({
        format,
        ...(options.filters || {}),
      } as Record<string, string>).toString()
      const response = await apiService.getRaw(`/api/harvest-approval/export?${qs}`)
      if (!response.ok) throw new Error(await response.text() || `HTTP ${response.status}`)
      const blob = await response.blob()
      const filename =
        options.filename || `harvest-approvals-${new Date().toISOString().slice(0, 10)}.${fileExtension(format)}`
      if (!downloadBlob(blob, filename)) throw new Error("Download failed")
      return { success: true, filename }
    } catch (error: unknown) {
      return { success: false, error: getErrorMessage(error, "Failed to export approvals") }
    }
  }

  async exportUploads(options: ExportOptions = {}): Promise<ExportResult> {
    if (options.rows?.length) return this.exportRowsLocally(options.rows, options)
    return this.exportViaImportService("custom", {
      ...options,
      rows: [{ message: "No upload registry export — use page data via options.rows" }],
    })
  }

  async exportAdminSettings(options: ExportOptions = {}): Promise<ExportResult> {
    if (options.rows?.length) return this.exportRowsLocally(options.rows, options)
    return this.exportUsers(options)
  }

  async exportLanguageData(options: ExportOptions = {}): Promise<ExportResult> {
    if (options.rows?.length) return this.exportRowsLocally(options.rows, options)
    try {
      const res = await apiGet("/api/language")
      const data = extractPayload(res) ?? {}
      return this.exportRowsLocally(
        Array.isArray(data) ? (data as ExportRow[]) : [{ exportedAt: new Date().toISOString(), ...flattenLite(data) }],
        options
      )
    } catch (e: unknown) {
      return { success: false, error: getErrorMessage(e, "Failed to export language data") }
    }
  }

  async exportUSSDData(options: ExportOptions = {}): Promise<ExportResult> {
    if (options.rows?.length) return this.exportRowsLocally(options.rows, options)
    try {
      const res = await apiGet("/api/ussd/sessions")
      const list = extractList(res, "sessions")
      return this.exportRowsLocally(
        Array.isArray(list) ? (list as ExportRow[]) : [{ exportedAt: new Date().toISOString(), ...flattenLite(list) }],
        options
      )
    } catch (e: unknown) {
      return { success: false, error: getErrorMessage(e, "Failed to export USSD data") }
    }
  }

  async exportGoogleAuth(_options: ExportOptions = {}): Promise<ExportResult> {
    return { success: false, error: "Google auth records are not exportable" }
  }

  async exportExportImport(options: ExportOptions = {}): Promise<ExportResult> {
    const type = (options.dataType as ServerExportType) || "custom"
    return this.exportViaImportService(type, options)
  }

  async exportVerify(options: ExportOptions = {}): Promise<ExportResult> {
    if (options.rows?.length) return this.exportRowsLocally(options.rows, options)
    return this.exportHarvests(options)
  }

  async exportAuth(_options: ExportOptions = {}): Promise<ExportResult> {
    return { success: false, error: "Auth records are not exportable for security reasons" }
  }

  async exportCustomData(data: ReadonlyArray<ExportRow | object>, options: ExportOptions = {}): Promise<ExportResult> {
    return this.exportRowsLocally(data || [], options)
  }

  /** @deprecated Prefer typed exporters; kept for compatibility */
  async exportData(endpoint: string, options: ExportOptions = {}): Promise<ExportResult> {
    const match = endpoint.match(/export-import\/export\/(\w+)/) || endpoint.match(/\/(\w+)\/export/)
    const type = (match?.[1] || "custom") as ServerExportType
    const known: ServerExportType[] = [
      "harvests",
      "listings",
      "users",
      "partners",
      "shipments",
      "transactions",
      "orders",
      "analytics",
      "custom",
    ]
    if (known.includes(type)) {
      return this.exportViaImportService(type, options)
    }
    if (options.rows?.length) return this.exportRowsLocally(options.rows, options)
    return { success: false, error: `No export handler for ${endpoint}` }
  }
}

export function getExportService() {
  return new ExportService()
}
