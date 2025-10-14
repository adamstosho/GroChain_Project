import { useState, useEffect } from 'react'

interface GeolocationData {
  lat: number
  lng: number
  city?: string
  state?: string
  country?: string
  accuracy?: number
}

interface GeolocationHookResult {
  location: GeolocationData | null
  loading: boolean
  error: string | null
  requestLocation: () => void
}

export const useGeolocation = (): GeolocationHookResult => {
  const [location, setLocation] = useState<GeolocationData | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [retryCount, setRetryCount] = useState(0)

  // Function to get city/state from coordinates using reverse geocoding
  const reverseGeocode = async (lat: number, lng: number): Promise<{ city?: string; state?: string; country?: string }> => {
    try {
      // Use backend endpoint to avoid CORS issues
      const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'
      const response = await fetch(
        `${backendUrl}/api/weather/reverse-geocode?lat=${lat}&lng=${lng}`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json'
          }
        }
      )

      if (!response.ok) {
        throw new Error(`Reverse geocoding failed: ${response.status}`)
      }

      const result = await response.json()

      if (result.status !== 'success') {
        throw new Error(result.message || 'Reverse geocoding failed')
      }

      const { city, state, country } = result.data

      console.log('🌍 Reverse geocoding result:', { 
        lat, 
        lng, 
        city, 
        state, 
        country,
        fullAddress: result.data.fullAddress 
      })

      return { city, state, country }
    } catch (err) {
      console.error('Reverse geocoding error:', err)
      return { city: 'Current Location', state: 'Unknown State', country: 'Nigeria' }
    }
  }

  const requestLocation = () => {
    if (!navigator.geolocation) {
      setError('Geolocation is not supported by this browser')
      return
    }

    setLoading(true)
    setError(null)

    const options: PositionOptions = {
      enableHighAccuracy: true,
      timeout: 15000, // Increased timeout to 15 seconds
      maximumAge: 300000 // 5 minutes
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const { latitude, longitude, accuracy } = position.coords

          console.log('📍 Got user location:', { latitude, longitude, accuracy })

          // Get city/state information
          const locationDetails = await reverseGeocode(latitude, longitude)

          const locationData: GeolocationData = {
            lat: latitude,
            lng: longitude,
            city: locationDetails.city,
            state: locationDetails.state,
            country: locationDetails.country,
            accuracy
          }

          setLocation(locationData)
          setLoading(false)

          console.log('📍 Complete location data:', locationData)
        } catch (error) {
          console.error('❌ Error processing location data:', error)
          setError('Failed to process location data. Please try again.')
          setLoading(false)
        }
      },
      (err) => {
        // Enhanced error logging with more details
        console.error('❌ Geolocation error:', {
          code: err.code,
          message: err.message,
          error: err,
          timestamp: new Date().toISOString()
        })
        
        let errorMessage = 'Unable to get your location'

        // Handle different error codes with proper constants
        switch (err.code) {
          case 1: // PERMISSION_DENIED
            errorMessage = 'Location access denied. Please enable location permissions in your browser settings.'
            break
          case 2: // POSITION_UNAVAILABLE
            errorMessage = 'Location information is unavailable. Please check your device\'s location services.'
            break
          case 3: // TIMEOUT
            errorMessage = 'Location request timed out. Please try again.'
            break
          default:
            errorMessage = `Location error: ${err.message || 'Unknown error occurred'}`
            break
        }

        setError(errorMessage)
        setLoading(false)
        
        // Auto-retry for certain errors (up to 2 times)
        if (retryCount < 2 && (err.code === 2 || err.code === 3)) {
          console.log(`🔄 Retrying geolocation request (attempt ${retryCount + 1}/2)...`)
          setRetryCount(prev => prev + 1)
          setTimeout(() => {
            requestLocation()
          }, 2000) // Wait 2 seconds before retry
        }
      },
      options
    )
  }

  // Fallback function to get approximate location via IP
  const getFallbackLocation = async () => {
    try {
      console.log('🌐 Attempting IP-based location fallback...')
      const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'
      const response = await fetch(`${backendUrl}/api/weather/ip-location`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      })

      if (response.ok) {
        const result = await response.json()
        if (result.status === 'success') {
          const fallbackLocation: GeolocationData = {
            lat: result.data.lat,
            lng: result.data.lng,
            city: result.data.city || 'Current Location',
            state: result.data.state || 'Unknown State',
            country: result.data.country || 'Nigeria',
            accuracy: 10000 // Low accuracy for IP-based location
          }
          
          console.log('🌐 Fallback location obtained:', fallbackLocation)
          setLocation(fallbackLocation)
          setError(null)
          return true
        }
      }
    } catch (error) {
      console.error('❌ Fallback location failed:', error)
    }
    return false
  }

  // Auto-request location on first load if not already available
  useEffect(() => {
    if (!location && !loading && !error) {
      console.log('🌍 Auto-requesting user location...')
      // Add a small delay to ensure the component is ready
      const timer = setTimeout(() => {
        requestLocation()
      }, 100)
      return () => clearTimeout(timer)
    }
  }, [location, loading, error])

  // Fallback effect - try IP-based location if geolocation fails completely
  useEffect(() => {
    if (error && !location && retryCount >= 2) {
      console.log('🔄 All geolocation attempts failed, trying IP-based fallback...')
      getFallbackLocation()
    }
  }, [error, location, retryCount])

  return {
    location,
    loading,
    error,
    requestLocation
  }
}

