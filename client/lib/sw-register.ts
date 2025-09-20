'use client';

// Service Worker Registration for Production Only (excluding Vercel)
export function registerServiceWorker() {
  if (typeof window === 'undefined') return;
  
  // Check if we're on Vercel
  const isVercel = process.env.VERCEL === '1' || process.env.VERCEL_ENV;
  
  // Only register in production and not on Vercel
  if (process.env.NODE_ENV !== 'production' || isVercel) {
    // Unregister any existing service workers in development or Vercel
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.getRegistrations().then(registrations => {
        registrations.forEach(registration => {
          registration.unregister();
        });
      });
    }
    return;
  }

  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('/sw.js')
        .then((registration) => {
          console.log('✅ Service Worker registered successfully');
          
          // Check for updates
          registration.addEventListener('updatefound', () => {
            const newWorker = registration.installing;
            if (newWorker) {
              newWorker.addEventListener('statechange', () => {
                if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                  // New content is available, notify user
                  if (confirm('New version available! Reload to update?')) {
                    window.location.reload();
                  }
                }
              });
            }
          });
        })
        .catch((registrationError) => {
          console.error('❌ Service Worker registration failed:', registrationError);
        });
    });

    // Listen for messages from service worker
    navigator.serviceWorker.addEventListener('message', (event) => {
      if (event.data && event.data.type === 'CACHE_UPDATED') {
        console.log('📦 Cache updated:', event.data.payload);
      }
    });
  }
}

// Initialize service worker registration
if (typeof window !== 'undefined') {
  registerServiceWorker();
}




