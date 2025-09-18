"use client"

/**
 * Notification System Hook
 *
 * Environment Variables:
 * - NEXT_PUBLIC_DISABLE_WEBSOCKET: Set to 'true' to disable Socket.IO connections
 *
 * Features:
 * - Real-time Socket.IO notifications
 * - Automatic reconnection with exponential backoff
 * - Fallback to polling when Socket.IO fails
 * - Connection timeout handling
 * - Comprehensive error logging
 */

import { useState, useEffect, useCallback, useRef } from 'react'
import { io, Socket } from 'socket.io-client'
import { api } from '@/lib/api'
import { useAuth } from './use-auth'
import { useToast } from './use-toast'
import { APP_CONFIG } from '@/lib/constants'

export interface Notification {
  id: string
  _id?: string // Backend uses _id
  title: string
  message: string
  type: 'info' | 'success' | 'warning' | 'error'
  category: string
  isRead: boolean
  read?: boolean // Backend uses 'read'
  createdAt: string
  actionUrl?: string
  data?: Record<string, any>
  priority?: 'low' | 'normal' | 'high' | 'urgent'
}

interface NotificationState {
  notifications: Notification[]
  unreadCount: number
  loading: boolean
  error: string | null
  connected: boolean
}

interface NotificationFilters {
  page?: number
  limit?: number
  category?: string
  type?: string
  read?: boolean
  priority?: string
}

export const useNotifications = () => {
  const { user } = useAuth()
  const { toast } = useToast()
  const [state, setState] = useState<NotificationState>({
    notifications: [],
    unreadCount: 0,
    loading: true,
    error: null,
    connected: false
  })

  // WebSocket failure tracking
  const wsFailures = useRef(0)
  const maxWsFailures = 3

  // Socket.IO connection reference
  const socketRef = useRef<Socket | null>(null)
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const reconnectAttempts = useRef(0)
  const maxReconnectAttempts = 5

  // Normalize backend notification to frontend format
  const normalizeNotification = (backendNotification: any): Notification => {
    return {
      id: backendNotification._id || backendNotification.id,
      _id: backendNotification._id,
      title: backendNotification.title,
      message: backendNotification.message,
      type: backendNotification.type,
      category: backendNotification.category,
      isRead: backendNotification.read || false,
      read: backendNotification.read,
      createdAt: backendNotification.createdAt,
      actionUrl: backendNotification.actionUrl,
      data: backendNotification.data,
      priority: backendNotification.priority
    }
  }

  // Fetch notifications with advanced filtering
  const fetchNotifications = useCallback(async (filters: NotificationFilters = {}) => {
    if (!user) return

    try {
      setState(prev => ({ ...prev, loading: true, error: null }))

      const params = new URLSearchParams()
      params.set('page', String(filters.page || 1))
      params.set('limit', String(filters.limit || 20))
      
      if (filters.category) params.set('category', filters.category)
      if (filters.type) params.set('type', filters.type)
      if (filters.read !== undefined) params.set('read', String(filters.read))
      if (filters.priority) params.set('priority', filters.priority)

      const response = await api.get(`/api/notifications?${params.toString()}`)

      // Handle different response structures
      const responseData = response.data?.data || response.data
      const { notifications: rawNotifications, pagination } = responseData || {}
      
      if (!rawNotifications) {
        throw new Error('Invalid response structure from notifications API')
      }

      // Normalize backend notifications to frontend format
      const notifications = rawNotifications.map(normalizeNotification)

      setState(prev => ({
        ...prev,
        notifications,
        unreadCount: notifications.filter((n: Notification) => !n.isRead).length,
        loading: false
      }))

      return { notifications, pagination }
    } catch (error: any) {
      const errorMessage = error.message || 'Failed to fetch notifications'
      setState(prev => ({
        ...prev,
        error: errorMessage,
        loading: false
      }))

      // Only show toast if component is still mounted and not in background
      if (typeof window !== 'undefined' && !document.hidden) {
        toast({
          title: "Notification Error",
          description: errorMessage,
          variant: "destructive"
        })
      }
      return null
    }
  }, [user]) // Remove toast dependency

  // Mark notifications as read
  const markAsRead = useCallback(async (notificationIds: string[]) => {
    if (!user) return false

    try {
      await api.patch('/api/notifications/mark-read', {
        notificationIds
      })

      // Optimistically update local state
      setState(prev => ({
        ...prev,
        notifications: prev.notifications.map(n =>
          notificationIds.includes(n.id)
            ? { ...n, isRead: true }
            : n
        ),
        unreadCount: prev.unreadCount - notificationIds.length
      }))

      return true
    } catch (error: any) {
      const errorMessage = error.message || 'Failed to mark notifications as read'

      // Only show toast if component is still mounted and not in background
      if (typeof window !== 'undefined' && !document.hidden) {
        toast({
          title: "Error",
          description: errorMessage,
          variant: "destructive"
        })
      }
      return false
    }
  }, [user]) // Remove toast dependency

  // Mark all notifications as read
  const markAllAsRead = useCallback(async () => {
    if (!user) return false

    try {
      await api.patch('/api/notifications/mark-all-read', {})

      setState(prev => ({
        ...prev,
        notifications: prev.notifications.map(n => ({ ...n, isRead: true })),
        unreadCount: 0
      }))

      return true
    } catch (error: any) {
      const errorMessage = error.message || 'Failed to mark all notifications as read'

      // Only show toast if component is still mounted and not in background
      if (typeof window !== 'undefined' && !document.hidden) {
        toast({
          title: "Error",
          description: errorMessage,
          variant: "destructive"
        })
      }
      return false
    }
  }, [user]) // Remove toast dependency

  // Get notification preferences
  const getNotificationPreferences = useCallback(async () => {
    if (!user) return null

    try {
      const response = await api.get('/api/notifications/preferences')
      return response.data?.data || response.data
    } catch (error: any) {
      console.error('Failed to fetch notification preferences:', error)
      return null
    }
  }, [user])

  // Update notification preferences
  const updateNotificationPreferences = useCallback(async (preferences: any) => {
    if (!user) return false

    try {
      await api.put('/api/notifications/preferences', { notifications: preferences })

      // Only show toast if component is still mounted and not in background
      if (typeof window !== 'undefined' && !document.hidden) {
        toast({
          title: "Preferences Updated",
          description: "Your notification preferences have been saved",
          variant: "success"
        })
      }

      return true
    } catch (error: any) {
      const errorMessage = error.message || 'Failed to update preferences'

      // Only show toast if component is still mounted and not in background
      if (typeof window !== 'undefined' && !document.hidden) {
        toast({
          title: "Error",
          description: errorMessage,
          variant: "destructive"
        })
      }
      return false
    }
  }, [user]) // Remove toast dependency

  // Update push token
  const updatePushToken = useCallback(async (token: string) => {
    if (!user) return false

    try {
      await api.put('/api/notifications/push-token', { token })
      return true
    } catch (error: any) {
      console.error('Failed to update push token:', error)
      return false
    }
  }, [user])

  // Request notification permission
  const requestNotificationPermission = useCallback(async () => {
    if (!('Notification' in window)) {
      return false
    }

    try {
      const permission = await Notification.requestPermission()
      return permission === 'granted'
    } catch (error) {
      console.error('Failed to request notification permission:', error)
      return false
    }
  }, [])

  // Socket.IO connection management
  const connectSocket = useCallback(() => {
    if (!user || socketRef.current?.connected) return

    // Check if WebSocket is disabled via environment variable
    if (process.env.NEXT_PUBLIC_DISABLE_WEBSOCKET === 'true') {
      console.log('🔔 Socket.IO disabled via environment configuration')
      return
    }

    // Check if we've had too many failures
    if (wsFailures.current >= maxWsFailures) {
      console.warn('🔔 Socket.IO disabled due to too many failures, using polling instead')
      return
    }

    try {
      const serverUrl = APP_CONFIG.api.baseUrl.replace('http://', 'http://').replace('https://', 'https://')
      const token = localStorage.getItem('grochain_auth_token')

      if (!token) {
        console.warn('🔔 No auth token available for Socket.IO connection')
        return
      }

      console.log('🔔 Attempting Socket.IO connection to:', serverUrl)
      console.log('🔔 Token length:', token?.length || 0)

      // Create Socket.IO connection with proper authentication
      socketRef.current = io(serverUrl, {
        path: '/notifications',
        auth: {
          token: token
        },
        transports: ['websocket', 'polling'],
        timeout: 10000,
        forceNew: true
      })

      // Connection established
      socketRef.current.on('connect', () => {
        console.log('🔔 Socket.IO connected successfully')
        console.log('🔔 Socket ID:', socketRef.current?.id)
        setState(prev => ({ ...prev, connected: true }))
        reconnectAttempts.current = 0
        wsFailures.current = 0 // Reset failure count on successful connection
      })

      // Handle notifications
      socketRef.current.on('notification', (data) => {
        try {
          const rawNotification = data

          // Validate notification data
          if (!rawNotification || !rawNotification.title) {
            console.warn('🔔 Received invalid notification data:', data)
            return
          }

          // Normalize the notification
          const notification = normalizeNotification(rawNotification)

          setState(prev => ({
            ...prev,
            notifications: [notification, ...prev.notifications],
            unreadCount: prev.unreadCount + 1
          }))

          // Only show toast if component is still mounted and not in background
          if (typeof window !== 'undefined' && !document.hidden) {
            toast({
              title: notification.title,
              description: notification.message,
              variant: notification.type === 'error' ? 'destructive' : 'default'
            })
          }
        } catch (error) {
          console.error('🔔 Failed to process notification:', error)
        }
      })

      // Handle connection acknowledgment
      socketRef.current.on('connection_ack', () => {
        console.log('🔔 Socket.IO connection acknowledged by server')
      })

      // Handle disconnection
      socketRef.current.on('disconnect', (reason) => {
        console.log(`🔔 Socket.IO disconnected: ${reason}`)
        setState(prev => ({ ...prev, connected: false }))

        // Track failures for fallback mechanism
        wsFailures.current++

        // Only attempt to reconnect if not intentionally closed and not too many failures
        if (reason !== 'io client disconnect' && reconnectAttempts.current < maxReconnectAttempts && wsFailures.current < maxWsFailures) {
          reconnectAttempts.current++
          const delay = Math.min(1000 * Math.pow(2, reconnectAttempts.current), 30000)

          console.log(`🔄 Scheduling Socket.IO reconnection in ${delay}ms (attempt ${reconnectAttempts.current}/${maxReconnectAttempts})`)

          reconnectTimeoutRef.current = setTimeout(() => {
            console.log(`🔄 Attempting to reconnect Socket.IO (${reconnectAttempts.current}/${maxReconnectAttempts})`)
            connectSocket()
          }, delay)
        } else if (reason === 'io client disconnect') {
          console.log('🔔 Socket.IO connection closed intentionally')
        } else if (wsFailures.current >= maxWsFailures) {
          console.warn('🔔 Socket.IO failed too many times, falling back to polling')
          console.warn('🔔 To re-enable Socket.IO, refresh the page or set NEXT_PUBLIC_DISABLE_WEBSOCKET=false')
        } else {
          console.log('🔔 Socket.IO connection closed, max reconnection attempts reached')
        }
      })

      // Handle connection errors
      socketRef.current.on('connect_error', (error) => {
        console.error('🔔 Socket.IO connection error:', error)
        console.error('🔔 Connection details:', {
          message: error.message,
          reconnectAttempts: reconnectAttempts.current,
          wsFailures: wsFailures.current
        })

        // Increment failure tracking
        wsFailures.current++
      })

    } catch (error) {
      console.error('🔔 Failed to create Socket.IO connection:', error)

      // Provide more context about the connection attempt
      console.error('🔔 Server URL attempted:', APP_CONFIG.api.baseUrl)
      console.error('🔔 User authenticated:', !!user)
      console.error('🔔 Token available:', !!localStorage.getItem('grochain_auth_token'))
      console.error('🔔 Error details:', error instanceof Error ? error.message : String(error))

      // If Socket.IO creation fails, we could fallback to polling
      // For now, we'll just log and continue without Socket.IO
      console.warn('🔔 Continuing without Socket.IO connection - notifications will use polling')
    }
  }, [user]) // Remove toast dependency

  const disconnectSocket = useCallback(() => {
    if (socketRef.current) {
      socketRef.current.disconnect()
      socketRef.current = null
    }

    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current)
      reconnectTimeoutRef.current = null
    }

    setState(prev => ({ ...prev, connected: false }))
  }, [])

  // Initialize notifications and Socket.IO connection
  useEffect(() => {
    if (user) {
      fetchNotifications()

      // Add a small delay before attempting Socket.IO connection
      // This helps ensure the user is fully authenticated
      const socketTimeout = setTimeout(() => {
        connectSocket()
      }, 1000)

      return () => clearTimeout(socketTimeout)
    } else {
      setState(prev => ({
        ...prev,
        notifications: [],
        unreadCount: 0,
        loading: false,
        connected: false
      }))
      disconnectSocket()
    }

    return () => {
      disconnectSocket()
    }
  }, [user, fetchNotifications, connectSocket, disconnectSocket])

  // Refresh notifications periodically
  useEffect(() => {
    if (!user) return

    const interval = setInterval(() => {
      fetchNotifications()
    }, 60000) // Refresh every minute

    return () => clearInterval(interval)
  }, [user, fetchNotifications])

  return {
    ...state,
    fetchNotifications,
    markAsRead,
    markAllAsRead,
    getNotificationPreferences,
    updateNotificationPreferences,
    updatePushToken,
    requestNotificationPermission,
    refetch: fetchNotifications
  }
}
