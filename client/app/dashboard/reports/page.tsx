"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { DashboardLayout } from "@/components/dashboard/dashboard-layout"
import { DashboardPageHeader } from "@/components/dashboard/dashboard-page-header"
import { apiService } from "@/lib/api"
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

  const formatDate = (value: any) =>
    value ? new Date(value).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }) : 'N/A'

  const formatCurrency = (amount: number) => `₦${(amount || 0).toLocaleString()}`

  const openPrintWindow = (title: string, bodyHtml: string) => {
    const printWindow = window.open('', '_blank')
    if (!printWindow) {
      throw new Error('Unable to open print window. Please allow popups.')
    }

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>${title}</title>
        <meta charset="utf-8" />
        <style>
          body { font-family: Arial, sans-serif; padding: 32px; color: #111827; }
          h1 { font-size: 22px; margin-bottom: 4px; }
          h2 { font-size: 16px; margin-top: 28px; margin-bottom: 8px; }
          .meta { color: #6b7280; font-size: 13px; margin-bottom: 20px; }
          table { width: 100%; border-collapse: collapse; margin-top: 8px; }
          th, td { text-align: left; padding: 8px; border-bottom: 1px solid #e5e7eb; font-size: 12px; }
          th { background: #f9fafb; }
          p.empty { color: #6b7280; font-size: 13px; }
        </style>
      </head>
      <body>
        <h1>${title}</h1>
        <div class="meta">Generated ${formatDate(new Date().toISOString())}</div>
        ${bodyHtml}
      </body>
      </html>
    `

    printWindow.document.open()
    printWindow.document.write(html)
    printWindow.document.close()

    window.setTimeout(() => {
      printWindow.focus()
      printWindow.print()
    }, 400)
  }

  const generateHarvestReport = async () => {
    const response: any = await apiService.getHarvests()
    const harvests = response.harvests || response.data?.harvests || []

    const rows = harvests.map((h: any) => `
      <tr>
        <td>${h.cropType || 'N/A'}</td>
        <td>${h.quantity ?? '-'} ${h.unit || ''}</td>
        <td style="text-transform: capitalize;">${h.quality || '-'}</td>
        <td style="text-transform: capitalize;">${h.status || '-'}</td>
        <td>${formatDate(h.date || h.createdAt)}</td>
        <td>${h.batchId || '-'}</td>
      </tr>
    `).join('')

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
    const response: any = await apiService.getFinancialDashboard()
    const data = response.data || {}
    const overview = data.overview || {}
    const transactions = data.recentTransactions || []

    const overviewRows = `
      <tr><td>Credit Score</td><td>${overview.creditScore ?? 'N/A'}</td></tr>
      <tr><td>Total Earnings</td><td>${formatCurrency(overview.totalEarnings)}</td></tr>
      <tr><td>Total Savings</td><td>${formatCurrency(overview.totalSavings)}</td></tr>
      <tr><td>Active Loans</td><td>${overview.activeLoans ?? 0}</td></tr>
      <tr><td>Insurance Policies</td><td>${overview.insurancePolicies ?? 0}</td></tr>
      <tr><td>Risk Level</td><td style="text-transform: capitalize;">${overview.riskLevel || 'N/A'}</td></tr>
    `

    const transactionRows = transactions.map((t: any) => `
      <tr>
        <td style="text-transform: capitalize;">${t.type || '-'}</td>
        <td>${formatCurrency(t.amount)}</td>
        <td>${t.description || '-'}</td>
        <td>${formatDate(t.date)}</td>
        <td style="text-transform: capitalize;">${t.status || '-'}</td>
      </tr>
    `).join('')

    const body = `
      <h2>Overview</h2>
      <table>${overviewRows}</table>
      <h2>Recent Transactions</h2>
      ${transactions.length > 0 ? `
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

    const response: any = await apiService.getMarketplaceAnalytics(undefined, user._id)
    const data = response.data || {}
    const trends = data.monthlyTrends || []

    const summaryRows = `
      <tr><td>Total Listings</td><td>${data.totalListings ?? 0}</td></tr>
      <tr><td>Total Orders</td><td>${data.totalOrders ?? 0}</td></tr>
      <tr><td>Total Revenue</td><td>${formatCurrency(data.totalRevenue)}</td></tr>
      <tr><td>Total Harvests</td><td>${data.totalHarvests ?? 0}</td></tr>
      <tr><td>Harvest Approval Rate</td><td>${data.approvalRate ?? 0}%</td></tr>
    `

    const trendRows = trends.map((t: any) => `
      <tr>
        <td>${t.month || '-'}</td>
        <td>${formatCurrency(t.revenue)}</td>
        <td>${t.harvests ?? 0}</td>
      </tr>
    `).join('')

    const body = `
      <h2>Summary</h2>
      <table>${summaryRows}</table>
      <h2>Monthly Trend</h2>
      ${trends.length > 0 ? `
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
