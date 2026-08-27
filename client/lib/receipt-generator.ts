// Branded GroChain order receipt — downloads a real PDF file

import jsPDF from "jspdf"
import html2canvas from "html2canvas"
import { brandColors } from "@/lib/brand/colors"
import { docBrand, escapeHtml } from "@/lib/brand/document-brand"

export interface ReceiptData {
  orderNumber: string
  orderDate: string
  buyer: {
    name: string
    email: string
    phone: string
  }
  items: Array<{
    cropName: string
    quantity: number
    unit: string
    price: number
    total: number
    farmer: {
      name: string
      farmName: string
      phone: string
      email: string
    }
  }>
  subtotal: number
  shipping: number
  tax: number
  total: number
  paymentStatus: string
  status: string
  paymentReference?: string
  paidAt?: string
  shippingAddress?: {
    street?: string
    city?: string
    state?: string
    country?: string
    phone?: string
  }
  deliveryInstructions?: string
}

function normalizeReceiptData(data: ReceiptData): Required<Pick<ReceiptData, "shippingAddress">> & ReceiptData {
  const addr = data.shippingAddress || {}
  return {
    ...data,
    shippingAddress: {
      street: addr.street || "Not provided",
      city: addr.city || "",
      state: addr.state || "",
      country: addr.country || "Nigeria",
      phone: addr.phone || data.buyer?.phone || "Not provided",
    },
  }
}

export class ReceiptGenerator {
  /** Download a real PDF file (html2canvas + jsPDF). */
  static async generatePDF(receiptData: ReceiptData): Promise<void> {
    const data = normalizeReceiptData(receiptData)
    const { getLogoFullDataUrl } = await import("@/lib/brand/document-brand")
    const logoDataUrl = (await getLogoFullDataUrl()) || docBrand.logoFullPath
    const htmlContent = this.generateReceiptHTML(data, logoDataUrl)

    const host = document.createElement("div")
    host.style.position = "fixed"
    host.style.left = "-10000px"
    host.style.top = "0"
    host.style.width = "800px"
    host.style.background = "#ffffff"
    host.style.zIndex = "-1"
    host.innerHTML = htmlContent
    document.body.appendChild(host)

    try {
      const imgs = Array.from(host.querySelectorAll("img"))
      await Promise.all(
        imgs.map(
          (img) =>
            new Promise<void>((resolve) => {
              if (img.complete) return resolve()
              img.onload = () => resolve()
              img.onerror = () => resolve()
              window.setTimeout(resolve, 1500)
            })
        )
      )

      const target = (host.querySelector(".receipt-container") as HTMLElement) || host
      const canvas = await html2canvas(target, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: "#ffffff",
        logging: false,
      })

      const imgData = canvas.toDataURL("image/png")
      const pdf = new jsPDF("p", "mm", "a4")
      const pageWidth = 210
      const pageHeight = 297
      const margin = 8
      const usableWidth = pageWidth - margin * 2
      const imgHeight = (canvas.height * usableWidth) / canvas.width
      let heightLeft = imgHeight
      let position = margin

      pdf.addImage(imgData, "PNG", margin, position, usableWidth, imgHeight)
      heightLeft -= pageHeight - margin * 2

      while (heightLeft > 2) {
        position = margin - (imgHeight - heightLeft)
        pdf.addPage()
        pdf.addImage(imgData, "PNG", margin, position, usableWidth, imgHeight)
        heightLeft -= pageHeight - margin * 2
      }

      const safeId = (data.orderNumber || "receipt").replace(/[^\w.-]+/g, "_").slice(0, 48)
      pdf.save(`GroChain-Receipt-${safeId}.pdf`)
    } finally {
      document.body.removeChild(host)
    }
  }

  static generateReceiptHTML(data: ReceiptData, logoSrc: string = docBrand.logoFullPath): string {
    const normalized = normalizeReceiptData(data)
    const e = escapeHtml

    const formatPrice = (price: number) =>
      new Intl.NumberFormat("en-NG", {
        style: "currency",
        currency: "NGN",
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      }).format(price ?? 0)

    const paymentBadgeClass =
      normalized.paymentStatus === "paid" ? "status-paid" : "status-pending"
    const addr = normalized.shippingAddress!

    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <title>Receipt - ${e(normalized.orderNumber)}</title>
  <style>
    * { box-sizing: border-box; }
    body {
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      margin: 0;
      padding: 16px;
      background: white;
      color: ${docBrand.ink};
      line-height: 1.5;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
    .receipt-container {
      max-width: 800px;
      margin: 0 auto;
      border: 2px solid ${brandColors.primary};
      border-radius: 8px;
      overflow: hidden;
    }
    .header {
      background: linear-gradient(135deg, ${docBrand.deep}, ${brandColors.primary});
      color: white;
      padding: 20px 24px;
      display: flex;
      align-items: center;
      gap: 16px;
    }
    .header img {
      height: 56px;
      width: auto;
      max-width: 200px;
      object-fit: contain;
      background: rgba(255,255,255,0.08);
      border-radius: 8px;
      padding: 4px;
    }
    .header-text h1 { margin: 0; font-size: 22px; font-weight: 700; }
    .header-text p { margin: 4px 0 0; font-size: 12px; opacity: 0.92; }
    .content { padding: 24px; overflow-wrap: anywhere; word-break: break-word; }
    .order-info {
      background: ${docBrand.soft};
      padding: 16px;
      border-radius: 8px;
      margin-bottom: 20px;
      page-break-inside: avoid;
    }
    .order-info h2 { color: ${brandColors.primary}; margin: 0 0 12px; font-size: 16px; }
    .info-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 12px 20px;
    }
    .info-label { font-weight: 700; color: ${docBrand.muted}; font-size: 11px; text-transform: uppercase; letter-spacing: 0.02em; }
    .info-value { font-size: 14px; margin-top: 2px; }
    .items-section { margin-bottom: 20px; }
    .items-section h2 { color: ${brandColors.primary}; font-size: 16px; margin: 0 0 12px; }
    .item {
      border: 1px solid ${docBrand.border};
      border-radius: 8px;
      padding: 12px;
      margin-bottom: 10px;
      page-break-inside: avoid;
    }
    .item-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      gap: 12px;
      margin-bottom: 8px;
    }
    .item-name { font-weight: 700; font-size: 15px; }
    .item-price { font-weight: 700; color: ${brandColors.primary}; white-space: nowrap; }
    .item-details {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 12px;
      font-size: 13px;
      color: ${docBrand.muted};
    }
    .farmer-info {
      background: ${docBrand.softGreen};
      padding: 8px 10px;
      border-radius: 6px;
    }
    .farmer-info h4 { margin: 0 0 4px; color: ${brandColors.primary}; font-size: 12px; }
    .summary-section {
      background: ${docBrand.soft};
      padding: 16px;
      border-radius: 8px;
      margin-bottom: 20px;
      page-break-inside: avoid;
    }
    .summary-section h2 { color: ${brandColors.primary}; font-size: 16px; margin: 0 0 12px; }
    .summary-row {
      display: flex;
      justify-content: space-between;
      gap: 12px;
      padding: 6px 0;
      border-bottom: 1px solid ${docBrand.border};
      font-size: 14px;
    }
    .summary-row:last-child {
      border-bottom: none;
      font-weight: 700;
      font-size: 17px;
      color: ${brandColors.primary};
      padding-top: 12px;
      border-top: 2px solid ${brandColors.primary};
    }
    .status-badge {
      display: inline-block;
      padding: 4px 10px;
      border-radius: 999px;
      font-size: 11px;
      font-weight: 700;
      text-transform: uppercase;
    }
    .status-paid { background: ${docBrand.softGreen}; color: ${brandColors.primary}; }
    .status-pending { background: #f8efd6; color: ${brandColors.warning}; }
    .footer {
      background: ${docBrand.deep};
      color: white;
      padding: 16px 20px;
      text-align: center;
      font-size: 12px;
    }
    .footer p { margin: 4px 0; }
    @media print {
      body { margin: 0; padding: 0; }
      .receipt-container { border: none; border-radius: 0; max-width: none; }
      .no-print { display: none !important; }
    }
    @media (max-width: 640px) {
      .info-grid, .item-details { grid-template-columns: 1fr; }
      .header { flex-direction: column; text-align: center; }
    }
  </style>
</head>
<body>
  <div class="receipt-container">
    <div class="header">
      <img src="${logoSrc}" alt="GroChain" />
      <div class="header-text">
        <h1>Order Receipt</h1>
        <p>${e(docBrand.tagline)}</p>
      </div>
    </div>

    <div class="content">
      <div class="order-info">
        <h2>Order Information</h2>
        <div class="info-grid">
          <div>
            <div class="info-label">Order Number</div>
            <div class="info-value">${e(normalized.orderNumber)}</div>
          </div>
          <div>
            <div class="info-label">Payment Status</div>
            <div class="info-value"><span class="status-badge ${paymentBadgeClass}">${e(normalized.paymentStatus)}</span></div>
          </div>
          <div>
            <div class="info-label">Order Date</div>
            <div class="info-value">${e(normalized.orderDate)}</div>
          </div>
          <div>
            <div class="info-label">Total Amount</div>
            <div class="info-value" style="font-weight:700;font-size:17px;color:${brandColors.primary};">${e(formatPrice(normalized.total))}</div>
          </div>
          <div>
            <div class="info-label">Order Status</div>
            <div class="info-value">${e(normalized.status)}</div>
          </div>
          ${
            normalized.paymentReference
              ? `<div><div class="info-label">Payment Reference</div><div class="info-value" style="font-family:monospace;font-size:12px;">${e(normalized.paymentReference)}</div></div>`
              : ""
          }
          ${
            normalized.paidAt
              ? `<div><div class="info-label">Paid At</div><div class="info-value">${e(normalized.paidAt)}</div></div>`
              : ""
          }
        </div>
      </div>

      <div class="order-info">
        <h2>Buyer Information</h2>
        <div class="info-grid">
          <div><div class="info-label">Name</div><div class="info-value">${e(normalized.buyer.name)}</div></div>
          <div><div class="info-label">Email</div><div class="info-value">${e(normalized.buyer.email)}</div></div>
          <div><div class="info-label">Phone</div><div class="info-value">${e(normalized.buyer.phone)}</div></div>
        </div>
      </div>

      <div class="items-section">
        <h2>Order Items</h2>
        ${(normalized.items || [])
          .map(
            (item) => `
          <div class="item">
            <div class="item-header">
              <div class="item-name">${e(item.cropName)}</div>
              <div class="item-price">${e(formatPrice(item.total))}</div>
            </div>
            <div class="item-details">
              <div>
                <strong>Quantity:</strong> ${e(String(item.quantity))} ${e(item.unit)}<br/>
                <strong>Unit Price:</strong> ${e(formatPrice(item.price))}
              </div>
              <div class="farmer-info">
                <h4>Farmer</h4>
                <strong>${e(item.farmer?.name)}</strong><br/>
                ${e(item.farmer?.farmName || "")}<br/>
                ${e(item.farmer?.phone || "")}
              </div>
            </div>
          </div>`
          )
          .join("")}
      </div>

      <div class="summary-section">
        <h2>Order Summary</h2>
        <div class="summary-row"><span>Subtotal</span><span>${e(formatPrice(normalized.subtotal))}</span></div>
        <div class="summary-row"><span>Shipping</span><span>${normalized.shipping > 0 ? e(formatPrice(normalized.shipping)) : "FREE"}</span></div>
        <div class="summary-row"><span>Tax (VAT)</span><span>${e(formatPrice(normalized.tax))}</span></div>
        <div class="summary-row"><span>Total</span><span>${e(formatPrice(normalized.total))}</span></div>
      </div>

      <div class="order-info">
        <h2>Delivery Information</h2>
        <div class="info-grid">
          <div>
            <div class="info-label">Address</div>
            <div class="info-value">
              ${e(addr.street)}<br/>
              ${e([addr.city, addr.state].filter(Boolean).join(", "))}<br/>
              ${e(addr.country)}
            </div>
          </div>
          <div>
            <div class="info-label">Contact Phone</div>
            <div class="info-value">${e(addr.phone)}</div>
            ${
              normalized.deliveryInstructions
                ? `<div style="margin-top:10px;"><div class="info-label">Instructions</div><div class="info-value">${e(normalized.deliveryInstructions)}</div></div>`
                : ""
            }
          </div>
        </div>
      </div>
    </div>

    <div class="footer">
      <p><strong>Thank you for choosing GroChain</strong></p>
      <p>${e(docBrand.tagline)}</p>
      <p>Support: ${e(docBrand.supportEmail)}</p>
      <p>Generated ${e(new Date().toLocaleString("en-NG"))}</p>
    </div>
  </div>
</body>
</html>`
  }
}
