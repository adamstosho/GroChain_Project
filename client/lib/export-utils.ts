import { apiService } from "./api"

export interface ExportOptions {
  format?: "csv" | "json" | "excel" | "pdf" | "xlsx"
  filename?: string
  includeHeaders?: boolean
  dateRange?: { start: string; end: string } | string
  filters?: Record<string, any>
  dataType?: string
  /** Required for exports that run from already-loaded UI data */
  rows?: Record<string, any>[]
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

function flattenLite(value: any, prefix = ""): Record<string, any> {
  const out: Record<string, any> = {}
  if (value == null || typeof value !== "object" || Array.isArray(value)) {
    out[prefix || "value"] = value
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

async function apiGet(endpoint: string): Promise<any> {
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

function toCsv(rows: Record<string, any>[]): string {
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
      const filters = { ...(options.filters || {}) }
      if (options.dateRange && typeof options.dateRange === "object") {
        filters.startDate = options.dateRange.start
        filters.endDate = options.dateRange.end
      }

      const body: Record<string, any> = {
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

      const response: any = await apiService.post(`/export-import/export/${type}`, body)
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
    } catch (error: any) {
      console.error("Export error:", error)
      return { success: false, error: error?.message || "Failed to export data" }
    }
  }

  /** Client-side CSV when server export isn't available or data is already loaded. */
  async exportRowsLocally(rows: Record<string, any>[], options: ExportOptions = {}): Promise<ExportResult> {
    try {
      if (!rows?.length) return { success: false, error: "No data to export" }
      const format = normalizeFormat(options.format || "csv")
      if (format === "json") {
        const name =
          options.filename || `grochain-export-${new Date().toISOString().slice(0, 10)}.json`
        const blob = new Blob([JSON.stringify(rows, null, 2)], { type: "application/json" })
        if (!downloadBlob(blob, name)) throw new Error("Download failed")
        return { success: true, filename: name }
      }
      // excel → still CSV locally (real xlsx via custom export-import when possible)
      if (format === "excel") {
        return this.exportViaImportService("custom", { ...options, rows, format: "excel" })
      }
      const name =
        options.filename || `grochain-export-${new Date().toISOString().slice(0, 10)}.csv`
      const blob = new Blob([toCsv(rows)], { type: "text/csv;charset=utf-8" })
      if (!downloadBlob(blob, name.endsWith(".csv") ? name : `${name}.csv`)) {
        throw new Error("Download failed")
      }
      return { success: true, filename: name }
    } catch (error: any) {
      return { success: false, error: error?.message || "Failed to export" }
    }
  }

  // —— Specific exporters ——

  async exportFavorites(options: ExportOptions = {}): Promise<ExportResult> {
    if (options.rows?.length) return this.exportRowsLocally(options.rows, options)
    try {
      const res: any = await apiService.getFavorites()
      const list = res?.data?.favorites || res?.favorites || res?.data || []
      const rows = (Array.isArray(list) ? list : []).map((f: any) => ({
        listingId: f.listing?._id || f.listingId || f._id,
        cropName: f.listing?.cropName || f.cropName || "",
        price: f.listing?.price ?? f.price ?? "",
        quality: f.listing?.quality || "",
        farmer: f.listing?.farmer?.name || "",
        notes: f.notes || "",
        addedAt: f.createdAt || f.addedAt || "",
      }))
      return this.exportRowsLocally(rows, {
        ...options,
        filename: options.filename || `favorites-${new Date().toISOString().slice(0, 10)}.csv`,
      })
    } catch (e: any) {
      return { success: false, error: e?.message || "Failed to export favorites" }
    }
  }

  async exportCommissions(options: ExportOptions = {}): Promise<ExportResult> {
    if (options.rows?.length) return this.exportRowsLocally(options.rows, options)
    try {
      const res: any = await apiGet("/api/commissions")
      const list = res?.data?.commissions || res?.commissions || res?.data || []
      const rows = (Array.isArray(list) ? list : []).map((c: any) => ({
        id: c._id,
        amount: c.amount,
        rate: c.rate,
        status: c.status,
        orderNumber: c.order?.orderNumber,
        farmer: c.farmer?.name,
        crop: c.listing?.cropName,
        createdAt: c.createdAt,
      }))
      return this.exportRowsLocally(rows, options)
    } catch (e: any) {
      return { success: false, error: e?.message || "Failed to export commissions" }
    }
  }

  async exportTransactions(options: ExportOptions = {}, format?: string): Promise<ExportResult> {
    const opts = { ...options, format: (format as any) || options.format || "csv" }
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
      const res: any = await apiGet("/api/referrals")
      const list = res?.data?.referrals || res?.referrals || res?.data || []
      return this.exportRowsLocally(Array.isArray(list) ? list : [], options)
    } catch (e: any) {
      return { success: false, error: e?.message || "Failed to export referrals" }
    }
  }

  async exportNotifications(options: ExportOptions = {}): Promise<ExportResult> {
    if (options.rows?.length) return this.exportRowsLocally(options.rows, options)
    try {
      const res: any = await apiGet("/api/notifications")
      const list = res?.data?.notifications || res?.notifications || res?.data || []
      return this.exportRowsLocally(Array.isArray(list) ? list : [], options)
    } catch (e: any) {
      return { success: false, error: e?.message || "Failed to export notifications" }
    }
  }

  async exportPriceAlerts(options: ExportOptions = {}): Promise<ExportResult> {
    if (options.rows?.length) return this.exportRowsLocally(options.rows, options)
    try {
      const res: any = await apiGet("/api/price-alerts")
      const list = res?.data?.alerts || res?.data || []
      return this.exportRowsLocally(Array.isArray(list) ? list : [], options)
    } catch (e: any) {
      return { success: false, error: e?.message || "Failed to export price alerts" }
    }
  }

  async exportWeatherData(options: ExportOptions = {}): Promise<ExportResult> {
    return this.exportWeather(options)
  }

  async exportWeather(options: ExportOptions = {}): Promise<ExportResult> {
    if (options.rows?.length) return this.exportRowsLocally(options.rows, options)
    try {
      const res: any = await apiGet("/api/weather/current/Lagos")
      const data = res?.data || res || {}
      return this.exportRowsLocally([{ exportedAt: new Date().toISOString(), ...data }], options)
    } catch (e: any) {
      return { success: false, error: e?.message || "Failed to export weather data" }
    }
  }

  async exportInventory(options: ExportOptions = {}): Promise<ExportResult> {
    return this.exportHarvests(options)
  }

  async exportReviews(options: ExportOptions = {}): Promise<ExportResult> {
    if (options.rows?.length) return this.exportRowsLocally(options.rows, options)
    try {
      const res: any = await apiGet("/api/reviews/farmer")
      const list = res?.data?.reviews || res?.reviews || res?.data || []
      return this.exportRowsLocally(Array.isArray(list) ? list : [], options)
    } catch (e: any) {
      return { success: false, error: e?.message || "Failed to export reviews" }
    }
  }

  async exportFintech(options: ExportOptions = {}): Promise<ExportResult> {
    if (options.rows?.length) return this.exportRowsLocally(options.rows, options)
    try {
      const res: any = await apiGet("/api/fintech/dashboard")
      const data = res?.data || res || {}
      return this.exportRowsLocally([{ exportedAt: new Date().toISOString(), ...flattenLite(data) }], options)
    } catch (e: any) {
      return { success: false, error: e?.message || "Failed to export fintech data" }
    }
  }

  async exportLoans(options: ExportOptions = {}): Promise<ExportResult> {
    if (options.rows?.length) return this.exportRowsLocally(options.rows, options)
    try {
      const res: any = await apiGet("/api/fintech/loan-applications")
      const list = res?.data?.applications || res?.data || []
      return this.exportRowsLocally(Array.isArray(list) ? list : [], options)
    } catch (e: any) {
      return { success: false, error: e?.message || "Failed to export loans" }
    }
  }

  async exportInsurance(options: ExportOptions = {}): Promise<ExportResult> {
    return this.exportInsurancePolicies(options)
  }

  async exportCreditScores(options: ExportOptions = {}): Promise<ExportResult> {
    if (options.rows?.length) return this.exportRowsLocally(options.rows, options)
    try {
      const res: any = await apiGet("/api/fintech/credit-score/me")
      const data = res?.data || res || {}
      return this.exportRowsLocally([{ exportedAt: new Date().toISOString(), ...data }], options)
    } catch (e: any) {
      return { success: false, error: e?.message || "Failed to export credit score" }
    }
  }

  async exportFinancialGoals(options: ExportOptions = {}): Promise<ExportResult> {
    if (options.rows?.length) return this.exportRowsLocally(options.rows, options)
    try {
      const res: any = await apiGet("/api/fintech/financial-goals/me")
      const list = res?.data?.goals || res?.data || []
      return this.exportRowsLocally(Array.isArray(list) ? list : [list].filter(Boolean), options)
    } catch (e: any) {
      return { success: false, error: e?.message || "Failed to export financial goals" }
    }
  }

  async exportLoanReferrals(options: ExportOptions = {}): Promise<ExportResult> {
    if (options.rows?.length) return this.exportRowsLocally(options.rows, options)
    return this.exportReferrals(options)
  }

  async exportInsurancePolicies(options: ExportOptions = {}): Promise<ExportResult> {
    if (options.rows?.length) return this.exportRowsLocally(options.rows, options)
    try {
      const res: any = await apiGet("/api/fintech/dashboard")
      const list = res?.data?.insurancePolicies || res?.data?.policies || []
      return this.exportRowsLocally(Array.isArray(list) ? list : [], options)
    } catch (e: any) {
      return { success: false, error: e?.message || "Failed to export insurance policies" }
    }
  }

  async exportBVNVerifications(options: ExportOptions = {}): Promise<ExportResult> {
    if (options.rows?.length) return this.exportRowsLocally(options.rows, options)
    try {
      const res: any = await apiGet("/api/bvn/status")
      const data = res?.data || res || {}
      return this.exportRowsLocally([{ exportedAt: new Date().toISOString(), ...data }], options)
    } catch (e: any) {
      return { success: false, error: e?.message || "Failed to export BVN status" }
    }
  }

  async exportQRCodes(options: ExportOptions = {}): Promise<ExportResult> {
    if (options.rows?.length) return this.exportRowsLocally(options.rows, options)
    try {
      const res: any = await apiService.getQRCodes({ limit: 1000 })
      const list = res?.data?.qrCodes || res?.data || []
      return this.exportRowsLocally(Array.isArray(list) ? list : [], options)
    } catch (e: any) {
      return { success: false, error: e?.message || "Failed to export QR codes" }
    }
  }

  async exportMarketplaceData(options: ExportOptions = {}): Promise<ExportResult> {
    return this.exportListings(options)
  }

  async exportPartnerSettings(options: ExportOptions = {}): Promise<ExportResult> {
    if (options.rows?.length) return this.exportRowsLocally(options.rows, options)
    try {
      const res: any = await apiGet("/api/users/settings/me")
      return this.exportRowsLocally([{ exportedAt: new Date().toISOString(), ...(res?.data || res || {}) }], options)
    } catch (e: any) {
      return { success: false, error: e?.message || "Failed to export partner settings" }
    }
  }

  async exportNotificationPreferences(options: ExportOptions = {}): Promise<ExportResult> {
    if (options.rows?.length) return this.exportRowsLocally(options.rows, options)
    try {
      const res: any = await apiGet("/api/users/preferences/me")
      return this.exportRowsLocally([{ exportedAt: new Date().toISOString(), ...(res?.data || res || {}) }], options)
    } catch (e: any) {
      return { success: false, error: e?.message || "Failed to export notification preferences" }
    }
  }

  async exportHarvestApprovals(options: ExportOptions = {}): Promise<ExportResult> {
    try {
      const format = normalizeFormat(options.format || "csv")
      const qs = new URLSearchParams({
        format,
        ...(options.filters || {}),
      }).toString()
      const response = await apiService.getRaw(`/api/harvest-approval/export?${qs}`)
      if (!response.ok) throw new Error(await response.text() || `HTTP ${response.status}`)
      const blob = await response.blob()
      const filename =
        options.filename || `harvest-approvals-${new Date().toISOString().slice(0, 10)}.${fileExtension(format)}`
      if (!downloadBlob(blob, filename)) throw new Error("Download failed")
      return { success: true, filename }
    } catch (error: any) {
      return { success: false, error: error?.message || "Failed to export approvals" }
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
      const res: any = await apiGet("/api/language")
      const data = res?.data || res || {}
      return this.exportRowsLocally(
        Array.isArray(data) ? data : [{ exportedAt: new Date().toISOString(), ...flattenLite(data) }],
        options
      )
    } catch (e: any) {
      return { success: false, error: e?.message || "Failed to export language data" }
    }
  }

  async exportUSSDData(options: ExportOptions = {}): Promise<ExportResult> {
    if (options.rows?.length) return this.exportRowsLocally(options.rows, options)
    try {
      const res: any = await apiGet("/api/ussd/sessions")
      const list = res?.data?.sessions || res?.data || []
      return this.exportRowsLocally(Array.isArray(list) ? list : [{ exportedAt: new Date().toISOString(), ...flattenLite(list) }], options)
    } catch (e: any) {
      return { success: false, error: e?.message || "Failed to export USSD data" }
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

  async exportCustomData(data: any[], options: ExportOptions = {}): Promise<ExportResult> {
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
