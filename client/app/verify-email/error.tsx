'use client'

import { useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { AlertCircle, RefreshCw, Mail } from 'lucide-react'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error('Email verification error:', error)
  }, [error])

  return (
    <div className="mx-auto max-w-md p-6">
      <Card>
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-100">
            <AlertCircle className="h-8 w-8 text-red-600" />
          </div>
          <CardTitle className="text-red-600">Something went wrong</CardTitle>
          <CardDescription>
            There was an error loading the verification page. This can happen when opening the link in a different browser.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 text-center">
          <p className="text-sm text-muted-foreground">
            {error.message || "An unexpected error occurred while loading the verification page."}
          </p>
          
          <div className="space-y-2">
            <Button onClick={reset} className="w-full">
              <RefreshCw className="w-4 h-4 mr-2" />
              Try Again
            </Button>
            
            <Button 
              variant="outline" 
              onClick={() => window.location.href = "/login"} 
              className="w-full"
            >
              Go to Login
            </Button>
          </div>
          
          <div className="text-xs text-muted-foreground space-y-2 pt-4 border-t">
            <p>💡 <strong>Common causes:</strong></p>
            <ul className="text-left space-y-1">
              <li>• Opening the link in a different browser</li>
              <li>• Browser cache or cookie issues</li>
              <li>• Network connectivity problems</li>
              <li>• Expired verification link</li>
            </ul>
            <p className="pt-2">
              <strong>Solution:</strong> Try opening the verification link in the same browser where you registered, or request a new verification email.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
