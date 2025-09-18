import { useState, useCallback, useEffect, useRef } from 'react'

interface ToastOptions {
  title: string
  description?: string
  variant?: 'default' | 'destructive' | 'success'
  duration?: number
  deduplicate?: boolean // Whether to prevent duplicate toasts
}

interface Toast extends ToastOptions {
  id: string
  timestamp: number
}

// Global toast state management
class ToastManager {
  private toasts: Toast[] = []
  private listeners: Array<(toasts: Toast[]) => void> = []
  private timeouts: Map<string, NodeJS.Timeout> = new Map()
  private dedupeMap: Map<string, number> = new Map() // Track recent toasts for deduplication

  private generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2)
  }

  private createDedupeKey(title: string, description?: string): string {
    return `${title}|${description || ''}`
  }

  private notify(): void {
    this.listeners.forEach(listener => listener([...this.toasts]))
  }

  addToast(options: ToastOptions): string {
    const id = this.generateId()
    const dedupeKey = options.deduplicate !== false ? this.createDedupeKey(options.title, options.description) : null
    const now = Date.now()

    // Deduplication logic - prevent showing the same toast within 2 seconds
    if (dedupeKey && this.dedupeMap.has(dedupeKey)) {
      const lastShown = this.dedupeMap.get(dedupeKey)!
      if (now - lastShown < 2000) {
        return id // Return ID but don't actually show the toast
      }
    }

    const newToast: Toast = {
      ...options,
      id,
      timestamp: now,
      duration: options.duration || 4000 // Default to 4 seconds
    }

    // Update dedupe map
    if (dedupeKey) {
      this.dedupeMap.set(dedupeKey, now)
      // Clean up old dedupe entries after 3 seconds
      setTimeout(() => {
        this.dedupeMap.delete(dedupeKey)
      }, 3000)
    }

    this.toasts = [newToast, ...this.toasts].slice(0, 5) // Limit to 5 toasts max
    this.notify()

    // Auto remove toast after duration
    const timeout = setTimeout(() => {
      this.removeToast(id)
    }, newToast.duration)

    this.timeouts.set(id, timeout)

    return id
  }

  removeToast(id: string): void {
    // Clear timeout if it exists
    const timeout = this.timeouts.get(id)
    if (timeout) {
      clearTimeout(timeout)
      this.timeouts.delete(id)
    }

    this.toasts = this.toasts.filter(t => t.id !== id)
    this.notify()
  }

  subscribe(listener: (toasts: Toast[]) => void): () => void {
    this.listeners.push(listener)
    // Immediately notify new listener with current state
    listener([...this.toasts])

    return () => {
      this.listeners = this.listeners.filter(l => l !== listener)
    }
  }

  getToasts(): Toast[] {
    return [...this.toasts]
  }

  clearAll(): void {
    // Clear all timeouts
    this.timeouts.forEach(timeout => clearTimeout(timeout))
    this.timeouts.clear()

    this.toasts = []
    this.notify()
  }
}

// Singleton instance
const toastManager = new ToastManager()

export function useToast() {
  const [toasts, setToasts] = useState<Toast[]>(toastManager.getToasts())
  const unsubscribeRef = useRef<(() => void) | null>(null)

  useEffect(() => {
    unsubscribeRef.current = toastManager.subscribe(setToasts)
    return () => {
      if (unsubscribeRef.current) {
        unsubscribeRef.current()
      }
    }
  }, [])

  const toast = useCallback((options: ToastOptions) => {
    return toastManager.addToast(options)
  }, [])

  const removeToast = useCallback((id: string) => {
    toastManager.removeToast(id)
  }, [])

  const clearAll = useCallback(() => {
    toastManager.clearAll()
  }, [])

  return {
    toasts,
    toast,
    removeToast,
    clearAll
  }
}

// Hook for components that only need to display toasts
export function useToaster() {
  const [toasts, setToasts] = useState<Toast[]>(toastManager.getToasts())
  const unsubscribeRef = useRef<(() => void) | null>(null)

  useEffect(() => {
    unsubscribeRef.current = toastManager.subscribe(setToasts)
    return () => {
      if (unsubscribeRef.current) {
        unsubscribeRef.current()
      }
    }
  }, [])

  return { toasts }
}

