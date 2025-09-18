const User = require('../models/user.model')
const { 
  languageMiddleware, 
  SUPPORTED_LANGUAGES, 
  DEFAULT_LANGUAGE,
  getTranslatedText,
  formatTextDirection,
  formatNumber,
  formatDate,
  formatCurrency
} = require('../middlewares/language.middleware')

// Get supported languages
exports.getSupportedLanguages = async (req, res) => {
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
exports.getCurrentLanguage = async (req, res) => {
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

// Update user language preference
exports.updateUserLanguage = async (req, res) => {
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

    res.json({
      status: 'success',
      message: 'Language preference updated successfully',
      data: {
        language,
        languageInfo: req.languageInfo
      }
    })
  } catch (error) {
    console.error('User language update error:', error)
    res.status(500).json({
      status: 'error',
      message: 'Internal server error during language update'
    })
  }
}

// Get language statistics (admin only)
exports.getLanguageStats = async (req, res) => {
  try {
    const stats = await User.aggregate([
      {
        $group: {
          _id: '$language',
          count: { $sum: 1 },
          users: { $push: { _id: '$id', email: '$email', name: '$name' } }
        }
      },
      {
        $sort: { count: -1 }
      }
    ])

    const totalUsers = await User.countDocuments()
    const usersWithLanguage = await User.countDocuments({ language: { $exists: true, $ne: null } })
    const usersWithoutLanguage = totalUsers - usersWithLanguage

    // Add default language stats
    const defaultLanguageStats = {
      _id: DEFAULT_LANGUAGE,
      count: usersWithoutLanguage,
      users: []
    }

    if (usersWithoutLanguage > 0) {
      stats.unshift(defaultLanguageStats)
    }

    // Calculate percentages
    const statsWithPercentage = stats.map(stat => ({
      ...stat,
      percentage: totalUsers > 0 ? ((stat.count / totalUsers) * 100).toFixed(2) : 0
    }))

    res.json({
      status: 'success',
      data: {
        total: totalUsers,
        usersWithLanguage,
        usersWithoutLanguage,
        defaultLanguage: DEFAULT_LANGUAGE,
        breakdown: statsWithPercentage
      }
    })
  } catch (error) {
    console.error('Get language stats error:', error)
    res.status(500).json({
      status: 'error',
      message: 'Internal server error while getting language statistics'
    })
  }
}

// Bulk language update (admin only)
exports.bulkLanguageUpdate = async (req, res) => {
  try {
    const { userIds, language } = req.body

    if (!Array.isArray(userIds) || userIds.length === 0) {
      return res.status(400).json({
        status: 'error',
        message: 'User IDs array is required'
      })
    }

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

    if (userIds.length > 100) {
      return res.status(400).json({
        status: 'error',
        message: 'Maximum 100 users can be processed at once'
      })
    }

    const users = await User.find({
      _id: { $in: userIds }
    }).select('email name language')

    if (users.length === 0) {
      return res.status(400).json({
        status: 'error',
        message: 'No users found'
      })
    }

    const results = []
    const batchSize = 50

    for (let i = 0; i < users.length; i += batchSize) {
      const batch = users.slice(i, i + batchSize)
      
      const batchPromises = batch.map(async (user) => {
        try {
          await User.findByIdAndUpdate(user._id, { language })

          return {
            userId: user._id,
            email: user.email,
            name: user.name,
            previousLanguage: user.language || DEFAULT_LANGUAGE,
            newLanguage: language,
            status: 'success',
            message: 'Language updated successfully'
          }
        } catch (error) {
          return {
            userId: user._id,
            email: user.email,
            name: user.name,
            previousLanguage: user.language || DEFAULT_LANGUAGE,
            newLanguage: language,
            status: 'error',
            message: error.message
          }
        }
      })

      const batchResults = await Promise.all(batchPromises)
      results.push(...batchResults)
    }

    res.json({
      status: 'success',
      message: `Updated language for ${results.length} users`,
      data: {
        language,
        totalProcessed: results.length,
        results
      }
    })
  } catch (error) {
    console.error('Bulk language update error:', error)
    res.status(500).json({
      status: 'error',
      message: 'Internal server error during bulk language update'
    })
  }
}

// Get language-specific content
exports.getLocalizedContent = async (req, res) => {
  try {
    const { contentType, contentId } = req.params
    const { language = req.language } = req.query

    if (!SUPPORTED_LANGUAGES[language]) {
      return res.status(400).json({
        status: 'error',
        message: `Unsupported language: ${language}`
      })
    }

    // This would typically fetch content from a database or CMS
    // For now, we'll return sample localized content
    const localizedContent = {
      welcome: {
        en: 'Welcome to GroChain',
        ha: 'Barka da zuwa GroChain',
        yo: 'Kaabo si GroChain',
        ig: 'Nnọọ na GroChain',
        fr: 'Bienvenue sur GroChain',
        ar: 'مرحباً بك في GroChain'
      },
      dashboard: {
        en: 'Dashboard',
        ha: 'Dashboard',
        yo: 'Dashboard',
        ig: 'Dashboard',
        fr: 'Tableau de bord',
        ar: 'لوحة التحكم'
      },
      harvest: {
        en: 'Harvest Management',
        ha: 'Gudanar da Girbi',
        yo: 'Iṣakoso Awọn Irọwọ',
        ig: 'Njikwa Ubi',
        fr: 'Gestion des récoltes',
        ar: 'إدارة الحصاد'
      }
    }

    let content = null

    if (contentType === 'welcome') {
      content = localizedContent.welcome
    } else if (contentType === 'dashboard') {
      content = localizedContent.dashboard
    } else if (contentType === 'harvest') {
      content = localizedContent.harvest
    }

    if (!content) {
      return res.status(404).json({
        status: 'error',
        message: 'Content type not found'
      })
    }

    const translatedContent = getTranslatedText(content, language)

    res.json({
      status: 'success',
      data: {
        contentType,
        contentId,
        language,
        content: translatedContent,
        availableLanguages: Object.keys(content),
        direction: SUPPORTED_LANGUAGES[language]?.direction || 'ltr'
      }
    })
  } catch (error) {
    console.error('Get localized content error:', error)
    res.status(500).json({
      status: 'error',
      message: 'Internal server error while getting localized content'
    })
  }
}

// Format data based on language
exports.formatData = async (req, res) => {
  try {
    const { data, formatType, language = req.language } = req.body

    if (!data) {
      return res.status(400).json({
        status: 'error',
        message: 'Data is required'
      })
    }

    if (!SUPPORTED_LANGUAGES[language]) {
      return res.status(400).json({
        status: 'error',
        message: `Unsupported language: ${language}`
      })
    }

    let formattedData = data

    switch (formatType) {
      case 'number':
        if (typeof data === 'number') {
          formattedData = formatNumber(data, language)
        }
        break
      case 'date':
        if (data) {
          formattedData = formatDate(data, language)
        }
        break
      case 'currency':
        if (typeof data === 'number') {
          formattedData = formatCurrency(data, 'NGN', language)
        }
        break
      case 'text':
        if (typeof data === 'string') {
          formattedData = formatTextDirection(data, language)
        }
        break
      case 'all':
        if (typeof data === 'object') {
          formattedData = JSON.parse(JSON.stringify(data))
          // Apply formatting to all fields
          Object.keys(formattedData).forEach(key => {
            if (typeof formattedData[key] === 'number') {
              formattedData[key] = formatNumber(formattedData[key], language)
            } else if (formattedData[key] && !isNaN(new Date(formattedData[key]).getTime())) {
              formattedData[key] = formatDate(formattedData[key], language)
            }
          })
        }
        break
      default:
        return res.status(400).json({
          status: 'error',
          message: `Unsupported format type: ${formatType}. Supported types: number, date, currency, text, all`
        })
    }

    res.json({
      status: 'success',
      data: {
        original: data,
        formatted: formattedData,
        language,
        formatType,
        direction: SUPPORTED_LANGUAGES[language]?.direction || 'ltr'
      }
    })
  } catch (error) {
    console.error('Format data error:', error)
    res.status(500).json({
      status: 'error',
      message: 'Internal server error while formatting data'
    })
  }
}

// Get language detection info
exports.detectLanguage = async (req, res) => {
  try {
    const { text } = req.body

    if (!text || typeof text !== 'string') {
      return res.status(400).json({
        status: 'error',
        message: 'Text is required for language detection'
      })
    }

    // Simple language detection based on character sets
    // In production, you might use a more sophisticated library like 'franc' or 'langdetect'
    let detectedLanguage = 'en'
    
    if (/[\u0600-\u06FF]/.test(text)) {
      detectedLanguage = 'ar' // Arabic
    } else if (/[àáâãäåçèéêëìíîïñòóôõöùúûüýÿ]/.test(text)) {
      detectedLanguage = 'fr' // French
    } else if (/[àáâãäåçèéêëìíîïñòóôõöùúûüýÿ]/.test(text)) {
      detectedLanguage = 'ha' // Hausa (basic detection)
    }

    res.json({
      status: 'success',
      data: {
        text: text.substring(0, 100) + (text.length > 100 ? '...' : ''),
        detectedLanguage,
        confidence: 0.8, // Placeholder confidence score
        supported: SUPPORTED_LANGUAGES[detectedLanguage] ? true : false,
        languageInfo: SUPPORTED_LANGUAGES[detectedLanguage] || null
      }
    })
  } catch (error) {
    console.error('Language detection error:', error)
    res.status(500).json({
      status: 'error',
      message: 'Internal server error during language detection'
    })
  }
}

