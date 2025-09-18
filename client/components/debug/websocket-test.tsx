'use client'

import { useState, useEffect, useRef } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { Wifi, WifiOff, RefreshCw, Send, AlertTriangle } from 'lucide-react'
import { io, Socket } from 'socket.io-client'
import { APP_CONFIG } from '@/lib/constants'
import { useAuthStore } from '@/lib/auth'

export function WebSocketTest() {
  const [connectionStatus, setConnectionStatus] = useState<'disconnected' | 'connecting' | 'connected' | 'error'>('disconnected')
  const [errorMessage, setErrorMessage] = useState('')
  const [logs, setLogs] = useState<string[]>([])
  const [testMessage, setTestMessage] = useState('Hello from WebSocket test!')
  const socketRef = useRef<Socket | null>(null)
  const { user, token, isAuthenticated } = useAuthStore()

  const addLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString()
    setLogs(prev => [...prev.slice(-9), `[${timestamp}] ${message}`])
  }

  const connectWebSocket = () => {
    if (!isAuthenticated || !token || !user) {
      addLog('❌ Cannot connect: User not authenticated')
      setConnectionStatus('error')
      setErrorMessage('User not authenticated')
      return
    }

    setConnectionStatus('connecting')
    setErrorMessage('')
    addLog('🔌 Attempting to connect to WebSocket...')

    try {
      const wsUrl = APP_CONFIG.api.wsUrl || APP_CONFIG.api.baseUrl
      addLog(`🔌 Connecting to: ${wsUrl}`)

      const socket = io(wsUrl, {
        auth: { token },
        transports: ['websocket', 'polling'],
        timeout: 10000,
        reconnection: false, // Disable auto-reconnection for manual control
      })

      socket.on('connect', () => {
        addLog(`✅ Connected successfully! Socket ID: ${socket.id}`)
        setConnectionStatus('connected')

        // Join user-specific rooms
        socket.emit('join-room', `user:${user._id}`)
        socket.emit('join-room', `role:${user.role}`)
        addLog(`🔔 Joined rooms: user:${user._id}, role:${user.role}`)
      })

      socket.on('disconnect', (reason) => {
        addLog(`🔌 Disconnected: ${reason}`)
        setConnectionStatus('disconnected')
      })

      socket.on('connect_error', (error) => {
        addLog(`❌ Connection error: ${error.message}`)
        setConnectionStatus('error')
        setErrorMessage(error.message)
      })

      socket.on('error', (error) => {
        addLog(`❌ Socket error: ${error.message || error}`)
        setConnectionStatus('error')
        setErrorMessage(error.message || error)
      })

      socket.on('notification', (notification: any) => {
        addLog(`🔔 Received notification: ${notification.title || notification.message}`)
      })

      socketRef.current = socket
    } catch (error: any) {
      addLog(`❌ Failed to initialize socket: ${error.message}`)
      setConnectionStatus('error')
      setErrorMessage(error.message)
    }
  }

  const disconnectWebSocket = () => {
    if (socketRef.current) {
      addLog('🔌 Disconnecting...')
      socketRef.current.disconnect()
      socketRef.current = null
    }
    setConnectionStatus('disconnected')
    setErrorMessage('')
  }

  const sendTestMessage = () => {
    if (!socketRef.current || connectionStatus !== 'connected') {
      addLog('❌ Cannot send: Not connected')
      return
    }

    try {
      // Emit a test event (this will only work if the backend has a handler for it)
      socketRef.current.emit('test-message', { message: testMessage, timestamp: new Date() })
      addLog(`📤 Sent test message: ${testMessage}`)
    } catch (error: any) {
      addLog(`❌ Failed to send message: ${error.message}`)
    }
  }

  const testNotification = () => {
    if (!socketRef.current || connectionStatus !== 'connected') {
      addLog('❌ Cannot test notifications: Not connected')
      return
    }

    try {
      socketRef.current.emit('test-notification', {
        userId: user?._id,
        message: 'Test notification from debug page',
        title: 'Debug Test'
      })
      addLog('📤 Sent test notification request')
    } catch (error: any) {
      addLog(`❌ Failed to send notification test: ${error.message}`)
    }
  }

  useEffect(() => {
    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect()
      }
    }
  }, [])

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {connectionStatus === 'connected' ? (
            <Wifi className="h-5 w-5 text-green-500" />
          ) : connectionStatus === 'connecting' ? (
            <RefreshCw className="h-5 w-5 text-yellow-500 animate-spin" />
          ) : (
            <WifiOff className="h-5 w-5 text-red-500" />
          )}
          WebSocket Connection Test
          <Badge variant={
            connectionStatus === 'connected' ? 'default' :
            connectionStatus === 'connecting' ? 'secondary' :
            connectionStatus === 'error' ? 'destructive' : 'outline'
          }>
            {connectionStatus}
          </Badge>
        </CardTitle>
        <CardDescription>
          Test WebSocket connectivity to the backend server
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Connection Controls */}
        <div className="flex gap-2">
          <Button
            onClick={connectWebSocket}
            disabled={connectionStatus === 'connecting' || connectionStatus === 'connected'}
            variant="default"
          >
            <Wifi className="h-4 w-4 mr-2" />
            Connect
          </Button>
          <Button
            onClick={disconnectWebSocket}
            disabled={connectionStatus === 'disconnected'}
            variant="outline"
          >
            <WifiOff className="h-4 w-4 mr-2" />
            Disconnect
          </Button>
          <Button
            onClick={testNotification}
            disabled={connectionStatus !== 'connected'}
            variant="secondary"
          >
            <Send className="h-4 w-4 mr-2" />
            Test Notification
          </Button>
        </div>

        {/* Authentication Status */}
        <div className="p-3 bg-gray-50 rounded-lg">
          <h4 className="font-medium mb-2">Authentication Status</h4>
          <div className="text-sm space-y-1">
            <p><strong>Authenticated:</strong> {isAuthenticated ? 'Yes' : 'No'}</p>
            <p><strong>User:</strong> {user?.name || 'N/A'} ({user?.role || 'N/A'})</p>
            <p><strong>Token:</strong> {token ? `${token.substring(0, 20)}...` : 'No token'}</p>
          </div>
        </div>

        {/* Test Message Input */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Test Message:</label>
          <div className="flex gap-2">
            <Textarea
              value={testMessage}
              onChange={(e) => setTestMessage(e.target.value)}
              placeholder="Enter a test message to send"
              className="flex-1"
              rows={2}
            />
            <Button
              onClick={sendTestMessage}
              disabled={connectionStatus !== 'connected'}
              variant="outline"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Error Display */}
        {errorMessage && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-center gap-2 text-red-600">
              <AlertTriangle className="h-4 w-4" />
              <span className="font-medium">Error:</span>
            </div>
            <p className="text-sm text-red-600 mt-1">{errorMessage}</p>
          </div>
        )}

        {/* Connection Logs */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Connection Logs:</label>
          <div className="bg-gray-900 text-green-400 p-3 rounded-lg font-mono text-sm max-h-40 overflow-y-auto">
            {logs.length === 0 ? (
              <p className="text-gray-500">No logs yet. Click "Connect" to start testing.</p>
            ) : (
              logs.map((log, index) => (
                <div key={index} className="mb-1">{log}</div>
              ))
            )}
          </div>
        </div>

        {/* Connection Info */}
        <div className="text-xs text-gray-500 space-y-1">
          <p><strong>WebSocket URL:</strong> {APP_CONFIG.api.wsUrl || APP_CONFIG.api.baseUrl}</p>
          <p><strong>HTTP URL:</strong> {APP_CONFIG.api.baseUrl}</p>
          <p><strong>Transports:</strong> websocket, polling</p>
        </div>
      </CardContent>
    </Card>
  )
}
