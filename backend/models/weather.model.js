const mongoose = require('mongoose')

const WeatherDataSchema = new mongoose.Schema({
  location: {
    lat: { type: Number, required: true },
    lng: { type: Number, required: true },
    city: { type: String, required: true },
    state: { type: String, required: true },
    country: { type: String, required: true }
  },
  current: {
    temperature: { type: Number, required: true },
    humidity: { type: Number, required: true },
    windSpeed: { type: Number, default: 0 },
    windDirection: { type: String, default: 'N' },
    pressure: { type: Number, default: 0 },
    visibility: { type: Number, default: 0 },
    uvIndex: { type: Number, default: 0 },
    weatherCondition: { type: String, default: 'Clear' },
    weatherIcon: { type: String, default: '01d' },
    feelsLike: { type: Number, default: 0 },
    dewPoint: { type: Number, default: 0 },
    cloudCover: { type: Number, default: 0 }
  },
  forecast: [{
    date: { type: Date, required: true },
    highTemp: { type: Number, required: true },
    lowTemp: { type: Number, required: true },
    humidity: { type: Number, required: true },
    windSpeed: { type: Number, required: true },
    precipitation: { type: Number, required: true },
    weatherCondition: { type: String, required: true },
    weatherIcon: { type: String, required: true },
    uvIndex: { type: Number, required: true }
  }],
  alerts: [{
    type: { 
      type: String, 
      enum: ['weather', 'climate', 'agricultural'], 
      required: true 
    },
    severity: { 
      type: String, 
      enum: ['low', 'medium', 'high', 'critical'], 
      required: true 
    },
    title: { type: String, required: true },
    description: { type: String, required: true },
    startTime: { type: Date, required: true },
    endTime: { type: Date, required: true },
    affectedCrops: [String]
  }],
  agricultural: {
    soilMoisture: { type: Number, default: 0 },
    soilTemperature: { type: Number, default: 0 },
    growingDegreeDays: { type: Number, default: 0 },
    frostRisk: { 
      type: String, 
      enum: ['low', 'medium', 'high'], 
      default: 'low' 
    },
    droughtIndex: { type: Number, default: 0 },
    pestRisk: { 
      type: String, 
      enum: ['low', 'medium', 'high'], 
      default: 'low' 
    },
    plantingRecommendation: { type: String, default: '' },
    irrigationAdvice: { type: String, default: '' }
  },
  metadata: {
    source: { type: String, default: 'OpenWeather' },
    lastUpdated: { type: Date, default: () => new Date() },
    dataQuality: { 
      type: String, 
      enum: ['high', 'medium', 'low'], 
      default: 'high' 
    },
    nextUpdate: { 
      type: Date, 
      default: () => new Date(Date.now() + 3600 * 1000) 
    }
  }
}, { timestamps: true })

// Indexes for efficient querying
WeatherDataSchema.index({ 'location.lat': 1, 'location.lng': 1 })
WeatherDataSchema.index({ 'metadata.lastUpdated': -1 })
WeatherDataSchema.index({ 'alerts.severity': 1, 'alerts.type': 1 })
WeatherDataSchema.index({ 'agricultural.frostRisk': 1, 'agricultural.droughtIndex': 1 })

module.exports = mongoose.model('WeatherData', WeatherDataSchema)

