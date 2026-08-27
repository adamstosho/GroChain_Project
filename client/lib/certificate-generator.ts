import jsPDF from "jspdf"
import html2canvas from "html2canvas"
import QRCode from "qrcode"
import {
  docBrand,
  escapeHtml,
  getLogoIconDataUrl,
  hexToRgb,
} from "@/lib/brand/document-brand"

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
    coordinates?: { lat: number; lng: number }
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
    if (!dateString || dateString.trim() === "") return "Date not available"
    const date = new Date(dateString)
    if (isNaN(date.getTime())) return "Invalid date"
    return new Intl.DateTimeFormat("en-NG", {
      year: "numeric",
      month: "long",
      day: "numeric",
    }).format(date)
  }

  private formatPrice(price: number): string {
    return new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency: "NGN",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price)
  }

  private truncate(text: string, max: number): string {
    const s = text || ""
    return s.length <= max ? s : `${s.slice(0, max - 1)}…`
  }

  async generateCertificate(data: VerificationData): Promise<void> {
    const doc = new jsPDF("p", "mm", "a4")
    const pageWidth = doc.internal.pageSize.getWidth()
    const pageHeight = doc.internal.pageSize.getHeight()
    const margin = 16
    const contentWidth = pageWidth - margin * 2
    const [forestR, forestG, forestB] = hexToRgb(docBrand.forest)
    const [deepR, deepG, deepB] = hexToRgb(docBrand.deep)
    const [inkR, inkG, inkB] = hexToRgb(docBrand.ink)
    const [softR, softG, softB] = hexToRgb(docBrand.softGreen)

    const logoData = await getLogoIconDataUrl()
    let qrData: string | null = null
    try {
      qrData = await QRCode.toDataURL(data.verificationUrl || `https://grochain.com/verify/${data.batchId}`, {
        width: 256,
        margin: 1,
        color: { dark: docBrand.deep, light: "#FFFFFF" },
      })
    } catch {
      qrData = null
    }

    // Header bar
    doc.setFillColor(deepR, deepG, deepB)
    doc.rect(0, 0, pageWidth, 36, "F")
    doc.setFillColor(forestR, forestG, forestB)
    doc.rect(0, 36, pageWidth, 2, "F")

    if (logoData) {
      try {
        doc.addImage(logoData, "PNG", margin, 6, 24, 24)
      } catch {
        /* text fallback below */
      }
    }

    doc.setTextColor(255, 255, 255)
    doc.setFont("helvetica", "bold")
    doc.setFontSize(20)
    doc.text("GroChain", logoData ? margin + 28 : margin, 18)
    doc.setFont("helvetica", "normal")
    doc.setFontSize(9)
    doc.text(docBrand.tagline, logoData ? margin + 28 : margin, 26)

    // Title
    doc.setTextColor(inkR, inkG, inkB)
    doc.setFont("helvetica", "bold")
    doc.setFontSize(16)
    doc.text("PRODUCT VERIFICATION CERTIFICATE", pageWidth / 2, 50, { align: "center" })

    doc.setDrawColor(forestR, forestG, forestB)
    doc.setLineWidth(1.2)
    doc.line(margin + 20, 54, pageWidth - margin - 20, 54)

    doc.setFont("helvetica", "normal")
    doc.setFontSize(9)
    doc.setTextColor(inkR, inkG, inkB)
    doc.text(`Certificate ID: ${this.truncate(data.batchId, 36)}`, margin, 62)
    doc.text(`Issued: ${this.formatDate(data.timestamp)}`, pageWidth - margin, 62, { align: "right" })

    let y = 72

    const drawSection = (title: string, lines: string[], height: number) => {
      if (y + height > pageHeight - 48) {
        doc.addPage()
        y = margin
      }
      doc.setFillColor(softR, softG, softB)
      doc.roundedRect(margin, y, contentWidth, height, 2, 2, "F")
      doc.setTextColor(forestR, forestG, forestB)
      doc.setFont("helvetica", "bold")
      doc.setFontSize(11)
      doc.text(title, margin + 5, y + 8)
      doc.setTextColor(inkR, inkG, inkB)
      doc.setFont("helvetica", "normal")
      doc.setFontSize(10)
      let ly = y + 16
      for (const line of lines) {
        const wrapped = doc.splitTextToSize(line, contentWidth - 10)
        doc.text(wrapped, margin + 5, ly)
        ly += wrapped.length * 5 + 1
      }
      y += height + 6
    }

    const productLines = [
      `Crop Type: ${data.cropType}`,
      `Variety: ${data.variety || "Not specified"}`,
      `Quantity: ${data.quantity} ${data.unit}`,
      `Quality Grade: ${data.quality}`,
      `Harvest Date: ${this.formatDate(data.harvestDate)}`,
      `Location: ${data.location.city}, ${data.location.state}${data.location.country ? `, ${data.location.country}` : ""}`,
    ]
    if (data.price) productLines.push(`Price: ${this.formatPrice(data.price)}`)
    if (data.organic) productLines.push("Organic Certified: Yes")
    drawSection("PRODUCT INFORMATION", productLines, 48)

    const farmerLines = [
      `Name: ${data.farmer.name}`,
      `Farm: ${data.farmer.farmName || "Not specified"}`,
    ]
    if (data.farmer.phone) farmerLines.push(`Phone: ${data.farmer.phone}`)
    if (data.farmer.email) farmerLines.push(`Email: ${data.farmer.email}`)
    drawSection("FARMER INFORMATION", farmerLines, 36)

    const verifyLines = [
      `Status: ${(data.status || "unknown").toUpperCase()}`,
      `Verification URL:`,
      data.verificationUrl || "—",
    ]
    drawSection("VERIFICATION DETAILS", verifyLines, 34)

    const statement =
      "This certificate verifies that the above product has been authenticated through GroChain's supply chain verification system. Product information, farmer details, and harvest data have been verified and recorded."
    const statementLines = doc.splitTextToSize(statement, contentWidth)
    if (y + statementLines.length * 5 + 40 > pageHeight - 20) {
      doc.addPage()
      y = margin
    }
    doc.setFontSize(10)
    doc.setTextColor(inkR, inkG, inkB)
    doc.text(statementLines, margin, y)
    y += statementLines.length * 5 + 10

    // QR + signature footer
    const footerTop = Math.max(y, pageHeight - 52)
    if (qrData) {
      try {
        doc.addImage(qrData, "PNG", margin, footerTop, 28, 28)
        doc.setFontSize(7)
        doc.setTextColor(100, 100, 100)
        doc.text("Scan to verify", margin + 14, footerTop + 32, { align: "center" })
      } catch {
        /* ignore */
      }
    }

    doc.setDrawColor(inkR, inkG, inkB)
    doc.setLineWidth(0.4)
    doc.line(pageWidth - margin - 55, footerTop + 18, pageWidth - margin, footerTop + 18)
    doc.setFontSize(8)
    doc.setTextColor(inkR, inkG, inkB)
    doc.text("GroChain Verification System", pageWidth - margin - 27.5, footerTop + 24, { align: "center" })
    doc.text("Digital Signature", pageWidth - margin - 27.5, footerTop + 29, { align: "center" })

    doc.setFillColor(forestR, forestG, forestB)
    doc.rect(0, pageHeight - 6, pageWidth, 6, "F")

    const safeId = (data.batchId || "certificate").replace(/[^\w.-]+/g, "_").slice(0, 48)
    doc.save(`GroChain-Certificate-${safeId}.pdf`)
  }

  async generateCertificateFromHTML(data: VerificationData): Promise<void> {
    const certificateDiv = document.createElement("div")
    certificateDiv.style.width = "210mm"
    certificateDiv.style.minHeight = "297mm"
    certificateDiv.style.padding = "0"
    certificateDiv.style.backgroundColor = "#ffffff"
    certificateDiv.style.fontFamily = "Arial, Helvetica, sans-serif"
    certificateDiv.style.position = "absolute"
    certificateDiv.style.top = "-9999px"
    certificateDiv.style.left = "-9999px"
    certificateDiv.style.overflow = "hidden"
    certificateDiv.innerHTML = await this.generateCertificateHTML(data)
    document.body.appendChild(certificateDiv)

    try {
      const canvas = await html2canvas(certificateDiv, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: "#ffffff",
        logging: false,
      })

      const imgData = canvas.toDataURL("image/png")
      const pdf = new jsPDF("p", "mm", "a4")
      const imgWidth = 210
      const pageHeight = 297
      const imgHeight = (canvas.height * imgWidth) / canvas.width
      let heightLeft = imgHeight
      let position = 0

      pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight)
      heightLeft -= pageHeight

      while (heightLeft > 2) {
        position = heightLeft - imgHeight
        pdf.addPage()
        pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight)
        heightLeft -= pageHeight
      }

      const safeId = (data.batchId || "certificate").replace(/[^\w.-]+/g, "_").slice(0, 48)
      pdf.save(`GroChain-Certificate-${safeId}.pdf`)
    } finally {
      document.body.removeChild(certificateDiv)
    }
  }

  private async generateCertificateHTML(data: VerificationData): Promise<string> {
    let qrImg = ""
    try {
      const qr = await QRCode.toDataURL(data.verificationUrl || `https://grochain.com/verify/${data.batchId}`, {
        width: 160,
        margin: 1,
        color: { dark: docBrand.deep, light: "#FFFFFF" },
      })
      qrImg = `<img src="${qr}" alt="QR" width="96" height="96" style="display:block;margin:0 auto;" />`
    } catch {
      qrImg = ""
    }

    const e = escapeHtml
    return `
      <div style="box-sizing:border-box;width:210mm;min-height:297mm;overflow:hidden;color:${docBrand.ink};">
        <div style="background:${docBrand.deep};color:#fff;padding:18px 24px;display:flex;align-items:center;gap:14px;">
          <img src="${docBrand.logoIconPath}" alt="GroChain" width="56" height="56" style="object-fit:contain;" crossorigin="anonymous" />
          <div>
            <div style="font-size:26px;font-weight:700;line-height:1.1;">GroChain</div>
            <div style="font-size:11px;opacity:0.9;margin-top:4px;">${e(docBrand.tagline)}</div>
          </div>
        </div>
        <div style="height:4px;background:${docBrand.forest};"></div>

        <div style="padding:24px 28px 32px;">
          <h2 style="text-align:center;color:${docBrand.ink};font-size:20px;margin:8px 0 10px;">PRODUCT VERIFICATION CERTIFICATE</h2>
          <hr style="border:none;border-top:2px solid ${docBrand.forest};width:70%;margin:0 auto 18px;" />

          <div style="display:flex;justify-content:space-between;font-size:11px;margin-bottom:18px;gap:12px;">
            <span style="max-width:55%;word-break:break-word;"><strong>Certificate ID:</strong> ${e(data.batchId)}</span>
            <span style="text-align:right;"><strong>Issued:</strong> ${e(this.formatDate(data.timestamp))}</span>
          </div>

          <div style="background:${docBrand.softGreen};padding:16px;margin:0 0 14px;border-radius:8px;overflow:hidden;">
            <h3 style="color:${docBrand.forest};font-size:14px;margin:0 0 10px;">PRODUCT INFORMATION</h3>
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px 20px;font-size:12px;">
              <div><strong>Crop Type:</strong> ${e(data.cropType)}</div>
              <div><strong>Harvest Date:</strong> ${e(this.formatDate(data.harvestDate))}</div>
              <div><strong>Variety:</strong> ${e(data.variety || "Not specified")}</div>
              <div><strong>Location:</strong> ${e(`${data.location.city}, ${data.location.state}`)}</div>
              <div><strong>Quantity:</strong> ${e(`${data.quantity} ${data.unit}`)}</div>
              <div><strong>Quality:</strong> ${e(data.quality)}</div>
              ${data.price ? `<div><strong>Price:</strong> ${e(this.formatPrice(data.price))}</div>` : ""}
              ${data.organic ? `<div><strong>Organic:</strong> Yes</div>` : ""}
            </div>
          </div>

          <div style="background:${docBrand.softGreen};padding:16px;margin:0 0 14px;border-radius:8px;">
            <h3 style="color:${docBrand.forest};font-size:14px;margin:0 0 10px;">FARMER INFORMATION</h3>
            <div style="font-size:12px;line-height:1.6;">
              <div><strong>Name:</strong> ${e(data.farmer.name)}</div>
              <div><strong>Farm:</strong> ${e(data.farmer.farmName || "Not specified")}</div>
              ${data.farmer.phone ? `<div><strong>Phone:</strong> ${e(data.farmer.phone)}</div>` : ""}
              ${data.farmer.email ? `<div><strong>Email:</strong> ${e(data.farmer.email)}</div>` : ""}
            </div>
          </div>

          <div style="background:${docBrand.softGreen};padding:16px;margin:0 0 14px;border-radius:8px;">
            <h3 style="color:${docBrand.forest};font-size:14px;margin:0 0 10px;">VERIFICATION DETAILS</h3>
            <div style="font-size:12px;line-height:1.6;">
              <div><strong>Status:</strong> ${e((data.status || "").toUpperCase())}</div>
              <div style="word-break:break-all;"><strong>URL:</strong> ${e(data.verificationUrl)}</div>
            </div>
          </div>

          <p style="font-size:12px;line-height:1.55;margin:16px 0 24px;color:${docBrand.ink};">
            This certificate verifies that the above product has been authenticated through GroChain's
            supply chain verification system. Product information, farmer details, and harvest data
            have been verified and recorded.
          </p>

          <div style="display:flex;justify-content:space-between;align-items:flex-end;gap:24px;margin-top:20px;">
            <div style="text-align:center;width:110px;">
              ${qrImg}
              <div style="font-size:10px;color:${docBrand.muted};margin-top:4px;">Scan to verify</div>
            </div>
            <div style="text-align:center;min-width:180px;">
              <hr style="width:160px;margin:0 auto 8px;border:none;border-top:1px solid ${docBrand.ink};" />
              <div style="font-size:11px;color:${docBrand.muted};">GroChain Verification System</div>
              <div style="font-size:11px;color:${docBrand.muted};">Digital Signature</div>
            </div>
          </div>
        </div>
        <div style="height:8px;background:${docBrand.forest};"></div>
      </div>
    `
  }
}

export const certificateGenerator = new CertificateGenerator()
