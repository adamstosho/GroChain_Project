"use client"

import type React from "react"

import { useState } from "react"
import { ArrowLeft, Banknote, FileText, Calculator } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { apiService } from "@/lib/api"
import Link from "next/link"
import { useRouter } from "next/navigation"

export default function LoanApplicationPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [currentStep, setCurrentStep] = useState(1)
  const [loanData, setLoanData] = useState({
    amount: "",
    purpose: "",
    term: "12",
    businessType: "",
    monthlyIncome: "",
    existingLoans: "",
    collateral: "",
    description: "",
    documents: [] as File[],
    agreeToTerms: false,
  })

  const handleInputChange = (field: string, value: string | boolean) => {
    setLoanData((prev) => ({ ...prev, [field]: value }))
  }

  const handleDocumentUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files)
      setLoanData((prev) => ({ ...prev, documents: [...prev.documents, ...files] }))
    }
  }

  const calculateMonthlyPayment = () => {
    const principal = Number.parseFloat(loanData.amount) || 0
    const rate = 0.15 / 12 // 15% annual rate
    const term = Number.parseInt(loanData.term) || 12

    if (principal > 0) {
      const monthlyPayment = (principal * rate * Math.pow(1 + rate, term)) / (Math.pow(1 + rate, term) - 1)
      return monthlyPayment
    }
    return 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      setLoading(true)

      const payload = {
        amount: Number(loanData.amount),
        purpose: loanData.purpose || 'other',
        term: Number(loanData.term),
        description: loanData.description || undefined,
      }

      const response: any = await apiService.createLoanApplication(payload)
      const created = response?.data || response
      const id = created?._id || created?.id
      router.push(`/finance/loans${id ? `/${id}` : ''}`)
    } catch (error) {
      console.error("Failed to submit loan application:", error)
    } finally {
      setLoading(false)
    }
  }

  const nextStep = () => setCurrentStep((prev) => Math.min(prev + 1, 3))
  const prevStep = () => setCurrentStep((prev) => Math.max(prev - 1, 1))

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-yellow-50">
      <div className="container mx-auto px-4 py-8">
        <Button variant="ghost" asChild className="mb-6">
          <Link href="/finance/loans" className="flex items-center gap-2">
            <ArrowLeft className="h-4 w-4" />
            Back to Loans
          </Link>
        </Button>

        <div className="max-w-4xl mx-auto">
          {/* Progress Steps */}
          <div className="mb-8">
            <div className="flex items-center justify-center space-x-8">
              {[1, 2, 3].map((step) => (
                <div key={step} className="flex items-center">
                  <div
                    className={`h-10 w-10 rounded-full flex items-center justify-center font-semibold ${
                      step <= currentStep ? "bg-green-600 text-white" : "bg-gray-200 text-gray-600"
                    }`}
                  >
                    {step}
                  </div>
                  <span className="ml-2 text-sm font-medium">
                    {step === 1 && "Loan Details"}
                    {step === 2 && "Financial Info"}
                    {step === 3 && "Documents & Review"}
                  </span>
                  {step < 3 && <div className="w-16 h-0.5 bg-gray-200 ml-4"></div>}
                </div>
              ))}
            </div>
          </div>

          <form onSubmit={handleSubmit}>
            {/* Step 1: Loan Details */}
            {currentStep === 1 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Banknote className="h-5 w-5" />
                    Loan Details
                  </CardTitle>
                  <p className="text-gray-600">Tell us about the loan you need</p>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <Label htmlFor="amount">Loan Amount (₦) *</Label>
                      <Input
                        id="amount"
                        type="number"
                        value={loanData.amount}
                        onChange={(e) => handleInputChange("amount", e.target.value)}
                        placeholder="e.g., 500000"
                        required
                      />
                    </div>

                    <div>
                      <Label htmlFor="term">Loan Term (months) *</Label>
                      <Select value={loanData.term} onValueChange={(value) => handleInputChange("term", value)}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="6">6 months</SelectItem>
                          <SelectItem value="12">12 months</SelectItem>
                          <SelectItem value="18">18 months</SelectItem>
                          <SelectItem value="24">24 months</SelectItem>
                          <SelectItem value="36">36 months</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="purpose">Loan Purpose *</Label>
                    <Select value={loanData.purpose} onValueChange={(value) => handleInputChange("purpose", value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select loan purpose" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="seeds">Seeds and Planting Materials</SelectItem>
                        <SelectItem value="fertilizer">Fertilizer and Chemicals</SelectItem>
                        <SelectItem value="equipment">Farm Equipment</SelectItem>
                        <SelectItem value="livestock">Livestock Purchase</SelectItem>
                        <SelectItem value="processing">Processing Equipment</SelectItem>
                        <SelectItem value="storage">Storage Facilities</SelectItem>
                        <SelectItem value="working-capital">Working Capital</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      value={loanData.description}
                      onChange={(e) => handleInputChange("description", e.target.value)}
                      placeholder="Provide more details about how you plan to use the loan"
                      rows={4}
                    />
                  </div>

                  {/* Loan Calculator */}
                  {loanData.amount && (
                    <Card className="bg-blue-50">
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-lg">
                          <Calculator className="h-5 w-5" />
                          Loan Calculator
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
                          <div>
                            <p className="text-sm text-gray-600">Monthly Payment</p>
                            <p className="text-2xl font-bold text-blue-600">
                              ₦{calculateMonthlyPayment().toLocaleString(undefined, { maximumFractionDigits: 0 })}
                            </p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-600">Interest Rate</p>
                            <p className="text-2xl font-bold text-green-600">15%</p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-600">Total Repayment</p>
                            <p className="text-2xl font-bold text-purple-600">
                              ₦
                              {(calculateMonthlyPayment() * Number.parseInt(loanData.term || "12")).toLocaleString(
                                undefined,
                                {
                                  maximumFractionDigits: 0,
                                },
                              )}
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Step 2: Financial Information */}
            {currentStep === 2 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    Financial Information
                  </CardTitle>
                  <p className="text-gray-600">Help us assess your creditworthiness</p>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <Label htmlFor="businessType">Business Type *</Label>
                      <Select
                        value={loanData.businessType}
                        onValueChange={(value) => handleInputChange("businessType", value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select business type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="crop-farming">Crop Farming</SelectItem>
                          <SelectItem value="livestock">Livestock</SelectItem>
                          <SelectItem value="mixed-farming">Mixed Farming</SelectItem>
                          <SelectItem value="agro-processing">Agro-processing</SelectItem>
                          <SelectItem value="trading">Agricultural Trading</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label htmlFor="monthlyIncome">Monthly Income (₦) *</Label>
                      <Input
                        id="monthlyIncome"
                        type="number"
                        value={loanData.monthlyIncome}
                        onChange={(e) => handleInputChange("monthlyIncome", e.target.value)}
                        placeholder="e.g., 200000"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="existingLoans">Existing Loans (₦)</Label>
                    <Input
                      id="existingLoans"
                      type="number"
                      value={loanData.existingLoans}
                      onChange={(e) => handleInputChange("existingLoans", e.target.value)}
                      placeholder="Total amount of existing loans"
                    />
                  </div>

                  <div>
                    <Label htmlFor="collateral">Collateral Description</Label>
                    <Textarea
                      id="collateral"
                      value={loanData.collateral}
                      onChange={(e) => handleInputChange("collateral", e.target.value)}
                      placeholder="Describe any assets you can offer as collateral (land, equipment, etc.)"
                      rows={3}
                    />
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Step 3: Documents & Review */}
            {currentStep === 3 && (
              <Card>
                <CardHeader>
                  <CardTitle>Documents & Review</CardTitle>
                  <p className="text-gray-600">Upload required documents and review your application</p>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div>
                    <Label htmlFor="documents">Required Documents</Label>
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                      <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-600 mb-4">
                        Upload: ID card, Bank statements, Farm registration, Income proof
                      </p>
                      <Input
                        type="file"
                        multiple
                        accept=".pdf,.jpg,.jpeg,.png"
                        onChange={handleDocumentUpload}
                        className="hidden"
                        id="document-upload"
                      />
                      <Label htmlFor="document-upload" className="cursor-pointer">
                        <Button type="button" variant="outline">
                          Choose Files
                        </Button>
                      </Label>
                      {loanData.documents.length > 0 && (
                        <p className="text-sm text-gray-500 mt-2">{loanData.documents.length} file(s) selected</p>
                      )}
                    </div>
                  </div>

                  {/* Application Summary */}
                  <Card className="bg-gray-50">
                    <CardHeader>
                      <CardTitle className="text-lg">Application Summary</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <p className="text-sm text-gray-600">Loan Amount</p>
                          <p className="font-semibold">₦{Number.parseFloat(loanData.amount || "0").toLocaleString()}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Purpose</p>
                          <p className="font-semibold">{loanData.purpose}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Term</p>
                          <p className="font-semibold">{loanData.term} months</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Monthly Payment</p>
                          <p className="font-semibold">
                            ₦{calculateMonthlyPayment().toLocaleString(undefined, { maximumFractionDigits: 0 })}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="terms"
                      checked={loanData.agreeToTerms}
                      onCheckedChange={(checked) => handleInputChange("agreeToTerms", checked as boolean)}
                    />
                    <Label htmlFor="terms" className="text-sm">
                      I agree to the{" "}
                      <Link href="/terms" className="text-blue-600 hover:underline">
                        Terms and Conditions
                      </Link>{" "}
                      and{" "}
                      <Link href="/privacy" className="text-blue-600 hover:underline">
                        Privacy Policy
                      </Link>
                    </Label>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Navigation Buttons */}
            <div className="flex justify-between mt-8">
              <Button
                type="button"
                variant="outline"
                onClick={prevStep}
                disabled={currentStep === 1}
                className="bg-transparent"
              >
                Previous
              </Button>

              {currentStep < 3 ? (
                <Button
                  type="button"
                  onClick={nextStep}
                  disabled={
                    (currentStep === 1 && (!loanData.amount || !loanData.purpose)) ||
                    (currentStep === 2 && (!loanData.businessType || !loanData.monthlyIncome))
                  }
                >
                  Next
                </Button>
              ) : (
                <Button type="submit" disabled={loading || !loanData.agreeToTerms}>
                  {loading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Submitting...
                    </>
                  ) : (
                    "Submit Application"
                  )}
                </Button>
              )}
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
