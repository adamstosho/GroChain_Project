"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { DashboardLayout } from "@/components/dashboard/dashboard-layout"
import { apiService } from "@/lib/api"
import { useToast } from "@/hooks/use-toast"
import { ArrowLeft, CreditCard, Calculator, FileText, CheckCircle, AlertCircle, Info, Upload, X, Loader2, User } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"

interface LoanApplicationForm {
  amount: number
  purpose: string
  term: number
  description: string
  collateral: string
  monthlyIncome: number
  existingLoans: number
  interestRate: number
  collateralValue?: number
}

interface UserProfile {
  id: string
  name: string
  email: string
  phone: string
  monthlyIncome?: number
  creditScore?: number
}

interface UploadedDocument {
  id: string
  name: string
  url: string
  type: 'id' | 'income' | 'farm' | 'business'
}

const loanPurposes = [
  "Working Capital",
  "Equipment Purchase",
  "Farm Expansion",
  "Input Purchase",
  "Infrastructure Development",
  "Emergency Funds",
  "Seasonal Operations",
  "Technology Investment"
]

const loanTerms = [3, 6, 12, 18, 24, 36, 48, 60]

export default function LoanApplicationPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null)
  const [uploadedDocuments, setUploadedDocuments] = useState<UploadedDocument[]>([])
  const [formData, setFormData] = useState<LoanApplicationForm>({
    amount: 0,
    purpose: "",
    term: 12,
    description: "",
    collateral: "",
    monthlyIncome: 0,
    existingLoans: 0,
    interestRate: 15 // Default interest rate
  })

  const { toast } = useToast()

  useEffect(() => {
    loadUserData()
  }, [])

  const loadUserData = async () => {
    try {
      setLoading(true)

      // Load user profile
      const profileResponse = await apiService.getMyProfile()
      if (profileResponse.status === 'success') {
        const profile = profileResponse.data as any
        setUserProfile({
          id: profile._id || profile.id,
          name: profile.name,
          email: profile.email,
          phone: profile.phone,
          monthlyIncome: profile.monthlyIncome || 0,
          creditScore: profile.creditScore || 0
        })

        // Pre-fill form with user's monthly income if available
        setFormData(prev => ({
          ...prev,
          monthlyIncome: profile.monthlyIncome || 0
        }))
      }

      // Load credit score
      const creditScoreResponse = await apiService.getMyCreditScore()
      if (creditScoreResponse.status === 'success') {
        setUserProfile(prev => prev ? {
          ...prev,
          creditScore: (creditScoreResponse.data as any).score
        } : null)

        // Adjust interest rate based on credit score
        const creditScore = (creditScoreResponse.data as any).score
        let interestRate = 15 // Default
        if (creditScore >= 750) interestRate = 12
        else if (creditScore >= 650) interestRate = 14
        else if (creditScore >= 550) interestRate = 16
        else interestRate = 18

        setFormData(prev => ({ ...prev, interestRate }))
      }

    } catch (error) {
      console.error('Failed to load user data:', error)
      toast({
        title: "Data Loading Error",
        description: "Failed to load some user data. Please continue with the application.",
        variant: "default"
      })
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.amount || !formData.purpose || !formData.term) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields.",
        variant: "destructive"
      })
      return
    }

    if (!userProfile) {
      toast({
        title: "User Profile Error",
        description: "Unable to identify user. Please refresh the page and try again.",
        variant: "destructive"
      })
      return
    }

    // Validate amount limits
    if (formData.amount < 10000) {
      toast({
        title: "Invalid Amount",
        description: "Loan amount must be at least ₦10,000.",
        variant: "destructive"
      })
      return
    }

    if (formData.amount > 5000000) {
      toast({
        title: "Invalid Amount",
        description: "Loan amount cannot exceed ₦5,000,000.",
        variant: "destructive"
      })
      return
    }

    // Validate required documents
    const hasIdDocument = uploadedDocuments.some(doc => doc.type === 'id')
    const hasIncomeDocument = uploadedDocuments.some(doc => doc.type === 'income')

    if (!hasIdDocument || !hasIncomeDocument) {
      toast({
        title: "Missing Required Documents",
        description: "Please upload your Government ID and Proof of Income documents before submitting.",
        variant: "destructive"
      })
      return
    }

    // Check for business plan if amount is over 500,000
    if (formData.amount > 500000 && !uploadedDocuments.some(doc => doc.type === 'business')) {
      toast({
        title: "Business Plan Required",
        description: "Please upload a business plan for loan amounts over ₦500,000.",
        variant: "destructive"
      })
      return
    }

    try {
      setSubmitting(true)

      // Prepare data for backend API
      const applicationData = {
        amount: formData.amount,
        purpose: formData.purpose,
        term: formData.term,
        description: formData.description,
        farmerId: userProfile.id,
        loanAmount: formData.amount,
        interestRate: formData.interestRate,
        collateral: formData.collateral,
        collateralValue: formData.collateralValue,
        monthlyIncome: formData.monthlyIncome,
        existingLoans: formData.existingLoans,
        documents: uploadedDocuments.map(doc => doc.url)
      }

      const response = await apiService.createLoanApplication(applicationData)

      if (response.status === 'success') {
        toast({
          title: "Loan Application Submitted! 🎉",
          description: "Your application has been received and is under review. You will receive an email confirmation shortly.",
          variant: "default"
        })

        router.push("/dashboard/financial/loans")
      } else {
        throw new Error(response.message || 'Failed to submit application')
      }
    } catch (error) {
      console.error("Failed to submit loan application:", error)
      toast({
        title: "Application Failed",
        description: (error as any)?.message || "Please try again.",
        variant: "destructive"
      })
    } finally {
      setSubmitting(false)
    }
  }

  const calculateMonthlyPayment = () => {
    if (!formData.amount || !formData.term) return 0

    // Use the actual interest rate from form data
    const annualInterestRate = formData.interestRate / 100 // Convert percentage to decimal
    const monthlyInterestRate = annualInterestRate / 12

    // Calculate total amount with compound interest
    const monthlyPayment = (formData.amount * monthlyInterestRate * Math.pow(1 + monthlyInterestRate, formData.term)) /
                          (Math.pow(1 + monthlyInterestRate, formData.term) - 1)

    return Math.round(monthlyPayment)
  }

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>, documentType: 'id' | 'income' | 'farm' | 'business') => {
    const file = event.target.files?.[0]
    if (!file) return

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf']
    if (!allowedTypes.includes(file.type)) {
      toast({
        title: "Invalid File Type",
        description: "Please upload a JPEG, PNG, or PDF file.",
        variant: "destructive"
      })
      return
    }

    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "File Too Large",
        description: "Please upload a file smaller than 5MB.",
        variant: "destructive"
      })
      return
    }

    try {
      const uploadResponse = await apiService.uploadImage(file)

      if (uploadResponse && uploadResponse.url) {
        const document: UploadedDocument = {
          id: Date.now().toString(),
          name: file.name,
          url: uploadResponse.url,
          type: documentType
        }

        setUploadedDocuments(prev => [...prev, document])
        toast({
          title: "Document Uploaded",
          description: `${file.name} has been uploaded successfully.`,
          variant: "default"
        })
      } else {
        throw new Error('Invalid upload response')
      }
    } catch (error: any) {
      console.error('File upload failed:', error)

      let errorMessage = "Failed to upload document. Please try again."

      if (error.message?.includes('ENOTFOUND')) {
        errorMessage = "Network error: Unable to connect to upload service. Please check your internet connection."
      } else if (error.message?.includes('Only')) {
        errorMessage = error.message
      } else if (error.message?.includes('File too large')) {
        errorMessage = "File is too large. Please upload a file smaller than 5MB."
      }

      toast({
        title: "Upload Failed",
        description: errorMessage,
        variant: "destructive"
      })
    }
  }

  const removeDocument = (documentId: string) => {
    setUploadedDocuments(prev => prev.filter(doc => doc.id !== documentId))
  }

  const getLoanEligibility = () => {
    if (!formData.monthlyIncome || !formData.amount) return "unknown"
    
    const monthlyPayment = calculateMonthlyPayment()
    const debtToIncomeRatio = (monthlyPayment + formData.existingLoans) / formData.monthlyIncome
    
    if (debtToIncomeRatio <= 0.3) return "excellent"
    if (debtToIncomeRatio <= 0.4) return "good"
    if (debtToIncomeRatio <= 0.5) return "fair"
    return "poor"
  }

  const getEligibilityColor = (eligibility: string) => {
    switch (eligibility) {
      case "excellent": return "text-emerald-600"
      case "good": return "text-blue-600"
      case "fair": return "text-amber-600"
      case "poor": return "text-red-600"
      default: return "text-gray-600"
    }
  }

  const getEligibilityLabel = (eligibility: string) => {
    switch (eligibility) {
      case "excellent": return "Excellent"
      case "good": return "Good"
      case "fair": return "Fair"
      case "poor": return "Poor"
      default: return "Unknown"
    }
  }

  return (
    <DashboardLayout pageTitle="Apply for Loan">
      <div className="space-y-6">
        {/* Page Header */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-3">
              <Button variant="ghost" asChild className="text-gray-600 hover:text-gray-900">
                <Link href="/dashboard/financial" className="flex items-center gap-2">
                  <ArrowLeft className="h-4 w-4" />
                  Back to Financial Services
                </Link>
              </Button>
            </div>
            <h1 className="text-2xl font-semibold text-gray-900">Apply for Loan</h1>
            <p className="text-gray-600">
              Access affordable financing to grow your farming business
            </p>
          </div>

          {/* User Profile Card */}
          {userProfile && (
            <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-blue-500 flex items-center justify-center">
                    <User className="h-5 w-5 text-white" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">{userProfile.name}</p>
                    <p className="text-sm text-gray-600">{userProfile.email}</p>
                    {userProfile.creditScore && (
                      <p className="text-xs text-blue-600 font-medium">
                        Credit Score: {userProfile.creditScore}
                      </p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Loan Application Form */}
          <div className="lg:col-span-2">
            <Card className="border border-gray-200">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base font-medium">
                  <CreditCard className="h-4 w-4 text-blue-500" />
                  Loan Application Details
                </CardTitle>
                <CardDescription>
                  Fill in your loan requirements and personal information
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="amount">Loan Amount (NGN) *</Label>
                      <Input
                        id="amount"
                        type="number"
                        value={formData.amount}
                        onChange={(e) => setFormData(prev => ({ ...prev, amount: Number(e.target.value) }))}
                        placeholder="e.g., 500000"
                        min="10000"
                        step="10000"
                        required
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="purpose">Loan Purpose *</Label>
                      <Select 
                        value={formData.purpose} 
                        onValueChange={(value) => setFormData(prev => ({ ...prev, purpose: value }))}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select purpose" />
                        </SelectTrigger>
                        <SelectContent>
                          {loanPurposes.map((purpose) => (
                            <SelectItem key={purpose} value={purpose}>{purpose}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="term">Loan Term (Months) *</Label>
                      <Select 
                        value={formData.term.toString()} 
                        onValueChange={(value) => setFormData(prev => ({ ...prev, term: Number(value) }))}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {loanTerms.map((term) => (
                            <SelectItem key={term} value={term.toString()}>{term} months</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="monthlyIncome">Monthly Income (NGN)</Label>
                      <Input
                        id="monthlyIncome"
                        type="number"
                        value={formData.monthlyIncome}
                        onChange={(e) => setFormData(prev => ({ ...prev, monthlyIncome: Number(e.target.value) }))}
                        placeholder="e.g., 150000"
                        min="0"
                        step="10000"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="description">Detailed Description *</Label>
                    <Textarea
                      id="description"
                      value={formData.description}
                      onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                      placeholder="Explain how you plan to use this loan and how it will benefit your farming business..."
                      rows={4}
                      required
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="collateral">Collateral (Optional)</Label>
                      <Input
                        id="collateral"
                        value={formData.collateral}
                        onChange={(e) => setFormData(prev => ({ ...prev, collateral: e.target.value }))}
                        placeholder="e.g., Farm equipment, land title"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="existingLoans">Existing Monthly Loan Payments (NGN)</Label>
                      <Input
                        id="existingLoans"
                        type="number"
                        value={formData.existingLoans}
                        onChange={(e) => setFormData(prev => ({ ...prev, existingLoans: Number(e.target.value) }))}
                        placeholder="e.g., 25000"
                        min="0"
                        step="1000"
                      />
                    </div>
                  </div>

                  {/* Document Upload Section */}
                  <div className="space-y-4 pt-6 border-t border-gray-200">
                    <div>
                      <h4 className="text-sm font-medium text-gray-900 mb-3">Required Documents</h4>
                      <p className="text-xs text-gray-600 mb-4">
                        Please upload the following documents to complete your loan application
                      </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Government ID */}
                      <div className="space-y-2">
                        <Label className="text-sm">Government ID *</Label>
                        <div className="flex items-center gap-2">
                          <Input
                            type="file"
                            accept=".jpg,.jpeg,.png,.pdf"
                            onChange={(e) => handleFileUpload(e, 'id')}
                            className="hidden"
                            id="id-upload"
                          />
                          <Label
                            htmlFor="id-upload"
                            className="flex items-center gap-2 px-3 py-2 border border-gray-300 rounded-md cursor-pointer hover:bg-gray-50 transition-colors"
                          >
                            <Upload className="h-4 w-4 text-gray-500" />
                            <span className="text-sm">Choose File</span>
                          </Label>
                          {uploadedDocuments.some(doc => doc.type === 'id') && (
                            <CheckCircle className="h-4 w-4 text-green-500" />
                          )}
                        </div>
                        <p className="text-xs text-gray-500">Valid ID card or passport</p>
                      </div>

                      {/* Proof of Income */}
                      <div className="space-y-2">
                        <Label className="text-sm">Proof of Income *</Label>
                        <div className="flex items-center gap-2">
                          <Input
                            type="file"
                            accept=".jpg,.jpeg,.png,.pdf"
                            onChange={(e) => handleFileUpload(e, 'income')}
                            className="hidden"
                            id="income-upload"
                          />
                          <Label
                            htmlFor="income-upload"
                            className="flex items-center gap-2 px-3 py-2 border border-gray-300 rounded-md cursor-pointer hover:bg-gray-50 transition-colors"
                          >
                            <Upload className="h-4 w-4 text-gray-500" />
                            <span className="text-sm">Choose File</span>
                          </Label>
                          {uploadedDocuments.some(doc => doc.type === 'income') && (
                            <CheckCircle className="h-4 w-4 text-green-500" />
                          )}
                        </div>
                        <p className="text-xs text-gray-500">Bank statements or income proof</p>
                      </div>

                      {/* Farm Registration */}
                      <div className="space-y-2">
                        <Label className="text-sm">Farm Registration</Label>
                        <div className="flex items-center gap-2">
                          <Input
                            type="file"
                            accept=".jpg,.jpeg,.png,.pdf"
                            onChange={(e) => handleFileUpload(e, 'farm')}
                            className="hidden"
                            id="farm-upload"
                          />
                          <Label
                            htmlFor="farm-upload"
                            className="flex items-center gap-2 px-3 py-2 border border-gray-300 rounded-md cursor-pointer hover:bg-gray-50 transition-colors"
                          >
                            <Upload className="h-4 w-4 text-gray-500" />
                            <span className="text-sm">Choose File</span>
                          </Label>
                          {uploadedDocuments.some(doc => doc.type === 'farm') && (
                            <CheckCircle className="h-4 w-4 text-green-500" />
                          )}
                        </div>
                        <p className="text-xs text-gray-500">Farm registration documents</p>
                      </div>

                      {/* Business Plan */}
                      <div className="space-y-2">
                        <Label className="text-sm">Business Plan</Label>
                        <div className="flex items-center gap-2">
                          <Input
                            type="file"
                            accept=".jpg,.jpeg,.png,.pdf"
                            onChange={(e) => handleFileUpload(e, 'business')}
                            className="hidden"
                            id="business-upload"
                          />
                          <Label
                            htmlFor="business-upload"
                            className="flex items-center gap-2 px-3 py-2 border border-gray-300 rounded-md cursor-pointer hover:bg-gray-50 transition-colors"
                          >
                            <Upload className="h-4 w-4 text-gray-500" />
                            <span className="text-sm">Choose File</span>
                          </Label>
                          {uploadedDocuments.some(doc => doc.type === 'business') && (
                            <CheckCircle className="h-4 w-4 text-green-500" />
                          )}
                        </div>
                        <p className="text-xs text-gray-500">For amounts over ₦500,000</p>
                      </div>
                    </div>

                    {/* Uploaded Documents List */}
                    {uploadedDocuments.length > 0 && (
                      <div className="space-y-2">
                        <Label className="text-sm">Uploaded Documents</Label>
                        <div className="space-y-2">
                          {uploadedDocuments.map((doc) => (
                            <div key={doc.id} className="flex items-center justify-between p-2 bg-gray-50 rounded-md">
                              <div className="flex items-center gap-2">
                                <FileText className="h-4 w-4 text-gray-500" />
                                <span className="text-sm font-medium">{doc.name}</span>
                                <span className="text-xs text-gray-500 capitalize">({doc.type})</span>
                              </div>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => removeDocument(doc.id)}
                                className="text-red-500 hover:text-red-700"
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="flex gap-3 pt-4">
                    <Button variant="outline" onClick={() => router.push("/dashboard/financial")} type="button">
                      Cancel
                    </Button>
                    <Button type="submit" disabled={submitting || loading}>
                      {submitting ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Submitting Application...
                        </>
                      ) : (
                        "Submit Application"
                      )}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </div>

          {/* Loan Calculator & Eligibility */}
          <div className="space-y-6">
            {/* Loan Calculator */}
            <Card className="border border-gray-200">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base font-medium">
                  <Calculator className="h-4 w-4 text-green-500" />
                  Loan Calculator
                </CardTitle>
                <CardDescription>Estimate your monthly payments</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Loan Amount:</span>
                    <span className="font-medium">₦{formData.amount.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Term:</span>
                    <span className="font-medium">{formData.term} months</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Interest Rate:</span>
                    <span className="font-medium">{formData.interestRate}% APR</span>
                  </div>
                  <div className="border-t pt-2">
                    <div className="flex justify-between text-sm font-medium">
                      <span>Estimated Monthly Payment:</span>
                      <span className="text-green-600">₦{calculateMonthlyPayment().toLocaleString()}</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Eligibility Checker */}
            <Card className="border border-gray-200">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base font-medium">
                  <CheckCircle className="h-4 w-4 text-emerald-500" />
                  Eligibility Checker
                </CardTitle>
                <CardDescription>Quick assessment of your loan eligibility</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {formData.monthlyIncome > 0 && formData.amount > 0 ? (
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Debt-to-Income Ratio:</span>
                      <span className="font-medium">
                        {((calculateMonthlyPayment() + formData.existingLoans) / formData.monthlyIncome * 100).toFixed(1)}%
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Eligibility:</span>
                      <span className={`font-medium ${getEligibilityColor(getLoanEligibility())}`}>
                        {getEligibilityLabel(getLoanEligibility())}
                      </span>
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-gray-600">
                    Enter your monthly income and loan amount to check eligibility.
                  </p>
                )}
              </CardContent>
            </Card>

            {/* Loan Benefits */}
            <Card className="border border-gray-200">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base font-medium">
                  <Info className="h-4 w-4 text-blue-500" />
                  Why Choose Our Loans?
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="space-y-2 text-sm">
                  <div className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 text-emerald-500 mt-0.5 flex-shrink-0" />
                    <span>Competitive interest rates starting at {Math.min(formData.interestRate, 15)}% APR</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 text-emerald-500 mt-0.5 flex-shrink-0" />
                    <span>Quick approval process within 48 hours</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 text-emerald-500 mt-0.5 flex-shrink-0" />
                    <span>Flexible repayment terms up to 5 years</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 text-emerald-500 mt-0.5 flex-shrink-0" />
                    <span>No hidden fees or prepayment penalties</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Required Documents */}
            <Card className="border border-gray-200">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base font-medium">
                  <FileText className="h-4 w-4 text-amber-500" />
                  Required Documents
                </CardTitle>
                <CardDescription>Documents needed for loan processing</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-emerald-500" />
                    <span>Valid government ID</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-emerald-500" />
                    <span>Proof of income (bank statements)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-emerald-500" />
                    <span>Farm registration documents</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-emerald-500" />
                    <span>Business plan (for large amounts)</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
