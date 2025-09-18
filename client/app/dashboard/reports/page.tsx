"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Checkbox } from "@/components/ui/checkbox"
import { DashboardLayout } from "@/components/dashboard/dashboard-layout"
import { useToast } from "@/hooks/use-toast"
import {
  FileText,
  Download,
  Calendar,
  BarChart3,
  TrendingUp,
  Banknote,
  Leaf,
  Crop,
  Package,
  CreditCard,
  Cloud,
  RefreshCw,
  Eye,
  Clock,
  CheckCircle,
  XCircle
} from "lucide-react"

interface ReportTemplate {
  id: string
  name: string
  description: string
  category: 'harvest' | 'financial' | 'marketplace' | 'weather' | 'comprehensive'
  format: 'pdf' | 'excel' | 'csv'
  estimatedTime: string
  lastGenerated?: string
}

interface GeneratedReport {
  id: string
  templateName: string
  fileName: string
  generatedDate: string
  fileSize: string
  format: string
  status: 'completed' | 'processing' | 'failed'
}

const reportCategories = [
  { value: 'harvest', label: 'Harvest Reports', icon: Crop, color: 'text-green-600' },
  { value: 'financial', label: 'Financial Reports', icon: Banknote, color: 'text-blue-600' },
  { value: 'marketplace', label: 'Marketplace Reports', icon: Package, color: 'text-purple-600' },
  { value: 'weather', label: 'Weather Reports', icon: Cloud, color: 'text-cyan-600' },
  { value: 'comprehensive', label: 'Comprehensive Reports', icon: BarChart3, color: 'text-orange-600' }
]

export default function ReportsPage() {
  const [templates, setTemplates] = useState<ReportTemplate[]>([])
  const [generatedReports, setGeneratedReports] = useState<GeneratedReport[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('templates')
  const [selectedTemplates, setSelectedTemplates] = useState<string[]>([])
  const [generatingReports, setGeneratingReports] = useState<string[]>([])
  const { toast } = useToast()

  useEffect(() => {
    fetchReportsData()
  }, [])

  const fetchReportsData = async () => {
    try {
      setLoading(true)
      
      const mockTemplates: ReportTemplate[] = [
        {
          id: '1',
          name: 'Harvest Summary Report',
          description: 'Comprehensive overview of harvest yields, quality, and performance metrics',
          category: 'harvest',
          format: 'pdf',
          estimatedTime: '2-3 minutes',
          lastGenerated: '2024-01-15T10:30:00Z'
        },
        {
          id: '2',
          name: 'Financial Performance Report',
          description: 'Detailed financial analysis including revenue, expenses, and profit margins',
          category: 'financial',
          format: 'excel',
          estimatedTime: '3-5 minutes',
          lastGenerated: '2024-01-14T15:45:00Z'
        },
        {
          id: '3',
          name: 'Marketplace Analytics Report',
          description: 'Sales performance, customer insights, and market trends analysis',
          category: 'marketplace',
          format: 'pdf',
          estimatedTime: '2-4 minutes',
          lastGenerated: '2024-01-13T09:20:00Z'
        }
      ]

      const mockGeneratedReports: GeneratedReport[] = [
        {
          id: '1',
          templateName: 'Harvest Summary Report',
          fileName: 'harvest_summary_2024_01_15.pdf',
          generatedDate: '2024-01-15T10:30:00Z',
          fileSize: '2.4 MB',
          format: 'pdf',
          status: 'completed'
        },
        {
          id: '2',
          templateName: 'Financial Performance Report',
          fileName: 'financial_performance_2024_01_14.xlsx',
          generatedDate: '2024-01-14T15:45:00Z',
          fileSize: '1.8 MB',
          format: 'excel',
          status: 'completed'
        }
      ]

      setTemplates(mockTemplates)
      setGeneratedReports(mockGeneratedReports)
    } catch (error) {
      console.error("Failed to fetch reports data:", error)
      toast({
        title: "Error",
        description: "Failed to load reports data. Please try again.",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const handleGenerateReport = async (templateId: string) => {
    try {
      setGeneratingReports(prev => [...prev, templateId])
      
      await new Promise(resolve => setTimeout(resolve, 3000))
      
      const template = templates.find(t => t.id === templateId)
      if (!template) return

      const newReport: GeneratedReport = {
        id: Date.now().toString(),
        templateName: template.name,
        fileName: `${template.name.toLowerCase().replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.${template.format}`,
        generatedDate: new Date().toISOString(),
        fileSize: `${(Math.random() * 5 + 1).toFixed(1)} MB`,
        format: template.format,
        status: 'completed'
      }

      setGeneratedReports(prev => [newReport, ...prev])
      setGeneratingReports(prev => prev.filter(id => id !== templateId))
      
      toast({
        title: "Report Generated! 🎉",
        description: `${template.name} has been successfully generated.`,
        variant: "default"
      })
    } catch (error) {
      setGeneratingReports(prev => prev.filter(id => id !== templateId))
      toast({
        title: "Generation Failed",
        description: "Failed to generate report. Please try again.",
        variant: "destructive"
      })
    }
  }

  const getCategoryIcon = (category: string) => {
    const cat = reportCategories.find(c => c.value === category)
    if (cat) {
      const IconComponent = cat.icon
      return <IconComponent className={`h-5 w-5 ${cat.color}`} />
    }
    return <FileText className="h-5 w-5 text-gray-500" />
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  if (loading) {
    return (
      <DashboardLayout pageTitle="Reports">
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => (
              <Card key={i} className="animate-pulse border border-gray-200">
                <CardHeader className="pb-3">
                  <div className="h-5 bg-gray-200 rounded w-3/4"></div>
                  <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                </CardHeader>
                <CardContent>
                  <div className="h-8 bg-gray-200 rounded mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded w-2/3"></div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout pageTitle="Reports">
      <div className="space-y-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="space-y-1">
            <h1 className="text-2xl font-semibold text-gray-900">Reports & Export</h1>
            <p className="text-gray-600">Generate comprehensive reports and export your farm data</p>
          </div>
          
          <div className="flex gap-2">
            <Button variant="outline" onClick={fetchReportsData}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="border border-gray-200">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">Available Templates</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900">{templates.length}</div>
              <div className="text-sm text-gray-600 mt-1">Ready to use</div>
            </CardContent>
          </Card>

          <Card className="border border-gray-200">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">Generated Reports</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900">{generatedReports.length}</div>
              <div className="text-sm text-gray-600 mt-1">Reports available</div>
            </CardContent>
          </Card>

          <Card className="border border-gray-200">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">Currently Generating</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900">{generatingReports.length}</div>
              <div className="text-sm text-gray-600 mt-1">In progress</div>
            </CardContent>
          </Card>

          <Card className="border border-gray-200">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">Total Downloads</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900">
                {generatedReports.filter(r => r.status === 'completed').length}
              </div>
              <div className="text-sm text-gray-600 mt-1">Ready to download</div>
            </CardContent>
          </Card>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="templates">Report Templates</TabsTrigger>
            <TabsTrigger value="generated">Generated Reports</TabsTrigger>
          </TabsList>

          <TabsContent value="templates" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {templates.map((template) => (
                <Card key={template.id} className="border border-gray-200">
                  <CardHeader>
                    <div className="flex items-center gap-2">
                      {getCategoryIcon(template.category)}
                      <div>
                        <CardTitle className="text-base font-medium">{template.name}</CardTitle>
                        <CardDescription className="text-sm">
                          {reportCategories.find(c => c.value === template.category)?.label}
                        </CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <p className="text-sm text-gray-600">{template.description}</p>
                    
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-500">Format:</span>
                      <Badge variant="outline" className="text-xs">
                        {template.format.toUpperCase()}
                      </Badge>
                    </div>
                    
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-500">Estimated Time:</span>
                      <span className="font-medium">{template.estimatedTime}</span>
                    </div>
                    
                    {template.lastGenerated && (
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-500">Last Generated:</span>
                        <span className="font-medium">{formatDate(template.lastGenerated)}</span>
                      </div>
                    )}
                    
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full"
                      onClick={() => handleGenerateReport(template.id)}
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
          </TabsContent>

          <TabsContent value="generated" className="space-y-6">
            <div className="space-y-4">
              {generatedReports.map((report) => (
                <Card key={report.id} className="border border-gray-200">
                  <CardContent className="p-6">
                    <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                      <div className="flex-1 space-y-3">
                        <div className="flex items-center gap-3">
                          <Badge className={report.status === 'completed' ? 'bg-green-100 text-green-800' : 'bg-amber-100 text-amber-800'}>
                            {report.status === 'completed' ? <CheckCircle className="h-4 w-4" /> : <Clock className="h-4 w-4" />}
                            {report.status.charAt(0).toUpperCase() + report.status.slice(1)}
                          </Badge>
                          <span className="text-sm text-gray-500">
                            {formatDate(report.generatedDate)}
                          </span>
                        </div>
                        
                        <div>
                          <h4 className="font-medium text-gray-900">{report.templateName}</h4>
                          <p className="text-sm text-gray-600">{report.fileName}</p>
                        </div>
                        
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                          <div>
                            <span className="text-gray-500">Format:</span>
                            <div className="font-medium">{report.format.toUpperCase()}</div>
                          </div>
                          <div>
                            <span className="text-gray-500">File Size:</span>
                            <div className="font-medium">{report.fileSize}</div>
                          </div>
                          <div>
                            <span className="text-gray-500">Status:</span>
                            <div className="font-medium capitalize">{report.status}</div>
                          </div>
                          <div>
                            <span className="text-gray-500">Generated:</span>
                            <div className="font-medium">{formatDate(report.generatedDate)}</div>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex flex-col gap-2">
                        {report.status === 'completed' ? (
                          <Button size="sm">
                            <Download className="h-4 w-4 mr-2" />
                            Download
                          </Button>
                        ) : (
                          <Button variant="outline" size="sm" disabled>
                            <Clock className="h-4 w-4 mr-2" />
                            Processing...
                          </Button>
                        )}
                        
                        <Button variant="outline" size="sm">
                          <Eye className="h-4 w-4 mr-2" />
                          Preview
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
              
              {generatedReports.length === 0 && (
                <Card className="border border-gray-200">
                  <CardContent className="p-12 text-center">
                    <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No reports generated yet</h3>
                    <p className="text-gray-600 mb-4">
                      Generate your first report to get started with data analysis.
                    </p>
                    <Button onClick={() => setActiveTab('templates')}>
                      <Download className="h-4 w-4 mr-2" />
                      Generate Your First Report
                    </Button>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  )
}
