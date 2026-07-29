import { APP_CONFIG } from "@/lib/constants"

// Paystack payment integration utilities

interface PaystackPop {
  setup: (options: PaystackOptions) => { openIframe: () => void }
}

interface PaystackOptions {
  key: string
  email: string
  amount: number
  currency?: string
  ref?: string
  callback?: (response: PaystackInlineResponse) => void
  onClose?: () => void
}

interface PaystackInlineResponse {
  status: string
  message: string
  reference: string
}

declare global {
  interface Window {
    PaystackPop: PaystackPop
  }
}

/**
 * Load Paystack script dynamically
 */
export const loadPaystackScript = (): Promise<void> => {
  return new Promise((resolve, reject) => {
    // Check if already loaded
    if (typeof window !== 'undefined' && window.PaystackPop) {
      console.log('✅ Paystack script already loaded')
      resolve()
      return
    }

    // Check if script is already in DOM
    const existingScript = document.querySelector('script[src="https://js.paystack.co/v1/inline.js"]')
    if (existingScript) {
      console.log('✅ Paystack script tag exists, waiting for load...')
      existingScript.addEventListener('load', () => {
        console.log('✅ Paystack script loaded via existing tag')
        resolve()
      })
      existingScript.addEventListener('error', () => {
        console.error('❌ Paystack script failed to load via existing tag')
        reject(new Error('Paystack script failed to load'))
      })
      return
    }

    // Create and load script dynamically
    console.log('🔄 Loading Paystack script dynamically...')
    const script = document.createElement('script')
    script.src = 'https://js.paystack.co/v1/inline.js'
    script.async = true

    script.onload = () => {
      console.log('✅ Paystack script loaded dynamically')
      resolve()
    }

    script.onerror = () => {
      console.error('❌ Failed to load Paystack script dynamically')
      reject(new Error('Failed to load Paystack script'))
    }

    document.head.appendChild(script)
  })
}

export interface PaymentData {
  orderId: string
  amount: number
  email: string
  callbackUrl?: string
}

export interface PaystackResponse {
  status: 'success' | 'failed' | 'cancelled'
  reference?: string
  transaction?: Record<string, unknown>
}

/**
 * Initialize Paystack payment
 */
export const initializePaystackPayment = async (
  paymentData: PaymentData,
  onSuccess?: (response: PaystackResponse) => void,
  onClose?: () => void
): Promise<PaystackResponse> => {
  return new Promise(async (resolve, reject) => {
    try {
      // Get Paystack configuration
      const configResponse = await fetch(`${APP_CONFIG.api.baseUrl}/api/payments/config`)
      const config = await configResponse.json()

      // Require backend-provided key; avoid insecure hardcoded fallback
      const publicKey = config.data?.publicKey

      if (!publicKey || publicKey === 'pk_test_your_public_key_here') {
        throw new Error('Paystack public key not configured')
      }

      const paystackConfig = {
        key: publicKey,
        email: paymentData.email,
        amount: Math.round(paymentData.amount * 100), // Convert to kobo
        currency: 'NGN',
        ref: `GROCHAIN_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        callback: (response: PaystackInlineResponse) => {
          console.log('✅ Paystack payment callback:', response)
          const result: PaystackResponse = {
            status: 'success',
            reference: response.reference,
            transaction: { ...response } as Record<string, unknown>
          }
          if (onSuccess) onSuccess(result)
          resolve(result)
        },
        onClose: () => {
          console.log('❌ Paystack payment closed by user')
          const result: PaystackResponse = { status: 'cancelled' }
          if (onClose) onClose()
          resolve(result)
        },
        metadata: {
          order_id: paymentData.orderId,
          custom_fields: [
            {
              display_name: "Order ID",
              variable_name: "order_id",
              value: paymentData.orderId
            }
          ]
        }
      }

      console.log('🔄 Initializing Paystack payment:', paystackConfig)

      // Ensure Paystack script is loaded
      await loadPaystackScript()

      if (typeof window !== 'undefined' && window.PaystackPop) {
        console.log('✅ Initializing Paystack payment modal...')
        const handler = window.PaystackPop.setup(paystackConfig)
        handler.openIframe()
      } else {
        throw new Error('Paystack script not available after loading')
      }

    } catch (error) {
      console.error('❌ Paystack initialization error:', error)
      const result: PaystackResponse = { status: 'failed' }
      reject(result)
    }
  })
}

/**
 * Process payment for an order
 */
export const processOrderPayment = async (
  orderId: string,
  amount: number,
  email: string,
  onSuccess?: (response: PaystackResponse) => void,
  onClose?: () => void
): Promise<PaystackResponse> => {
  try {
    console.log('💳 Processing payment for order:', orderId)

    // Initialize payment with backend
    console.log('💳 Initializing payment with backend...')
    console.log('📤 Payment init data:', { orderId, amount, email })

    const token = localStorage.getItem('grochain_auth_token')
    const initResponse = await fetch(`${APP_CONFIG.api.baseUrl}/api/payments/initialize`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {})
      },
      body: JSON.stringify({
        orderId,
        amount,
        email,
        callbackUrl: `${window.location.origin}/payment/verify`
      })
    })

    console.log('📥 Payment init response status:', initResponse.status)
    console.log('📥 Payment init response headers:', Object.fromEntries(initResponse.headers.entries()))

    if (!initResponse.ok) {
      console.log('❌ Payment init failed with status:', initResponse.status)
      const responseText = await initResponse.text()
      console.log('❌ Payment init error response:', responseText)

      // Check if response is HTML
      if (responseText.includes('<!DOCTYPE') || responseText.includes('<html>')) {
        console.log('🚨 CRITICAL: Payment init returned HTML instead of JSON!')
        console.log('🚨 This is causing the "Unexpected token" error')
        throw new Error('Server returned HTML instead of JSON. Check API endpoint.')
      }

      try {
        const errorData = JSON.parse(responseText)
        throw new Error(errorData.message || 'Failed to initialize payment')
      } catch (parseError) {
        throw new Error(`Server error: ${initResponse.status} - ${responseText.substring(0, 100)}`)
      }
    }

    const initData = await initResponse.json()
    console.log('✅ Payment initialized:', initData)

    // If using Paystack inline (recommended)
    const paymentData: PaymentData = {
      orderId,
      amount,
      email,
      callbackUrl: `${window.location.origin}/payment/verify`
    }

    return await initializePaystackPayment(
      paymentData,
      (response) => {
        console.log('✅ Payment successful:', response)
        if (onSuccess) onSuccess(response)
      },
      () => {
        console.log('❌ Payment cancelled by user')
        if (onClose) onClose()
      }
    )

  } catch (error: unknown) {
    console.error('❌ Payment processing error:', error)
    throw error
  }
}

/**
 * Get payment configuration
 */
export const getPaymentConfig = async () => {
  try {
    const response = await fetch(`${APP_CONFIG.api.baseUrl}/api/payments/config`)
    return await response.json()
  } catch (error) {
    console.error('❌ Failed to get payment config:', error)
    throw error
  }
}

/**
 * Debug function to check Paystack script status
 */
export const checkPaystackStatus = () => {
  if (typeof window === 'undefined') {
    console.log('🔍 Running on server-side, window not available')
    return false
  }

  const isLoaded = typeof window.PaystackPop !== 'undefined'
  console.log('🔍 Paystack script status:', {
    loaded: isLoaded,
    scriptTag: !!document.querySelector('script[src="https://js.paystack.co/v1/inline.js"]'),
    paystackPop: isLoaded ? 'Available' : 'Not Available'
  })

  return isLoaded
}
