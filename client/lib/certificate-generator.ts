import jsPDF from 'jspdf'
import html2canvas from 'html2canvas'

interface VerificationData {
  batchId: string
  cropType: string
  variety?: string
  quantity: number
  unit: string
  quality: string
  location: {
    city: string
    state: string
    country: string
    coordinates?: {
      lat: number
      lng: number
    }
  }
  farmer: {
    id: string
    name: string
    farmName?: string
    phone?: string
    email?: string
  }
  harvestDate: string
  images?: string[]
  organic?: boolean
  price?: number
  status: string
  verificationUrl: string
  timestamp: string
}

export class CertificateGenerator {
  private formatDate(dateString: string): string {
    if (!dateString || dateString.trim() === '') {
      return 'Date not available'
    }
    
    const date = new Date(dateString)
    
    if (isNaN(date.getTime())) {
      return 'Invalid date'
    }
    
    return new Intl.DateTimeFormat('en-NG', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    }).format(date)
  }

  private formatPrice(price: number): string {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price)
  }

  generateCertificate(data: VerificationData): void {
    const doc = new jsPDF('p', 'mm', 'a4')
    const pageWidth = doc.internal.pageSize.getWidth()
    const pageHeight = doc.internal.pageSize.getHeight()

    // Set up colors
    const primaryColor = '#059669' // Green
    const secondaryColor = '#374151' // Gray
    const accentColor = '#F59E0B' // Amber

    // Header with logo and title
    doc.setFillColor(primaryColor)
    doc.rect(0, 0, pageWidth, 30, 'F')
    
    // White text on green background
    doc.setTextColor(255, 255, 255)
    doc.setFontSize(24)
    doc.setFont('helvetica', 'bold')
    doc.text('GROCHAIN', 20, 20)
    
    doc.setFontSize(12)
    doc.setFont('helvetica', 'normal')
    doc.text('Agricultural Supply Chain Verification', 20, 25)

    // Certificate title
    doc.setTextColor(secondaryColor)
    doc.setFontSize(20)
    doc.setFont('helvetica', 'bold')
    doc.text('PRODUCT VERIFICATION CERTIFICATE', pageWidth / 2, 50, { align: 'center' })

    // Decorative line
    doc.setDrawColor(primaryColor)
    doc.setLineWidth(2)
    doc.line(50, 55, pageWidth - 50, 55)

    // Certificate number and date
    doc.setFontSize(10)
    doc.setFont('helvetica', 'normal')
    doc.text(`Certificate ID: ${data.batchId}`, 20, 70)
    doc.text(`Issued: ${this.formatDate(data.timestamp)}`, pageWidth - 70, 70, { align: 'right' })

    // Main content area
    let yPosition = 90

    // Product Information Section
    doc.setFillColor(240, 248, 255)
    doc.rect(15, yPosition - 5, pageWidth - 30, 60, 'F')
    
    doc.setTextColor(secondaryColor)
    doc.setFontSize(14)
    doc.setFont('helvetica', 'bold')
    doc.text('PRODUCT INFORMATION', 20, yPosition)

    yPosition += 15

    // Product details in two columns
    const leftColumn = 25
    const rightColumn = pageWidth / 2 + 10

    doc.setFontSize(11)
    doc.setFont('helvetica', 'normal')

    // Left column
    doc.text(`Crop Type: ${data.cropType}`, leftColumn, yPosition)
    doc.text(`Variety: ${data.variety || 'Not specified'}`, leftColumn, yPosition + 7)
    doc.text(`Quantity: ${data.quantity} ${data.unit}`, leftColumn, yPosition + 14)
    doc.text(`Quality Grade: ${data.quality}`, leftColumn, yPosition + 21)

    // Right column
    doc.text(`Harvest Date: ${this.formatDate(data.harvestDate)}`, rightColumn, yPosition)
    doc.text(`Location: ${data.location.city}, ${data.location.state}`, rightColumn, yPosition + 7)
    if (data.price) {
      doc.text(`Price: ${this.formatPrice(data.price)}`, rightColumn, yPosition + 14)
    }
    if (data.organic) {
      doc.text('Organic Certified: Yes', rightColumn, yPosition + 21)
    }

    yPosition += 50

    // Farmer Information Section
    doc.setFillColor(240, 248, 255)
    doc.rect(15, yPosition - 5, pageWidth - 30, 40, 'F')
    
    doc.setTextColor(secondaryColor)
    doc.setFontSize(14)
    doc.setFont('helvetica', 'bold')
    doc.text('FARMER INFORMATION', 20, yPosition)

    yPosition += 15

    doc.setFontSize(11)
    doc.setFont('helvetica', 'normal')
    doc.text(`Name: ${data.farmer.name}`, leftColumn, yPosition)
    doc.text(`Farm: ${data.farmer.farmName || 'Not specified'}`, leftColumn, yPosition + 7)
    if (data.farmer.phone) {
      doc.text(`Phone: ${data.farmer.phone}`, leftColumn, yPosition + 14)
    }
    if (data.farmer.email) {
      doc.text(`Email: ${data.farmer.email}`, leftColumn, yPosition + 21)
    }

    yPosition += 50

    // Verification Details Section
    doc.setFillColor(240, 248, 255)
    doc.rect(15, yPosition - 5, pageWidth - 30, 30, 'F')
    
    doc.setTextColor(secondaryColor)
    doc.setFontSize(14)
    doc.setFont('helvetica', 'bold')
    doc.text('VERIFICATION DETAILS', 20, yPosition)

    yPosition += 15

    doc.setFontSize(11)
    doc.setFont('helvetica', 'normal')
    doc.text(`Verification URL: ${data.verificationUrl}`, leftColumn, yPosition)
    doc.text(`Status: ${data.status.toUpperCase()}`, leftColumn, yPosition + 7)

    yPosition += 40

    // Verification statement
    doc.setTextColor(secondaryColor)
    doc.setFontSize(12)
    doc.setFont('helvetica', 'normal')
    const statementText = 'This certificate verifies that the above product has been authenticated through GroChain\'s blockchain-powered supply chain verification system. The product information, farmer details, and harvest data have been verified and recorded on our immutable ledger.'
    
    const splitText = doc.splitTextToSize(statementText, pageWidth - 40)
    doc.text(splitText, 20, yPosition)

    yPosition += splitText.length * 5 + 10

    // Footer with signature line
    doc.setDrawColor(secondaryColor)
    doc.setLineWidth(0.5)
    doc.line(pageWidth - 80, pageHeight - 40, pageWidth - 20, pageHeight - 40)
    
    doc.setFontSize(10)
    doc.text('GroChain Verification System', pageWidth - 70, pageHeight - 35, { align: 'center' })
    doc.text('Digital Signature', pageWidth - 70, pageHeight - 25, { align: 'center' })

    // QR Code area (placeholder for now)
    doc.setFillColor(240, 240, 240)
    doc.rect(pageWidth - 50, pageHeight - 50, 30, 30, 'F')
    doc.setTextColor(secondaryColor)
    doc.setFontSize(8)
    doc.text('QR Code', pageWidth - 35, pageHeight - 35, { align: 'center' })

    // Bottom border
    doc.setDrawColor(primaryColor)
    doc.setLineWidth(2)
    doc.line(0, pageHeight - 10, pageWidth, pageHeight - 10)

    // Save the PDF
    const fileName = `GroChain-Certificate-${data.batchId}.pdf`
    doc.save(fileName)
  }

  // Alternative method using HTML to PDF conversion
  async generateCertificateFromHTML(data: VerificationData): Promise<void> {
    // Create a temporary div with the certificate content
    const certificateDiv = document.createElement('div')
    certificateDiv.style.width = '210mm'
    certificateDiv.style.minHeight = '297mm'
    certificateDiv.style.padding = '20mm'
    certificateDiv.style.backgroundColor = '#ffffff'
    certificateDiv.style.fontFamily = 'Arial, sans-serif'
    certificateDiv.style.position = 'absolute'
    certificateDiv.style.top = '-9999px'
    certificateDiv.style.left = '-9999px'

    certificateDiv.innerHTML = this.generateCertificateHTML(data)
    document.body.appendChild(certificateDiv)

    try {
      const canvas = await html2canvas(certificateDiv, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff'
      })

      const imgData = canvas.toDataURL('image/png')
      const pdf = new jsPDF('p', 'mm', 'a4')
      
      const imgWidth = 210
      const pageHeight = 295
      const imgHeight = (canvas.height * imgWidth) / canvas.width
      let heightLeft = imgHeight

      let position = 0

      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight)
      heightLeft -= pageHeight

      while (heightLeft >= 0) {
        position = heightLeft - imgHeight
        pdf.addPage()
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight)
        heightLeft -= pageHeight
      }

      const fileName = `GroChain-Certificate-${data.batchId}.pdf`
      pdf.save(fileName)
    } finally {
      document.body.removeChild(certificateDiv)
    }
  }

  private generateCertificateHTML(data: VerificationData): string {
    return `
      <div style="text-align: center; margin-bottom: 30px;">
        <div style="background: #059669; color: white; padding: 20px; margin-bottom: 20px; border-radius: 8px;">
          <h1 style="margin: 0; font-size: 28px; font-weight: bold;">GROCHAIN</h1>
          <p style="margin: 5px 0 0 0; font-size: 14px;">Agricultural Supply Chain Verification</p>
        </div>
        
        <h2 style="color: #374151; font-size: 24px; margin: 20px 0;">PRODUCT VERIFICATION CERTIFICATE</h2>
        <hr style="border: 2px solid #059669; margin: 20px auto; width: 80%;">
        
        <div style="display: flex; justify-content: space-between; margin: 20px 0; font-size: 12px;">
          <span><strong>Certificate ID:</strong> ${data.batchId}</span>
          <span><strong>Issued:</strong> ${this.formatDate(data.timestamp)}</span>
        </div>
      </div>

      <div style="background: #f0f8ff; padding: 20px; margin: 20px 0; border-radius: 8px;">
        <h3 style="color: #374151; font-size: 18px; margin-bottom: 15px;">PRODUCT INFORMATION</h3>
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px;">
          <div>
            <p><strong>Crop Type:</strong> ${data.cropType}</p>
            <p><strong>Variety:</strong> ${data.variety || 'Not specified'}</p>
            <p><strong>Quantity:</strong> ${data.quantity} ${data.unit}</p>
            <p><strong>Quality Grade:</strong> ${data.quality}</p>
          </div>
          <div>
            <p><strong>Harvest Date:</strong> ${this.formatDate(data.harvestDate)}</p>
            <p><strong>Location:</strong> ${data.location.city}, ${data.location.state}</p>
            ${data.price ? `<p><strong>Price:</strong> ${this.formatPrice(data.price)}</p>` : ''}
            ${data.organic ? '<p><strong>Organic Certified:</strong> Yes</p>' : ''}
          </div>
        </div>
      </div>

      <div style="background: #f0f8ff; padding: 20px; margin: 20px 0; border-radius: 8px;">
        <h3 style="color: #374151; font-size: 18px; margin-bottom: 15px;">FARMER INFORMATION</h3>
        <div>
          <p><strong>Name:</strong> ${data.farmer.name}</p>
          <p><strong>Farm:</strong> ${data.farmer.farmName || 'Not specified'}</p>
          ${data.farmer.phone ? `<p><strong>Phone:</strong> ${data.farmer.phone}</p>` : ''}
          ${data.farmer.email ? `<p><strong>Email:</strong> ${data.farmer.email}</p>` : ''}
        </div>
      </div>

      <div style="background: #f0f8ff; padding: 20px; margin: 20px 0; border-radius: 8px;">
        <h3 style="color: #374151; font-size: 18px; margin-bottom: 15px;">VERIFICATION DETAILS</h3>
        <p><strong>Verification URL:</strong> ${data.verificationUrl}</p>
        <p><strong>Status:</strong> ${data.status.toUpperCase()}</p>
      </div>

      <div style="margin: 30px 0; padding: 20px; border: 1px solid #e5e7eb; border-radius: 8px;">
        <p style="color: #374151; line-height: 1.6; margin: 0;">
          This certificate verifies that the above product has been authenticated through GroChain's 
          blockchain-powered supply chain verification system. The product information, farmer details, 
          and harvest data have been verified and recorded on our immutable ledger.
        </p>
      </div>

      <div style="margin-top: 40px; text-align: center;">
        <div style="display: inline-block; text-align: center;">
          <hr style="width: 200px; margin: 0 auto 10px; border: 1px solid #374151;">
          <p style="margin: 0; font-size: 12px; color: #6b7280;">GroChain Verification System</p>
          <p style="margin: 5px 0 0 0; font-size: 12px; color: #6b7280;">Digital Signature</p>
        </div>
      </div>
    `
  }
}

export const certificateGenerator = new CertificateGenerator()

