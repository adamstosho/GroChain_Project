"use client"

import React, { Component, ErrorInfo, ReactNode } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { AlertTriangle, RefreshCw } from 'lucide-react'

interface Props {
  children: ReactNode
  fallback?: ReactNode
}

interface State {
  hasError: boolean
  error: Error | null
  errorInfo: ErrorInfo | null
}

export class WebSocketErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false, error: null, errorInfo: null }
  }

  static getDerivedStateFromError(error: Error): State {
    // Check if it's a WebSocket-related error
    const isWebSocketError = 
      error.message.includes('websocket') ||
      error.message.includes('socket.io') ||
      error.message.includes('connection') ||
      error.message.includes('network')

    if (isWebSocketError) {
      console.warn('🔌 WebSocket error caught by error boundary:', error.message)
      return { hasError: true, error, errorInfo: null }
    }

    // Re-throw non-WebSocket errors
    throw error
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('🔌 WebSocket Error Boundary caught an error:', error, errorInfo)
    this.setState({
      error,
      errorInfo
    })
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null, errorInfo: null })
    // Force a page refresh to reinitialize WebSocket connections
    window.location.reload()
  }

  handleDismiss = () => {
    this.setState({ hasError: false, error: null, errorInfo: null })
  }

  render() {
    if (this.state.hasError) {
      // Custom fallback UI
      if (this.props.fallback) {
        return this.props.fallback
      }

      return (
        <Card className="w-full max-w-md mx-auto mt-4">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-sm">
              <AlertTriangle className="h-4 w-4 text-yellow-500" />
              Connection Issue
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-muted-foreground">
              There was a temporary connection issue with real-time notifications. 
              The app will continue to work normally, but you may miss some real-time updates.
            </p>
            <div className="flex gap-2">
              <Button 
                onClick={this.handleRetry} 
                size="sm" 
                className="flex-1"
              >
                <RefreshCw className="h-3 w-3 mr-2" />
                Retry
              </Button>
              <Button 
                onClick={this.handleDismiss} 
                variant="outline" 
                size="sm"
                className="flex-1"
              >
                Continue
              </Button>
            </div>
            {process.env.NODE_ENV === 'development' && this.state.error && (
              <details className="text-xs text-muted-foreground">
                <summary className="cursor-pointer">Error Details</summary>
                <pre className="mt-2 p-2 bg-muted rounded text-xs overflow-auto">
                  {this.state.error.message}
                </pre>
              </details>
            )}
          </CardContent>
        </Card>
      )
    }

    return this.props.children
  }
}

// Higher-order component for easier usage
export function withWebSocketErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  fallback?: ReactNode
) {
  return function WrappedComponent(props: P) {
    return (
      <WebSocketErrorBoundary fallback={fallback}>
        <Component {...props} />
      </WebSocketErrorBoundary>
    )
  }
}


