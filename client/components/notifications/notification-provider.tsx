"use client"

import { createContext, useContext, ReactNode } from 'react'
import { useNotifications } from '@/hooks/use-notifications'
import { WebSocketErrorBoundary } from './websocket-error-boundary'

type NotificationContextType = ReturnType<typeof useNotifications>

const NotificationContext = createContext<NotificationContextType | undefined>(undefined)

interface NotificationProviderProps {
  children: ReactNode
}

export function NotificationProvider({ children }: NotificationProviderProps) {
  const notificationData = useNotifications()

  return (
    <WebSocketErrorBoundary>
      <NotificationContext.Provider value={notificationData}>
        {children}
      </NotificationContext.Provider>
    </WebSocketErrorBoundary>
  )
}

export function useNotificationContext() {
  const context = useContext(NotificationContext)
  if (context === undefined) {
    throw new Error('useNotificationContext must be used within a NotificationProvider')
  }
  return context
}
