'use client'

import React from 'react'
import { Button } from '@/components/ui/button'
import { AlertCircle, RefreshCw } from 'lucide-react'

interface ErrorBoundaryState {
  hasError: boolean
  error?: Error
  retryCount: number
}

interface ErrorBoundaryProps {
  children: React.ReactNode
  fallback?: React.ComponentType<{ error: Error; retry: () => void }>
}

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props)
    this.state = { hasError: false, retryCount: 0 }
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error, retryCount: 0 }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo)
    
    // Check if it's a chunk loading error
    if (error.message.includes('Loading chunk') || error.message.includes('ChunkLoadError')) {
      console.log('Chunk loading error detected, will retry...')
      // Auto-retry for chunk loading errors
      setTimeout(() => {
        this.handleRetry()
      }, 1000)
    }
  }

  handleRetry = () => {
    if (this.state.retryCount < 3) {
      this.setState(prevState => ({
        hasError: false,
        error: undefined,
        retryCount: prevState.retryCount + 1
      }))
      
      // Force reload the page for chunk loading errors
      if (this.state.error?.message.includes('Loading chunk')) {
        window.location.reload()
      }
    }
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return <this.props.fallback error={this.state.error!} retry={this.handleRetry} />
      }

      return (
        <div className="min-h-screen flex items-center justify-center bg-background">
          <div className="max-w-md w-full mx-auto p-6">
            <div className="text-center space-y-4">
              <AlertCircle className="h-12 w-12 text-destructive mx-auto" />
              <h1 className="text-2xl font-bold text-foreground">
                {this.state.error?.message.includes('Loading chunk') 
                  ? 'Loading Error' 
                  : 'Something went wrong'
                }
              </h1>
              <p className="text-muted-foreground">
                {this.state.error?.message.includes('Loading chunk')
                  ? 'There was an issue loading the application. This usually resolves automatically.'
                  : 'An unexpected error occurred. Please try refreshing the page.'
                }
              </p>
              <div className="flex flex-col sm:flex-row gap-2 justify-center">
                <Button onClick={this.handleRetry} disabled={this.state.retryCount >= 3}>
                  <RefreshCw className="w-4 h-4 mr-2" />
                  {this.state.retryCount >= 3 ? 'Max retries reached' : 'Try Again'}
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => window.location.reload()}
                >
                  Refresh Page
                </Button>
              </div>
              {this.state.retryCount > 0 && (
                <p className="text-sm text-muted-foreground">
                  Retry attempt: {this.state.retryCount}/3
                </p>
              )}
            </div>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

// Hook for handling chunk loading errors
export function useChunkErrorHandler() {
  React.useEffect(() => {
    const handleChunkError = (event: ErrorEvent) => {
      if (event.message.includes('Loading chunk') || event.message.includes('ChunkLoadError')) {
        console.log('Chunk loading error detected, reloading page...')
        // Small delay to prevent infinite reloads
        setTimeout(() => {
          window.location.reload()
        }, 1000)
      }
    }

    window.addEventListener('error', handleChunkError)
    return () => window.removeEventListener('error', handleChunkError)
  }, [])
}
