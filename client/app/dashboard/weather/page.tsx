"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { DashboardLayout } from "@/components/dashboard/dashboard-layout"
import { DashboardPageHeader } from "@/components/dashboard/dashboard-page-header"
import { apiService } from "@/lib/api"
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
  Navigation,
  Calendar,
  AlertTriangle,
  CheckCircle,
  Clock,
  RefreshCw,
  Download,
  MapPin,
  Crop,
  Leaf,
  Zap,
  Umbrella,
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

const generateFarmingRecommendations = (agri: any, currentTemp: number, currentHumidity: number): FarmingRecommendation[] => {
  if (!agri) return []
  
  const recs: FarmingRecommendation[] = []
  
  // Soil Moisture Recommendation
  const moisture = agri.soilMoisture !== undefined ? agri.soilMoisture : 50
  if (moisture < 40) {
    recs.push({
      id: 'soil-moisture',
      crop: 'General Crops',
      recommendation: 'Low soil moisture level detected',
      priority: 'high',
      weatherFactor: `Soil moisture is at ${Math.round(moisture)}%`,
      action: agri.irrigationAdvice || 'Increase irrigation frequency and check soil moisture depth.',
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
    recommendation: agri.plantingRecommendation || 'Monitor environmental conditions before planting.',
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
  if (agri.pestRisk === 'high') {
    recs.push({
      id: 'pest-risk',
      crop: 'Cereals & Vegetables',
      recommendation: 'High risk of pest infestation',
      priority: 'high',
      weatherFactor: 'High temperature and humidity levels favor pest proliferation',
      action: 'Perform field inspections and prepare organic or chemical pest control measures.',
      timeframe: 'Next 48 hours'
    })
  } else if (agri.pestRisk === 'medium') {
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
  if (agri.frostRisk === 'high') {
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
  const drought = agri.droughtIndex !== undefined ? agri.droughtIndex : 0
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
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null)
  const [locating, setLocating] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    locateAndFetch()
  }, [])

  const locateAndFetch = () => {
    setLocating(true)
    setLoading(true)
    if (typeof window !== 'undefined' && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const lat = position.coords.latitude
          const lng = position.coords.longitude
          setCoords({ lat, lng })
          await loadWeatherForCoords(lat, lng)
        },
        async (error) => {
          console.warn("Geolocation access denied or failed. Falling back to IP-based location...", error)
          toast({
            title: "Using Estimated Location",
            description: "Location permission denied or timed out. Falling back to IP-based location.",
          })
          await loadWeatherFromIP()
        },
        { timeout: 10000, enableHighAccuracy: true }
      )
    } else {
      loadWeatherFromIP()
    }
  }

  const loadWeatherFromIP = async () => {
    try {
      setLocating(true)
      const res = await apiService.getIPLocation()
      if (res.status === 'success' && res.data) {
        const { lat, lng, city, state, country } = res.data
        setCoords({ lat, lng })
        await loadWeatherForCoords(lat, lng, city, state, country)
      } else {
        throw new Error("Invalid IP location response")
      }
    } catch (err) {
      console.error("Failed to locate via IP:", err)
      // Ultimate fallback: Lagos, Nigeria
      const defaultLat = 6.5244
      const defaultLng = 3.3792
      setCoords({ lat: defaultLat, lng: defaultLng })
      await loadWeatherForCoords(defaultLat, defaultLng, "Lagos", "Lagos State", "Nigeria")
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
      let resolvedCity = city
      let resolvedState = state
      let resolvedCountry = country

      if (!resolvedCity || !resolvedState || !resolvedCountry) {
        try {
          const geocodeRes = await apiService.reverseGeocode(lat, lng)
          if (geocodeRes.status === 'success' && geocodeRes.data) {
            resolvedCity = geocodeRes.data.city
            resolvedState = geocodeRes.data.state
            resolvedCountry = geocodeRes.data.country
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
        const data = weatherRes.data as any
        
        // Map current weather
        const cur = data.current
        const mappedCurrent: CurrentWeather = {
          temperature: Math.round(cur.temperature),
          feelsLike: Math.round(cur.feelsLike),
          humidity: cur.humidity,
          windSpeed: Math.round(cur.windSpeed * 3.6), // Convert m/s to km/h
          windDirection: cur.windDirection || 'N',
          pressure: cur.pressure,
          visibility: Math.round(cur.visibility / 1000), // m to km
          uvIndex: cur.uvIndex || 0,
          condition: mapWeatherCondition(cur.weatherCondition),
          icon: cur.weatherIcon || '01d',
          lastUpdated: data.metadata?.lastUpdated || new Date().toISOString()
        }
        
        // Map forecast
        const rawForecast = data.forecast || []
        const mappedForecast: WeatherForecast[] = rawForecast.map((f: any) => ({
          date: f.date,
          high: Math.round(f.highTemp !== undefined ? f.highTemp : f.high),
          low: Math.round(f.lowTemp !== undefined ? f.lowTemp : f.low),
          condition: mapWeatherCondition(f.weatherCondition || f.condition),
          icon: f.weatherIcon || f.icon || '01d',
          precipitation: Math.round((f.precipitation || 0) * 10) / 10,
          humidity: f.humidity,
          windSpeed: Math.round((f.windSpeed || 0) * 3.6) // m/s to km/h
        }))

        // Map recommendations dynamically
        const mappedRecommendations = generateFarmingRecommendations(
          data.agricultural,
          mappedCurrent.temperature,
          mappedCurrent.humidity
        )

        // Calculate stats
        const computedStats = calculateStats(mappedForecast)

        // Set states
        setCurrentWeather(mappedCurrent)
        setForecast(mappedForecast)
        setRecommendations(mappedRecommendations)
        setStats(computedStats)
        setAlerts(data.alerts || [])
      } else {
        throw new Error("Failed to load weather data from backend API")
      }
    } catch (err: any) {
      console.error("Error loading weather data:", err)
      toast({
        title: "Weather Load Error",
        description: err.message || "Failed to load real weather data. Please check your connection.",
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
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
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
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout pageTitle="Weather">
      <div className="space-y-6">
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
                      <h2 className="text-3xl font-bold text-foreground">
                        {currentWeather.temperature}°C
                      </h2>
                      <span className="text-lg text-muted-foreground">
                        Feels like {currentWeather.feelsLike}°C
                      </span>
                    </div>
                    <p className="text-xl text-foreground capitalize">
                      {currentWeather.condition.replace('-', ' ')}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {location} • Last updated {formatTime(currentWeather.lastUpdated)}
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
                      <div className="text-2xl font-bold text-foreground">{stats.averageTemperature}°C</div>
                      <div className="text-sm text-muted-foreground">Avg Temperature</div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-foreground">{stats.totalPrecipitation}mm</div>
                      <div className="text-sm text-muted-foreground">Total Rainfall</div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-foreground">{stats.averageHumidity}%</div>
                      <div className="text-sm text-muted-foreground">Avg Humidity</div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-foreground">{stats.windEvents}</div>
                      <div className="text-sm text-muted-foreground">Wind Events</div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-foreground">{stats.sunnyDays}</div>
                      <div className="text-sm text-muted-foreground">Sunny Days</div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-foreground">{stats.rainyDays}</div>
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
      </div>
    </DashboardLayout>
  )
}
