"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { QrCode, Download, Copy, Check } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface QRGeneratorProps {
  onQRGenerated?: (qrData: string) => void
}

export default function QRGenerator({ onQRGenerated }: QRGeneratorProps) {
  const [qrData, setQrData] = useState("")
  const [qrImage, setQrImage] = useState("")
  const [loading, setLoading] = useState(false)
  const [copied, setCopied] = useState(false)
  const { toast } = useToast()

  // Sample QR codes for testing
  const sampleQRCodes = [
    {
      name: "Sample Maize Batch",
      data: "BATCH-MAIZE-2024-001",
      description: "Fresh maize from Lagos farm"
    },
    {
      name: "Sample Cassava Batch", 
      data: "BATCH-CASSAVA-2024-002",
      description: "Organic cassava from Ogun state"
    },
    {
      name: "Sample Rice Batch",
      data: "BATCH-RICE-2024-003", 
      description: "Premium rice from Kano"
    }
  ]

  const generateQR = async (data: string) => {
    if (!data.trim()) return

    setLoading(true)
    try {
      // In a real implementation, you'd use a QR code library
      // For now, we'll create a simple data URL
      const qrCodeData = {
        batchId: data,
        cropType: "Sample Crop",
        harvestDate: new Date().toISOString(),
        quantity: 100,
        unit: "kg",
        quality: "Premium",
        location: {
          city: "Lagos",
          state: "Lagos State",
          country: "Nigeria"
        },
        farmer: {
          id: "farmer-123",
          name: "Sample Farmer",
          farmName: "Green Acres Farm"
        },
        status: "verified",
        timestamp: new Date().toISOString()
      }

      // Create a simple QR code representation
      const qrString = JSON.stringify(qrCodeData)
      const qrImageData = `data:image/svg+xml;base64,${btoa(`
        <svg width="200" height="200" xmlns="http://www.w3.org/2000/svg">
          <rect width="200" height="200" fill="white"/>
          <text x="100" y="100" text-anchor="middle" font-family="monospace" font-size="12" fill="black">
            ${data}
          </text>
        </svg>
      `)}`
      
      setQrImage(qrImageData)
      setQrData(data)
      
      if (onQRGenerated) {
        onQRGenerated(data)
      }

      toast({
        title: "QR Code Generated",
        description: "QR code has been generated successfully",
      })
    } catch (error) {
      console.error('Error generating QR code:', error)
      toast({
        title: "Generation Failed",
        description: "Failed to generate QR code. Please try again.",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(qrData)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
      toast({
        title: "Copied to clipboard",
        description: "QR code data has been copied",
      })
    } catch (error) {
      console.error('Failed to copy:', error)
    }
  }

  const downloadQR = () => {
    if (!qrImage) return
    
    const link = document.createElement('a')
    link.href = qrImage
    link.download = `qr-code-${qrData}.svg`
    link.click()
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <QrCode className="h-5 w-5" />
          <span>QR Code Generator</span>
        </CardTitle>
        <CardDescription>
          Generate QR codes for testing the scanner functionality
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="qr-input">Batch ID or QR Data</Label>
          <Input
            id="qr-input"
            placeholder="Enter batch ID or QR data..."
            value={qrData}
            onChange={(e) => setQrData(e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <Label>Quick Samples</Label>
          <Select onValueChange={(value) => setQrData(value)}>
            <SelectTrigger>
              <SelectValue placeholder="Select a sample QR code" />
            </SelectTrigger>
            <SelectContent>
              {sampleQRCodes.map((sample, index) => (
                <SelectItem key={index} value={sample.data}>
                  {sample.name} - {sample.description}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex space-x-2">
          <Button 
            onClick={() => generateQR(qrData)} 
            disabled={!qrData.trim() || loading}
            className="flex-1"
          >
            {loading ? "Generating..." : "Generate QR Code"}
          </Button>
        </div>

        {qrImage && (
          <div className="space-y-4">
            <div className="text-center">
              <img 
                src={qrImage} 
                alt="Generated QR Code" 
                className="mx-auto border rounded-lg"
                style={{ maxWidth: '200px', maxHeight: '200px' }}
              />
            </div>
            
            <div className="flex space-x-2">
              <Button variant="outline" onClick={copyToClipboard} className="flex-1">
                {copied ? <Check className="h-4 w-4 mr-2" /> : <Copy className="h-4 w-4 mr-2" />}
                {copied ? "Copied!" : "Copy Data"}
              </Button>
              <Button variant="outline" onClick={downloadQR} className="flex-1">
                <Download className="h-4 w-4 mr-2" />
                Download
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
