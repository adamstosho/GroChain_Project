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
    console.warn = (...args) => {
      // Suppress Datadog storage warnings
      if (args[0] && typeof args[0] === 'string' &&
          (args[0].includes('Datadog Browser SDK') ||
           args[0].includes('No storage available'))) {
        return // Suppress the warning
      }
      originalWarn.apply(console, args)
    }
  }
}
