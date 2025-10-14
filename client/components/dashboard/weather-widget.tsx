"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { apiService } from "@/lib/api"
import { useAuthStore } from "@/lib/auth"
import { useToast } from "@/hooks/use-toast"
import { useGeolocation } from "@/hooks/useGeolocation"
import { Cloud, Sun, CloudRain, Wind, Droplets, Calendar, Thermometer, Droplets as HumidityIcon, Navigation, RefreshCw, MapPin, X } from "lucide-react"

export function WeatherWidget() {
  const [weather, setWeather] = useState<any>(null)
  const [forecast, setForecast] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isForecastLoading, setIsForecastLoading] = useState(false)
  const [currentLocation, setCurrentLocation] = useState<string>("")
  const [hasAttemptedFetch, setHasAttemptedFetch] = useState(false)
  const [isForecastOpen, setIsForecastOpen] = useState(false)
  const { toast } = useToast()
  const { user } = useAuthStore()
  const { location: geoLocation, loading: geoLoading, error: geoError, requestLocation } = useGeolocation()

  // Helper function to parse and normalize location - ONLY use stored data as last resort
  const parseLocation = (userObj: any) => {
    // Only use stored location if geolocation completely fails
    let lat: number | null = null
    let lng: number | null = null
    let city = "Current Location"
    let state = "Unknown State"
    let country = "Nigeria"

    if (userObj) {
      // Priority 1: Check profile.coordinates (most accurate)
      if (userObj.profile?.coordinates?.lat && userObj.profile?.coordinates?.lng) {
        lat = userObj.profile.coordinates.lat
        lng = userObj.profile.coordinates.lng
        city = userObj.profile.city || "Current Location"
        state = userObj.profile.state || "Nigeria"
        country = userObj.profile.country || "Nigeria"
        console.log('📍 Using profile coordinates:', { lat, lng, city, state })
        return { lat, lng, city, state, country }
      }

      // Priority 2: Check profile location fields
      if (userObj.profile?.city || userObj.profile?.state) {
        city = userObj.profile.city || city
        state = userObj.profile.state || state
        country = userObj.profile.country || "Nigeria"
        console.log('📍 Using profile location:', { lat, lng, city, state })
        return { lat, lng, city, state, country }
      }

      // Priority 3: Check simple location field
      if (userObj.location) {
        const trimmedLocation = userObj.location.trim()

        // Check if location contains coordinates (lat,lng format)
        const coordMatch = trimmedLocation.match(/(-?\d+\.?\d*),?\s*(-?\d+\.?\d*)/)
        if (coordMatch) {
          lat = parseFloat(coordMatch[1])
          lng = parseFloat(coordMatch[2])
          city = "Current Location"
          state = "Nigeria"
          console.log('📍 Using location coordinates:', { lat, lng, city, state })
          return { lat, lng, city, state, country }
        } else {
          // Parse city, state format
          const parts = trimmedLocation.split(',').map((p: string) => p.trim())
          if (parts.length >= 2) {
            city = parts[0]
            state = parts[1]
          } else if (parts.length === 1) {
            city = parts[0]
            // Try to infer state from major Nigerian cities
            const cityToState: { [key: string]: string } = {
              'Lagos': 'Lagos',
              'Abuja': 'FCT',
              'Kano': 'Kano',
              'Ibadan': 'Oyo',
              'Port Harcourt': 'Rivers',
              'Benin City': 'Edo',
              'Kaduna': 'Kaduna',
              'Enugu': 'Enugu',
              'Ilorin': 'Kwara',
              'Abeokuta': 'Ogun',
              'Jos': 'Plateau',
              'Ile-Ife': 'Osun',
              'Ogbomosho': 'Oyo',
              'Iseyin': 'Oyo',
              'Iwo': 'Osun'
            }
            state = cityToState[city] || city
          }
          console.log('📍 Using simple location:', { lat, lng, city, state })
          return { lat, lng, city, state, country }
        }
      }
    }

    // Return null coordinates to force geolocation usage
    console.log('📍 No stored location found, will use geolocation')
    return { lat: null, lng: null, city, state, country }
  }

  useEffect(() => {
    const fetchWeather = async () => {
      // Prevent multiple simultaneous fetches
      if (hasAttemptedFetch && isLoading) {
        console.log('⏳ Weather fetch already in progress, skipping...')
        return
      }

      try {
        setIsLoading(true)
        setHasAttemptedFetch(true)

        // Priority 1: ALWAYS use actual current location from geolocation API
        let locationData: any = null

        if (geoLocation && !geoLoading && !geoError) {
          console.log('🎯 Using actual current location from geolocation:', geoLocation)
          locationData = {
            lat: geoLocation.lat,
            lng: geoLocation.lng,
            city: geoLocation.city || 'Current Location',
            state: geoLocation.state || 'Unknown State',
            country: geoLocation.country || 'Nigeria'
          }
        } else if (geoLoading) {
          // If geolocation is still loading, wait for it - NO FALLBACK
          console.log('⏳ Geolocation in progress, waiting for real location...')
          setIsLoading(false)
          return
        } else if (geoError) {
          // If geolocation failed, show error - NO FALLBACK
          console.log('❌ Geolocation failed, showing error')
          toast({
            title: "Location Required",
            description: "Unable to get your location. Please enable location permissions and refresh the page.",
            variant: "destructive"
          })
          setIsLoading(false)
          return
        } else {
          // Only use stored data if geolocation is completely unavailable
          console.log('📁 Using stored location data as last resort')
          console.log('👤 User data:', {
            id: user?._id,
            name: user?.name,
            location: user?.location,
            profile: user?.profile ? {
              city: user.profile.city,
              state: user.profile.state,
              country: user.profile.country,
              coordinates: user.profile.coordinates
            } : 'No profile data',
            hasLocation: !!user?.location,
            hasProfileLocation: !!(user?.profile?.city || user?.profile?.state)
          })

          // Parse user's stored location
          locationData = parseLocation(user)
          
          // If no valid coordinates found, request geolocation
          if (!locationData.lat || !locationData.lng) {
            console.log('📍 No valid coordinates found, requesting geolocation...')
            requestLocation()
            setIsLoading(false)
            return
          }
        }

        console.log('📍 Final location data:', locationData)

        const { lat, lng, city, state, country } = locationData

        // Store current location for comparison
        const locationKey = `${lat},${lng},${city},${state}`
        setCurrentLocation(locationKey)

        console.log('🌤️ Fetching weather for:', { lat, lng, city, state, country })

        // Add a small delay to prevent rapid requests
        await new Promise(resolve => setTimeout(resolve, 100))

        const response = await apiService.getCurrentWeather({ lat, lng, city, state, country })

        if (response.status === 'success' && response.data) {
          const d = response.data
          console.log('🌤️ Weather data received:', d)

        const mapped = {
          location: `${(d.location as any)?.city || city}, ${(d.location as any)?.state || state}, ${(d.location as any)?.country || country}`,
          current: {
              temperature: Math.round(d.current?.temperature ?? 0),
            humidity: d.current?.humidity ?? 0,
              windSpeed: Math.round(d.current?.windSpeed ?? 0),
              description: (d.current as any)?.weatherCondition || (d.current as any)?.condition || "Clear",
              weatherIcon: (d.current as any)?.weatherIcon || "",
              feelsLike: Math.round((d.current as any)?.feelsLike ?? 0),
          },
          agriculturalInsights: {
              plantingRecommendations: (d as any).agricultural?.plantingRecommendation ?
                [(d as any).agricultural.plantingRecommendation] : [],
            harvestingRecommendations: [],
            irrigationAdvice: (d as any).agricultural?.irrigationAdvice || "",
            pestWarnings: [],
          },
        }
        setWeather(mapped)
        } else {
          throw new Error('Weather API returned unsuccessful response')
        }
      } catch (error: any) {
        console.error('❌ Weather fetch failed:', error)

        // Show user-friendly error message
        const locationData = parseLocation(user?.location || "")
        setWeather({
          location: user?.location ? `${locationData.city}, ${locationData.state}, Nigeria` : `${locationData.city}, ${locationData.state}, Nigeria`,
          current: {
            temperature: 0,
            humidity: 0,
            windSpeed: 0,
            description: "Weather data unavailable",
            weatherIcon: "",
            feelsLike: 0,
          },
          agriculturalInsights: {
            plantingRecommendations: ["Weather data currently unavailable. Please check your connection."],
            harvestingRecommendations: [],
            irrigationAdvice: "Unable to provide irrigation advice at this time",
            pestWarnings: [],
          },
        })

        toast({
          title: "Weather Data Unavailable",
          description: "Unable to fetch current weather data. Please try again later.",
          variant: "destructive",
        })
      } finally {
        setIsLoading(false)
      }
    }

    // Only fetch if we haven't attempted yet
    if (!hasAttemptedFetch) {
      if (geoLocation) {
        // If we have geolocation, use it immediately
        console.log('🌤️ Starting weather fetch with geolocation:', {
          hasGeoLocation: !!geoLocation,
          geoLoading,
          geoError,
          hasAttemptedFetch
        })
        fetchWeather()
      } else if (geoLoading) {
        // If geolocation is loading, wait for it
        console.log('🌤️ Waiting for geolocation to complete...')
        setIsLoading(false)
      } else if (user && geoError) {
        // Only use stored data if geolocation failed
        console.log('🌤️ Starting weather fetch with stored data after geolocation failed:', {
          hasUser: !!user,
          hasGeoLocation: !!geoLocation,
          geoLoading,
          geoError,
          hasAttemptedFetch
        })
        fetchWeather()
      } else {
        console.log('🌤️ No user data or geolocation available for weather fetch')
        setIsLoading(false)
      }
    }
  }, [user?._id, user?.location, geoLocation, geoLoading, geoError, hasAttemptedFetch, toast])

  const handleRefresh = () => {
    console.log('🔄 Manual refresh requested')
    // Prevent rapid refreshes
    if (isLoading) {
      console.log('⏳ Refresh already in progress, skipping...')
      return
    }
    setHasAttemptedFetch(false)
    setIsLoading(true)
  }

  const fetchForecast = async () => {
    // Check if we have any location data
    if (!user && !geoLocation) {
      toast({
        title: "Location Required",
        description: "Unable to determine your location for weather forecast.",
        variant: "destructive",
      })
      return
    }

    setIsForecastLoading(true)
    try {
      // Use same location priority as main weather fetch
      let locationData: any = null

      if (geoLocation && !geoLoading && !geoError) {
        console.log('🎯 Using actual current location for forecast:', geoLocation)
        locationData = {
          lat: geoLocation.lat,
          lng: geoLocation.lng,
          city: geoLocation.city || 'Current Location',
          state: geoLocation.state || 'Unknown State',
          country: geoLocation.country || 'Nigeria'
        }
      } else if (geoLoading) {
        // If geolocation is still loading, wait for it
        console.log('⏳ Geolocation in progress for forecast, waiting...')
        setIsForecastLoading(false)
        return
      } else if (geoError) {
        // If geolocation failed, use stored data
        console.log('📁 Using stored location data for forecast after geolocation failed')
        locationData = parseLocation(user)
      } else {
        console.log('📁 Using stored location data for forecast')
        locationData = parseLocation(user)
      }

      const { lat, lng, city, state, country } = locationData

      console.log('🌤️ Fetching forecast for:', { lat, lng, city, state, country })

      const response = await apiService.getWeatherForecast({ lat, lng, city, state, country, days: 5 })

      if (response.status === 'success' && response.data) {
        console.log('🌤️ Forecast data received:', response.data)
        const forecastData = response.data.forecast || response.data || []
        setForecast(Array.isArray(forecastData) ? forecastData.slice(0, 5) : [])
      } else {
        throw new Error('Forecast API returned unsuccessful response')
      }
    } catch (error: any) {
      console.error('❌ Forecast fetch failed:', error)
      setForecast([]) // Clear any existing forecast data
      toast({
        title: "Forecast Unavailable",
        description: error.message || "Unable to fetch weather forecast data. Please try again later.",
        variant: "destructive",
      })
    } finally {
      setIsForecastLoading(false)
    }
  }

  const getWeatherIcon = (description: string) => {
    const desc = description?.toLowerCase() || ""
    if (desc.includes("rain") || desc.includes("drizzle")) return CloudRain
    if (desc.includes("cloud")) return Cloud
    if (desc.includes("sun") || desc.includes("clear")) return Sun
    return Cloud
  }

  const formatDayName = (date: Date) => {
    const today = new Date()
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)

    if (date.toDateString() === today.toDateString()) return "Today"
    if (date.toDateString() === tomorrow.toDateString()) return "Tomorrow"

    return date.toLocaleDateString('en-US', { weekday: 'short' })
  }

  if (isLoading || geoLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Weather</CardTitle>
          <CardDescription>
            {geoLoading ? "Detecting your location..." : "Loading weather data..."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-3">
            <div className="h-4 bg-muted rounded w-3/4" />
            <div className="h-8 bg-muted rounded w-1/2" />
            <div className="h-4 bg-muted rounded w-full" />
          </div>
        </CardContent>
      </Card>
    )
  }

  // Debug logging
  console.log('🌤️ Weather widget render:', {
    isLoading,
    hasAttemptedFetch,
    weather: weather ? 'present' : 'null',
    geoLocation: geoLocation ? 'present' : 'null',
    geoLoading,
    geoError
  })

  const WeatherIcon = getWeatherIcon(weather?.current?.description || "")

  // Show error state if no weather data and not loading
  if (!weather && !isLoading && !geoLoading) {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Weather</CardTitle>
              <CardDescription>
                {geoError ? "Location access denied" : "Unable to load weather data"}
              </CardDescription>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleRefresh}
              disabled={isLoading}
              title="Refresh weather data"
            >
              <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <Cloud className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground mb-4">
              {geoError ? "Please enable location permissions" : "Weather data unavailable"}
            </p>
            <Button onClick={handleRefresh} disabled={isLoading}>
              {isLoading ? 'Loading...' : 'Try Again'}
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="overflow-hidden w-full">
      <CardHeader className="overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 min-w-0">
          <div className="min-w-0 flex-1">
            <CardTitle className="flex items-center gap-2 text-sm sm:text-base">
              Weather
              {geoLoading && <div className="animate-spin rounded-full h-3 w-3 sm:h-4 sm:w-4 border-b-2 border-gray-900"></div>}
            </CardTitle>
            <CardDescription className="flex items-center gap-2 text-xs sm:text-sm min-w-0">
              {geoLocation ? (
                <>
                  <Navigation className="h-3 w-3 text-green-500 flex-shrink-0" />
                  <span className="truncate min-w-0 flex-1">{weather?.location} (Live)</span>
                </>
              ) : (
                <>
                  <MapPin className="h-3 w-3 text-muted-foreground flex-shrink-0" />
                  <span className="truncate min-w-0 flex-1">{weather?.location} (Stored)</span>
                </>
              )}
            </CardDescription>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleRefresh}
            disabled={isLoading || geoLoading}
            title="Refresh weather data"
            className="flex-shrink-0"
          >
            <RefreshCw className={`h-4 w-4 ${isLoading || geoLoading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="overflow-hidden">
        <div className="space-y-4">
          {/* Current Weather */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2 sm:space-x-3">
              <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                <WeatherIcon className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-xl sm:text-2xl font-bold">{weather?.current?.temperature}°C</div>
                <div className="text-xs sm:text-sm text-muted-foreground capitalize truncate">{weather?.current?.description}</div>
              </div>
            </div>
          </div>

          {/* Weather Details */}
          <div className="grid grid-cols-2 gap-3 sm:gap-4 text-xs sm:text-sm">
            <div className="flex items-center space-x-2">
              <Droplets className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground flex-shrink-0" />
              <span className="truncate">{weather?.current?.humidity}% humidity</span>
            </div>
            <div className="flex items-center space-x-2">
              <Wind className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground flex-shrink-0" />
              <span className="truncate">{weather?.current?.windSpeed} km/h</span>
            </div>
          </div>

          {/* Agricultural Insights */}
          <div className="space-y-2">
            <h4 className="font-medium text-xs sm:text-sm">Farming Insights</h4>
            <div className="space-y-1">
              {weather?.current?.temperature > 0 ? (
                // Generate intelligent insights based on real weather data
                <>
                  <div className="text-xs text-muted-foreground flex items-start space-x-1">
                    <div className="h-1 w-1 rounded-full bg-primary mt-1.5 flex-shrink-0" />
                    <span className="break-words leading-relaxed">
                      {weather.current.temperature > 30
                        ? "🔥 High temps - provide shade and increase irrigation"
                        : weather.current.temperature > 25
                        ? "🌡️ Warm conditions - monitor heat stress in crops"
                        : weather.current.temperature < 15
                        ? "❄️ Cool temps - protect frost-sensitive crops"
                        : "✅ Optimal temperatures for crop growth"
                      }
                    </span>
                  </div>
                  <div className="text-xs text-muted-foreground flex items-start space-x-1">
                    <div className="h-1 w-1 rounded-full bg-primary mt-1.5 flex-shrink-0" />
                    <span className="break-words leading-relaxed">
                      {weather.current.humidity > 80
                        ? "💧 High humidity - monitor for fungal diseases"
                        : weather.current.humidity > 70
                        ? "💧 Elevated humidity - watch for pest activity"
                        : weather.current.humidity < 40
                        ? "🏜️ Low humidity - increase irrigation frequency"
                        : "✅ Good humidity levels for crop health"
                      }
                    </span>
                  </div>
                  <div className="text-xs text-muted-foreground flex items-start space-x-1">
                    <div className="h-1 w-1 rounded-full bg-primary mt-1.5 flex-shrink-0" />
                    <span className="break-words leading-relaxed">
                      {weather.current.windSpeed > 15
                        ? "🌪️ Strong winds - secure young plants"
                        : weather.current.windSpeed > 8
                        ? "💨 Moderate winds - good for pest control"
                        : "🌬️ Light winds - ideal farming conditions"
                      }
                    </span>
                  </div>
                </>
              ) : (
                <div className="text-xs text-muted-foreground flex items-start space-x-1">
                  <div className="h-1 w-1 rounded-full bg-muted mt-1.5 flex-shrink-0" />
                  <span className="break-words">Weather data required for farming insights</span>
                </div>
              )}
            </div>
          </div>

          <Dialog open={isForecastOpen} onOpenChange={setIsForecastOpen}>
            <DialogTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className="w-full bg-transparent text-xs sm:text-sm"
                onClick={() => {
                  fetchForecast()
                  setIsForecastOpen(true)
                }}
                disabled={isForecastLoading}
              >
                {isForecastLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-3 w-3 sm:h-4 sm:w-4 border-b-2 border-gray-900 mr-2"></div>
                    <span className="hidden sm:inline">Loading...</span>
                    <span className="sm:hidden">Loading...</span>
                  </>
                ) : (
                  <>
                    <Calendar className="h-3 w-3 sm:h-4 sm:w-4 mr-2" />
                    <span className="hidden sm:inline">View Forecast</span>
                    <span className="sm:hidden">Forecast</span>
                  </>
                )}
          </Button>
            </DialogTrigger>
            <DialogContent className="max-w-sm sm:max-w-md md:max-w-2xl lg:max-w-4xl w-[95vw] sm:w-full max-h-[90vh] overflow-hidden flex flex-col mx-2 sm:mx-0">
              <DialogHeader className="flex-shrink-0">
                <div className="flex items-center justify-between">
                  <div>
                    <DialogTitle className="text-base sm:text-lg">5-Day Weather Forecast</DialogTitle>
                    <DialogDescription className="text-sm">
                      Weather forecast for {weather?.location || "your location"}
                    </DialogDescription>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsForecastOpen(false)}
                    className="h-8 w-8 p-0 flex-shrink-0"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </DialogHeader>

              <div className="flex-1 overflow-y-auto px-1">
                <div className="grid gap-3 sm:gap-4 grid-cols-1 xs:grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 pb-4">
                {forecast.map((day: any, index: number) => {
                  const WeatherIcon = getWeatherIcon(day.weatherCondition || day.weatherIcon)
                  const dayDate = new Date(day.date || Date.now() + index * 24 * 60 * 60 * 1000)

                  return (
                    <Card key={index} className="text-center h-full">
                      <CardHeader className="pb-2 px-3 sm:px-4">
                        <CardTitle className="text-xs sm:text-sm font-medium">
                          {formatDayName(dayDate)}
                        </CardTitle>
                        <div className="flex justify-center">
                          <WeatherIcon className="h-6 w-6 sm:h-8 sm:w-8 text-primary" />
                        </div>
                      </CardHeader>
                      <CardContent className="pt-0 px-3 sm:px-4 pb-3 sm:pb-4">
                        <div className="space-y-1.5 sm:space-y-2">
                          <div className="flex justify-between items-center text-xs sm:text-sm">
                            <Thermometer className="h-3 w-3 sm:h-4 sm:w-4 text-red-500 flex-shrink-0" />
                            <span className="font-medium text-xs sm:text-sm">
                              {Math.round(day.temperature?.max || day.highTemp || 25)}°
                            </span>
                          </div>
                          <div className="flex justify-between items-center text-xs sm:text-sm">
                            <Thermometer className="h-3 w-3 sm:h-4 sm:w-4 text-blue-500 flex-shrink-0" />
                            <span className="text-muted-foreground text-xs sm:text-sm">
                              {Math.round(day.temperature?.min || day.lowTemp || 20)}°
                            </span>
                          </div>
                          <div className="flex justify-between items-center text-xs sm:text-sm">
                            <HumidityIcon className="h-3 w-3 sm:h-4 sm:w-4 text-blue-400 flex-shrink-0" />
                            <span className="text-muted-foreground text-xs sm:text-sm">
                              {day.humidity || 65}%
                            </span>
                          </div>
                          {day.precipitation > 0 && (
                            <div className="flex justify-between items-center text-xs sm:text-sm">
                              <CloudRain className="h-3 w-3 sm:h-4 sm:w-4 text-blue-600 flex-shrink-0" />
                              <span className="text-muted-foreground text-xs sm:text-sm">
                                {Math.round(day.precipitation)}mm
                              </span>
                            </div>
                          )}
                        </div>
                        <div className="mt-2 text-xs text-muted-foreground capitalize break-words">
                          {day.weatherCondition || "Clear"}
                        </div>
                      </CardContent>
                    </Card>
                  )
                })}
                </div>

                {forecast.length === 0 && !isForecastLoading && (
                  <div className="text-center py-6 sm:py-8">
                    <Calendar className="h-10 w-10 sm:h-12 sm:w-12 text-muted-foreground mx-auto mb-3 sm:mb-4" />
                    <p className="text-sm text-muted-foreground">No forecast data available</p>
                  </div>
                )}
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </CardContent>
    </Card>
  )
}
