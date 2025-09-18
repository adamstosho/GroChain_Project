"use client"

import type React from "react"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Progress } from "@/components/ui/progress"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Upload, Download, FileText, CheckCircle, AlertCircle, Users, ArrowLeft } from "lucide-react"
import { api } from "@/lib/api"
import Link from "next/link"

interface UploadResult {
  success: boolean
  totalRows: number
  successfulRows: number
  failedRows: number
  errors: Array<{ row: number; error: string }>
}

export default function BulkOnboardPage() {
  const [file, setFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [result, setResult] = useState<UploadResult | null>(null)

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0]
    if (selectedFile && selectedFile.type === "text/csv") {
      setFile(selectedFile)
      setResult(null)
    } else {
      alert("Please select a valid CSV file")
    }
  }

  const handleUpload = async () => {
    if (!file) return

    setUploading(true)
    setUploadProgress(0)

    try {
      const formData = new FormData()
      formData.append("csvFile", file)

      // Simulate progress
      const progressInterval = setInterval(() => {
        setUploadProgress((prev) => Math.min(prev + 10, 90))
      }, 200)

      const response = await api.uploadPartnerCSV(file)

      clearInterval(progressInterval)
      setUploadProgress(100)
      setResult(response.data as any)
    } catch (error) {
      console.error("Upload failed:", error)
      alert("Upload failed. Please try again.")
    } finally {
      setUploading(false)
    }
  }

  const downloadTemplate = () => {
    // Create CSV template
    const csvContent = `name,email,phone,location,gender,age,education
John Doe,john@example.com,+2348012345678,"Lagos, Nigeria",Male,35,Secondary
Jane Smith,jane@example.com,+2348087654321,"Kano, Nigeria",Female,28,Tertiary`

    const blob = new Blob([csvContent], { type: "text/csv" })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = "farmer_template.csv"
    a.click()
    window.URL.revokeObjectURL(url)
  }

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <Button variant="outline" size="sm" asChild>
          <Link href="/partners">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Partners
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Bulk Farmer Onboarding</h1>
          <p className="text-gray-600">Upload a CSV file to onboard multiple farmers at once</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Upload Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Upload className="h-5 w-5" />
              Upload CSV File
            </CardTitle>
            <CardDescription>Select a CSV file containing farmer information to upload</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="csvFile">CSV File</Label>
              <Input id="csvFile" type="file" accept=".csv" onChange={handleFileChange} disabled={uploading} />
            </div>

            {file && (
              <Alert>
                <FileText className="h-4 w-4" />
                <AlertDescription>
                  Selected file: {file.name} ({(file.size / 1024).toFixed(2)} KB)
                </AlertDescription>
              </Alert>
            )}

            {uploading && (
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Uploading...</span>
                  <span>{uploadProgress}%</span>
                </div>
                <Progress value={uploadProgress} />
              </div>
            )}

            <div className="flex gap-2">
              <Button onClick={handleUpload} disabled={!file || uploading} className="flex-1">
                {uploading ? "Uploading..." : "Upload & Process"}
              </Button>
              <Button variant="outline" onClick={downloadTemplate} disabled={uploading}>
                <Download className="h-4 w-4 mr-2" />
                Template
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Instructions */}
        <Card>
          <CardHeader>
            <CardTitle>Instructions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h4 className="font-semibold mb-2">CSV Format Requirements:</h4>
              <ul className="text-sm space-y-1 text-gray-600">
                <li>• File must be in CSV format (.csv)</li>
                <li>• First row should contain column headers</li>
                <li>• Required columns: name, email, phone, location</li>
                <li>• Optional columns: gender, age, education</li>
                <li>• Maximum file size: 5MB</li>
                <li>• Maximum rows: 1000 farmers per upload</li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold mb-2">Data Validation:</h4>
              <ul className="text-sm space-y-1 text-gray-600">
                <li>• Email addresses must be valid and unique</li>
                <li>• Phone numbers must be in Nigerian format</li>
                <li>• Names must be at least 2 characters long</li>
                <li>• Location should include state information</li>
              </ul>
            </div>

            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>Download the template file to ensure your CSV is properly formatted</AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      </div>

      {/* Results */}
      {result && (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {result.success ? (
                <CheckCircle className="h-5 w-5 text-green-600" />
              ) : (
                <AlertCircle className="h-5 w-5 text-red-600" />
              )}
              Upload Results
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">{result.totalRows}</div>
                <div className="text-sm text-blue-600">Total Rows</div>
              </div>
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <div className="text-2xl font-bold text-green-600">{result.successfulRows}</div>
                <div className="text-sm text-green-600">Successful</div>
              </div>
              <div className="text-center p-4 bg-red-50 rounded-lg">
                <div className="text-2xl font-bold text-red-600">{result.failedRows}</div>
                <div className="text-sm text-red-600">Failed</div>
              </div>
            </div>

            {result.errors.length > 0 && (
              <div>
                <h4 className="font-semibold mb-2 text-red-600">Errors:</h4>
                <div className="max-h-40 overflow-y-auto space-y-1">
                  {result.errors.map((error, index) => (
                    <div key={index} className="text-sm p-2 bg-red-50 rounded">
                      Row {error.row}: {error.error}
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex gap-2 mt-4">
              <Button asChild>
                <Link href="/partners">
                  <Users className="h-4 w-4 mr-2" />
                  View Farmers
                </Link>
              </Button>
              <Button variant="outline" onClick={() => setResult(null)}>
                Upload Another File
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
