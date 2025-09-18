"use client"

import { useState, useCallback } from "react"
import { useDropzone } from "react-dropzone"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { DashboardLayout } from "@/components/dashboard/dashboard-layout"
import { useToast } from "@/hooks/use-toast"
import { api } from "@/lib/api"
import { 
  Upload, 
  Download, 
  FileText, 
  CheckCircle, 
  AlertCircle, 
  XCircle, 
  Users, 
  ArrowLeft,
  Eye,
  EyeOff,
  Trash2
} from "lucide-react"
import Link from "next/link"

interface FarmerData {
  name: string
  email: string
  phone: string
  location: string | {
    city: string
    state: string
  }
  [key: string]: string | {
    city: string
    state: string
  }
}

interface ValidationResult {
  valid: FarmerData[]
  errors: string[]
  totalRows: number
}

export default function BulkUploadPage() {
  const [file, setFile] = useState<File | null>(null)
  const [csvData, setCsvData] = useState<FarmerData[]>([])
  const [validationResult, setValidationResult] = useState<ValidationResult | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [showPreview, setShowPreview] = useState(false)
  const { toast } = useToast()

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const uploadedFile = acceptedFiles[0]
    if (uploadedFile && uploadedFile.type === "text/csv") {
      setFile(uploadedFile)
      processCSV(uploadedFile)
    } else {
      toast({
        title: "Invalid file type",
        description: "Please upload a CSV file",
        variant: "destructive",
      })
    }
  }, [toast])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'text/csv': ['.csv']
    },
    multiple: false
  })

  const processCSV = async (file: File) => {
    try {
      const text = await file.text()
      const lines = text.split(/\r?\n/).filter(Boolean)
      const headers = lines[0].split(',').map(h => h.trim())
      
      const data: FarmerData[] = lines.slice(1).map((line, index) => {
        const values = line.split(',')
        const row = {} as FarmerData
        headers.forEach((header, i) => {
          row[header] = values[i]?.trim() || ''
        })
        return row
      })

      setCsvData(data)
      validateData(data)
    } catch (error) {
      toast({
        title: "Error processing CSV",
        description: "Please check your file format",
        variant: "destructive",
      })
    }
  }

  const validateData = (data: FarmerData[]) => {
    const errors: string[] = []
    const valid: FarmerData[] = []

    data.forEach((row, index) => {
      const rowNumber = index + 2 // +2 because we start from line 2 (after header)

      if (!row.name || row.name.trim() === '') {
        errors.push(`Row ${rowNumber}: Name is required`)
        return
      }

      if (!row.email || row.email.trim() === '') {
        errors.push(`Row ${rowNumber}: Email is required`)
        return
      }

      // Basic email validation
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailRegex.test(row.email)) {
        errors.push(`Row ${rowNumber}: Invalid email format`)
        return
      }

      if (!row.phone || row.phone.trim() === '') {
        errors.push(`Row ${rowNumber}: Phone is required`)
        return
      }

      // Basic phone validation (Nigerian format)
      const phoneRegex = /^(\+234|0)[789][01]\d{8}$/
      if (!phoneRegex.test(row.phone.replace(/\s/g, ''))) {
        errors.push(`Row ${rowNumber}: Invalid phone format (use +234 or 0 followed by 10 digits)`)
        return
      }

      if (!row.location || (typeof row.location === 'string' ? row.location.trim() === '' : false)) {
        errors.push(`Row ${rowNumber}: Location is required`)
        return
      }

      valid.push(row)
    })

    setValidationResult({
      valid,
      errors,
      totalRows: data.length
    })
  }

  const handleUpload = async () => {
    if (!file || !validationResult || validationResult.valid.length === 0) {
      toast({
        title: "No valid data to upload",
        description: "Please select a file and fix validation errors first",
        variant: "destructive",
      })
      return
    }

    try {
      setIsUploading(true)
      setUploadProgress(0)

      // Use real API call
      const response = await api.uploadPartnerCSV(file)

      if (response.status === 'success') {
        const data = response.data
        setUploadProgress(100)

        toast({
          title: "Upload completed!",
          description: `${data?.successfulRows || 0} farmers onboarded successfully`,
        })

        // Reset form
        setFile(null)
        setCsvData([])
        setValidationResult(null)
        setUploadProgress(0)
        setShowPreview(false)
      } else {
        throw new Error(response.message || 'Upload failed')
      }
    } catch (error: any) {
      console.error('Upload error:', error)
      toast({
        title: "Upload failed",
        description: error.message || "Failed to upload farmers data",
        variant: "destructive",
      })
    } finally {
      setIsUploading(false)
    }
  }

  const downloadTemplate = () => {
    const template = `name,email,phone,location
John Doe,john@farmer.com,+2348012345678,Lagos
Jane Smith,jane@farmer.com,+2348012345679,Abuja
Mike Johnson,mike@farmer.com,+2348012345680,Kano`
    
    const blob = new Blob([template], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'farmer_template.csv'
    a.click()
    window.URL.revokeObjectURL(url)
  }

  const removeFile = () => {
    setFile(null)
    setCsvData([])
    setValidationResult(null)
    setUploadProgress(0)
  }

  return (
    <DashboardLayout pageTitle="Bulk Farmer Upload">
      <div className="space-y-4 sm:space-y-6">
        {/* Header */}
        <div className="flex flex-col space-y-4 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
          <div className="space-y-1 min-w-0 flex-1">
            <div className="flex items-center space-x-2">
              <Button variant="ghost" size="sm" asChild className="flex-shrink-0">
                <Link href="/dashboard/farmers">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  <span className="hidden sm:inline">Back to Farmers</span>
                  <span className="sm:hidden">Back</span>
                </Link>
              </Button>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight truncate">Bulk Farmer Upload</h1>
            <p className="text-sm sm:text-base text-muted-foreground">Upload multiple farmers at once using CSV format</p>
          </div>
          <Button variant="outline" onClick={downloadTemplate} className="flex-shrink-0 w-full sm:w-auto">
            <Download className="w-4 h-4 mr-2" />
            <span className="hidden sm:inline">Download Template</span>
            <span className="sm:hidden">Template</span>
          </Button>
        </div>

        <div className="grid gap-4 sm:gap-6 lg:grid-cols-2">
          {/* Upload Section */}
          <div className="space-y-4 sm:space-y-6">
            {/* File Upload */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg sm:text-xl">Upload CSV File</CardTitle>
                <CardDescription className="text-sm sm:text-base">
                  Drag and drop your CSV file or click to browse
                </CardDescription>
              </CardHeader>
              <CardContent>
                {!file ? (
                  <div
                    {...getRootProps()}
                    className={`border-2 border-dashed rounded-lg p-4 sm:p-8 text-center cursor-pointer transition-colors ${
                      isDragActive
                        ? "border-primary bg-primary/5"
                        : "border-muted-foreground/25 hover:border-primary/50"
                    }`}
                  >
                    <input {...getInputProps()} />
                    <Upload className="h-10 w-10 sm:h-12 sm:w-12 text-muted-foreground mx-auto mb-3 sm:mb-4" />
                    {isDragActive ? (
                      <p className="text-sm sm:text-base text-primary font-medium">Drop the CSV file here</p>
                    ) : (
                      <div>
                        <p className="text-sm sm:text-base font-medium">Drop your CSV file here</p>
                        <p className="text-xs sm:text-sm text-muted-foreground mt-1 sm:mt-2">
                          or click to select a file
                        </p>
                      </div>
                    )}
                    <p className="text-xs text-muted-foreground mt-3 sm:mt-4">
                      Supports .csv files up to 10MB
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between p-3 sm:p-4 border rounded-lg gap-3 sm:gap-0">
                      <div className="flex items-center space-x-3 min-w-0 flex-1">
                        <FileText className="h-6 w-6 sm:h-8 sm:w-8 text-primary flex-shrink-0" />
                        <div className="min-w-0 flex-1">
                          <p className="font-medium text-sm sm:text-base truncate">{file.name}</p>
                          <p className="text-xs sm:text-sm text-muted-foreground">
                            {(file.size / 1024 / 1024).toFixed(2)} MB
                          </p>
                        </div>
                      </div>
                      <Button variant="ghost" size="sm" onClick={removeFile} className="flex-shrink-0">
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>

                    {validationResult && (
                      <div className="space-y-3">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                          <span className="text-sm font-medium">Validation Results</span>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setShowPreview(!showPreview)}
                            className="w-full sm:w-auto"
                          >
                            {showPreview ? <EyeOff className="w-4 h-4 mr-2" /> : <Eye className="w-4 h-4 mr-2" />}
                            <span className="hidden sm:inline">{showPreview ? "Hide" : "Show"} Preview</span>
                            <span className="sm:hidden">{showPreview ? "Hide" : "Show"}</span>
                          </Button>
                        </div>

                        <div className="grid grid-cols-3 gap-2 text-sm">
                          <div className="text-center p-2 sm:p-3 bg-green-50 rounded">
                            <div className="font-bold text-green-600 text-sm sm:text-base">{validationResult.valid.length}</div>
                            <div className="text-green-600 text-xs sm:text-sm">Valid</div>
                          </div>
                          <div className="text-center p-2 sm:p-3 bg-red-50 rounded">
                            <div className="font-bold text-red-600 text-sm sm:text-base">{validationResult.errors.length}</div>
                            <div className="text-red-600 text-xs sm:text-sm">Errors</div>
                          </div>
                          <div className="text-center p-2 sm:p-3 bg-blue-50 rounded">
                            <div className="font-bold text-blue-600 text-sm sm:text-base">{validationResult.totalRows}</div>
                            <div className="text-blue-600 text-xs sm:text-sm">Total</div>
                          </div>
                        </div>

                        {validationResult.errors.length > 0 && (
                          <Alert variant="destructive">
                            <AlertCircle className="h-4 w-4" />
                            <AlertDescription>
                              Please fix the validation errors before uploading
                            </AlertDescription>
                          </Alert>
                        )}

                        {validationResult.valid.length > 0 && (
                          <Button
                            onClick={handleUpload}
                            disabled={isUploading || validationResult.errors.length > 0}
                            className="w-full"
                            size="sm"
                          >
                            {isUploading ? "Uploading..." : `Upload ${validationResult.valid.length} Farmers`}
                          </Button>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Upload Progress */}
            {isUploading && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg sm:text-xl">Upload Progress</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <Progress value={uploadProgress} className="h-2" />
                    <p className="text-sm text-muted-foreground">
                      {uploadProgress}% complete
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Preview Section */}
          <div className="space-y-4 sm:space-y-6">
            {/* CSV Template */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg sm:text-xl">CSV Template</CardTitle>
                <CardDescription className="text-sm sm:text-base">
                  Your CSV should follow this format with these required columns
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-1 sm:gap-2 text-xs sm:text-sm font-medium bg-muted p-2 rounded">
                    <span className="truncate">name</span>
                    <span className="truncate">email</span>
                    <span className="truncate">phone</span>
                    <span className="truncate">location</span>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-1 sm:gap-2 text-xs sm:text-sm bg-muted/50 p-2 rounded">
                    <span className="truncate">John Doe</span>
                    <span className="truncate">john@farmer.com</span>
                    <span className="truncate">+2348012345678</span>
                    <span className="truncate">Lagos</span>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-1 sm:gap-2 text-xs sm:text-sm bg-muted/50 p-2 rounded">
                    <span className="truncate">Jane Smith</span>
                    <span className="truncate">jane@farmer.com</span>
                    <span className="truncate">+2348012345679</span>
                    <span className="truncate">Abuja</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Validation Errors */}
            {validationResult && validationResult.errors.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2 text-lg sm:text-xl">
                    <XCircle className="h-4 w-4 sm:h-5 sm:w-5 text-red-600 flex-shrink-0" />
                    <span className="truncate">Validation Errors</span>
                  </CardTitle>
                  <CardDescription className="text-sm sm:text-base">
                    Please fix these errors before uploading
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 max-h-40 sm:max-h-60 overflow-y-auto">
                    {validationResult.errors.map((error, index) => (
                      <div key={index} className="flex items-start space-x-2 text-xs sm:text-sm">
                        <XCircle className="h-3 w-3 sm:h-4 sm:w-4 text-red-600 mt-0.5 flex-shrink-0" />
                        <span className="text-red-700">{error}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Data Preview */}
            {showPreview && validationResult && validationResult.valid.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2 text-lg sm:text-xl">
                    <CheckCircle className="h-4 w-4 sm:h-5 sm:w-5 text-green-600 flex-shrink-0" />
                    <span className="truncate">Data Preview</span>
                  </CardTitle>
                  <CardDescription className="text-sm sm:text-base">
                    Preview of valid data that will be uploaded
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 max-h-40 sm:max-h-60 overflow-y-auto">
                    {validationResult.valid.slice(0, 5).map((row, index) => (
                      <div key={index} className="p-2 sm:p-3 border rounded text-xs sm:text-sm">
                        <div className="font-medium truncate">{row.name}</div>
                        <div className="text-muted-foreground text-xs sm:text-sm truncate">
                          {row.email} • {row.phone} • {typeof row.location === 'string' ? row.location : `${row.location?.city || 'Unknown'}, ${row.location?.state || 'Unknown State'}`}
                        </div>
                      </div>
                    ))}
                    {validationResult.valid.length > 5 && (
                      <p className="text-xs sm:text-sm text-muted-foreground text-center">
                        ... and {validationResult.valid.length - 5} more
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>

        {/* Instructions */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg sm:text-xl">Instructions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:gap-6 md:grid-cols-2">
              <div className="space-y-3">
                <h4 className="font-medium text-sm sm:text-base">Required Fields</h4>
                <ul className="space-y-1 text-xs sm:text-sm text-muted-foreground">
                  <li>• <strong>name:</strong> Full name of the farmer</li>
                  <li>• <strong>email:</strong> Valid email address</li>
                  <li>• <strong>phone:</strong> Nigerian phone number (+234 or 0)</li>
                  <li>• <strong>location:</strong> City or region</li>
                </ul>
              </div>
              <div className="space-y-3">
                <h4 className="font-medium text-sm sm:text-base">Tips</h4>
                <ul className="space-y-1 text-xs sm:text-sm text-muted-foreground">
                  <li>• Use the template as a starting point</li>
                  <li>• Ensure all required fields are filled</li>
                  <li>• Check phone numbers follow Nigerian format</li>
                  <li>• Maximum file size: 10MB</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}
