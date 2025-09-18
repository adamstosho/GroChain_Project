const User = require('../models/user.model')

// Supported languages
const SUPPORTED_LANGUAGES = {
  en: {
    name: 'English',
    nativeName: 'English',
    direction: 'ltr',
    flag: '🇺🇸'
  },
  ha: {
    name: 'Hausa',
    nativeName: 'Hausa',
    direction: 'ltr',
    flag: '🇳🇬'
  },
  yo: {
    name: 'Yoruba',
    nativeName: 'Yorùbá',
    direction: 'ltr',
    flag: '🇳🇬'
  },
  ig: {
    name: 'Igbo',
    nativeName: 'Igbo',
    direction: 'ltr',
    flag: '🇳🇬'
  },
  fr: {
    name: 'French',
    nativeName: 'Français',
    direction: 'ltr',
    flag: '🇫🇷'
  },
  ar: {
    name: 'Arabic',
    nativeName: 'العربية',
    direction: 'rtl',
    flag: '🇸🇦'
  }
}

// Default language
const DEFAULT_LANGUAGE = 'en'

// Language detection middleware
const detectLanguage = (req, res, next) => {
  try {
    let language = DEFAULT_LANGUAGE

    // Priority order for language detection:
    // 1. User preference from database
    // 2. Query parameter
    // 3. Accept-Language header
    // 4. Default language

    // Check query parameter
    if (req.query.lang && SUPPORTED_LANGUAGES[req.query.lang]) {
      language = req.query.lang
    }

    // Check Accept-Language header
    if (!req.query.lang && req.headers['accept-language']) {
      const acceptLanguage = req.headers['accept-language']
      const preferredLanguages = acceptLanguage
        .split(',')
        .map(lang => lang.split(';')[0].trim().substring(0, 2))
        .filter(lang => SUPPORTED_LANGUAGES[lang])

      if (preferredLanguages.length > 0) {
        language = preferredLanguages[0]
      }
    }

    // Set language in request object
    req.language = language
    req.languageInfo = SUPPORTED_LANGUAGES[language]

    next()
  } catch (error) {
    console.error('Language detection error:', error)
    // Fallback to default language
    req.language = DEFAULT_LANGUAGE
    req.languageInfo = SUPPORTED_LANGUAGES[DEFAULT_LANGUAGE]
    next()
  }
}

// Set user language preference
const setUserLanguage = async (req, res, next) => {
  try {
    if (req.user && req.user.language && SUPPORTED_LANGUAGES[req.user.language]) {
      req.language = req.user.language
      req.languageInfo = SUPPORTED_LANGUAGES[req.user.language]
    }

    next()
  } catch (error) {
    console.error('User language setting error:', error)
    next()
  }
}

// Validate language parameter
const validateLanguage = (req, res, next) => {
  try {
    const { lang } = req.params

    if (!lang) {
      return res.status(400).json({
        status: 'error',
        message: 'Language parameter is required'
      })
    }

    if (!SUPPORTED_LANGUAGES[lang]) {
      return res.status(400).json({
        status: 'error',
        message: `Unsupported language: ${lang}. Supported languages: ${Object.keys(SUPPORTED_LANGUAGES).join(', ')}`
      })
    }

    req.language = lang
    req.languageInfo = SUPPORTED_LANGUAGES[lang]
    next()
  } catch (error) {
    console.error('Language validation error:', error)
    return res.status(500).json({
      status: 'error',
      message: 'Internal server error during language validation'
    })
  }
}

// Update user language preference
const updateUserLanguage = async (req, res, next) => {
  try {
    const { language } = req.body

    if (!language) {
      return res.status(400).json({
        status: 'error',
        message: 'Language is required'
      })
    }

    if (!SUPPORTED_LANGUAGES[language]) {
      return res.status(400).json({
        status: 'error',
        message: `Unsupported language: ${language}. Supported languages: ${Object.keys(SUPPORTED_LANGUAGES).join(', ')}`
      })
    }

    // Update user's language preference
    if (req.user) {
      await User.findByIdAndUpdate(req.user.id, { language })
      req.user.language = language
    }

    req.language = language
    req.languageInfo = SUPPORTED_LANGUAGES[language]
    next()
  } catch (error) {
    console.error('User language update error:', error)
    return res.status(500).json({
      status: 'error',
      message: 'Internal server error during language update'
    })
  }
}

// Get supported languages
const getSupportedLanguages = (req, res) => {
  try {
    const languages = Object.entries(SUPPORTED_LANGUAGES).map(([code, info]) => ({
      code,
      ...info,
      isCurrent: code === req.language
    }))

    res.json({
      status: 'success',
      data: {
        languages,
        currentLanguage: req.language,
        defaultLanguage: DEFAULT_LANGUAGE
      }
    })
  } catch (error) {
    console.error('Get supported languages error:', error)
    res.status(500).json({
      status: 'error',
      message: 'Internal server error while getting supported languages'
    })
  }
}

// Get current language info
const getCurrentLanguage = (req, res) => {
  try {
    res.json({
      status: 'success',
      data: {
        language: req.language,
        languageInfo: req.languageInfo,
        supportedLanguages: Object.keys(SUPPORTED_LANGUAGES)
      }
    })
  } catch (error) {
    console.error('Get current language error:', error)
    res.status(500).json({
      status: 'error',
      message: 'Internal server error while getting current language'
    })
  }
}

// Language middleware for routes
const languageMiddleware = {
  // Apply language detection to all routes
  detect: detectLanguage,
  
  // Apply user language preference
  userPreference: setUserLanguage,
  
  // Validate language parameter in route
  validate: validateLanguage,
  
  // Update user language
  update: updateUserLanguage,
  
  // Get supported languages
  getSupported: getSupportedLanguages,
  
  // Get current language
  getCurrent: getCurrentLanguage
}

// Helper function to get translated text
const getTranslatedText = (texts, language = DEFAULT_LANGUAGE) => {
  try {
    if (!texts || typeof texts === 'string') {
      return texts || ''
    }

    if (typeof texts === 'object') {
      // Return text in specified language, fallback to default, then first available
      return texts[language] || texts[DEFAULT_LANGUAGE] || Object.values(texts)[0] || ''
    }

    return ''
  } catch (error) {
    console.error('Translation error:', error)
    return texts || ''
  }
}

// Helper function to format text based on language direction
const formatTextDirection = (text, language = DEFAULT_LANGUAGE) => {
  try {
    const direction = SUPPORTED_LANGUAGES[language]?.direction || 'ltr'
    
    if (direction === 'rtl') {
      return `\u202B${text}\u202C` // Right-to-left mark
    }
    
    return text
  } catch (error) {
    console.error('Text direction formatting error:', error)
    return text
  }
}

// Helper function to get number format based on language
const formatNumber = (number, language = DEFAULT_LANGUAGE) => {
  try {
    const localeMap = {
      en: 'en-US',
      ha: 'ha-NG',
      yo: 'yo-NG',
      ig: 'ig-NG',
      fr: 'fr-FR',
      ar: 'ar-SA'
    }

    const locale = localeMap[language] || 'en-US'
    
    return new Intl.NumberFormat(locale).format(number)
  } catch (error) {
    console.error('Number formatting error:', error)
    return number.toString()
  }
}

// Helper function to get date format based on language
const formatDate = (date, language = DEFAULT_LANGUAGE, options = {}) => {
  try {
    const localeMap = {
      en: 'en-US',
      ha: 'ha-NG',
      yo: 'yo-NG',
      ig: 'ig-NG',
      fr: 'fr-FR',
      ar: 'ar-SA'
    }

    const locale = localeMap[language] || 'en-US'
    const defaultOptions = {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    }

    const dateOptions = { ...defaultOptions, ...options }
    
    return new Intl.DateTimeFormat(locale, dateOptions).format(new Date(date))
  } catch (error) {
    console.error('Date formatting error:', error)
    return new Date(date).toLocaleDateString()
  }
}

// Helper function to get currency format based on language
const formatCurrency = (amount, currency = 'NGN', language = DEFAULT_LANGUAGE) => {
  try {
    const localeMap = {
      en: 'en-NG',
      ha: 'ha-NG',
      yo: 'yo-NG',
      ig: 'ig-NG',
      fr: 'fr-FR',
      ar: 'ar-SA'
    }

    const locale = localeMap[language] || 'en-NG'
    
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: currency
    }).format(amount)
  } catch (error) {
    console.error('Currency formatting error:', error)
    return `${currency} ${amount}`
  }
}

module.exports = {
  languageMiddleware,
  SUPPORTED_LANGUAGES,
  DEFAULT_LANGUAGE,
  getTranslatedText,
  formatTextDirection,
  formatNumber,
  formatDate,
  formatCurrency
}

