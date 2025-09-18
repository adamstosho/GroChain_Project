'use client'

import { useEffect } from 'react'
import { suppressDatadogWarnings } from '@/lib/utils'

export function DatadogSuppressor() {
  useEffect(() => {
    suppressDatadogWarnings()
  }, [])

  return null // This component doesn't render anything
}
