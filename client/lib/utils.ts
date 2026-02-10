import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Utility to check if localStorage is available
export function isStorageAvailable(type: 'localStorage' | 'sessionStorage' = 'localStorage'): boolean {
  try {
    const storage = window[type]
    const test = '__storage_test__'
    storage.setItem(test, test)
    storage.removeItem(test)
    return true
  } catch (e) {
    return false
  }
}

// Safe storage wrapper that won't throw errors
export const safeStorage = {
  getItem: (key: string): string | null => {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        return window.localStorage.getItem(key)
      }
      return null
    } catch (e) {
      console.warn('localStorage not available:', e)
      return null
    }
  },

  setItem: (key: string, value: string): void => {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.setItem(key, value)
      }
    } catch (e) {
      console.warn('localStorage not available:', e)
    }
  },

  removeItem: (key: string): void => {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.removeItem(key)
      }
    } catch (e) {
      console.warn('localStorage not available:', e)
    }
  }
}

// Suppress Datadog storage warnings in console
export function suppressDatadogWarnings() {
  if (typeof window !== 'undefined') {
    const originalWarn = console.warn
    const originalLog = console.log
    const originalError = console.error

    const isDatadogMessage = (msg: unknown) =>
      typeof msg === 'string' && (msg.includes('Datadog Browser SDK') || msg.includes('No storage available'))

    console.warn = (...args) => {
      if (args[0] && isDatadogMessage(args[0])) return
      originalWarn.apply(console, args)
    }

    console.log = (...args) => {
      if (args[0] && isDatadogMessage(args[0])) return
      originalLog.apply(console, args)
    }

    console.error = (...args) => {
      if (args[0] && isDatadogMessage(args[0])) return
      originalError.apply(console, args)
    }
  }
}
