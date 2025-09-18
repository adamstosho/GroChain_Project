"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { apiService } from "@/lib/api"

export default function TestGoogleAuthPage() {
  const [testData, setTestData] = useState({
    googleId: "test-google-123",
    email: "test@example.com",
    name: "Test User",
    image: "https://via.placeholder.com/150"
  })
  const [result, setResult] = useState<any>(null)
  const [loading, setLoading] = useState(false)

  const handleTestGoogleAuth = async () => {
    setLoading(true)
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/auth/google`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(testData)
      })

      const data = await response.json()
      setResult(data)
    } catch (error: any) {
      setResult({ error: error.message })
    } finally {
      setLoading(false)
    }
  }

  const handleGoogleLogin = () => {
    const googleAuthUrl = `https://accounts.google.com/o/oauth2/v2/auth?` +
      `client_id=${process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID}&` +
      `redirect_uri=${encodeURIComponent(process.env.NEXT_PUBLIC_GOOGLE_REDIRECT_URI!)}&` +
      `response_type=code&` +
      `scope=openid email profile&` +
      `access_type=offline&` +
      `prompt=consent`
    
    window.location.href = googleAuthUrl
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Google OAuth Test</CardTitle>
            <CardDescription>
              Test the Google OAuth integration for GroChain
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="googleId">Google ID</Label>
                <Input
                  id="googleId"
                  value={testData.googleId}
                  onChange={(e) => setTestData({ ...testData, googleId: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={testData.email}
                  onChange={(e) => setTestData({ ...testData, email: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  value={testData.name}
                  onChange={(e) => setTestData({ ...testData, name: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="image">Image URL</Label>
                <Input
                  id="image"
                  value={testData.image}
                  onChange={(e) => setTestData({ ...testData, image: e.target.value })}
                />
              </div>
            </div>

            <div className="flex space-x-4">
              <Button onClick={handleTestGoogleAuth} disabled={loading}>
                {loading ? "Testing..." : "Test Direct Auth"}
              </Button>
              <Button onClick={handleGoogleLogin} variant="outline">
                Test Google OAuth Flow
              </Button>
            </div>

            {result && (
              <div className="mt-4 p-4 bg-gray-100 rounded-lg">
                <h3 className="font-semibold mb-2">Result:</h3>
                <pre className="text-sm overflow-auto">
                  {JSON.stringify(result, null, 2)}
                </pre>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Environment Variables</CardTitle>
            <CardDescription>
              Check if Google OAuth environment variables are loaded
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm">
              <div>
                <strong>GOOGLE_CLIENT_ID:</strong> {process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID ? "✅ Loaded" : "❌ Missing"}
              </div>
              <div>
                <strong>GOOGLE_REDIRECT_URI:</strong> {process.env.NEXT_PUBLIC_GOOGLE_REDIRECT_URI ? "✅ Loaded" : "❌ Missing"}
              </div>
              <div>
                <strong>API_BASE_URL:</strong> {process.env.NEXT_PUBLIC_API_BASE_URL ? "✅ Loaded" : "❌ Missing"}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
