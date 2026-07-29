// Receipt generation utility for GroChain orders
// Opens a print-ready HTML receipt in a new window

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

function normalizeReceiptData(data: ReceiptData): Required<Pick<ReceiptData, 'shippingAddress'>> & ReceiptData {
  const addr = data.shippingAddress || {}
  return {
    ...data,
    shippingAddress: {
      street: addr.street || 'Not provided',
      city: addr.city || '',
      state: addr.state || '',
      country: addr.country || 'Nigeria',
      phone: addr.phone || data.buyer?.phone || 'Not provided',
    },
  }
}

export class ReceiptGenerator {
  static async generatePDF(receiptData: ReceiptData): Promise<void> {
    const data = normalizeReceiptData(receiptData)

    const printWindow = window.open('', '_blank')
    if (!printWindow) {
      throw new Error('Unable to open print window. Please allow popups.')
    }

    const htmlContent = this.generateReceiptHTML(data)

    printWindow.document.open()
    printWindow.document.write(htmlContent)
    printWindow.document.close()

    return new Promise((resolve, reject) => {
      const timeout = window.setTimeout(() => {
        try {
          printWindow.focus()
          printWindow.print()
          window.setTimeout(() => {
            printWindow.close()
            resolve()
          }, 300)
        } catch (err) {
          reject(err)
        }
      }, 400)

      printWindow.onerror = () => {
        window.clearTimeout(timeout)
        reject(new Error('Failed to render receipt'))
      }
    })
  }

  static generateReceiptHTML(data: ReceiptData): string {
    const normalized = normalizeReceiptData(data)

    const formatPrice = (price: number) => {
      return new Intl.NumberFormat('en-NG', {
        style: 'currency',
        currency: 'NGN',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      }).format(price ?? 0)
    }

    const paymentBadgeClass =
      normalized.paymentStatus === 'paid' ? 'status-paid' : 'status-pending'

    const addr = normalized.shippingAddress!

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Receipt - ${normalized.orderNumber}</title>
        <style>
          body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            margin: 0;
            padding: 20px;
            background: white;
            color: #333;
            line-height: 1.6;
          }
          .receipt-container {
            max-width: 800px;
            margin: 0 auto;
            border: 2px solid #2d5a27;
            border-radius: 8px;
            overflow: hidden;
          }
          .header {
            background: linear-gradient(135deg, #2d5a27, #4a7c59);
            color: white;
            padding: 30px;
            text-align: center;
          }
          .header h1 { margin: 0; font-size: 28px; font-weight: bold; }
          .header p { margin: 10px 0 0 0; font-size: 16px; opacity: 0.9; }
          .content { padding: 30px; }
          .order-info {
            background: #f8f9fa;
            padding: 20px;
            border-radius: 8px;
            margin-bottom: 30px;
          }
          .order-info h2 { color: #2d5a27; margin-top: 0; font-size: 20px; }
          .info-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 20px;
          }
          .info-label { font-weight: bold; color: #666; font-size: 12px; text-transform: uppercase; }
          .info-value { font-size: 16px; margin-top: 5px; }
          .items-section { margin-bottom: 30px; }
          .items-section h2 { color: #2d5a27; font-size: 20px; margin-bottom: 20px; }
          .item {
            border: 1px solid #e0e0e0;
            border-radius: 8px;
            padding: 15px;
            margin-bottom: 15px;
          }
          .item-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 10px;
          }
          .item-name { font-weight: bold; font-size: 16px; }
          .item-price { font-weight: bold; color: #2d5a27; }
          .item-details {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 15px;
            font-size: 14px;
            color: #666;
          }
          .farmer-info {
            background: #f0f8f0;
            padding: 10px;
            border-radius: 6px;
            margin-top: 10px;
          }
          .farmer-info h4 { margin: 0 0 5px 0; color: #2d5a27; font-size: 14px; }
          .summary-section {
            background: #f8f9fa;
            padding: 20px;
            border-radius: 8px;
            margin-bottom: 30px;
          }
          .summary-section h2 { color: #2d5a27; font-size: 20px; margin-bottom: 20px; }
          .summary-row {
            display: flex;
            justify-content: space-between;
            padding: 8px 0;
            border-bottom: 1px solid #e0e0e0;
          }
          .summary-row:last-child {
            border-bottom: none;
            font-weight: bold;
            font-size: 18px;
            color: #2d5a27;
            padding-top: 15px;
            border-top: 2px solid #2d5a27;
          }
          .status-badge {
            display: inline-block;
            padding: 6px 12px;
            border-radius: 20px;
            font-size: 12px;
            font-weight: bold;
            text-transform: uppercase;
          }
          .status-paid { background: #d4edda; color: #155724; }
          .status-pending { background: #fff3cd; color: #856404; }
          .footer {
            background: #2d5a27;
            color: white;
            padding: 20px;
            text-align: center;
            font-size: 14px;
          }
          .footer p { margin: 5px 0; }
          @media print {
            body { margin: 0; padding: 0; }
            .receipt-container { border: none; }
          }
        </style>
      </head>
      <body>
        <div class="receipt-container">
          <div class="header">
            <h1>GroChain</h1>
            <p>Agricultural Supply Chain Platform</p>
            <p>Order Receipt</p>
          </div>
          
          <div class="content">
            <div class="order-info">
              <h2>Order Information</h2>
              <div class="info-grid">
                <div>
                  <div class="info-item">
                    <div class="info-label">Order Number</div>
                    <div class="info-value">${normalized.orderNumber}</div>
                  </div>
                  <div class="info-item">
                    <div class="info-label">Order Date</div>
                    <div class="info-value">${normalized.orderDate}</div>
                  </div>
                  <div class="info-item">
                    <div class="info-label">Order Status</div>
                    <div class="info-value">${normalized.status}</div>
                  </div>
                </div>
                <div>
                  <div class="info-item">
                    <div class="info-label">Payment Status</div>
                    <div class="info-value">
                      <span class="status-badge ${paymentBadgeClass}">${normalized.paymentStatus}</span>
                    </div>
                  </div>
                  <div class="info-item">
                    <div class="info-label">Total Amount</div>
                    <div class="info-value" style="font-weight: bold; font-size: 18px; color: #2d5a27;">${formatPrice(normalized.total)}</div>
                  </div>
                  ${normalized.paymentReference ? `
                  <div class="info-item">
                    <div class="info-label">Payment Reference</div>
                    <div class="info-value" style="font-family: monospace; font-size: 13px;">${normalized.paymentReference}</div>
                  </div>
                  ` : ''}
                  ${normalized.paidAt ? `
                  <div class="info-item">
                    <div class="info-label">Paid At</div>
                    <div class="info-value">${normalized.paidAt}</div>
                  </div>
                  ` : ''}
                </div>
              </div>
            </div>

            <div class="order-info">
              <h2>Buyer Information</h2>
              <div class="info-grid">
                <div>
                  <div class="info-label">Name</div>
                  <div class="info-value">${normalized.buyer.name}</div>
                </div>
                <div>
                  <div class="info-label">Email</div>
                  <div class="info-value">${normalized.buyer.email}</div>
                </div>
                <div>
                  <div class="info-label">Phone</div>
                  <div class="info-value">${normalized.buyer.phone}</div>
                </div>
              </div>
            </div>

            <div class="items-section">
              <h2>Order Items</h2>
              ${normalized.items.map(item => `
                <div class="item">
                  <div class="item-header">
                    <div class="item-name">${item.cropName}</div>
                    <div class="item-price">${formatPrice(item.total)}</div>
                  </div>
                  <div class="item-details">
                    <div>
                      <strong>Quantity:</strong> ${item.quantity} ${item.unit}<br>
                      <strong>Unit Price:</strong> ${formatPrice(item.price)}
                    </div>
                    <div class="farmer-info">
                      <h4>Farmer</h4>
                      <strong>${item.farmer.name}</strong><br>
                      ${item.farmer.farmName}<br>
                      ${item.farmer.phone}
                    </div>
                  </div>
                </div>
              `).join('')}
            </div>

            <div class="summary-section">
              <h2>Order Summary</h2>
              <div class="summary-row">
                <span>Subtotal</span>
                <span>${formatPrice(normalized.subtotal)}</span>
              </div>
              <div class="summary-row">
                <span>Shipping</span>
                <span>${normalized.shipping > 0 ? formatPrice(normalized.shipping) : 'FREE'}</span>
              </div>
              <div class="summary-row">
                <span>Tax (VAT)</span>
                <span>${formatPrice(normalized.tax)}</span>
              </div>
              <div class="summary-row">
                <span>Total</span>
                <span>${formatPrice(normalized.total)}</span>
              </div>
            </div>

            <div class="order-info">
              <h2>Delivery Information</h2>
              <div class="info-grid">
                <div>
                  <div class="info-label">Address</div>
                  <div class="info-value">
                    ${addr.street}<br>
                    ${[addr.city, addr.state].filter(Boolean).join(', ')}<br>
                    ${addr.country}
                  </div>
                </div>
                <div>
                  <div class="info-label">Contact Phone</div>
                  <div class="info-value">${addr.phone}</div>
                  ${normalized.deliveryInstructions ? `
                    <div class="info-item" style="margin-top: 12px;">
                      <div class="info-label">Instructions</div>
                      <div class="info-value">${normalized.deliveryInstructions}</div>
                    </div>
                  ` : ''}
                </div>
              </div>
            </div>
          </div>

          <div class="footer">
            <p><strong>Thank you for choosing GroChain</strong></p>
            <p>For support: support@grochain.com</p>
            <p>Generated ${new Date().toLocaleString('en-NG')}</p>
          </div>
        </div>
      </body>
      </html>
    `
  }
}
