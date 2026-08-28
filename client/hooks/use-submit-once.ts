"use client"

import { useCallback, useRef } from "react"

/**
 * Prevents duplicate form/API submissions from double-clicks or Strict Mode races.
 * Returns [guard, reset] — call guard() at submit start; returns false if already in flight.
 */
export function useSubmitOnce() {
  const inFlightRef = useRef(false)

  const guard = useCallback(() => {
    if (inFlightRef.current) return false
    inFlightRef.current = true
    return true
  }, [])

  const reset = useCallback(() => {
    inFlightRef.current = false
  }, [])

  return { guard, reset, isInFlight: () => inFlightRef.current }
}
