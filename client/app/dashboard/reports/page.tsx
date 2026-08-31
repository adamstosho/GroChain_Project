"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { DashboardLayout } from "@/components/dashboard/dashboard-layout"
import { DashboardPageHeader } from "@/components/dashboard/dashboard-page-header"
import { apiService } from "@/lib/api"
import { asRecord } from "@/lib/error-utils"
import { useAuthStore } from "@/lib/auth"
import { useToast } from "@/hooks/use-toast"
import {
  FileText,
  Download,
  Banknote,
  Crop,
  Package,
  RefreshCw,
  Clock
} from "lucide-react"

interface ReportTemplate {
  id: string
  name: string
  description: string
  category: 'harvest' | 'financial' | 'marketplace'
}

interface RecentReport {
  id: string
  name: string
  generatedAt: string
}

const reportTemplates: ReportTemplate[] = [
  {
    id: 'harvest',
    name: 'Harvest Summary Report',
    description: 'Your harvest records, including crop type, quantity, quality and approval status.',
    category: 'harvest'
  },
  {
    id: 'financial',
    name: 'Financial Performance Report',
    description: 'Your credit score, earnings, savings, active loans, insurance policies and recent transactions.',
    category: 'financial'
  },
  {
    id: 'marketplace',
    name: 'Marketplace Analytics Report',
    description: 'Your listings, orders, revenue and monthly sales trend.',
    category: 'marketplace'
  }
]

const categoryMeta = {
  harvest: { label: 'Harvest', icon: Crop, color: 'text-success' },
  financial: { label: 'Financial', icon: Banknote, color: 'text-primary' },
  marketplace: { label: 'Marketplace', icon: Package, color: 'text-accent' }
}

export default function ReportsPage() {
  const [generatingReports, setGeneratingReports] = useState<string[]>([])
  const [recentReports, setRecentReports] = useState<RecentReport[]>([])
  const { user } = useAuthStore()
  const { toast } = useToast()

  // Harvest/financial/marketplace reports are all farmer-specific data - not relevant to buyers
  const visibleReportTemplates = user?.role === 'farmer' ? reportTemplates : []

  const formatDate = (value: unknown) => {
    if (value instanceof Date && !Number.isNaN(value.getTime())) {
      return value.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
    }
    if (typeof value === 'string' || typeof value === 'number') {
      const parsed = new Date(value)
      if (!Number.isNaN(parsed.getTime())) {
        return parsed.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
      }
    }
    return 'N/A'
  }

  const formatCurrency = (amount: number) => `₦${(amount || 0).toLocaleString()}`

  const openPrintWindow = (title: string, bodyHtml: string) => {
    const printWindow = window.open('', '_blank')
    if (!printWindow) {
      throw new Error('Unable to open print window. Please allow popups.')
    }

    const html = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <title>${title} · GroChain</title>
        <meta charset="utf-8" />
        <style>
          * { box-sizing: border-box; }
          body { font-family: 'Segoe UI', Arial, sans-serif; padding: 0; margin: 0; color: #1f2937; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          .brand { background: #0B3D1E; color: #fff; padding: 16px 28px; display: flex; align-items: center; gap: 14px; }
          .brand img { height: 48px; width: auto; object-fit: contain; }
          .brand h1 { margin: 0; font-size: 18px; }
          .brand p { margin: 2px 0 0; font-size: 11px; opacity: 0.9; }
          .accent { height: 4px; background: #166534; }
          .content { padding: 24px 28px 32px; overflow-wrap: anywhere; }
          h2 { font-size: 15px; margin: 22px 0 8px; color: #166534; }
          .meta { color: #6b7280; font-size: 12px; margin-bottom: 16px; }
          table { width: 100%; border-collapse: collapse; margin-top: 8px; table-layout: fixed; }
          th, td { text-align: left; padding: 8px; border-bottom: 1px solid #e5e7eb; font-size: 12px; word-break: break-word; }
          th { background: #166534; color: #fff; }
          tr:nth-child(even) td { background: #eef6ea; }
          p.empty { color: #6b7280; font-size: 13px; }
          .footer { margin-top: 28px; padding-top: 12px; border-top: 2px solid #166534; font-size: 11px; color: #6b7280; }
          @media print { .brand { -webkit-print-color-adjust: exact; } }
        </style>
      </head>
      <body>
        <div class="brand">
          <img src="/logo-full.png" alt="GroChain" />
          <div>
            <h1>${title}</h1>
            <p>Building Trust in Nigeria's Food Chain</p>
          </div>
        </div>
        <div class="accent"></div>
        <div class="content">
          <div class="meta">Generated ${formatDate(new Date().toISOString())}</div>
          ${bodyHtml}
          <div class="footer">GroChain Report · For support contact support@grochain.com</div>
        </div>
      </body>
      </html>
    `

    printWindow.document.open()
    printWindow.document.write(html)
    printWindow.document.close()

    window.setTimeout(() => {
      printWindow.focus()
      printWindow.print()
    }, 600)
  }

  const generateHarvestReport = async () => {
    const response = await apiService.getHarvests()
    const rec = asRecord(response)
    const data = rec.data
    let harvests: unknown[] = []
    if (Array.isArray(rec.harvests)) {
      harvests = rec.harvests
    } else if (data && typeof data === "object" && !Array.isArray(data)) {
      const nestedHarvests = asRecord(data).harvests
      if (Array.isArray(nestedHarvests)) harvests = nestedHarvests
    } else if (Array.isArray(data)) {
      harvests = data
    }

    const rows = harvests.map((harvest) => {
      const h = asRecord(harvest)
      return `
      <tr>
        <td>${typeof h.cropType === 'string' ? h.cropType : 'N/A'}</td>
        <td>${h.quantity ?? '-'} ${typeof h.unit === 'string' ? h.unit : ''}</td>
        <td style="text-transform: capitalize;">${typeof h.quality === 'string' ? h.quality : '-'}</td>
        <td style="text-transform: capitalize;">${typeof h.status === 'string' ? h.status : '-'}</td>
        <td>${formatDate(h.date || h.createdAt)}</td>
        <td>${typeof h.batchId === 'string' ? h.batchId : '-'}</td>
      </tr>
    `
    }).join('')

    const body = harvests.length > 0 ? `
      <h2>Harvest Records (${harvests.length})</h2>
      <table>
        <tr><th>Crop</th><th>Quantity</th><th>Quality</th><th>Status</th><th>Date</th><th>Batch ID</th></tr>
        ${rows}
      </table>
    ` : `<p class="empty">You don't have any harvest records yet.</p>`

    openPrintWindow('Harvest Summary Report', body)
  }

  const generateFinancialReport = async () => {
    const response = await apiService.getFinancialDashboard()
    const rec = asRecord(response)
    const data = asRecord(rec.data)
    const overview = asRecord(data.overview)
    const transactionsRaw = Array.isArray(data.recentTransactions) ? data.recentTransactions : []

    const overviewRows = `
      <tr><td>Credit Score</td><td>${overview.creditScore ?? 'N/A'}</td></tr>
      <tr><td>Total Earnings</td><td>${formatCurrency(typeof overview.totalEarnings === 'number' ? overview.totalEarnings : 0)}</td></tr>
      <tr><td>Total Savings</td><td>${formatCurrency(typeof overview.totalSavings === 'number' ? overview.totalSavings : 0)}</td></tr>
      <tr><td>Active Loans</td><td>${overview.activeLoans ?? 0}</td></tr>
      <tr><td>Insurance Policies</td><td>${overview.insurancePolicies ?? 0}</td></tr>
      <tr><td>Risk Level</td><td style="text-transform: capitalize;">${overview.riskLevel || 'N/A'}</td></tr>
    `

    const transactionRows = transactionsRaw.map((transaction) => {
      const t = asRecord(transaction)
      return `
      <tr>
        <td style="text-transform: capitalize;">${typeof t.type === 'string' ? t.type : '-'}</td>
        <td>${formatCurrency(typeof t.amount === 'number' ? t.amount : 0)}</td>
        <td>${typeof t.description === 'string' ? t.description : '-'}</td>
        <td>${formatDate(t.date)}</td>
        <td style="text-transform: capitalize;">${typeof t.status === 'string' ? t.status : '-'}</td>
      </tr>
    `
    }).join('')

    const body = `
      <h2>Overview</h2>
      <table>${overviewRows}</table>
      <h2>Recent Transactions</h2>
      ${transactionsRaw.length > 0 ? `
        <table>
          <tr><th>Type</th><th>Amount</th><th>Description</th><th>Date</th><th>Status</th></tr>
          ${transactionRows}
        </table>
      ` : '<p class="empty">No recent transactions.</p>'}
    `

    openPrintWindow('Financial Performance Report', body)
  }

  const generateMarketplaceReport = async () => {
    if (!user?._id) {
      throw new Error('Unable to identify the current user.')
    }

    const response = await apiService.getMarketplaceAnalytics(undefined, user._id)
    const rec = asRecord(response)
    const data = asRecord(rec.data)
    const trendsRaw = Array.isArray(data.monthlyTrends) ? data.monthlyTrends : []

    const summaryRows = `
      <tr><td>Total Listings</td><td>${data.totalListings ?? 0}</td></tr>
      <tr><td>Total Orders</td><td>${data.totalOrders ?? 0}</td></tr>
      <tr><td>Total Revenue</td><td>${formatCurrency(typeof data.totalRevenue === 'number' ? data.totalRevenue : 0)}</td></tr>
      <tr><td>Total Harvests</td><td>${data.totalHarvests ?? 0}</td></tr>
      <tr><td>Harvest Approval Rate</td><td>${data.approvalRate ?? 0}%</td></tr>
    `

    const trendRows = trendsRaw.map((trend) => {
      const t = asRecord(trend)
      return `
      <tr>
        <td>${typeof t.month === 'string' ? t.month : '-'}</td>
        <td>${formatCurrency(typeof t.revenue === 'number' ? t.revenue : 0)}</td>
        <td>${typeof t.harvests === 'number' ? t.harvests : 0}</td>
      </tr>
    `
    }).join('')

    const body = `
      <h2>Summary</h2>
      <table>${summaryRows}</table>
      <h2>Monthly Trend</h2>
      ${trendsRaw.length > 0 ? `
        <table>
          <tr><th>Month</th><th>Revenue</th><th>Harvests</th></tr>
          ${trendRows}
        </table>
      ` : '<p class="empty">No monthly trend data available.</p>'}
    `

    openPrintWindow('Marketplace Analytics Report', body)
  }

  const handleGenerateReport = async (template: ReportTemplate) => {
    try {
      setGeneratingReports(prev => [...prev, template.id])

      if (template.category === 'harvest') {
        await generateHarvestReport()
      } else if (template.category === 'financial') {
        await generateFinancialReport()
      } else {
        await generateMarketplaceReport()
      }

      setRecentReports(prev => [
        { id: `${template.id}-${Date.now()}`, name: template.name, generatedAt: new Date().toISOString() },
        ...prev
      ].slice(0, 5))

      toast({
        title: "Report Ready",
        description: `${template.name} has been opened for printing/saving as PDF.`,
        variant: "default"
      })
    } catch (error) {
      console.error(`Failed to generate ${template.name}:`, error)
      toast({
        title: "Generation Failed",
        description: `Failed to generate ${template.name}. Please try again.`,
        variant: "destructive"
      })
    } finally {
      setGeneratingReports(prev => prev.filter(id => id !== template.id))
    }
  }

  const getCategoryIcon = (category: ReportTemplate['category']) => {
    const meta = categoryMeta[category]
    const IconComponent = meta.icon
    return <IconComponent className={`h-5 w-5 ${meta.color}`} />
  }

  return (
    <DashboardLayout pageTitle="Reports">
      <div className="space-y-6">
        <DashboardPageHeader
          badge="Reporting Active"
          title="Reports"
          titleHighlight="& Export"
          description="Generate reports from your real farm data, ready to print or save as PDF."
        />

        {visibleReportTemplates.length === 0 && (
          <Card className="border border-border">
            <CardContent className="py-12 text-center">
              <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium text-foreground mb-2">No Reports Available</h3>
              <p className="text-muted-foreground">Report exports for your account type aren&apos;t available yet.</p>
            </CardContent>
          </Card>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {visibleReportTemplates.map((template) => (
            <Card key={template.id} className="border border-border">
              <CardHeader>
                <div className="flex items-center gap-2">
                  {getCategoryIcon(template.category)}
                  <div>
                    <CardTitle className="text-base font-medium">{template.name}</CardTitle>
                    <CardDescription className="text-sm">
                      {categoryMeta[template.category].label} Report
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground">{template.description}</p>

                <Button
                  variant="outline"
                  size="sm"
                  className="w-full"
                  onClick={() => handleGenerateReport(template)}
                  disabled={generatingReports.includes(template.id)}
                >
                  {generatingReports.includes(template.id) ? (
                    <>
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Download className="h-4 w-4 mr-2" />
                      Generate Report
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        {recentReports.length > 0 && (
          <Card className="border border-border">
            <CardHeader>
              <CardTitle className="text-base font-medium">Generated This Session</CardTitle>
              <CardDescription>
                Reports you've generated during this visit. They open directly in a print window and aren't stored anywhere.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {recentReports.map((report) => (
                  <div key={report.id} className="flex items-center justify-between p-3 border border-border rounded-lg">
                    <div className="flex items-center gap-3">
                      <FileText className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm font-medium text-foreground">{report.name}</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Clock className="h-3 w-3" />
                      {new Date(report.generatedAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  )
}
