// Chunk loading retry utility
export function setupChunkRetry() {
  if (typeof window === 'undefined') return

  // Store original fetch
  const originalFetch = window.fetch

  // Override fetch to handle chunk loading errors
  window.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
    try {
      const response = await originalFetch(input, init)
      return response
    } catch (error: any) {
      // Check if it's a chunk loading error
      if (error.message?.includes('Loading chunk') || 
          error.message?.includes('ChunkLoadError') ||
          error.name === 'ChunkLoadError') {
        
        console.log('Chunk loading error detected, retrying...')
        
        // Retry the request after a short delay
        await new Promise(resolve => setTimeout(resolve, 1000))
        
        try {
          return await originalFetch(input, init)
        } catch (retryError) {
          console.error('Chunk retry failed:', retryError)
          // If retry fails, reload the page
          window.location.reload()
          throw retryError
        }
      }
      throw error
    }
  }

  // Handle script loading errors
  const originalCreateElement = document.createElement
  document.createElement = function(tagName: string) {
    const element = originalCreateElement.call(this, tagName)
    
    if (tagName === 'script') {
      element.addEventListener('error', (event) => {
        const target = event.target as HTMLScriptElement
        if (target.src && target.src.includes('_next/static/chunks/')) {
          console.log('Script chunk loading error detected, reloading page...')
          setTimeout(() => {
            window.location.reload()
          }, 1000)
        }
      })
    }
    
    return element
  }
}

// Initialize chunk retry on page load
if (typeof window !== 'undefined') {
  setupChunkRetry()
}

