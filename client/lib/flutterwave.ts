// Flutterwave payment integration utilities

declare global {
  interface Window {
    FlutterwaveCheckout: any
  }
}

/**
 * Load Flutterwave script dynamically
 */
export const loadFlutterwaveScript = (): Promise<void> => {
  return new Promise((resolve, reject) => {
    // Check if already loaded
    if (typeof window !== 'undefined' && window.FlutterwaveCheckout) {
      console.log('✅ Flutterwave script already loaded')
      resolve()
      return
    }

    // Check if script is already in DOM
    const existingScript = document.querySelector('script[src="https://checkout.flutterwave.com/v3.js"]')
    if (existingScript) {
      console.log('✅ Flutterwave script tag exists, waiting for load...')
      existingScript.addEventListener('load', () => {
        console.log('✅ Flutterwave script loaded via existing tag')
        resolve()
      })
      existingScript.addEventListener('error', () => {
        console.error('❌ Flutterwave script failed to load via existing tag')
        reject(new Error('Flutterwave script failed to load'))
      })
      return
    }

    // Create and load script dynamically
    console.log('🔄 Loading Flutterwave script dynamically...')
    const script = document.createElement('script')
    script.src = 'https://checkout.flutterwave.com/v3.js'
    script.async = true

    script.onload = () => {
      console.log('✅ Flutterwave script loaded dynamically')
      resolve()
    }

    script.onerror = () => {
      console.error('❌ Failed to load Flutterwave script dynamically')
      reject(new Error('Failed to load Flutterwave script'))
    }

    document.head.appendChild(script)
  })
}

export interface FlutterwavePaymentData {
  orderId: string
  amount: number
  email: string
  callbackUrl?: string
  customerName?: string
  phone?: string
}

export interface FlutterwaveResponse {
  status: 'success' | 'failed' | 'cancelled'
  reference?: string
  transaction?: any
}

/**
 * Initialize Flutterwave payment
 */
export const initializeFlutterwavePayment = async (
  paymentData: FlutterwavePaymentData,
  onSuccess?: (response: FlutterwaveResponse) => void,
  onClose?: () => void
): Promise<FlutterwaveResponse> => {
  return new Promise(async (resolve, reject) => {
    try {
      // Get Flutterwave configuration
      const configResponse = await fetch('http://localhost:5000/api/payments/config')
      const config = await configResponse.json()

      // Use the public key from the config or fallback to the correct test key
      const publicKey = config.data?.flutterwave?.publicKey || 'FLWPUBK_TEST-fd980f9c2c56a376ea35cea0218289ca-X'

      if (!publicKey || publicKey === 'your_flutterwave_public_key' || publicKey === 'FLWPUBK_TEST_your_public_key_here') {
        throw new Error('Flutterwave is not properly configured. Please contact support or use Paystack instead.')
      }

      const flutterwaveConfig = {
        public_key: publicKey,
        tx_ref: `GROCHAIN_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        amount: paymentData.amount,
        currency: 'NGN',
        payment_options: 'card,mobilemoney,ussd',
        redirect_url: paymentData.callbackUrl || `${window.location.origin}/payment/verify`,
        customer: {
          email: paymentData.email,
          phone_number: paymentData.phone || '',
          name: paymentData.customerName || ''
        },
        customizations: {
          title: 'GroChain Payment',
          description: `Payment for order ${paymentData.orderId}`,
          logo: 'https://your-domain.com/logo.png'
        },
        meta: {
          order_id: paymentData.orderId,
          customer_name: paymentData.customerName
        },
        callback: (response: any) => {
          console.log('✅ Flutterwave payment callback:', response)
          const result: FlutterwaveResponse = {
            status: 'success',
            reference: response.tx_ref,
            transaction: response
          }
          if (onSuccess) onSuccess(result)
          resolve(result)
        },
        onclose: () => {
          console.log('❌ Flutterwave payment closed by user')
          const result: FlutterwaveResponse = { status: 'cancelled' }
          if (onClose) onClose()
          resolve(result)
        }
      }

      console.log('🔄 Initializing Flutterwave payment:', flutterwaveConfig)

      // Ensure Flutterwave script is loaded
      await loadFlutterwaveScript()

      if (typeof window !== 'undefined' && window.FlutterwaveCheckout) {
        console.log('✅ Initializing Flutterwave payment modal...')
        window.FlutterwaveCheckout(flutterwaveConfig)
      } else {
        throw new Error('Flutterwave script not available after loading')
      }

    } catch (error) {
      console.error('❌ Flutterwave initialization error:', error)
      const result: FlutterwaveResponse = { status: 'failed' }
      reject(result)
    }
  })
}

/**
 * Process payment for an order with Flutterwave
 */
export const processFlutterwaveOrderPayment = async (
  orderId: string,
  amount: number,
  email: string,
  onSuccess?: (response: FlutterwaveResponse) => void,
  onClose?: () => void
): Promise<FlutterwaveResponse> => {
  try {
    console.log('💳 Processing Flutterwave payment for order:', orderId)

    // Initialize payment with backend
    console.log('💳 Initializing Flutterwave payment with backend...')
    console.log('📤 Payment init data:', { orderId, amount, email, paymentProvider: 'flutterwave' })

    const initResponse = await fetch('http://localhost:5000/api/payments/initialize', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        orderId,
        amount,
        email,
        paymentProvider: 'flutterwave',
        callbackUrl: `${window.location.origin}/payment/verify`
      })
    })

    console.log('📥 Flutterwave payment init response status:', initResponse.status)

    if (!initResponse.ok) {
      console.log('❌ Flutterwave payment init failed with status:', initResponse.status)
      const responseText = await initResponse.text()
      console.log('❌ Flutterwave payment init error response:', responseText)

      // Check if response is HTML
      if (responseText.includes('<!DOCTYPE') || responseText.includes('<html>')) {
        console.log('🚨 CRITICAL: Flutterwave payment init returned HTML instead of JSON!')
        throw new Error('Server returned HTML instead of JSON. Check API endpoint.')
      }

      try {
        const errorData = JSON.parse(responseText)
        throw new Error(errorData.message || 'Failed to initialize Flutterwave payment')
      } catch (parseError) {
        throw new Error(`Server error: ${initResponse.status} - ${responseText.substring(0, 100)}`)
      }
    }

    const initData = await initResponse.json()
    console.log('✅ Flutterwave payment initialized:', initData)

    // Process Flutterwave payment
    const paymentData: FlutterwavePaymentData = {
      orderId,
      amount,
      email,
      callbackUrl: `${window.location.origin}/payment/verify`
    }

    return await initializeFlutterwavePayment(
      paymentData,
      (response) => {
        console.log('✅ Flutterwave payment successful:', response)
        if (onSuccess) onSuccess(response)
      },
      () => {
        console.log('❌ Flutterwave payment cancelled by user')
        if (onClose) onClose()
      }
    )

  } catch (error: any) {
    console.error('❌ Flutterwave payment processing error:', error)
    throw error
  }
}

/**
 * Get payment configuration
 */
export const getFlutterwaveConfig = async () => {
  try {
    const response = await fetch('http://localhost:5000/api/payments/config')
    return await response.json()
  } catch (error) {
    console.error('❌ Failed to get Flutterwave config:', error)
    throw error
  }
}

/**
 * Debug function to check Flutterwave script status
 */
export const checkFlutterwaveStatus = () => {
  if (typeof window === 'undefined') {
    console.log('🔍 Running on server-side, window not available')
    return false
  }

  const isLoaded = typeof window.FlutterwaveCheckout !== 'undefined'
  console.log('🔍 Flutterwave script status:', {
    loaded: isLoaded,
    scriptTag: !!document.querySelector('script[src="https://checkout.flutterwave.com/v3.js"]'),
    flutterwaveCheckout: isLoaded ? 'Available' : 'Not Available'
  })

  return isLoaded
}

