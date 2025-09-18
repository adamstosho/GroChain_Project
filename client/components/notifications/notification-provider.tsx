"use client"

import { createContext, useContext, ReactNode } from 'react'
import { useNotifications, Notification } from '@/hooks/use-notifications'

interface NotificationContextType {
  notifications: Notification[]
  unreadCount: number
  loading: boolean
  error: string | null
  connected: boolean
  markAsRead: (notificationIds: string[]) => Promise<boolean>
  markAllAsRead: () => Promise<boolean>
  fetchNotifications: (filters?: any) => Promise<any>
  getNotificationPreferences: () => Promise<any>
  updateNotificationPreferences: (preferences: any) => Promise<boolean>
  updatePushToken: (token: string) => Promise<boolean>
  requestNotificationPermission: () => Promise<boolean>
  refetch: () => Promise<any>
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined)

interface NotificationProviderProps {
  children: ReactNode
}

export function NotificationProvider({ children }: NotificationProviderProps) {
  const notificationData = useNotifications()

  return (
    <NotificationContext.Provider value={notificationData}>
      {children}
    </NotificationContext.Provider>
  )
}

export function useNotificationContext() {
  const context = useContext(NotificationContext)
  if (context === undefined) {
    throw new Error('useNotificationContext must be used within a NotificationProvider')
  }
  return context
}
