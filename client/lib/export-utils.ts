import { useToast } from "@/hooks/use-toast"
import { apiService } from "./api"

export interface ExportOptions {
  format?: 'csv' | 'json' | 'excel' | 'pdf'
  filename?: string
  includeHeaders?: boolean
  dateRange?: {
    start: string
    end: string
  } | string
  filters?: Record<string, any>
  dataType?: string
}

export interface ExportResult {
  success: boolean
  filename?: string
  error?: string
}

export class ExportService {
  private getMimeType(format: string): string {
    const mimeTypes = {
      csv: 'text/csv',
      json: 'application/json',
      excel: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      pdf: 'application/pdf'
    }
    return mimeTypes[format as keyof typeof mimeTypes] || 'text/csv'
  }

  private getFileExtension(format: string): string {
    const extensions = {
      csv: 'csv',
      json: 'json',
      excel: 'xlsx',
      pdf: 'pdf'
    }
    return extensions[format as keyof typeof extensions] || 'csv'
  }

  private downloadFile(blob: Blob, filename: string, contentType: string): boolean {
    try {
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = filename
      link.style.display = 'none'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)
      return true
    } catch (error) {
      console.error('Download failed:', error)
      return false
    }
  }

  private showToast(title: string, description: string, variant: 'default' | 'destructive' = 'default') {
    // Note: This will be handled by the calling component's toast
    console.log(`Toast: ${title} - ${description}`)
  }

  async exportData(endpoint: string, options: ExportOptions = {}): Promise<ExportResult> {
    try {
      const {
        format = 'csv',
        filename,
        includeHeaders = true,
        dateRange,
        filters = {}
      } = options

      const requestBody = {
        format,
        includeHeaders,
        dateRange,
        filters
      }

      const response = await apiService.postRaw(endpoint, requestBody, {
        headers: { 'Accept': this.getMimeType(format) }
      })

      if (!response.ok) {
        throw new Error(await response.text() || `HTTP Error: ${response.status}`)
      }

      const blob = await response.blob()
      const contentType = response.headers.get('content-type') || this.getMimeType(format)
      const contentDisposition = response.headers.get('content-disposition')

      let finalFilename = filename || `${endpoint.split('/').pop()}-export-${new Date().toISOString().split('T')[0]}.${this.getFileExtension(format)}`
      
      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename="(.+)"/) || contentDisposition.match(/filename\*=.+''(.+)/);
        if (filenameMatch && filenameMatch[1]) {
          finalFilename = decodeURIComponent(filenameMatch[1])
        }
      }

      if (this.downloadFile(blob, finalFilename, contentType)) {
            this.showToast('Export Successful! 📊', 'Your data has been exported and downloaded.')
            return { success: true, filename: finalFilename }
          } else {
            throw new Error('Failed to download file')
      }
    } catch (error: any) {
      console.error('Export error:', error)
      const errorMessage = error.message || 'Failed to export data. Please try again.'
      this.showToast('Export Failed ❌', errorMessage, 'destructive')
      return { success: false, error: errorMessage }
    }
  }

  // Specific export methods for different data types
  async exportFavorites(options: ExportOptions = {}): Promise<ExportResult> {
    return this.exportData('/api/favorites/export', options)
  }

  async exportCommissions(options: ExportOptions = {}): Promise<ExportResult> {
    return this.exportData('/api/commissions/export', options)
  }

  async exportTransactions(options: ExportOptions = {}, format?: string): Promise<ExportResult> {
    const exportOptions = { ...options }
    if (format) {
      exportOptions.format = format as 'csv' | 'json' | 'excel' | 'pdf'
    }
    return this.exportData('/api/transactions/export', exportOptions)
  }

  async exportReferrals(options: ExportOptions = {}): Promise<ExportResult> {
    return this.exportData('/api/referrals/export', options)
  }

  async exportOrders(options: ExportOptions = {}): Promise<ExportResult> {
    return this.exportData('/api/orders/export', options)
  }

  async exportHarvests(options: ExportOptions = {}): Promise<ExportResult> {
    return this.exportData('/api/harvests/export', options)
  }

  async exportShipments(options: ExportOptions = {}): Promise<ExportResult> {
    return this.exportData('/api/shipments/export', options)
  }

  async exportProducts(options: ExportOptions = {}): Promise<ExportResult> {
    return this.exportData('/api/products/export', options)
  }

  async exportUsers(options: ExportOptions = {}): Promise<ExportResult> {
    return this.exportData('/api/users/export', options)
  }

  async exportPartners(options: ExportOptions = {}): Promise<ExportResult> {
    return this.exportData('/api/partners/export', options)
  }

  async exportFarmers(options: ExportOptions = {}): Promise<ExportResult> {
    return this.exportData('/api/farmers/export', options)
  }

  async exportAnalytics(type?: string, timeRange?: any, format?: string): Promise<ExportResult> {
    const options: ExportOptions = {}
    if (format) {
      options.format = format as 'csv' | 'json' | 'excel' | 'pdf'
    }
    if (timeRange) {
      options.dateRange = timeRange
    }
    if (type) {
      options.filters = { type }
    }
    return this.exportData('/api/analytics/export', options)
  }

  async exportReports(options: ExportOptions = {}): Promise<ExportResult> {
    return this.exportData('/api/reports/export', options)
  }

  async exportNotifications(options: ExportOptions = {}): Promise<ExportResult> {
    return this.exportData('/api/notifications/export', options)
  }

  async exportPriceAlerts(options: ExportOptions = {}): Promise<ExportResult> {
    return this.exportData('/api/price-alerts/export', options)
  }

  async exportWeatherData(options: ExportOptions = {}): Promise<ExportResult> {
    return this.exportData('/api/weather/export', options)
  }

  async exportInventory(options: ExportOptions = {}): Promise<ExportResult> {
    return this.exportData('/api/inventory/export', options)
  }

  async exportReviews(options: ExportOptions = {}): Promise<ExportResult> {
    return this.exportData('/api/reviews/export', options)
  }

  async exportPayments(options: ExportOptions = {}): Promise<ExportResult> {
    return this.exportData('/api/payments/export', options)
  }

  async exportFintech(options: ExportOptions = {}): Promise<ExportResult> {
    return this.exportData('/api/fintech/export', options)
  }

  async exportLoans(options: ExportOptions = {}): Promise<ExportResult> {
    return this.exportData('/api/loans/export', options)
  }

  async exportInsurance(options: ExportOptions = {}): Promise<ExportResult> {
    return this.exportData('/api/insurance/export', options)
  }

  async exportCreditScores(options: ExportOptions = {}): Promise<ExportResult> {
    return this.exportData('/api/credit-scores/export', options)
  }

  async exportFinancialGoals(options: ExportOptions = {}): Promise<ExportResult> {
    return this.exportData('/api/financial-goals/export', options)
  }

  async exportLoanReferrals(options: ExportOptions = {}): Promise<ExportResult> {
    return this.exportData('/api/loan-referrals/export', options)
  }

  async exportInsurancePolicies(options: ExportOptions = {}): Promise<ExportResult> {
    return this.exportData('/api/insurance-policies/export', options)
  }

  async exportBVNVerifications(options: ExportOptions = {}): Promise<ExportResult> {
    return this.exportData('/api/bvn-verifications/export', options)
  }

  async exportQRCodes(options: ExportOptions = {}): Promise<ExportResult> {
    return this.exportData('/api/qr-codes/export', options)
  }

  async exportListings(options: ExportOptions = {}): Promise<ExportResult> {
    return this.exportData('/api/listings/export', options)
  }

  async exportMarketplaceData(options: ExportOptions = {}): Promise<ExportResult> {
    return this.exportData('/api/marketplace/export', options)
  }

  async exportPartnerSettings(options: ExportOptions = {}): Promise<ExportResult> {
    return this.exportData('/api/partner-settings/export', options)
  }

  async exportNotificationPreferences(options: ExportOptions = {}): Promise<ExportResult> {
    return this.exportData('/api/notification-preferences/export', options)
  }

  async exportHarvestApprovals(options: ExportOptions = {}): Promise<ExportResult> {
    return this.exportData('/api/harvest-approvals/export', options)
  }

  async exportUploads(options: ExportOptions = {}): Promise<ExportResult> {
    return this.exportData('/api/uploads/export', options)
  }

  async exportWeather(options: ExportOptions = {}): Promise<ExportResult> {
    return this.exportData('/api/weather/export', options)
  }

  async exportAdminSettings(options: ExportOptions = {}): Promise<ExportResult> {
    return this.exportData('/api/admin-settings/export', options)
  }

  async exportLanguageData(options: ExportOptions = {}): Promise<ExportResult> {
    return this.exportData('/api/language/export', options)
  }

  async exportUSSDData(options: ExportOptions = {}): Promise<ExportResult> {
    return this.exportData('/api/ussd/export', options)
  }

  async exportGoogleAuth(options: ExportOptions = {}): Promise<ExportResult> {
    return this.exportData('/api/google-auth/export', options)
  }

  async exportExportImport(options: ExportOptions = {}): Promise<ExportResult> {
    return this.exportData('/api/export-import/export', options)
  }

  async exportVerify(options: ExportOptions = {}): Promise<ExportResult> {
    return this.exportData('/api/verify/export', options)
  }

  async exportAuth(options: ExportOptions = {}): Promise<ExportResult> {
    return this.exportData('/api/auth/export', options)
  }

  // Generic method for exporting custom data
  async exportCustomData(data: any[], options: ExportOptions = {}): Promise<ExportResult> {
    try {
      const {
        format = 'csv',
        filename,
        includeHeaders = true
      } = options

      if (!data || data.length === 0) {
        return { success: false, error: 'No data to export' }
      }

      // Convert data to CSV format
      if (format === 'csv') {
        const headers = Object.keys(data[0])
        const csvContent = [
          includeHeaders ? headers.join(',') : '',
          ...data.map(row => headers.map(header => {
            const value = row[header]
            return typeof value === 'string' && value.includes(',') ? `"${value}"` : value
          }).join(','))
        ].filter(Boolean).join('\n')

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
        const finalFilename = filename || `custom-data-export-${new Date().toISOString().split('T')[0]}.csv`
        
        if (this.downloadFile(blob, finalFilename, 'text/csv')) {
          this.showToast('Export Successful! 📊', 'Your data has been exported and downloaded.')
          return { success: true, filename: finalFilename }
        } else {
          throw new Error('Failed to download file')
        }
      }

      // For other formats, use the generic exportData method
      return this.exportData('/api/export/custom', options)
    } catch (error: any) {
      console.error('Custom export error:', error)
      const errorMessage = error.message || 'Failed to export data. Please try again.'
      this.showToast('Export Failed ❌', errorMessage, 'destructive')
      return { success: false, error: errorMessage }
    }
  }
}

// Hook for using the export service
export function useExportService() {
  return new ExportService()
}

// Default export
export default ExportService