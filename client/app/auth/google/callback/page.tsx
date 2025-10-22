"use client"

import { useEffect, useState, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { useAuthStore } from "@/lib/auth"
import { apiService } from "@/lib/api"
import { Loader2, CheckCircle, XCircle } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

function GoogleCallbackContent() {
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading')
  const [message, setMessage] = useState('')
  const [retryCount, setRetryCount] = useState(0)
  const router = useRouter()
  const searchParams = useSearchParams()
  const { setUser, setToken } = useAuthStore()

  const handleRetry = () => {
    setRetryCount(prev => prev + 1)
    setStatus('loading')
    setMessage('Retrying authentication...')
    // Redirect back to Google OAuth
    window.location.href = `https://accounts.google.com/o/oauth2/v2/auth?` +
      `client_id=${process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID}&` +
      `redirect_uri=${encodeURIComponent(process.env.NEXT_PUBLIC_GOOGLE_REDIRECT_URI || 'http://localhost:3000/auth/google/callback')}&` +
      `response_type=code&` +
      `scope=openid email profile&` +
      `access_type=offline&` +
      `prompt=consent`
  }

  useEffect(() => {
    const handleGoogleCallback = async () => {
      try {
        console.log('Environment check:')
        console.log('NEXT_PUBLIC_API_BASE_URL:', process.env.NEXT_PUBLIC_API_BASE_URL)
        console.log('NEXT_PUBLIC_GOOGLE_REDIRECT_URI:', process.env.NEXT_PUBLIC_GOOGLE_REDIRECT_URI)
        console.log('NEXT_PUBLIC_JWT_STORAGE_KEY:', process.env.NEXT_PUBLIC_JWT_STORAGE_KEY)
        
        const code = searchParams.get('code')
        const state = searchParams.get('state')
        const error = searchParams.get('error')

        console.log('URL params:', { code, state, error })

        if (error) {
          setStatus('error')
          setMessage('Google authentication was cancelled or failed')
          return
        }

        if (!code) {
          setStatus('error')
          setMessage('No authorization code received from Google')
          return
        }

        // Exchange code for tokens
        console.log('Sending request to backend with code:', code)
        console.log('API Base URL:', process.env.NEXT_PUBLIC_API_BASE_URL)
        const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5000'
        console.log('Full URL:', `${apiBaseUrl}/api/auth/google/callback`)
        const response = await fetch(`${apiBaseUrl}/api/auth/google/callback`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            code,
            state,
            redirectUri: process.env.NEXT_PUBLIC_GOOGLE_REDIRECT_URI || 'http://localhost:3000/auth/google/callback'
          })
        })
        
        console.log('Backend response status:', response.status)
        console.log('Backend response headers:', response.headers)
        
        if (!response.ok) {
          console.error('Backend response not ok:', response.status, response.statusText)
          const errorText = await response.text()
          console.error('Error response body:', errorText)
          
          // Parse error response to get more details
          let errorData
          try {
            errorData = JSON.parse(errorText)
          } catch (e) {
            errorData = { message: errorText }
          }
          
          // Handle specific Google OAuth errors
          if (errorData.error === 'invalid_grant') {
            setStatus('error')
            setMessage('Authorization code expired. Please try signing in again.')
            return
          }
          
          throw new Error(`Backend error: ${response.status} ${response.statusText} - ${errorData.message || errorText}`)
        }

        let data
        try {
          data = await response.json()
          console.log('Google callback response:', data)
        } catch (parseError) {
          console.error('Failed to parse JSON response:', parseError)
          const responseText = await response.text()
          console.error('Raw response:', responseText)
          throw new Error('Failed to parse backend response')
        }

        if (data.status === 'success') {
          // Store tokens and user data
          if (data.token) {
            console.log('Setting token:', data.token)
            setToken(data.token)
            apiService.setToken(data.token)
            localStorage.setItem(process.env.NEXT_PUBLIC_JWT_STORAGE_KEY || 'grochain_auth_token', data.token)
          }

          if (data.user) {
            console.log('Setting user:', data.user)
            setUser(data.user)
          }

          setStatus('success')
          setMessage('Successfully signed in with Google!')

          // Redirect to dashboard after a short delay
          setTimeout(() => {
            router.push('/dashboard')
          }, 1000)
        } else {
          setStatus('error')
          setMessage(data.message || data.error || 'Authentication failed')
          console.error('Authentication failed:', data)
        }
      } catch (error) {
        console.error('Google callback error:', error)
        setStatus('error')
        setMessage('An error occurred during authentication')
      }
    }

    handleGoogleCallback()
  }, [searchParams, router, setUser, setToken])

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle>Google Authentication</CardTitle>
          <CardDescription>
            Processing your Google sign-in...
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center space-y-4">
          {status === 'loading' && (
            <>
              <Loader2 className="h-8 w-8 animate-spin mx-auto text-blue-600" />
              <p className="text-sm text-gray-600">Please wait while we verify your account...</p>
            </>
          )}

          {status === 'success' && (
            <>
              <CheckCircle className="h-8 w-8 mx-auto text-green-600" />
              <p className="text-sm text-green-600">{message}</p>
              <p className="text-xs text-gray-500">Redirecting to dashboard...</p>
            </>
          )}

          {status === 'error' && (
            <>
              <XCircle className="h-8 w-8 mx-auto text-red-600" />
              <p className="text-sm text-red-600">{message}</p>
              <div className="flex gap-2">
                <Button 
                  onClick={handleRetry}
                  className="flex-1 bg-blue-600 hover:bg-blue-700"
                >
                  Try Again
                </Button>
                <Button 
                  onClick={() => router.push('/login')}
                  variant="outline"
                  className="flex-1"
                >
                  Back to Login
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

export default function GoogleCallbackPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Processing authentication...</p>
        </div>
      </div>
    }>
      <GoogleCallbackContent />
    </Suspense>
  )
}
