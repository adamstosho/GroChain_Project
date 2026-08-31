"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { DashboardLayout } from "@/components/dashboard/dashboard-layout"
import { DashboardPageHeader } from "@/components/dashboard/dashboard-page-header"
import { DashboardPageShell } from "@/components/layout/dashboard-page-shell"
import { Display, Text } from "@/components/ui/typography"
import { apiService } from "@/lib/api"
import { asRecord, getErrorMessage } from "@/lib/error-utils"
import { useAuthStore } from "@/lib/auth"
import { dashboard } from "@/lib/design-system"
import { useToast } from "@/hooks/use-toast"
import {
  Cloud,
  CloudRain,
  Sun,
  Cloudy,
  Wind,
  Thermometer,
  Droplets,
  Eye,
  Calendar,
  AlertTriangle,
  CheckCircle,
  Clock,
  RefreshCw,
  MapPin,
  Leaf,
  Zap,
  Shield
} from "lucide-react"

interface CurrentWeather {
  temperature: number
  feelsLike: number
  humidity: number
  windSpeed: number
  windDirection: string
  pressure: number
  visibility: number
  uvIndex: number
  condition: string
  icon: string
  lastUpdated: string
}

interface WeatherForecast {
  date: string
  high: number
  low: number
  condition: string
  icon: string
  precipitation: number
  humidity: number
  windSpeed: number
}

interface WeatherAlert {
  id: string
  type: 'severe' | 'warning' | 'watch' | 'advisory'
  title: string
  description: string
  severity: 'low' | 'medium' | 'high'
  startTime: string
  endTime: string
  affectedAreas: string[]
}

interface FarmingRecommendation {
  id: string
  crop: string
  recommendation: string
  priority: 'low' | 'medium' | 'high'
  weatherFactor: string
  action: string
  timeframe: string
}

interface WeatherStats {
  averageTemperature: number
  totalPrecipitation: number
  averageHumidity: number
  windEvents: number
  sunnyDays: number
  rainyDays: number
}

const weatherConditions = {
  'clear': { icon: Sun, color: 'text-warning', bg: 'bg-warning/10' },
  'partly-cloudy': { icon: Cloudy, color: 'text-primary', bg: 'bg-primary/10' },
  'cloudy': { icon: Cloud, color: 'text-muted-foreground', bg: 'bg-muted' },
  'rainy': { icon: CloudRain, color: 'text-primary', bg: 'bg-primary/10' },
  'stormy': { icon: Zap, color: 'text-accent', bg: 'bg-accent/10' },
  'windy': { icon: Wind, color: 'text-success', bg: 'bg-success/10' }
}

const alertColors = {
  severe: 'bg-destructive/10 text-destructive border-destructive/10',
  warning: 'bg-warning/10 text-warning border-warning/10',
  watch: 'bg-warning/10 text-warning border-warning/10',
  advisory: 'bg-primary/10 text-primary border-primary/10'
}

const priorityColors = {
  low: 'bg-success/10 text-success',
  medium: 'bg-warning/10 text-warning',
  high: 'bg-destructive/10 text-destructive'
}

const NIGERIAN_CITIES = [
  { name: 'Lagos', state: 'Lagos State', country: 'Nigeria', lat: 6.5244, lng: 3.3792 },
  { name: 'Abuja', state: 'FCT', country: 'Nigeria', lat: 9.0820, lng: 7.3986 },
  { name: 'Kano', state: 'Kano State', country: 'Nigeria', lat: 11.9914, lng: 8.5311 },
  { name: 'Port Harcourt', state: 'Rivers State', country: 'Nigeria', lat: 4.8156, lng: 7.0498 },
  { name: 'Ibadan', state: 'Oyo State', country: 'Nigeria', lat: 7.3775, lng: 3.9470 },
  { name: 'Enugu', state: 'Enugu State', country: 'Nigeria', lat: 6.4584, lng: 7.5083 },
  { name: 'Kaduna', state: 'Kaduna State', country: 'Nigeria', lat: 10.5105, lng: 7.4165 },
  { name: 'Benin City', state: 'Edo State', country: 'Nigeria', lat: 6.3350, lng: 5.6037 }
]

const mapWeatherCondition = (mainCondition: string): string => {
  const cond = (mainCondition || '').toLowerCase()
  if (cond.includes('clear')) return 'clear'
  if (cond.includes('cloud') || cond.includes('overcast')) return 'partly-cloudy'
  if (cond.includes('rain') || cond.includes('drizzle') || cond.includes('shower')) return 'rainy'
  if (cond.includes('thunderstorm') || cond.includes('storm')) return 'stormy'
  if (cond.includes('wind') || cond.includes('mist') || cond.includes('fog') || cond.includes('haze') || cond.includes('dust')) return 'windy'
  return 'clear' // default fallback
}

const generateFarmingRecommendations = (agri: unknown, currentTemp: number): FarmingRecommendation[] => {
  if (!agri || typeof agri !== "object") return []
  const rec = asRecord(agri)
  
  const recs: FarmingRecommendation[] = []
  
  // Soil Moisture Recommendation
  const moisture = typeof rec.soilMoisture === "number" ? rec.soilMoisture : 50
  if (moisture < 40) {
    recs.push({
      id: 'soil-moisture',
      crop: 'General Crops',
      recommendation: 'Low soil moisture level detected',
      priority: 'high',
      weatherFactor: `Soil moisture is at ${Math.round(moisture)}%`,
      action: typeof rec.irrigationAdvice === "string" ? rec.irrigationAdvice : 'Increase irrigation frequency and check soil moisture depth.',
      timeframe: 'Next 24 hours'
    })
  } else if (moisture > 80) {
    recs.push({
      id: 'soil-moisture',
      crop: 'General Crops',
      recommendation: 'High soil moisture level detected',
      priority: 'medium',
      weatherFactor: `Soil moisture is at ${Math.round(moisture)}%`,
      action: 'Reduce irrigation frequency and ensure drainage channels are clear.',
      timeframe: 'Next 48 hours'
    })
  }

  // Planting Recommendation
  recs.push({
    id: 'planting',
    crop: 'All Season Crops',
    recommendation: typeof rec.plantingRecommendation === "string" ? rec.plantingRecommendation : 'Monitor environmental conditions before planting.',
    priority: currentTemp > 35 || currentTemp < 10 ? 'high' : 'low',
    weatherFactor: `Air temperature is ${currentTemp}°C`,
    action: currentTemp > 35 
      ? 'Delay planting or provide shade/mulch to reduce heat stress.' 
      : currentTemp < 10 
      ? 'Delay planting until temperatures rise to optimal growing range.' 
      : 'Proceed with planting scheduled crops, monitoring soil conditions.',
    timeframe: 'Next 3 days'
  })

  // Pest Risk Recommendation
  if (rec.pestRisk === 'high') {
    recs.push({
      id: 'pest-risk',
      crop: 'Cereals & Vegetables',
      recommendation: 'High risk of pest infestation',
      priority: 'high',
      weatherFactor: 'High temperature and humidity levels favor pest proliferation',
      action: 'Perform field inspections and prepare organic or chemical pest control measures.',
      timeframe: 'Next 48 hours'
    })
  } else if (rec.pestRisk === 'medium') {
    recs.push({
      id: 'pest-risk',
      crop: 'Cereals & Vegetables',
      recommendation: 'Moderate risk of pest infestation',
      priority: 'medium',
      weatherFactor: 'Warm and humid conditions present',
      action: 'Monitor crop leaves for signs of pests or disease.',
      timeframe: 'Weekly routine'
    })
  }

  // Frost Risk
  if (rec.frostRisk === 'high') {
    recs.push({
      id: 'frost-risk',
      crop: 'Sensitive Crops',
      recommendation: 'Critical frost risk warning',
      priority: 'high',
      weatherFactor: `Temperature drops near frost point (${currentTemp}°C)`,
      action: 'Cover sensitive young plants or seedlings with frost blankets/mulch.',
      timeframe: 'Tonight/Early Morning'
    })
  }

  // Drought Index
  const drought = typeof rec.droughtIndex === "number" ? rec.droughtIndex : 0
  if (drought > 60) {
    recs.push({
      id: 'drought',
      crop: 'Drought Sensitive Crops',
      recommendation: 'Elevated drought stress risk',
      priority: 'high',
      weatherFactor: `Drought Index is high (${Math.round(drought)})`,
      action: 'Prioritize water supply to critical growth stages, consider mulching.',
      timeframe: 'Ongoing'
    })
  }

  return recs
}

const calculateStats = (forecastList: WeatherForecast[]): WeatherStats => {
  if (!forecastList || forecastList.length === 0) {
    return {
      averageTemperature: 0,
      totalPrecipitation: 0,
      averageHumidity: 0,
      windEvents: 0,
      sunnyDays: 0,
      rainyDays: 0
    }
  }

  let tempSum = 0
  let humiditySum = 0
  let totalPrecipitation = 0
  let windEvents = 0
  let sunnyDays = 0
  let rainyDays = 0

  forecastList.forEach(day => {
    const avgTemp = (day.high + day.low) / 2
    tempSum += avgTemp
    humiditySum += day.humidity
    totalPrecipitation += day.precipitation || 0
    
    if (day.windSpeed > 15) {
      windEvents++
    }
    
    if (day.condition === 'clear') {
      sunnyDays++
    } else if (day.condition === 'rainy' || (day.precipitation && day.precipitation > 0)) {
      rainyDays++
    }
  })

  return {
    averageTemperature: Math.round((tempSum / forecastList.length) * 10) / 10,
    totalPrecipitation: Math.round(totalPrecipitation * 10) / 10,
    averageHumidity: Math.round(humiditySum / forecastList.length),
    windEvents,
    sunnyDays,
    rainyDays
  }
}

export default function WeatherPage() {
  const [currentWeather, setCurrentWeather] = useState<CurrentWeather | null>(null)
  const [forecast, setForecast] = useState<WeatherForecast[]>([])
  const [alerts, setAlerts] = useState<WeatherAlert[]>([])
  const [recommendations, setRecommendations] = useState<FarmingRecommendation[]>([])
  const [stats, setStats] = useState<WeatherStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('overview')
  const [location, setLocation] = useState('Locating farm...')
  const [locationSource, setLocationSource] = useState<'live' | 'ip' | 'stored' | 'manual' | null>(null)
  const [locationUnavailable, setLocationUnavailable] = useState(false)
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null)
  const [locating, setLocating] = useState(false)
  const { toast } = useToast()
  const { user } = useAuthStore()

  useEffect(() => {
    locateAndFetch()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const locateAndFetch = () => {
    setLocating(true)
    setLoading(true)
    setLocationUnavailable(false)
    if (typeof window !== 'undefined' && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const lat = position.coords.latitude
          const lng = position.coords.longitude
          setCoords({ lat, lng })
          setLocationSource('live')
          await loadWeatherForCoords(lat, lng)
        },
        async (error: GeolocationPositionError) => {
          // Native GeolocationPositionError has no enumerable own properties,
          // so logging it directly renders as an empty "{}" in some consoles —
          // log the primitives instead. Denied/unavailable/timed-out is an
          // expected, already-handled outcome (falls back to IP-based location).
          console.warn(`Geolocation unavailable (code ${error.code}): ${error.message || 'falling back to IP-based location'}`)
          toast({
            title: "Using Estimated Location",
            description: "Location permission denied or timed out. Falling back to IP-based location.",
          })
          await loadWeatherFromIP()
        },
        { timeout: 10000, enableHighAccuracy: true, maximumAge: 0 }
      )
    } else {
      loadWeatherFromIP()
    }
  }

  // Real GPS coordinates the farmer saved to their profile — a genuine,
  // exact fallback (not a guess) when live browser geolocation isn't granted.
  const getStoredProfileCoords = (): { lat: number; lng: number } | null => {
    const stored = user?.profile?.coordinates
    if (!stored) return null
    if (typeof stored.lat === "number" && typeof stored.lng === "number") {
      return { lat: stored.lat, lng: stored.lng }
    }
    return null
  }

  const loadWeatherFromIP = async () => {
    try {
      setLocating(true)
      const res = await apiService.getIPLocation()
      if (res.status === 'success' && res.data) {
        const { lat, lng, city, state, country } = res.data
        setCoords({ lat, lng })
        setLocationSource('ip')
        await loadWeatherForCoords(lat, lng, city, state, country)
        return
      }
      throw new Error("Invalid IP location response")
    } catch (err) {
      console.error("Failed to locate via IP:", err)

      // Next best thing: the exact coordinates the farmer saved on their
      // profile, rather than a guessed city that may not even be close.
      const profileCoords = getStoredProfileCoords()
      if (profileCoords) {
        setCoords(profileCoords)
        setLocationSource('stored')
        await loadWeatherForCoords(profileCoords.lat, profileCoords.lng)
        return
      }

      // No real location available from any source — say so instead of
      // silently showing an arbitrary city's weather as if it were theirs.
      setLocating(false)
      setLoading(false)
      setLocationUnavailable(true)
      setLocation('Location unavailable')
      toast({
        title: "Location Unavailable",
        description: "Enable location permissions, or pick a city below, to see accurate weather.",
        variant: "destructive"
      })
    }
  }

  const loadWeatherForCoords = async (
    lat: number,
    lng: number,
    city?: string,
    state?: string,
    country?: string
  ) => {
    try {
      setLoading(true)
      setLocationUnavailable(false)
      let resolvedCity = city
      let resolvedState = state
      let resolvedCountry = country

      if (!resolvedCity || !resolvedState || !resolvedCountry) {
        try {
          const geocodeRes = await apiService.reverseGeocode(lat, lng)
          if (geocodeRes.status === 'success' && geocodeRes.data) {
            const geo = geocodeRes.data as { city?: string; state?: string; country?: string }
            resolvedCity = geo.city
            resolvedState = geo.state
            resolvedCountry = geo.country
          }
        } catch (err) {
          console.error("Reverse geocoding failed, using coordinates as fallback:", err)
        }
      }

      // Final default strings if still unresolved
      resolvedCity = resolvedCity || 'Unknown City'
      resolvedState = resolvedState || 'Unknown State'
      resolvedCountry = resolvedCountry || 'Nigeria'

      const locationLabel = `${resolvedCity}, ${resolvedState}`
      setLocation(locationLabel)

      const weatherRes = await apiService.getCurrentWeather({
        lat,
        lng,
        city: resolvedCity,
        state: resolvedState,
        country: resolvedCountry
      })

      if (weatherRes.status === 'success' && weatherRes.data) {
        const data = asRecord(weatherRes.data)
        
        // Map current weather
        const cur = asRecord(data.current)
        const metadata = asRecord(data.metadata)
        const mappedCurrent: CurrentWeather = {
          temperature: Math.round(typeof cur.temperature === "number" ? cur.temperature : 0),
          feelsLike: Math.round(typeof cur.feelsLike === "number" ? cur.feelsLike : 0),
          humidity: typeof cur.humidity === "number" ? cur.humidity : 0,
          windSpeed: Math.round((typeof cur.windSpeed === "number" ? cur.windSpeed : 0) * 3.6), // Convert m/s to km/h
          windDirection: typeof cur.windDirection === "string" ? cur.windDirection : 'N',
          pressure: typeof cur.pressure === "number" ? cur.pressure : 0,
          visibility: Math.round((typeof cur.visibility === "number" ? cur.visibility : 0) / 1000), // m to km
          uvIndex: typeof cur.uvIndex === "number" ? cur.uvIndex : 0,
          condition: mapWeatherCondition(typeof cur.weatherCondition === "string" ? cur.weatherCondition : ""),
          icon: typeof cur.weatherIcon === "string" ? cur.weatherIcon : '01d',
          lastUpdated: typeof metadata.lastUpdated === "string" ? metadata.lastUpdated : new Date().toISOString()
        }
        
        // Map forecast
        const rawForecast = Array.isArray(data.forecast) ? data.forecast : []
        const mappedForecast: WeatherForecast[] = rawForecast.map((forecast) => {
          const f = asRecord(forecast)
          const high = typeof f.highTemp === "number" ? f.highTemp : typeof f.high === "number" ? f.high : 0
          const low = typeof f.lowTemp === "number" ? f.lowTemp : typeof f.low === "number" ? f.low : 0
          return {
          date: typeof f.date === "string" ? f.date : "",
          high: Math.round(high),
          low: Math.round(low),
          condition: mapWeatherCondition(typeof f.weatherCondition === "string" ? f.weatherCondition : typeof f.condition === "string" ? f.condition : ""),
          icon: typeof f.weatherIcon === "string" ? f.weatherIcon : typeof f.icon === "string" ? f.icon : '01d',
          precipitation: Math.round((typeof f.precipitation === "number" ? f.precipitation : 0) * 10) / 10,
          humidity: typeof f.humidity === "number" ? f.humidity : 0,
          windSpeed: Math.round((typeof f.windSpeed === "number" ? f.windSpeed : 0) * 3.6) // m/s to km/h
        }
        })

        // Map recommendations dynamically
        const mappedRecommendations = generateFarmingRecommendations(
          data.agricultural,
          mappedCurrent.temperature
        )

        // Calculate stats
        const computedStats = calculateStats(mappedForecast)

        // Set states
        setCurrentWeather(mappedCurrent)
        setForecast(mappedForecast)
        setRecommendations(mappedRecommendations)
        setStats(computedStats)
        setAlerts(Array.isArray(data.alerts) ? data.alerts.filter((alert): alert is WeatherAlert => {
          if (!alert || typeof alert !== "object") return false
          const rec = asRecord(alert)
          return typeof rec.id === "string" && typeof rec.title === "string"
        }).map((alert) => {
          const rec = asRecord(alert)
          return {
            id: typeof rec.id === "string" ? rec.id : "",
            type: rec.type === "severe" || rec.type === "warning" || rec.type === "watch" || rec.type === "advisory" ? rec.type : "advisory",
            title: typeof rec.title === "string" ? rec.title : "",
            description: typeof rec.description === "string" ? rec.description : "",
            severity: rec.severity === "low" || rec.severity === "medium" || rec.severity === "high" ? rec.severity : "low",
            startTime: typeof rec.startTime === "string" ? rec.startTime : "",
            endTime: typeof rec.endTime === "string" ? rec.endTime : "",
            affectedAreas: Array.isArray(rec.affectedAreas) ? rec.affectedAreas.filter((area): area is string => typeof area === "string") : [],
          }
        }) : [])
      } else {
        throw new Error("Failed to load weather data from backend API")
      }
    } catch (err) {
      console.error("Error loading weather data:", err)
      toast({
        title: "Weather Load Error",
        description: getErrorMessage(err, "Failed to load real weather data. Please check your connection."),
        variant: "destructive"
      })
    } finally {
      setLoading(false)
      setLocating(false)
    }
  }

  const handleRefresh = async () => {
    if (coords) {
      await loadWeatherForCoords(coords.lat, coords.lng)
    } else {
      locateAndFetch()
    }
    toast({
      title: "Refreshed",
      description: "Weather data has been updated.",
      variant: "default"
    })
  }

  const getWeatherIcon = (condition: string) => {
    const weather = weatherConditions[condition as keyof typeof weatherConditions]
    if (weather) {
      const IconComponent = weather.icon
      return <IconComponent className={`h-6 w-6 ${weather.color}`} />
    }
    return <Cloud className="h-6 w-6 text-muted-foreground" />
  }

  const getWeatherBackground = (condition: string) => {
    const weather = weatherConditions[condition as keyof typeof weatherConditions]
    return weather ? weather.bg : 'bg-muted'
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric'
    })
  }

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  if (loading) {
    return (
      <DashboardLayout pageTitle="Weather">
        <DashboardPageShell>
          <div className={dashboard.statsGrid4}>
            {[...Array(4)].map((_, i) => (
              <Card key={i} className="animate-pulse border border-border">
                <CardHeader className="pb-3">
                  <div className="h-5 bg-muted rounded w-3/4"></div>
                  <div className="h-4 bg-muted rounded w-1/2"></div>
                </CardHeader>
                <CardContent>
                  <div className="h-8 bg-muted rounded mb-2"></div>
                  <div className="h-3 bg-muted rounded w-2/3"></div>
                </CardContent>
              </Card>
            ))}
          </div>
        </DashboardPageShell>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout pageTitle="Weather">
      <DashboardPageShell>
        <DashboardPageHeader
          badge="Weather Monitoring Active"
          title="Weather"
          titleHighlight="Dashboard"
          description={locating ? "Detecting location..." : "Monitor weather conditions and get farming recommendations."}
          actions={
            <>
              <Button variant="outline" size="lg" onClick={handleRefresh} disabled={locating}>
                <RefreshCw className={`mr-2 h-4 w-4 ${locating ? "animate-spin" : ""}`} />
                Refresh
              </Button>

              <Select
                onValueChange={async (val) => {
                  if (val === 'current') {
                    locateAndFetch()
                  } else {
                    const cityObj = NIGERIAN_CITIES.find(c => c.name === val)
                    if (cityObj) {
                      const newCoords = { lat: cityObj.lat, lng: cityObj.lng }
                      setCoords(newCoords)
                      setLocationSource('manual')
                      setLocationUnavailable(false)
                      await loadWeatherForCoords(cityObj.lat, cityObj.lng, cityObj.name, cityObj.state, cityObj.country)
                    }
                  }
                }}
              >
                <SelectTrigger className="w-full sm:w-[210px] bg-card border border-border text-foreground">
                  <MapPin className="h-4 w-4 mr-2 text-success animate-pulse" />
                  <SelectValue placeholder="Change Location" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="current">📍 Detect Location</SelectItem>
                  {NIGERIAN_CITIES.map((city) => (
                    <SelectItem key={city.name} value={city.name}>
                      {city.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </>
          }
        />

        {/* Location unavailable — never silently substitute a wrong city */}
        {locationUnavailable && !currentWeather && (
          <Card className="border border-warning/20 bg-warning/5">
            <CardContent className="p-6 text-center space-y-3">
              <MapPin className="h-10 w-10 text-warning mx-auto" />
              <div>
                <h3 className="font-medium text-foreground">We couldn't detect your exact location</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Enable location permissions in your browser and click Refresh, or pick your city from the dropdown above to see accurate weather.
                </p>
              </div>
              <Button variant="outline" size="sm" onClick={locateAndFetch} disabled={locating}>
                <RefreshCw className={`mr-2 h-4 w-4 ${locating ? "animate-spin" : ""}`} />
                Try Again
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Current Weather Overview */}
        {currentWeather && (
          <Card className="border border-border">
            <CardContent className="p-6">
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
                <div className="flex items-center gap-6">
                  <div className={`p-4 rounded-full ${getWeatherBackground(currentWeather.condition)}`}>
                    {getWeatherIcon(currentWeather.condition)}
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <Display as="h2" variant="page">
                        {currentWeather.temperature}°C
                      </Display>
                      <span className="text-lg text-muted-foreground">
                        Feels like {currentWeather.feelsLike}°C
                      </span>
                    </div>
                    <p className="text-xl text-foreground capitalize">
                      {currentWeather.condition.replace('-', ' ')}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {location}
                      {locationSource === 'live' && ' (Live GPS)'}
                      {locationSource === 'ip' && ' (Approximate — via IP)'}
                      {locationSource === 'stored' && ' (Saved location)'}
                      {locationSource === 'manual' && ' (Selected city)'}
                      {' • '}Last updated {formatTime(currentWeather.lastUpdated)}
                    </p>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                  <div>
                    <div className="flex items-center justify-center gap-1 mb-1">
                      <Droplets className="h-4 w-4 text-primary" />
                      <span className="text-sm text-muted-foreground">Humidity</span>
                    </div>
                    <p className="text-lg font-semibold">{currentWeather.humidity}%</p>
                  </div>
                  <div>
                    <div className="flex items-center justify-center gap-1 mb-1">
                      <Wind className="h-4 w-4 text-success" />
                      <span className="text-sm text-muted-foreground">Wind</span>
                    </div>
                    <p className="text-lg font-semibold">{currentWeather.windSpeed} km/h</p>
                    <p className="text-xs text-muted-foreground">{currentWeather.windDirection}</p>
                  </div>
                  <div>
                    <div className="flex items-center justify-center gap-1 mb-1">
                      <Eye className="h-4 w-4 text-accent" />
                      <span className="text-sm text-muted-foreground">Visibility</span>
                    </div>
                    <p className="text-lg font-semibold">{currentWeather.visibility} km</p>
                  </div>
                  <div>
                    <div className="flex items-center justify-center gap-1 mb-1">
                      <Shield className="h-4 w-4 text-warning" />
                      <span className="text-sm text-muted-foreground">UV Index</span>
                    </div>
                    <p className="text-lg font-semibold">{currentWeather.uvIndex}</p>
                    <p className="text-xs text-muted-foreground">
                      {currentWeather.uvIndex > 7 ? 'High' : currentWeather.uvIndex > 4 ? 'Moderate' : 'Low'}
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Weather Alerts */}
        {alerts.length > 0 && (
          <div className="space-y-3">
            {alerts.map((alert) => (
              <Card key={alert.id} className={`border ${alertColors[alert.type]}`}>
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="h-5 w-5 text-warning mt-0.5 flex-shrink-0" />
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-medium">{alert.title}</h3>
                        <Badge className={priorityColors[alert.severity]}>
                          {alert.severity}
                        </Badge>
                      </div>
                      <p className="text-sm mb-2">{alert.description}</p>
                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <span>From: {formatTime(alert.startTime)}</span>
                        <span>To: {formatTime(alert.endTime)}</span>
                        <span>Areas: {alert.affectedAreas.join(', ')}</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Main Content Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-2 sm:grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="forecast">7-Day Forecast</TabsTrigger>
            <TabsTrigger value="recommendations">Farming Tips</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Quick Forecast */}
              <Card className="border border-border">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base font-medium">
                    <Calendar className="h-4 w-4 text-primary" />
                    Next 3 Days
                  </CardTitle>
                  <CardDescription>Quick weather outlook</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {forecast.slice(1, 4).map((day, index) => (
                      <div key={index} className="flex items-center justify-between p-3 border border-border rounded-lg">
                        <div className="flex items-center gap-3">
                          {getWeatherIcon(day.condition)}
                          <div>
                            <div className="font-medium text-sm">{formatDate(day.date)}</div>
                            <div className="text-xs text-muted-foreground capitalize">
                              {day.condition.replace('-', ' ')}
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-medium text-sm">{day.high}° / {day.low}°</div>
                          <div className="text-xs text-muted-foreground">
                            {day.precipitation > 0 ? `${day.precipitation}mm` : 'No rain'}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Farming Recommendations Summary */}
              <Card className="border border-border">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base font-medium">
                    <Leaf className="h-4 w-4 text-success" />
                    Top Recommendations
                  </CardTitle>
                  <CardDescription>Weather-based farming advice</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {recommendations.slice(0, 3).map((rec) => (
                      <div key={rec.id} className="p-3 border border-border rounded-lg">
                        <div className="flex items-start gap-2 mb-2">
                          <Badge className={priorityColors[rec.priority]}>
                            {rec.priority}
                          </Badge>
                          <span className="text-sm font-medium">{rec.crop}</span>
                        </div>
                        <p className="text-sm text-muted-foreground mb-2">{rec.recommendation}</p>
                        <div className="text-xs text-muted-foreground">
                          <span className="font-medium">Action:</span> {rec.action}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Weather Stats */}
            {stats && (
              <Card className="border border-border">
                <CardHeader>
                  <CardTitle className="text-base font-medium">Weekly Weather Summary</CardTitle>
                  <CardDescription>Key weather metrics for the week</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-6 gap-4 text-center">
                    <div>
                      <Text as="div" variant="stat" className="text-foreground">{stats.averageTemperature}°C</Text>
                      <div className="text-sm text-muted-foreground">Avg Temperature</div>
                    </div>
                    <div>
                      <Text as="div" variant="stat" className="text-foreground">{stats.totalPrecipitation}mm</Text>
                      <div className="text-sm text-muted-foreground">Total Rainfall</div>
                    </div>
                    <div>
                      <Text as="div" variant="stat" className="text-foreground">{stats.averageHumidity}%</Text>
                      <div className="text-sm text-muted-foreground">Avg Humidity</div>
                    </div>
                    <div>
                      <Text as="div" variant="stat" className="text-foreground">{stats.windEvents}</Text>
                      <div className="text-sm text-muted-foreground">Wind Events</div>
                    </div>
                    <div>
                      <Text as="div" variant="stat" className="text-foreground">{stats.sunnyDays}</Text>
                      <div className="text-sm text-muted-foreground">Sunny Days</div>
                    </div>
                    <div>
                      <Text as="div" variant="stat" className="text-foreground">{stats.rainyDays}</Text>
                      <div className="text-sm text-muted-foreground">Rainy Days</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Forecast Tab */}
          <TabsContent value="forecast" className="space-y-6">
            <div>
              <h3 className="text-lg font-medium text-foreground">7-Day Weather Forecast</h3>
              <p className="text-sm text-muted-foreground">Detailed weather predictions for the week ahead</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {forecast.map((day, index) => (
                <Card key={index} className="border border-border">
                  <CardContent className="p-4 text-center">
                    <div className="mb-3">
                      <div className="text-sm font-medium text-foreground mb-1">
                        {index === 0 ? 'Today' : formatDate(day.date)}
                      </div>
                      <div className="flex justify-center mb-2">
                        {getWeatherIcon(day.condition)}
                      </div>
                      <div className="text-xs text-muted-foreground capitalize mb-2">
                        {day.condition.replace('-', ' ')}
                      </div>
                    </div>
                    
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">High:</span>
                        <span className="font-medium">{day.high}°C</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Low:</span>
                        <span className="font-medium">{day.low}°C</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Rain:</span>
                        <span className="font-medium">
                          {day.precipitation > 0 ? `${day.precipitation}mm` : '0mm'}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Humidity:</span>
                        <span className="font-medium">{day.humidity}%</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Wind:</span>
                        <span className="font-medium">{day.windSpeed} km/h</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Recommendations Tab */}
          <TabsContent value="recommendations" className="space-y-6">
            <div>
              <h3 className="text-lg font-medium text-foreground">Farming Recommendations</h3>
              <p className="text-sm text-muted-foreground">Weather-based advice for optimal farming decisions</p>
            </div>

            <div className="space-y-4">
              {recommendations.map((rec) => (
                <Card key={rec.id} className="border border-border">
                  <CardContent className="p-6">
                    <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                      <div className="flex-1 space-y-3">
                        <div className="flex items-center gap-3">
                          <Badge className={priorityColors[rec.priority]}>
                            {rec.priority} Priority
                          </Badge>
                          <span className="text-sm text-muted-foreground">Crop: {rec.crop}</span>
                        </div>
                        
                        <div>
                          <h4 className="font-medium text-foreground mb-2">{rec.recommendation}</h4>
                          <p className="text-sm text-muted-foreground">{rec.action}</p>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                          <div>
                            <span className="text-muted-foreground">Weather Factor:</span>
                            <div className="font-medium">{rec.weatherFactor}</div>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Timeframe:</span>
                            <div className="font-medium">{rec.timeframe}</div>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Priority:</span>
                            <div className="font-medium capitalize">{rec.priority}</div>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex flex-col gap-2">
                        <Button variant="outline" size="sm">
                          <CheckCircle className="h-4 w-4 mr-2" />
                          Mark Complete
                        </Button>
                        <Button variant="outline" size="sm">
                          <Clock className="h-4 w-4 mr-2" />
                          Remind Later
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Analytics Tab */}
          <TabsContent value="analytics" className="space-y-6">
            <div>
              <h3 className="text-lg font-medium text-foreground">Weather Analytics</h3>
              <p className="text-sm text-muted-foreground">Historical weather patterns and trends</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Temperature Trends */}
              <Card className="border border-border">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base font-medium">
                    <Thermometer className="h-4 w-4 text-destructive" />
                    Temperature Trends
                  </CardTitle>
                  <CardDescription>Weekly temperature variations</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {forecast.map((day, index) => (
                      <div key={index} className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">
                          {index === 0 ? 'Today' : formatDate(day.date)}
                        </span>
                        <div className="flex items-center gap-2">
                          <div className="w-24 bg-muted rounded-full h-2">
                            <div 
                              className="bg-destructive h-2 rounded-full" 
                              style={{ width: `${((day.high - 15) / 20) * 100}%` }}
                            ></div>
                          </div>
                          <span className="text-sm font-medium w-12 text-right">
                            {day.high}° / {day.low}°
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Precipitation Analysis */}
              <Card className="border border-border">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base font-medium">
                    <Droplets className="h-4 w-4 text-primary" />
                    Precipitation Analysis
                  </CardTitle>
                  <CardDescription>Rainfall patterns and predictions</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {forecast.map((day, index) => (
                      <div key={index} className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">
                          {index === 0 ? 'Today' : formatDate(day.date)}
                        </span>
                        <div className="flex items-center gap-2">
                          <div className="w-24 bg-muted rounded-full h-2">
                            <div 
                              className="bg-primary h-2 rounded-full" 
                              style={{ width: `${(day.precipitation / 50) * 100}%` }}
                            ></div>
                          </div>
                          <span className="text-sm font-medium w-16 text-right">
                            {day.precipitation}mm
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </DashboardPageShell>
    </DashboardLayout>
  )
}
