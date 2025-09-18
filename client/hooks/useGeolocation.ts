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
      timeout: 10000,
      maximumAge: 300000 // 5 minutes
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
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
      },
      (err) => {
        console.error('❌ Geolocation error:', err)
        let errorMessage = 'Unable to get your location'

        switch (err.code) {
          case err.PERMISSION_DENIED:
            errorMessage = 'Location access denied. Please enable location permissions.'
            break
          case err.POSITION_UNAVAILABLE:
            errorMessage = 'Location information is unavailable.'
            break
          case err.TIMEOUT:
            errorMessage = 'Location request timed out.'
            break
        }

        setError(errorMessage)
        setLoading(false)
      },
      options
    )
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

  return {
    location,
    loading,
    error,
    requestLocation
  }
}

