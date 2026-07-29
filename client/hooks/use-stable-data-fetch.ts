"use client"

import { useCallback, useRef, useState } from "react"

/**
 * Separates first-load skeleton from background refresh so lists do not unmount/flicker.
 * Stale responses are ignored via generation counter.
 */
export function useStableDataFetch() {
  const hasLoadedOnceRef = useRef(false)
  const generationRef = useRef(0)
  const [isInitialLoading, setIsInitialLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)

  const begin = useCallback(() => {
    const generation = ++generationRef.current
    if (!hasLoadedOnceRef.current) {
      setIsInitialLoading((prev) => (prev ? prev : true))
    } else {
      setIsRefreshing((prev) => (prev ? prev : true))
    }
    return generation
  }, [])

  const finish = useCallback((generation: number) => {
    if (generation !== generationRef.current) return false
    hasLoadedOnceRef.current = true
    setIsInitialLoading((prev) => (prev ? false : prev))
    setIsRefreshing((prev) => (prev ? false : prev))
    return true
  }, [])

  const reset = useCallback(() => {
    hasLoadedOnceRef.current = false
    generationRef.current += 1
    setIsInitialLoading(true)
    setIsRefreshing(false)
  }, [])

  return {
    isInitialLoading,
    isRefreshing,
    begin,
    finish,
    reset,
    hasLoadedOnce: hasLoadedOnceRef.current,
  }
}
