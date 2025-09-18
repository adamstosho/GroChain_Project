"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { DashboardLayout } from "@/components/dashboard/dashboard-layout"
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
  'clear': { icon: Sun, color: 'text-yellow-500', bg: 'bg-yellow-100' },
  'partly-cloudy': { icon: Cloudy, color: 'text-blue-500', bg: 'bg-blue-100' },
  'cloudy': { icon: Cloud, color: 'text-gray-500', bg: 'bg-gray-100' },
  'rainy': { icon: CloudRain, color: 'text-blue-600', bg: 'bg-blue-100' },
  'stormy': { icon: Zap, color: 'text-purple-600', bg: 'bg-purple-100' },
  'windy': { icon: Wind, color: 'text-green-500', bg: 'bg-green-100' }
}

const alertColors = {
  severe: 'bg-red-100 text-red-800 border-red-200',
  warning: 'bg-amber-100 text-amber-800 border-amber-200',
  watch: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  advisory: 'bg-blue-100 text-blue-800 border-blue-200'
}

const priorityColors = {
  low: 'bg-green-100 text-green-800',
  medium: 'bg-amber-100 text-amber-800',
  high: 'bg-red-100 text-red-800'
}

export default function WeatherPage() {
  const [currentWeather, setCurrentWeather] = useState<CurrentWeather | null>(null)
  const [forecast, setForecast] = useState<WeatherForecast[]>([])
  const [alerts, setAlerts] = useState<WeatherAlert[]>([])
  const [recommendations, setRecommendations] = useState<FarmingRecommendation[]>([])
  const [stats, setStats] = useState<WeatherStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('overview')
  const [location, setLocation] = useState('Farm Location')
  const { toast } = useToast()

  useEffect(() => {
    fetchWeatherData()
  }, [])

  const fetchWeatherData = async () => {
    try {
      setLoading(true)
      
      // Mock data for now - replace with actual API call
      const mockCurrentWeather: CurrentWeather = {
        temperature: 28,
        feelsLike: 31,
        humidity: 65,
        windSpeed: 12,
        windDirection: 'SE',
        pressure: 1013,
        visibility: 10,
        uvIndex: 7,
        condition: 'partly-cloudy',
        icon: 'partly-cloudy',
        lastUpdated: new Date().toISOString()
      }

      const mockForecast: WeatherForecast[] = [
        { date: '2024-01-16', high: 30, low: 22, condition: 'clear', icon: 'clear', precipitation: 0, humidity: 60, windSpeed: 8 },
        { date: '2024-01-17', high: 29, low: 21, condition: 'partly-cloudy', icon: 'partly-cloudy', precipitation: 5, humidity: 70, windSpeed: 10 },
        { date: '2024-01-18', high: 27, low: 20, condition: 'rainy', icon: 'rainy', precipitation: 25, humidity: 85, windSpeed: 15 },
        { date: '2024-01-19', high: 26, low: 19, condition: 'rainy', icon: 'rainy', precipitation: 30, humidity: 90, windSpeed: 18 },
        { date: '2024-01-20', high: 28, low: 21, condition: 'partly-cloudy', icon: 'partly-cloudy', precipitation: 10, humidity: 75, windSpeed: 12 },
        { date: '2024-01-21', high: 31, low: 23, condition: 'clear', icon: 'clear', precipitation: 0, humidity: 65, windSpeed: 8 },
        { date: '2024-01-22', high: 32, low: 24, condition: 'clear', icon: 'clear', precipitation: 0, humidity: 60, windSpeed: 6 }
      ]

      const mockAlerts: WeatherAlert[] = [
        {
          id: '1',
          type: 'warning',
          title: 'Heavy Rainfall Warning',
          description: 'Heavy rainfall expected in the next 24 hours. Prepare for potential flooding in low-lying areas.',
          severity: 'medium',
          startTime: '2024-01-18T06:00:00Z',
          endTime: '2024-01-19T18:00:00Z',
          affectedAreas: ['North Region', 'Central Region']
        },
        {
          id: '2',
          type: 'advisory',
          title: 'High UV Index Advisory',
          description: 'UV index reaching high levels. Take precautions when working outdoors.',
          severity: 'low',
          startTime: '2024-01-16T10:00:00Z',
          endTime: '2024-01-16T16:00:00Z',
          affectedAreas: ['All Regions']
        }
      ]

      const mockRecommendations: FarmingRecommendation[] = [
        {
          id: '1',
          crop: 'Maize',
          recommendation: 'Delay planting due to expected heavy rainfall',
          priority: 'high',
          weatherFactor: 'Heavy rainfall forecast',
          action: 'Postpone planting by 2-3 days',
          timeframe: 'Next 48 hours'
        },
        {
          id: '2',
          crop: 'Cassava',
          recommendation: 'Ensure proper drainage in fields',
          priority: 'medium',
          weatherFactor: 'Rainfall accumulation',
          action: 'Check and clear drainage channels',
          timeframe: 'Before rainfall'
        },
        {
          id: '3',
          crop: 'Tomato',
          recommendation: 'Protect from high UV exposure',
          priority: 'low',
          weatherFactor: 'High UV index',
          action: 'Use shade cloth during peak hours',
          timeframe: '10 AM - 4 PM'
        }
      ]

      const mockStats: WeatherStats = {
        averageTemperature: 28.5,
        totalPrecipitation: 45,
        averageHumidity: 72,
        windEvents: 3,
        sunnyDays: 4,
        rainyDays: 2
      }

      setCurrentWeather(mockCurrentWeather)
      setForecast(mockForecast)
      setAlerts(mockAlerts)
      setRecommendations(mockRecommendations)
      setStats(mockStats)
    } catch (error) {
      console.error("Failed to fetch weather data:", error)
      toast({
        title: "Error",
        description: "Failed to load weather data. Please try again.",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const handleRefresh = async () => {
    await fetchWeatherData()
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
    return <Cloud className="h-6 w-6 text-gray-500" />
  }

  const getWeatherBackground = (condition: string) => {
    const weather = weatherConditions[condition as keyof typeof weatherConditions]
    return weather ? weather.bg : 'bg-gray-100'
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
              <Card key={i} className="animate-pulse border border-gray-200">
                <CardHeader className="pb-3">
                  <div className="h-5 bg-gray-200 rounded w-3/4"></div>
                  <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                </CardHeader>
                <CardContent>
                  <div className="h-8 bg-gray-200 rounded mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded w-2/3"></div>
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
        {/* Page Header */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="space-y-1">
            <h1 className="text-2xl font-semibold text-gray-900">Weather Dashboard</h1>
            <p className="text-gray-600">
              Monitor weather conditions and get farming recommendations
            </p>
          </div>
          
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleRefresh}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
            <Button variant="outline">
              <MapPin className="h-4 w-4 mr-2" />
              Change Location
            </Button>
          </div>
        </div>

        {/* Current Weather Overview */}
        {currentWeather && (
          <Card className="border border-gray-200">
            <CardContent className="p-6">
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
                <div className="flex items-center gap-6">
                  <div className={`p-4 rounded-full ${getWeatherBackground(currentWeather.condition)}`}>
                    {getWeatherIcon(currentWeather.condition)}
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <h2 className="text-3xl font-bold text-gray-900">
                        {currentWeather.temperature}°C
                      </h2>
                      <span className="text-lg text-gray-600">
                        Feels like {currentWeather.feelsLike}°C
                      </span>
                    </div>
                    <p className="text-xl text-gray-700 capitalize">
                      {currentWeather.condition.replace('-', ' ')}
                    </p>
                    <p className="text-sm text-gray-500">
                      {location} • Last updated {formatTime(currentWeather.lastUpdated)}
                    </p>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                  <div>
                    <div className="flex items-center justify-center gap-1 mb-1">
                      <Droplets className="h-4 w-4 text-blue-500" />
                      <span className="text-sm text-gray-600">Humidity</span>
                    </div>
                    <p className="text-lg font-semibold">{currentWeather.humidity}%</p>
                  </div>
                  <div>
                    <div className="flex items-center justify-center gap-1 mb-1">
                      <Wind className="h-4 w-4 text-green-500" />
                      <span className="text-sm text-gray-600">Wind</span>
                    </div>
                    <p className="text-lg font-semibold">{currentWeather.windSpeed} km/h</p>
                    <p className="text-xs text-gray-500">{currentWeather.windDirection}</p>
                  </div>
                  <div>
                    <div className="flex items-center justify-center gap-1 mb-1">
                      <Eye className="h-4 w-4 text-purple-500" />
                      <span className="text-sm text-gray-600">Visibility</span>
                    </div>
                    <p className="text-lg font-semibold">{currentWeather.visibility} km</p>
                  </div>
                  <div>
                    <div className="flex items-center justify-center gap-1 mb-1">
                      <Shield className="h-4 w-4 text-orange-500" />
                      <span className="text-sm text-gray-600">UV Index</span>
                    </div>
                    <p className="text-lg font-semibold">{currentWeather.uvIndex}</p>
                    <p className="text-xs text-gray-500">
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
                    <AlertTriangle className="h-5 w-5 text-amber-600 mt-0.5 flex-shrink-0" />
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-medium">{alert.title}</h3>
                        <Badge className={priorityColors[alert.severity]}>
                          {alert.severity}
                        </Badge>
                      </div>
                      <p className="text-sm mb-2">{alert.description}</p>
                      <div className="flex items-center gap-4 text-xs text-gray-600">
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
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="forecast">7-Day Forecast</TabsTrigger>
            <TabsTrigger value="recommendations">Farming Tips</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Quick Forecast */}
              <Card className="border border-gray-200">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base font-medium">
                    <Calendar className="h-4 w-4 text-blue-500" />
                    Next 3 Days
                  </CardTitle>
                  <CardDescription>Quick weather outlook</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {forecast.slice(1, 4).map((day, index) => (
                      <div key={index} className="flex items-center justify-between p-3 border border-gray-100 rounded-lg">
                        <div className="flex items-center gap-3">
                          {getWeatherIcon(day.condition)}
                          <div>
                            <div className="font-medium text-sm">{formatDate(day.date)}</div>
                            <div className="text-xs text-gray-500 capitalize">
                              {day.condition.replace('-', ' ')}
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-medium text-sm">{day.high}° / {day.low}°</div>
                          <div className="text-xs text-gray-500">
                            {day.precipitation > 0 ? `${day.precipitation}mm` : 'No rain'}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Farming Recommendations Summary */}
              <Card className="border border-gray-200">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base font-medium">
                    <Leaf className="h-4 w-4 text-green-500" />
                    Top Recommendations
                  </CardTitle>
                  <CardDescription>Weather-based farming advice</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {recommendations.slice(0, 3).map((rec) => (
                      <div key={rec.id} className="p-3 border border-gray-100 rounded-lg">
                        <div className="flex items-start gap-2 mb-2">
                          <Badge className={priorityColors[rec.priority]}>
                            {rec.priority}
                          </Badge>
                          <span className="text-sm font-medium">{rec.crop}</span>
                        </div>
                        <p className="text-sm text-gray-600 mb-2">{rec.recommendation}</p>
                        <div className="text-xs text-gray-500">
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
              <Card className="border border-gray-200">
                <CardHeader>
                  <CardTitle className="text-base font-medium">Weekly Weather Summary</CardTitle>
                  <CardDescription>Key weather metrics for the week</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-6 gap-4 text-center">
                    <div>
                      <div className="text-2xl font-bold text-gray-900">{stats.averageTemperature}°C</div>
                      <div className="text-sm text-gray-600">Avg Temperature</div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-gray-900">{stats.totalPrecipitation}mm</div>
                      <div className="text-sm text-gray-600">Total Rainfall</div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-gray-900">{stats.averageHumidity}%</div>
                      <div className="text-sm text-gray-600">Avg Humidity</div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-gray-900">{stats.windEvents}</div>
                      <div className="text-sm text-gray-600">Wind Events</div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-gray-900">{stats.sunnyDays}</div>
                      <div className="text-sm text-gray-600">Sunny Days</div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-gray-900">{stats.rainyDays}</div>
                      <div className="text-sm text-gray-600">Rainy Days</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Forecast Tab */}
          <TabsContent value="forecast" className="space-y-6">
            <div>
              <h3 className="text-lg font-medium text-gray-900">7-Day Weather Forecast</h3>
              <p className="text-sm text-gray-600">Detailed weather predictions for the week ahead</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {forecast.map((day, index) => (
                <Card key={index} className="border border-gray-200">
                  <CardContent className="p-4 text-center">
                    <div className="mb-3">
                      <div className="text-sm font-medium text-gray-900 mb-1">
                        {index === 0 ? 'Today' : formatDate(day.date)}
                      </div>
                      <div className="flex justify-center mb-2">
                        {getWeatherIcon(day.condition)}
                      </div>
                      <div className="text-xs text-gray-500 capitalize mb-2">
                        {day.condition.replace('-', ' ')}
                      </div>
                    </div>
                    
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">High:</span>
                        <span className="font-medium">{day.high}°C</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Low:</span>
                        <span className="font-medium">{day.low}°C</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Rain:</span>
                        <span className="font-medium">
                          {day.precipitation > 0 ? `${day.precipitation}mm` : '0mm'}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Humidity:</span>
                        <span className="font-medium">{day.humidity}%</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Wind:</span>
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
              <h3 className="text-lg font-medium text-gray-900">Farming Recommendations</h3>
              <p className="text-sm text-gray-600">Weather-based advice for optimal farming decisions</p>
            </div>

            <div className="space-y-4">
              {recommendations.map((rec) => (
                <Card key={rec.id} className="border border-gray-200">
                  <CardContent className="p-6">
                    <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                      <div className="flex-1 space-y-3">
                        <div className="flex items-center gap-3">
                          <Badge className={priorityColors[rec.priority]}>
                            {rec.priority} Priority
                          </Badge>
                          <span className="text-sm text-gray-500">Crop: {rec.crop}</span>
                        </div>
                        
                        <div>
                          <h4 className="font-medium text-gray-900 mb-2">{rec.recommendation}</h4>
                          <p className="text-sm text-gray-600">{rec.action}</p>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                          <div>
                            <span className="text-gray-500">Weather Factor:</span>
                            <div className="font-medium">{rec.weatherFactor}</div>
                          </div>
                          <div>
                            <span className="text-gray-500">Timeframe:</span>
                            <div className="font-medium">{rec.timeframe}</div>
                          </div>
                          <div>
                            <span className="text-gray-500">Priority:</span>
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
              <h3 className="text-lg font-medium text-gray-900">Weather Analytics</h3>
              <p className="text-sm text-gray-600">Historical weather patterns and trends</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Temperature Trends */}
              <Card className="border border-gray-200">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base font-medium">
                    <Thermometer className="h-4 w-4 text-red-500" />
                    Temperature Trends
                  </CardTitle>
                  <CardDescription>Weekly temperature variations</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {forecast.map((day, index) => (
                      <div key={index} className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">
                          {index === 0 ? 'Today' : formatDate(day.date)}
                        </span>
                        <div className="flex items-center gap-2">
                          <div className="w-24 bg-gray-200 rounded-full h-2">
                            <div 
                              className="bg-red-500 h-2 rounded-full" 
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
              <Card className="border border-gray-200">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base font-medium">
                    <Droplets className="h-4 w-4 text-blue-500" />
                    Precipitation Analysis
                  </CardTitle>
                  <CardDescription>Rainfall patterns and predictions</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {forecast.map((day, index) => (
                      <div key={index} className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">
                          {index === 0 ? 'Today' : formatDate(day.date)}
                        </span>
                        <div className="flex items-center gap-2">
                          <div className="w-24 bg-gray-200 rounded-full h-2">
                            <div 
                              className="bg-blue-500 h-2 rounded-full" 
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
