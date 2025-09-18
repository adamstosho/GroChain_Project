'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { AlertCircle, CheckCircle, RefreshCw, Key } from 'lucide-react'
import { isStorageAvailable, safeStorage } from '@/lib/utils'
import { APP_CONFIG } from '@/lib/constants'
import { NotificationDemo } from '@/components/notifications/notification-demo'
import { WebSocketTest } from '@/components/debug/websocket-test'

export default function DebugPage() {
  const [storageStatus, setStorageStatus] = useState<{
    localStorage: boolean
    sessionStorage: boolean
    cookies: boolean
  }>({ localStorage: false, sessionStorage: false, cookies: false })

  const [datadogErrors, setDatadogErrors] = useState<string[]>([])
  const [authStatus, setAuthStatus] = useState<{
    hasToken: boolean
    tokenLength: number
    hasRefreshToken: boolean
    hasAuthData: boolean
    authData: any
  }>({
    hasToken: false,
    tokenLength: 0,
    hasRefreshToken: false,
    hasAuthData: false,
    authData: null
  })

  useEffect(() => {
    // Check storage availability
    const localAvailable = isStorageAvailable('localStorage')
    const sessionAvailable = isStorageAvailable('sessionStorage')

    // Check cookies
    let cookiesAvailable = false
    try {
      document.cookie = 'test=1'
      cookiesAvailable = document.cookie.includes('test=1')
      document.cookie = 'test=; expires=Thu, 01 Jan 1970 00:00:00 GMT'
    } catch (e) {
      cookiesAvailable = false
    }

    setStorageStatus({
      localStorage: localAvailable,
      sessionStorage: sessionAvailable,
      cookies: cookiesAvailable
    })

    // Check authentication status
    if (localAvailable) {
      const token = localStorage.getItem(APP_CONFIG.auth.tokenKey)
      const refreshToken = localStorage.getItem(APP_CONFIG.auth.refreshTokenKey)
      const authData = localStorage.getItem('grochain-auth')

      setAuthStatus({
        hasToken: !!token,
        tokenLength: token ? token.length : 0,
        hasRefreshToken: !!refreshToken,
        hasAuthData: !!authData,
        authData: authData ? JSON.parse(authData) : null
      })
    }

    // Listen for Datadog errors
    const originalWarn = console.warn
    const capturedErrors: string[] = []

    console.warn = (...args) => {
      const message = args.join(' ')
      if (message.includes('Datadog') || message.includes('storage')) {
        capturedErrors.push(message)
        setDatadogErrors([...capturedErrors])
      }
      originalWarn.apply(console, args)
    }

    // Cleanup
    return () => {
      console.warn = originalWarn
    }
  }, [])

  const testStorage = () => {
    try {
      safeStorage.setItem('test', 'working')
      const value = safeStorage.getItem('test')
      safeStorage.removeItem('test')
      return value === 'working'
    } catch (e) {
      return false
    }
  }

  const clearAllStorage = () => {
    try {
      localStorage.clear()
      sessionStorage.clear()
      // Clear cookies
      document.cookie.split(";").forEach((c) => {
        document.cookie = c
          .replace(/^ +/, "")
          .replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/")
      })
      window.location.reload()
    } catch (e) {
      console.error('Error clearing storage:', e)
    }
  }

  const testApiCall = async () => {
    const token = localStorage.getItem(APP_CONFIG.auth.tokenKey)
    if (!token) {
      alert('No token found. Please login first.')
      return
    }

    try {
      const response = await fetch('http://localhost:5000/api/partners/dashboard', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })

      const data = await response.json()
      console.log('API Test Response:', response.status, data)

      if (response.ok) {
        alert('✅ API call successful!')
      } else {
        alert(`❌ API call failed: ${response.status} - ${data.message || 'Unknown error'}`)
      }
    } catch (error: any) {
      console.error('API Test Error:', error)
      alert(`❌ API call error: ${error.message}`)
    }
  }

  const testFarmersApi = async () => {
    const token = localStorage.getItem(APP_CONFIG.auth.tokenKey)
    if (!token) {
      alert('No token found. Please login first.')
      return
    }

    try {
      const response = await fetch('http://localhost:5000/api/partners/farmers', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })

      const data = await response.json()
      console.log('Farmers API Test Response:', response.status, data)

      if (response.ok) {
        alert(`✅ Farmers API call successful! Found ${data.data?.total || 0} farmers`)
      } else {
        alert(`❌ Farmers API call failed: ${response.status} - ${data.message || 'Unknown error'}`)
      }
    } catch (error: any) {
      console.error('Farmers API Test Error:', error)
      alert(`❌ Farmers API call error: ${error.message}`)
    }
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Debug & Diagnostics</h1>
          <p className="text-muted-foreground">Troubleshoot browser storage and monitoring issues</p>
        </div>
        <Button onClick={() => window.location.reload()}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh Page
        </Button>
      </div>

      {/* Storage Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            Storage Status
            {storageStatus.localStorage && storageStatus.sessionStorage ? (
              <CheckCircle className="h-5 w-5 text-green-500" />
            ) : (
              <AlertCircle className="h-5 w-5 text-red-500" />
            )}
          </CardTitle>
          <CardDescription>Check browser storage availability</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center justify-between p-3 border rounded">
              <span>localStorage</span>
              <Badge variant={storageStatus.localStorage ? 'default' : 'destructive'}>
                {storageStatus.localStorage ? 'Available' : 'Unavailable'}
              </Badge>
            </div>
            <div className="flex items-center justify-between p-3 border rounded">
              <span>sessionStorage</span>
              <Badge variant={storageStatus.sessionStorage ? 'default' : 'destructive'}>
                {storageStatus.sessionStorage ? 'Available' : 'Unavailable'}
              </Badge>
            </div>
            <div className="flex items-center justify-between p-3 border rounded">
              <span>Cookies</span>
              <Badge variant={storageStatus.cookies ? 'default' : 'destructive'}>
                {storageStatus.cookies ? 'Available' : 'Unavailable'}
              </Badge>
            </div>
          </div>

          <div className="flex gap-2">
            <Button onClick={testStorage} variant="outline">
              Test Storage
            </Button>
            <Button onClick={clearAllStorage} variant="destructive">
              Clear All Storage
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Authentication Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Key className="h-5 w-5" />
            Authentication Status
            {authStatus.hasToken ? (
              <CheckCircle className="h-5 w-5 text-green-500" />
            ) : (
              <AlertCircle className="h-5 w-5 text-red-500" />
            )}
          </CardTitle>
          <CardDescription>Check authentication tokens and user session</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center justify-between p-3 border rounded">
              <span>Access Token</span>
              <Badge variant={authStatus.hasToken ? 'default' : 'destructive'}>
                {authStatus.hasToken ? `${authStatus.tokenLength} chars` : 'Missing'}
              </Badge>
            </div>
            <div className="flex items-center justify-between p-3 border rounded">
              <span>Refresh Token</span>
              <Badge variant={authStatus.hasRefreshToken ? 'default' : 'destructive'}>
                {authStatus.hasRefreshToken ? 'Present' : 'Missing'}
              </Badge>
            </div>
          </div>

          {authStatus.authData && (
            <div className="p-3 bg-gray-50 border rounded">
              <h4 className="font-semibold text-sm mb-2">Auth Store Data</h4>
              <pre className="text-xs text-gray-700 overflow-auto max-h-32">
                {JSON.stringify(authStatus.authData, null, 2)}
              </pre>
            </div>
          )}

          <div className="flex gap-2 flex-wrap">
            <Button onClick={testApiCall} variant="default">
              Test Dashboard API
            </Button>
            <Button onClick={testFarmersApi} variant="default">
              Test Farmers API
            </Button>
            <Button
              onClick={() => {
                localStorage.removeItem(APP_CONFIG.auth.tokenKey)
                localStorage.removeItem(APP_CONFIG.auth.refreshTokenKey)
                localStorage.removeItem('grochain-auth')
                window.location.reload()
              }}
              variant="destructive"
            >
              Clear Auth Data
            </Button>
            <Button
              onClick={() => window.location.href = '/login'}
              variant="outline"
            >
              Go to Login
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Datadog Errors */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            Monitoring Errors
            {datadogErrors.length > 0 ? (
              <Badge variant="destructive">{datadogErrors.length}</Badge>
            ) : (
              <CheckCircle className="h-5 w-5 text-green-500" />
            )}
          </CardTitle>
          <CardDescription>Datadog and monitoring service errors</CardDescription>
        </CardHeader>
        <CardContent>
          {datadogErrors.length > 0 ? (
            <div className="space-y-2">
              {datadogErrors.map((error, index) => (
                <div key={index} className="p-3 bg-red-50 border border-red-200 rounded text-sm text-red-800">
                  {error}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-green-600">No monitoring errors detected</p>
          )}
        </CardContent>
      </Card>

      {/* Solutions */}
      <Card>
        <CardHeader>
          <CardTitle>Solutions</CardTitle>
          <CardDescription>Steps to resolve the detected issues</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {!storageStatus.localStorage && (
            <div className="p-4 bg-yellow-50 border border-yellow-200 rounded">
              <h4 className="font-semibold text-yellow-800">Storage Unavailable</h4>
              <ul className="mt-2 text-sm text-yellow-700 space-y-1">
                <li>• You may be in incognito/private browsing mode</li>
                <li>• Storage may be disabled in browser settings</li>
                <li>• Try switching to normal browsing mode</li>
                <li>• Enable cookies and storage in browser settings</li>
              </ul>
            </div>
          )}

          {datadogErrors.length > 0 && (
            <div className="p-4 bg-blue-50 border border-blue-200 rounded">
              <h4 className="font-semibold text-blue-800">Datadog Storage Issues</h4>
              <ul className="mt-2 text-sm text-blue-700 space-y-1">
                <li>• Datadog monitoring may be disabled due to storage restrictions</li>
                <li>• This is normal in private browsing mode</li>
                <li>• App functionality is not affected</li>
                <li>• Clear storage and refresh to test</li>
              </ul>
            </div>
          )}

          <div className="p-4 bg-green-50 border border-green-200 rounded">
            <h4 className="font-semibold text-green-800">Favicon Fixed</h4>
            <p className="mt-2 text-sm text-green-700">
              The favicon.ico file has been created and configured in the app metadata.
              Refresh the page if you still see the 404 error.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Notification Demo */}
      <div className="flex justify-center">
        <NotificationDemo />
      </div>

      {/* WebSocket Test */}
      <div className="flex justify-center">
        <WebSocketTest />
      </div>

      {/* Browser Info */}
      <Card>
        <CardHeader>
          <CardTitle>Browser Information</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-sm">
            <p><strong>User Agent:</strong> {typeof window !== 'undefined' ? navigator.userAgent : 'N/A'}</p>
            <p><strong>Incognito Mode:</strong> {typeof window !== 'undefined' && !isStorageAvailable() ? 'Likely' : 'No'}</p>
            <p><strong>Cookies Enabled:</strong> {storageStatus.cookies ? 'Yes' : 'No'}</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
