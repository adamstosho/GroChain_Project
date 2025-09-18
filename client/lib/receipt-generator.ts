// Receipt generation utility for GroChain orders
// This generates a PDF receipt using browser APIs

interface ReceiptData {
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
  shippingAddress: {
    street: string
    city: string
    state: string
    country: string
    phone: string
  }
  deliveryInstructions: string
}

export class ReceiptGenerator {
  static async generatePDF(receiptData: ReceiptData): Promise<void> {
    try {
      // Create a new window for printing
      const printWindow = window.open('', '_blank')
      if (!printWindow) {
        throw new Error('Unable to open print window. Please allow popups.')
      }

      // Generate HTML content for the receipt
      const htmlContent = this.generateReceiptHTML(receiptData)
      
      printWindow.document.write(htmlContent)
      printWindow.document.close()
      
      // Wait for content to load, then trigger print
      printWindow.onload = () => {
        setTimeout(() => {
          printWindow.print()
          printWindow.close()
        }, 500)
      }
    } catch (error) {
      console.error('Error generating PDF:', error)
      throw error
    }
  }

  static generateReceiptHTML(data: ReceiptData): string {
    const formatPrice = (price: number) => {
      return new Intl.NumberFormat('en-NG', {
        style: 'currency',
        currency: 'NGN',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      }).format(price)
    }

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Receipt - ${data.orderNumber}</title>
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
          .header h1 {
            margin: 0;
            font-size: 28px;
            font-weight: bold;
          }
          .header p {
            margin: 10px 0 0 0;
            font-size: 16px;
            opacity: 0.9;
          }
          .content {
            padding: 30px;
          }
          .order-info {
            background: #f8f9fa;
            padding: 20px;
            border-radius: 8px;
            margin-bottom: 30px;
          }
          .order-info h2 {
            margin: 0 0 15px 0;
            color: #2d5a27;
            font-size: 20px;
          }
          .info-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 20px;
          }
          .info-item {
            margin-bottom: 10px;
          }
          .info-label {
            font-weight: bold;
            color: #555;
            font-size: 14px;
          }
          .info-value {
            color: #333;
            font-size: 16px;
          }
          .items-section {
            margin-bottom: 30px;
          }
          .items-section h2 {
            color: #2d5a27;
            font-size: 20px;
            margin-bottom: 20px;
          }
          .item {
            border: 1px solid #e0e0e0;
            border-radius: 8px;
            padding: 20px;
            margin-bottom: 15px;
            background: #fafafa;
          }
          .item-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 15px;
          }
          .item-name {
            font-size: 18px;
            font-weight: bold;
            color: #2d5a27;
          }
          .item-price {
            font-size: 18px;
            font-weight: bold;
            color: #2d5a27;
          }
          .item-details {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 15px;
            font-size: 14px;
          }
          .farmer-info {
            background: #e8f5e8;
            padding: 15px;
            border-radius: 6px;
            border-left: 4px solid #2d5a27;
          }
          .farmer-info h4 {
            margin: 0 0 10px 0;
            color: #2d5a27;
            font-size: 16px;
          }
          .summary-section {
            background: #f8f9fa;
            padding: 25px;
            border-radius: 8px;
            border: 2px solid #e0e0e0;
          }
          .summary-section h2 {
            color: #2d5a27;
            font-size: 20px;
            margin-bottom: 20px;
          }
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
          .status-paid {
            background: #d4edda;
            color: #155724;
          }
          .status-pending {
            background: #fff3cd;
            color: #856404;
          }
          .footer {
            background: #2d5a27;
            color: white;
            padding: 20px;
            text-align: center;
            font-size: 14px;
          }
          .footer p {
            margin: 5px 0;
          }
          @media print {
            body { margin: 0; padding: 0; }
            .receipt-container { border: none; }
          }
        </style>
      </head>
      <body>
        <div class="receipt-container">
          <div class="header">
            <h1>🌱 GroChain</h1>
            <p>Agricultural Supply Chain Platform</p>
            <p>Order Receipt</p>
          </div>
          
          <div class="content">
            <div class="order-info">
              <h2>Order Information</h2>
              <div class="info-grid">
                <div>
                  <div class="info-item">
                    <div class="info-label">Order Number:</div>
                    <div class="info-value">${data.orderNumber}</div>
                  </div>
                  <div class="info-item">
                    <div class="info-label">Order Date:</div>
                    <div class="info-value">${data.orderDate}</div>
                  </div>
                  <div class="info-item">
                    <div class="info-label">Status:</div>
                    <div class="info-value">
                      <span class="status-badge status-${data.status}">${data.status}</span>
                    </div>
                  </div>
                </div>
                <div>
                  <div class="info-item">
                    <div class="info-label">Payment Status:</div>
                    <div class="info-value">
                      <span class="status-badge status-${data.paymentStatus}">${data.paymentStatus}</span>
                    </div>
                  </div>
                  <div class="info-item">
                    <div class="info-label">Total Amount:</div>
                    <div class="info-value" style="font-weight: bold; font-size: 18px; color: #2d5a27;">${formatPrice(data.total)}</div>
                  </div>
                </div>
              </div>
            </div>

            <div class="items-section">
              <h2>Order Items</h2>
              ${data.items.map(item => `
                <div class="item">
                  <div class="item-header">
                    <div class="item-name">${item.cropName}</div>
                    <div class="item-price">${formatPrice(item.total)}</div>
                  </div>
                  <div class="item-details">
                    <div>
                      <strong>Quantity:</strong> ${item.quantity} ${item.unit}<br>
                      <strong>Unit Price:</strong> ${formatPrice(item.price)}<br>
                      <strong>Total:</strong> ${formatPrice(item.total)}
                    </div>
                    <div class="farmer-info">
                      <h4>Farmer Information</h4>
                      <strong>Name:</strong> ${item.farmer.name}<br>
                      <strong>Farm:</strong> ${item.farmer.farmName}<br>
                      <strong>Phone:</strong> ${item.farmer.phone}<br>
                      <strong>Email:</strong> ${item.farmer.email}
                    </div>
                  </div>
                </div>
              `).join('')}
            </div>

            <div class="summary-section">
              <h2>Order Summary</h2>
              <div class="summary-row">
                <span>Subtotal:</span>
                <span>${formatPrice(data.subtotal)}</span>
              </div>
              <div class="summary-row">
                <span>Shipping:</span>
                <span>${data.shipping > 0 ? formatPrice(data.shipping) : 'FREE'}</span>
              </div>
              <div class="summary-row">
                <span>Tax (7.5% VAT):</span>
                <span>${formatPrice(data.tax)}</span>
              </div>
              <div class="summary-row">
                <span><strong>Total:</strong></span>
                <span><strong>${formatPrice(data.total)}</strong></span>
              </div>
            </div>

            <div class="order-info">
              <h2>Delivery Information</h2>
              <div class="info-grid">
                <div>
                  <div class="info-item">
                    <div class="info-label">Delivery Address:</div>
                    <div class="info-value">
                      ${data.shippingAddress.street}<br>
                      ${data.shippingAddress.city}, ${data.shippingAddress.state}<br>
                      ${data.shippingAddress.country}
                    </div>
                  </div>
                </div>
                <div>
                  <div class="info-item">
                    <div class="info-label">Contact Phone:</div>
                    <div class="info-value">${data.shippingAddress.phone}</div>
                  </div>
                  ${data.deliveryInstructions ? `
                    <div class="info-item">
                      <div class="info-label">Delivery Instructions:</div>
                      <div class="info-value">${data.deliveryInstructions}</div>
                    </div>
                  ` : ''}
                </div>
              </div>
            </div>
          </div>

          <div class="footer">
            <p><strong>Thank you for choosing GroChain!</strong></p>
            <p>For support, contact us at support@grochain.com or +234 123 456 7890</p>
            <p>This receipt was generated on ${new Date().toLocaleDateString('en-US', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            })}</p>
          </div>
        </div>
      </body>
      </html>
    `
  }
}
