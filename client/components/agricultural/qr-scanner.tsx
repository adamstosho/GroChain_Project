"use client"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { 
  QrCode, 
  Camera, 
  Scan, 
  CheckCircle, 
  AlertCircle, 
  Copy, 
  ExternalLink,
  History,
  Info,
  X
} from "lucide-react"
import { cn } from "@/lib/utils"

export interface QRScanResult {
  id: string
  timestamp: Date
  data: string
  isValid: boolean
  harvestData?: any
}

interface QRScannerProps {
  onScan?: (result: QRScanResult) => void
  onVerify?: (qrData: string) => Promise<any>
  className?: string
  showHistory?: boolean
}

export function QRScanner({ 
  onScan, 
  onVerify, 
  className,
  showHistory = true 
}: QRScannerProps) {
  const [isScanning, setIsScanning] = useState(false)
  const [scanResults, setScanResults] = useState<QRScanResult[]>([])
  const [currentResult, setCurrentResult] = useState<QRScanResult | null>(null)
  const [manualInput, setManualInput] = useState("")
  const [isVerifying, setIsVerifying] = useState(false)
  const [verificationResult, setVerificationResult] = useState<any>(null)
  const [showScanner, setShowScanner] = useState(false)
  const videoRef = useRef<HTMLVideoElement>(null)
  const streamRef = useRef<MediaStream | null>(null)

  // Mock scan history for demonstration
  useEffect(() => {
    const mockHistory: QRScanResult[] = [
      {
        id: "1",
        timestamp: new Date(Date.now() - 1000 * 60 * 30), // 30 minutes ago
        data: "GROCHAIN_HARVEST_001_2024_08_26",
        isValid: true,
        harvestData: {
          cropType: "Rice",
          variety: "Basmati",
          farmer: "John Doe",
          harvestDate: "2024-08-26",
          location: "Kano State"
        }
      },
      {
        id: "2",
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2), // 2 hours ago
        data: "GROCHAIN_HARVEST_002_2024_08_25",
        isValid: true,
        harvestData: {
          cropType: "Maize",
          variety: "Sweet Corn",
          farmer: "Jane Smith",
          harvestDate: "2024-08-25",
          location: "Kaduna State"
        }
      }
    ]
    setScanResults(mockHistory)
  }, [])

  const startScanning = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: "environment" } 
      })
      streamRef.current = stream
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        setIsScanning(true)
        setShowScanner(true)
      }
    } catch (error) {
      console.error("Error accessing camera:", error)
      // Fallback to manual input
      setShowScanner(true)
    }
  }

  const stopScanning = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop())
      streamRef.current = null
    }
    setIsScanning(false)
    setShowScanner(false)
  }

  const handleManualScan = async () => {
    if (!manualInput.trim()) return

    const result: QRScanResult = {
      id: Date.now().toString(),
      timestamp: new Date(),
      data: manualInput.trim(),
      isValid: true
    }

    setCurrentResult(result)
    setScanResults(prev => [result, ...prev])
    
    if (onScan) {
      onScan(result)
    }

    // Auto-verify if verification function is provided
    if (onVerify) {
      await handleVerification(manualInput.trim())
    }

    setManualInput("")
  }

  const handleVerification = async (qrData: string) => {
    if (!onVerify) return

    setIsVerifying(true)
    try {
      const result = await onVerify(qrData)
      setVerificationResult(result)
      
      // Update scan result with verification data
      setScanResults(prev => prev.map(item => 
        item.data === qrData 
          ? { ...item, harvestData: result, isValid: true }
          : item
      ))
    } catch (error) {
      console.error("Verification failed:", error)
      setVerificationResult({ error: "Verification failed" })
    } finally {
      setIsVerifying(false)
    }
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
  }

  const clearHistory = () => {
    setScanResults([])
  }

  return (
    <div className={cn("w-full max-w-2xl mx-auto", className)}>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <QrCode className="h-6 w-6 text-primary" />
            Harvest Verification Scanner
          </CardTitle>
          <CardDescription>
            Scan QR codes to verify harvest authenticity and traceability
          </CardDescription>
        </CardHeader>

        <CardContent>
          <Tabs defaultValue="scanner" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="scanner">Scanner</TabsTrigger>
              <TabsTrigger value="manual">Manual Input</TabsTrigger>
              {showHistory && <TabsTrigger value="history">History</TabsTrigger>}
            </TabsList>

            <TabsContent value="scanner" className="space-y-4">
              <div className="text-center space-y-4">
                {!isScanning ? (
                  <div className="space-y-4">
                    <div className="w-32 h-32 mx-auto bg-muted rounded-lg flex items-center justify-center">
                      <QrCode className="h-16 w-16 text-muted-foreground" />
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Click the button below to start scanning
                    </p>
                    <Button onClick={startScanning} size="lg" className="w-full">
                      <Camera className="h-5 w-5 mr-2" />
                      Start Camera Scanner
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="relative">
                      <video
                        ref={videoRef}
                        autoPlay
                        playsInline
                        className="w-full max-w-sm mx-auto rounded-lg border"
                      />
                      <div className="absolute inset-0 border-2 border-primary rounded-lg pointer-events-none">
                        <div className="absolute top-2 left-2 w-6 h-6 border-l-2 border-t-2 border-primary"></div>
                            <div className="absolute top-2 right-2 w-6 h-6 border-r-2 border-t-2 border-primary"></div>
                            <div className="absolute bottom-2 left-2 w-6 h-6 border-l-2 border-b-2 border-primary"></div>
                            <div className="absolute bottom-2 right-2 w-6 h-6 border-r-2 border-b-2 border-primary"></div>
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Position the QR code within the frame
                    </p>
                    <Button onClick={stopScanning} variant="outline" className="w-full">
                      Stop Scanning
                    </Button>
                  </div>
                )}
              </div>
            </TabsContent>

            <TabsContent value="manual" className="space-y-4">
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium">Enter QR Code Data</label>
                  <div className="flex gap-2 mt-2">
                    <Input
                      placeholder="Paste or type QR code data here..."
                      value={manualInput}
                      onChange={(e) => setManualInput(e.target.value)}
                      onKeyPress={(e) => e.key === "Enter" && handleManualScan()}
                    />
                    <Button 
                      onClick={handleManualScan}
                      disabled={!manualInput.trim() || isVerifying}
                    >
                      <Scan className="h-4 w-4 mr-2" />
                      Verify
                    </Button>
                  </div>
                </div>

                {isVerifying && (
                  <div className="text-center py-4">
                    <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent mx-auto mb-2"></div>
                    <p className="text-sm text-muted-foreground">Verifying harvest data...</p>
                  </div>
                )}

                {verificationResult && (
                  <div className="p-4 border rounded-lg bg-muted/30">
                    {verificationResult.error ? (
                      <div className="flex items-center gap-2 text-destructive">
                        <AlertCircle className="h-4 w-4" />
                        <span>Verification failed: {verificationResult.error}</span>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        <div className="flex items-center gap-2 text-success">
                          <CheckCircle className="h-4 w-4" />
                          <span className="font-medium">Verification Successful!</span>
                        </div>
                        <div className="grid grid-cols-2 gap-2 text-sm">
                          <div>
                            <span className="text-muted-foreground">Crop:</span>
                            <span className="ml-2 font-medium">{verificationResult.cropType}</span>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Farmer:</span>
                            <span className="ml-2 font-medium">{verificationResult.farmer}</span>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Date:</span>
                            <span className="ml-2 font-medium">{verificationResult.harvestDate}</span>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Location:</span>
                            <span className="ml-2 font-medium">{typeof verificationResult.location === 'string' ? verificationResult.location : `${verificationResult.location?.city || 'Unknown'}, ${verificationResult.location?.state || 'Unknown State'}`}</span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </TabsContent>

            {showHistory && (
              <TabsContent value="history" className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold">Scan History</h3>
                  <Button variant="outline" size="sm" onClick={clearHistory}>
                    Clear History
                  </Button>
                </div>

                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {scanResults.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <History className="h-12 w-12 mx-auto mb-2 opacity-50" />
                      <p>No scan history yet</p>
                    </div>
                  ) : (
                    scanResults.map((result) => (
                      <div
                        key={result.id}
                        className="p-3 border rounded-lg hover:bg-muted/30 transition-colors cursor-pointer"
                        onClick={() => setCurrentResult(result)}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Badge variant={result.isValid ? "default" : "destructive"}>
                              {result.isValid ? "Valid" : "Invalid"}
                            </Badge>
                            <span className="text-sm font-mono text-muted-foreground">
                              {result.data.substring(0, 20)}...
                            </span>
                          </div>
                          <span className="text-xs text-muted-foreground">
                            {result.timestamp.toLocaleTimeString()}
                          </span>
                        </div>
                        {result.harvestData && (
                          <div className="mt-2 text-xs text-muted-foreground">
                            {result.harvestData.cropType} • {result.harvestData.farmer}
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </TabsContent>
            )}
          </Tabs>
        </CardContent>
      </Card>

      {/* Result Details Dialog */}
      <Dialog open={!!currentResult} onOpenChange={() => setCurrentResult(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <QrCode className="h-5 w-5 text-primary" />
              Scan Result Details
            </DialogTitle>
            <DialogDescription>
              Detailed information about the scanned QR code
            </DialogDescription>
          </DialogHeader>

          {currentResult && (
            <div className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Status:</span>
                  <Badge variant={currentResult.isValid ? "default" : "destructive"}>
                    {currentResult.isValid ? "Valid" : "Invalid"}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Timestamp:</span>
                  <span className="text-sm text-muted-foreground">
                    {currentResult.timestamp.toLocaleString()}
                  </span>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">QR Data:</label>
                <div className="flex items-center gap-2 p-2 bg-muted rounded border">
                  <code className="text-xs flex-1 break-all">
                    {currentResult.data}
                  </code>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => copyToClipboard(currentResult.data)}
                  >
                    <Copy className="h-3 w-3" />
                  </Button>
                </div>
              </div>

              {currentResult.harvestData && (
                <div className="space-y-2">
                  <label className="text-sm font-medium">Harvest Information:</label>
                  <div className="p-3 bg-muted/30 rounded border space-y-2">
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div>
                        <span className="text-muted-foreground">Crop:</span>
                        <span className="ml-2 font-medium">
                          {currentResult.harvestData.cropType}
                        </span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Variety:</span>
                        <span className="ml-2 font-medium">
                          {currentResult.harvestData.variety}
                        </span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Farmer:</span>
                        <span className="ml-2 font-medium">
                          {currentResult.harvestData.farmer}
                        </span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Location:</span>
                        <span className="ml-2 font-medium">
                          {typeof currentResult.harvestData.location === 'string' ? currentResult.harvestData.location : `${currentResult.harvestData.location?.city || 'Unknown'}, ${currentResult.harvestData.location?.state || 'Unknown State'}`}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-4">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentResult(null)}
                >
                  Close
                </Button>
                {currentResult.harvestData && (
                  <Button size="sm">
                    <ExternalLink className="h-4 w-4 mr-2" />
                    View Full Details
                  </Button>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
