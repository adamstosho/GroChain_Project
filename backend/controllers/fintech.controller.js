const CreditScore = require('../models/credit-score.model')
const LoanReferral = require('../models/loanReferral.model')
const User = require('../models/user.model')
const Partner = require('../models/partner.model')
const Transaction = require('../models/transaction.model')

// Import additional models
const FinancialGoal = require('../models/financial-goal.model')
const LoanApplication = require('../models/loan-application.model')
const InsurancePolicy = require('../models/insurance-policy.model')
const InsuranceClaim = require('../models/insurance-claim.model')

const fintechController = {
  // Get comprehensive financial dashboard data
  async getFinancialDashboard(req, res) {
    try {
      const userId = req.user.id
      const user = await User.findById(userId)

      if (!user) {
        return res.status(404).json({
          status: 'error',
          message: 'User not found'
        })
      }

      // Independent lookups that don't depend on each other - run in parallel
      const [creditScore, savings, activeLoans, activeInsurance, financialGoalsCount, farmerListings, farmerOrders] = await Promise.all([
        CreditScore.findOne({ farmer: userId }).sort({ createdAt: -1 }),
        FinancialGoal.aggregate([
          { $match: { farmer: userId, status: 'active' } },
          { $group: { _id: null, total: { $sum: '$currentAmount' } } }
        ]),
        LoanApplication.find({
          farmer: userId,
          status: { $in: ['approved', 'disbursed'] }
        }),
        InsurancePolicy.find({
          farmer: userId,
          status: 'active',
          endDate: { $gt: new Date() }
        }),
        FinancialGoal.countDocuments({ farmer: userId, status: 'active' }),
        user.role === 'farmer' ? require('../models/listing.model').find({ farmer: userId }).select('_id') : Promise.resolve([]),
        user.role === 'farmer' ? require('../models/order.model').find({ seller: userId }).select('_id') : Promise.resolve([])
      ])

      // Get total earnings
      let totalEarnings = 0

      if (user.role === 'farmer') {
        const Order = require('../models/order.model')
        const listingIds = farmerListings.map(listing => listing._id)
        const hasPartner = !!user.partner
        const platformFeeRate = 0.03
        const partnerCommissionRate = hasPartner ? 0.02 : 0

        // Calculate total earnings from completed orders, net of platform fee and partner commission
        const earningsResult = await Order.aggregate([
          {
            $match: {
              'items.listing': { $in: listingIds },
              paymentStatus: 'paid'
            }
          },
          { $unwind: '$items' },
          {
            $match: {
              'items.listing': { $in: listingIds }
            }
          },
          {
            $group: {
              _id: null,
              total: { $sum: { $multiply: ['$items.price', '$items.quantity'] } }
            }
          }
        ])

        const grossEarnings = earningsResult[0]?.total || 0
        totalEarnings = grossEarnings - (grossEarnings * platformFeeRate) - (grossEarnings * partnerCommissionRate)
      } else {
        const earnings = await Transaction.aggregate([
          { $match: { userId: userId, type: { $in: ['payment', 'commission'] }, status: 'completed' } },
          { $group: { _id: null, total: { $sum: '$amount' } } }
        ])
        totalEarnings = earnings[0]?.total || 0
      }

      // Get pending payments (upcoming loan repayments)
      const pendingPayments = []
      for (const loan of activeLoans) {
        const upcomingPayments = loan.repaymentSchedule.filter(payment =>
          payment.status === 'pending' && new Date(payment.dueDate) > new Date()
        )
        pendingPayments.push(...upcomingPayments)
      }

      const totalPendingPayments = pendingPayments.reduce((sum, payment) => sum + payment.amount, 0)

      // Get next payment due
      const nextPayment = pendingPayments
        .filter(payment => new Date(payment.dueDate) > new Date())
        .sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate))[0]

      // Get recent transactions
      let transactionQuery = {}

      if (user.role === 'farmer') {
        const orderIds = farmerOrders.map(order => order._id)
        const listingIds = farmerListings.map(listing => listing._id)

        transactionQuery = {
          $or: [
            { orderId: { $in: orderIds } },
            { listingId: { $in: listingIds } }
          ]
        }
      } else {
        transactionQuery = { userId: userId }
      }

      const recentTransactions = await Transaction.find(transactionQuery)
        .sort({ createdAt: -1 })
        .limit(10)
        .select('type amount description status createdAt')

      // Get risk level from credit score
      const riskLevel = creditScore ?
        (creditScore.score >= 750 ? 'low' : creditScore.score >= 600 ? 'medium' : 'high') : 'medium'

      // Format data
      const dashboardData = {
        overview: {
          creditScore: creditScore?.score || 0,
          totalEarnings,
          pendingPayments: totalPendingPayments,
          activeLoans: activeLoans.length,
          insurancePolicies: activeInsurance.length,
          totalSavings: savings[0]?.total || 0,
          financialGoals: financialGoalsCount,
          riskLevel: riskLevel,
          nextPaymentDue: nextPayment ? {
            amount: nextPayment.amount,
            dueDate: nextPayment.dueDate,
            daysUntilDue: Math.ceil((new Date(nextPayment.dueDate) - new Date()) / (1000 * 60 * 60 * 24))
          } : null
        },
        recentTransactions: recentTransactions.map(transaction => ({
          _id: transaction._id,
          type: transaction.type,
          amount: transaction.amount,
          description: transaction.description,
          date: transaction.createdAt.toISOString().split('T')[0],
          status: transaction.status
        })),
        activeLoans: activeLoans.map(loan => ({
          _id: loan._id,
          amount: loan.approvedAmount || loan.amount,
          purpose: loan.purpose,
          duration: loan.approvedDuration || loan.duration,
          interestRate: loan.approvedInterestRate || loan.interestRate,
          status: loan.status,
          monthlyPayment: loan.repaymentSchedule.length > 0 ?
            loan.repaymentSchedule[0].amount : (loan.amount / loan.duration),
          remainingBalance: loan.repaymentSchedule
            .filter(payment => payment.status === 'pending')
            .reduce((sum, payment) => sum + payment.amount, 0),
          nextPaymentDate: loan.repaymentSchedule
            .filter(payment => payment.status === 'pending')
            .sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate))[0]?.dueDate?.toISOString().split('T')[0]
        })),
        insurancePolicies: activeInsurance.map(policy => ({
          _id: policy._id,
          type: policy.type,
          provider: policy.provider,
          policyNumber: policy.policyNumber,
          coverageAmount: policy.coverageAmount,
          premium: policy.premium,
          startDate: policy.startDate.toISOString().split('T')[0],
          endDate: policy.endDate.toISOString().split('T')[0],
          status: policy.status
        }))
      }

      res.json({
        status: 'success',
        data: dashboardData
      })
    } catch (error) {
      console.error('Error getting financial dashboard:', error)
      res.status(500).json({
        status: 'error',
        message: 'Failed to get financial dashboard data'
      })
    }
  },
  // Get loan referrals
  async getLoanReferrals(req, res) {
    try {
      const query = {}
      
      // Role-based filtering
      if (req.user.role === 'partner') {
        query.partner = req.user.id
      }
      
      const stats = await LoanReferral.aggregate([
        { $match: query },
        {
          $group: {
            _id: '$status',
            count: { $sum: 1 },
            totalAmount: { $sum: '$loanAmount' }
          }
        }
      ])
      
      const totalApplications = await LoanReferral.countDocuments(query)
      const totalAmount = await LoanReferral.aggregate([
        { $match: query },
        { $group: { _id: null, total: { $sum: '$loanAmount' } } }
      ])
      
      res.json({
        status: 'success',
        data: {
          totalApplications,
          totalAmount: totalAmount[0]?.total || 0,
          statusBreakdown: stats,
          approvalRate: totalApplications > 0 ? 
            ((stats.find(s => s._id === 'approved')?.count || 0) / totalApplications * 100).toFixed(2) : 0
        }
      })
    } catch (error) {
      console.error('Error getting loan referrals:', error)
      res.status(500).json({
        status: 'error',
        message: 'Failed to get loan referrals'
      })
    }
  },

  // Get credit score for a farmer
  async getCreditScore(req, res) {
    try {
      let userId

      // Handle both /me and /:farmerId routes
      const { farmerId } = req.params
      if (req.path.endsWith('/me')) {
        userId = req.user.id
      } else {
        userId = farmerId === 'me' ? req.user.id : farmerId
      }

      // Check if user exists and is a farmer
      const user = await User.findById(userId)

      if (!user) {
        console.log(`❌ User ${userId} not found in database`)
        return res.status(404).json({
          status: 'error',
          message: 'User not found. Please log in again.'
        })
      }

      if (user.role !== 'farmer') {
        console.log(`❌ User ${user.email} is not a farmer (role: ${user.role})`)
        return res.status(403).json({
          status: 'error',
          message: 'Only farmers have credit scores'
        })
      }

      // Get or create credit score - ALWAYS create if doesn't exist
      let creditScore = await CreditScore.findOne({ farmer: userId })

      if (!creditScore) {
        console.log(`⚠️  No credit score found for farmer ${userId}, creating one...`)
        // Calculate initial credit score based on user data
        const initialScore = await calculateInitialCreditScore(userId)
        creditScore = await CreditScore.create({
          farmer: userId,
          score: initialScore.score,
          factors: initialScore.factors,
          recommendations: [
            'Complete your first harvest to improve payment history',
            'Maintain consistent harvest schedules',
            'Build your marketplace reputation through quality produce',
            'Consider saving a portion of your earnings'
          ],
          lastUpdated: new Date()
        })
        console.log(`✅ Created credit score ${creditScore.score} for farmer ${userId}`)
      }

      const { grade, status } = scoreToGradeAndStatus(creditScore.score)

      res.json({
        status: 'success',
        data: {
          farmerId: userId,
          score: creditScore.score,
          grade,
          status,
          riskLevel: creditScore.riskLevel,
          factors: creditScore.factors,
          recommendations: creditScore.recommendations || [],
          history: creditScore.history || [],
          eligibility: calculateEligibility(creditScore.score),
          lastUpdated: creditScore.lastUpdated,
          nextReviewDate: creditScore.nextReviewDate
        }
      })
    } catch (error) {
      console.error('Error getting credit score:', error)
      res.status(500).json({
        status: 'error',
        message: 'Failed to get credit score'
      })
    }
  },

  // Create loan referral
  async createLoanReferral(req, res) {
    try {
      const { farmerId, loanAmount, purpose, term, description } = req.body
      
      if (!farmerId || !loanAmount || !purpose || !term) {
        return res.status(400).json({
          status: 'error',
          message: 'Farmer ID, loan amount, purpose, and term are required'
        })
      }
      
      // Verify farmer exists
      const farmer = await User.findById(farmerId)
      if (!farmer || farmer.role !== 'farmer') {
        return res.status(404).json({
          status: 'error',
          message: 'Farmer not found'
        })
      }
      
      // Check if user has permission to create referral
      if (req.user.role === 'partner') {
        // Partner can only refer their own farmers
        if (farmer.partner?.toString() !== req.user.id) {
          return res.status(403).json({
            status: 'error',
            message: 'You can only refer your own farmers'
          })
        }
      } else if (req.user.role !== 'admin') {
        return res.status(403).json({
          status: 'error',
          message: 'Only partners and admins can create loan referrals'
        })
      }
      
      // Generate referral ID
      const referralId = `LOAN_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      
      // Create loan referral
      const loanReferral = await LoanReferral.create({
        referralId,
        partner: req.user.role === 'partner' ? req.user.id : undefined,
        farmer: farmerId,
        loanAmount: Number(loanAmount),
        purpose,
        term: Number(term),
        description,
        status: 'pending',
        submittedBy: req.user.id,
        submittedAt: new Date()
      })
      
      res.status(201).json({
        status: 'success',
        data: loanReferral
      })
    } catch (error) {
      console.error('Error creating loan referral:', error)
      res.status(500).json({
        status: 'error',
        message: 'Failed to create loan referral'
      })
    }
  },

  // Get loan applications
  async getLoanApplications(req, res) {
    try {
      const { page = 1, limit = 10, status, farmerId } = req.query
      const query = {}
      
      // Filter by status if provided
      if (status) query.status = status
      
      // Filter by farmer if provided
      if (farmerId) query.farmer = farmerId
      
      // Role-based filtering
      if (req.user.role === 'partner') {
        query.partner = req.user.id
      } else if (req.user.role === 'farmer') {
        query.farmer = req.user.id
      }
      
      const skip = (parseInt(page) - 1) * parseInt(limit)
      
      const [applications, total] = await Promise.all([
        LoanReferral.find(query)
          .populate('farmer', 'name email phone')
          .populate('partner', 'name organization')
          .sort({ submittedAt: -1 })
          .skip(skip)
          .limit(parseInt(limit)),
        LoanReferral.countDocuments(query)
      ])
      
      res.json({
        status: 'success',
        data: {
          applications,
          pagination: {
            currentPage: parseInt(page),
            totalPages: Math.ceil(total / parseInt(limit)),
            totalItems: total,
            itemsPerPage: parseInt(limit)
          }
        }
      })
    } catch (error) {
      console.error('Error getting loan applications:', error)
      res.status(500).json({
        status: 'error',
        message: 'Failed to get loan applications'
      })
    }
  },

  // Get loan statistics
  async getLoanStats(req, res) {
    try {
      const query = {}
      
      // Role-based filtering
      if (req.user.role === 'partner') {
        query.partner = req.user.id
      }
      
      const stats = await LoanReferral.aggregate([
        { $match: query },
        {
          $group: {
            _id: '$status',
            count: { $sum: 1 },
            totalAmount: { $sum: '$loanAmount' }
          }
        }
      ])
      
      const totalApplications = await LoanReferral.countDocuments(query)
      const totalAmount = await LoanReferral.aggregate([
        { $match: query },
        { $group: { _id: null, total: { $sum: '$loanAmount' } } }
      ])
      
      res.json({
        status: 'success',
        data: {
          totalApplications,
          totalAmount: totalAmount[0]?.total || 0,
          statusBreakdown: stats,
          approvalRate: totalApplications > 0 ? 
            ((stats.find(s => s._id === 'approved')?.count || 0) / totalApplications * 100).toFixed(2) : 0
        }
      })
    } catch (error) {
      console.error('Error getting loan stats:', error)
      res.status(500).json({
        status: 'error',
        message: 'Failed to get loan statistics'
      })
    }
  },

  // Get insurance policies
  async getInsurancePolicies(req, res) {
    try {
      const InsurancePolicy = require('../models/insurance-policy.model')
      const query = {}

      if (req.user.role === 'farmer') {
        query.farmer = req.user.id
      } else if (req.user.role === 'partner') {
        const farmers = await User.find({ partner: req.user.id }).select('_id')
        query.farmer = { $in: farmers.map(f => f._id) }
      }
      // admin: no farmer filter, sees all policies

      const { status, type } = req.query
      if (status) query.status = status
      if (type) query.type = type

      const policies = await InsurancePolicy.find(query)
        .populate('farmer', 'name email phone')
        .populate('claims')
        .sort({ createdAt: -1 })

      res.json({
        status: 'success',
        data: { policies }
      })
    } catch (error) {
      console.error('Error getting insurance policies:', error)
      res.status(500).json({
        status: 'error',
        message: 'Failed to get insurance policies'
      })
    }
  },

  // Get financial health assessment
  async getFinancialHealth(req, res) {
    try {
      const { farmerId } = req.params
      const userId = farmerId === 'me' ? req.user.id : farmerId
      
      // Get user's financial data
      const user = await User.findById(userId)
      let transactionQuery = {}

      if (user.role === 'farmer') {
        // For farmers, get transactions from orders where they are seller or listings they own
        const farmerOrders = await require('../models/order.model').find({ seller: userId }).select('_id')
        const orderIds = farmerOrders.map(order => order._id)

        const farmerListings = await require('../models/listing.model').find({ farmer: userId }).select('_id')
        const listingIds = farmerListings.map(listing => listing._id)

        transactionQuery = {
          $or: [
            { orderId: { $in: orderIds } },
            { listingId: { $in: listingIds } }
          ]
        }
      } else {
        transactionQuery = { userId: userId }
      }

      const transactions = await Transaction.find(transactionQuery)
      const creditScore = await CreditScore.findOne({ farmer: userId })
      
      // Calculate financial health metrics
      const totalIncome = transactions
        .filter(t => t.type === 'payment' && t.status === 'completed')
        .reduce((sum, t) => sum + t.amount, 0)
      
      const totalExpenses = transactions
        .filter(t => t.type === 'withdrawal' && t.status === 'completed')
        .reduce((sum, t) => sum + t.amount, 0)
      
      const netIncome = totalIncome - totalExpenses
      const savingsRate = totalIncome > 0 ? (netIncome / totalIncome * 100).toFixed(2) : 0
      
      const financialHealth = {
        score: creditScore?.score || 650,
        netIncome,
        savingsRate: parseFloat(savingsRate),
        totalIncome,
        totalExpenses,
        transactionCount: transactions.length,
        lastTransaction: transactions.length > 0 ? 
          Math.max(...transactions.map(t => t.createdAt)) : null,
        recommendations: generateFinancialRecommendations(netIncome, parseFloat(savingsRate))
      }
      
      res.json({
        status: 'success',
        data: financialHealth
      })
    } catch (error) {
      console.error('Error getting financial health:', error)
      res.status(500).json({
        status: 'error',
        message: 'Failed to get financial health'
      })
    }
  },

  // Get insurance stats
  async getInsuranceStats(req, res) {
    try {
      const { type, region } = req.query
      
      const match = {}
      if (type) match.type = type
      if (region) match.region = region
      
      const InsurancePolicy = require('../models/insurance-policy.model')
      
      const policyStats = await InsurancePolicy.aggregate([
        { $match: match },
        { $group: {
          _id: '$type',
          count: { $sum: 1 },
          totalPremium: { $sum: '$premium' },
          totalCoverage: { $sum: '$coverageAmount' },
          activePolicies: { $sum: { $cond: [{ $eq: ['$status', 'active'] }, 1, 0] } }
        }},
        { $sort: { count: -1 } }
      ])
      
      const regionalStats = await InsurancePolicy.aggregate([
        { $match: match },
        { $group: {
          _id: '$region',
          policies: { $sum: 1 },
          totalPremium: { $sum: '$premium' },
          avgCoverage: { $avg: '$coverageAmount' } 
        }},
        { $sort: { totalPremium: -1 } }
      ])
      
      const monthlyTrends = await InsurancePolicy.aggregate([
        { $match: match },
        { $group: {
          _id: { $dateToString: { format: '%Y-%m', date: '$createdAt' } },
          newPolicies: { $sum: 1 },
          premium: { $sum: '$premium' }
        }},
        { $sort: { _id: 1 } }
      ])
      
      res.json({
        status: 'success',
        data: {
          policyStats,
          regionalStats,
          monthlyTrends,
          summary: {
            totalPolicies: policyStats.reduce((sum, stat) => sum + stat.count, 0),
            totalPremium: policyStats.reduce((sum, stat) => sum + stat.totalPremium, 0),
            totalCoverage: policyStats.reduce((sum, stat) => sum + stat.totalCoverage, 0)
          }
        }
      })
    } catch (error) {
      console.error('Error getting insurance stats:', error)
      res.status(500).json({
        status: 'error',
        message: 'Failed to get insurance statistics'
      })
    }
  },

  // Get crop financials
  async getCropFinancials(req, res) {
    try {
      const { cropType, region, period = 'month' } = req.query
      
      const match = {}
      if (cropType) match.cropType = cropType
      if (region) match['location.state'] = region
      
      const now = new Date()
      const startDate = new Date()
      
      if (period === 'week') {
        startDate.setDate(now.getDate() - 7)
      } else if (period === 'month') {
        startDate.setMonth(now.getMonth() - 1)
      } else if (period === 'quarter') {
        startDate.setMonth(now.getMonth() - 3)
      } else if (period === 'year') {
        startDate.setFullYear(now.getFullYear() - 1)
      }
      
      match.createdAt = { $gte: startDate, $lte: now }
      
      const Harvest = require('../models/harvest.model')
      const Listing = require('../models/listing.model')
      const Order = require('../models/order.model')
      
      // Harvest costs and yields
      const harvestData = await Harvest.aggregate([
        { $match: match },
        { $group: {
          _id: '$cropType',
          totalQuantity: { $sum: '$quantity' },
          avgQuality: { $avg: { $cond: [{ $eq: ['$quality', 'excellent'] }, 4, { $cond: [{ $eq: ['$quality', 'good'] }, 3, { $cond: [{ $eq: ['$quality', 'fair'] }, 2, 1] }] }] } },
          harvests: { $sum: 1 }
        }},
        { $sort: { totalQuantity: -1 } }
      ])
      
      // Market prices
      const marketPrices = await Listing.aggregate([
        { $match: { ...match, status: 'active' } },
        { $group: {
          _id: '$cropType',
          avgPrice: { $avg: '$basePrice' },
          minPrice: { $min: '$basePrice' },
          maxPrice: { $max: '$basePrice' },
          listings: { $sum: 1 }
        }},
        { $sort: { avgPrice: -1 } }
      ])
      
      // Sales performance
      const salesData = await Order.aggregate([
        { $lookup: { from: 'listings', localField: 'items.listing', foreignField: '_id', as: 'listingData' } },
        { $unwind: '$listingData' },
        { $match: { ...match, 'listingData.cropType': { $exists: true } } },
        { $group: {
          _id: '$listingData.cropType',
          orders: { $sum: 1 },
          revenue: { $sum: '$total' },
          avgOrderValue: { $avg: '$total' }
        }},
        { $sort: { revenue: -1 } }
      ])
      
      // Calculate profitability metrics
      const cropFinancials = harvestData.map(harvest => {
        const market = marketPrices.find(m => m._id === harvest._id)
        const sales = salesData.find(s => s._id === harvest._id)
        
        const estimatedRevenue = (harvest.totalQuantity * (market?.avgPrice || 0))
        const estimatedProfit = estimatedRevenue * 0.7 // Assuming 30% costs
        const roi = estimatedRevenue > 0 ? (estimatedProfit / estimatedRevenue) * 100 : 0
        
        return {
          cropType: harvest._id,
          quantity: harvest.totalQuantity,
          quality: Math.round(harvest.avgQuality * 100) / 100,
          marketPrice: market?.avgPrice || 0,
          estimatedRevenue,
          estimatedProfit,
          roi: Math.round(roi * 100) / 100,
          marketData: market,
          salesData: sales
        }
      })
      
      res.json({
        status: 'success',
        data: {
          period,
          region: region || 'all',
          cropType: cropType || 'all',
          cropFinancials,
          summary: {
            totalCrops: cropFinancials.length,
            totalRevenue: cropFinancials.reduce((sum, crop) => sum + crop.estimatedRevenue, 0),
            avgROI: cropFinancials.reduce((sum, crop) => sum + crop.roi, 0) / cropFinancials.length || 0
          }
        }
      })
    } catch (error) {
      console.error('Error getting crop financials:', error)
      res.status(500).json({
        status: 'error',
        message: 'Failed to get crop financials'
      })
    }
  },

  // Get financial projections
  async getFinancialProjections(req, res) {
    try {
      const { months = 12, farmerId } = req.query
      
      const Order = require('../models/order.model')
      const Harvest = require('../models/harvest.model')
      const Listing = require('../models/listing.model')
      
      const match = {}
      if (farmerId) match.seller = farmerId
      
      // Historical data for trend analysis
      const historicalOrders = await Order.aggregate([
        { $match: match },
        { $group: {
          _id: { $dateToString: { format: '%Y-%m', date: '$createdAt' } },
          revenue: { $sum: '$total' },
          orders: { $sum: 1 }
        }},
        { $sort: { _id: -1 } },
        { $limit: 24 } // Last 24 months
      ])
      
      const historicalHarvests = await Harvest.aggregate([
        { $match: match },
        { $group: {
          _id: { $dateToString: { format: '%Y-%m', date: '$createdAt' } },
          quantity: { $sum: '$quantity' },
          count: { $sum: 1 }
        }},
        { $sort: { _id: -1 } },
        { $limit: 24 }
      ])
      
      // Calculate trends using linear regression
      const calculateTrend = (data, key) => {
        if (data.length < 2) return 0
        const n = data.length
        const sumX = data.reduce((sum, _, i) => sum + i, 0)
        const sumY = data.reduce((sum, item) => sum + item[key], 0)
        const sumXY = data.reduce((sum, item, i) => sum + (i * item[key]), 0)
        const sumXX = data.reduce((sum, _, i) => sum + (i * i), 0)
        
        const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX)
        return slope || 0
      }
      
      const revenueTrend = calculateTrend(historicalOrders, 'revenue')
      const orderTrend = calculateTrend(historicalOrders, 'orders')
      const harvestTrend = calculateTrend(historicalHarvests, 'quantity')
      
      // Generate projections
      const projections = []
      const baseRevenue = historicalOrders[0]?.revenue || 0
      const baseOrders = historicalOrders[0]?.orders || 0
      const baseHarvests = historicalHarvests[0]?.quantity || 0
      
      for (let i = 1; i <= months; i++) {
        const projectedDate = new Date()
        projectedDate.setMonth(projectedDate.getMonth() + i)
        const monthStr = projectedDate.toISOString().slice(0, 7)
        
        const projectedRevenue = Math.max(0, baseRevenue + (revenueTrend * i))
        const projectedOrders = Math.max(0, Math.round(baseOrders + (orderTrend * i)))
        const projectedHarvests = Math.max(0, Math.round(baseHarvests + (harvestTrend * i)))
        
        projections.push({
          month: monthStr,
          projectedRevenue: Math.round(projectedRevenue * 100) / 100,
          projectedOrders,
          projectedHarvests,
          confidence: Math.max(0.1, 1 - (i * 0.05)) // Decreasing confidence over time
        })
      }
      
      res.json({
        status: 'success',
        data: {
          projectionPeriod: months,
          farmerId: farmerId || 'all',
          trends: {
            revenue: Math.round(revenueTrend * 100) / 100,
            orders: Math.round(orderTrend * 100) / 100,
            harvests: Math.round(harvestTrend * 100) / 100
          },
          projections,
          summary: {
            totalProjectedRevenue: projections.reduce((sum, p) => sum + p.projectedRevenue, 0),
            avgMonthlyGrowth: Math.round((revenueTrend / baseRevenue) * 100 * 100) / 100
          }
        }
      })
    } catch (error) {
      console.error('Error getting financial projections:', error)
      res.status(500).json({
        status: 'error',
        message: 'Failed to get financial projections'
      })
    }
  },

  // Get financial goals
  async getFinancialGoals(req, res) {
    try {
      const { farmerId } = req.params
      
      const FinancialGoal = require('../models/financial-goal.model')
      const Order = require('../models/order.model')
      
      // Get farmer's financial goals
      const goals = await FinancialGoal.find({ farmer: farmerId }).sort({ targetDate: 1 })
      
      // Calculate progress for each goal
      const goalsWithProgress = await Promise.all(goals.map(async (goal) => {
        const startDate = goal.startDate || new Date(new Date().getFullYear(), 0, 1) // Start of year if not specified
        const endDate = goal.targetDate || new Date()
        
        const revenueMatch = { 
          seller: farmerId, 
          createdAt: { $gte: startDate, $lte: endDate },
          paymentStatus: 'paid'
        }
        
        const actualRevenue = await Order.aggregate([
          { $match: revenueMatch },
          { $group: { _id: null, total: { $sum: '$total' } } }
        ])
        
        const currentAmount = actualRevenue[0]?.total || 0
        const progress = goal.targetAmount > 0 ? (currentAmount / goal.targetAmount) * 100 : 0
        const remaining = Math.max(0, goal.targetAmount - currentAmount)
        
        // Calculate days remaining
        const daysRemaining = Math.ceil((endDate - new Date()) / (1000 * 60 * 60 * 24))
        
        // Determine status
        let status = 'on_track'
        if (progress >= 100) status = 'completed'
        else if (daysRemaining < 30 && progress < 75) status = 'at_risk'
        else if (daysRemaining < 7 && progress < 50) status = 'critical'
        
        return {
          ...goal.toObject(),
          currentAmount: Math.round(currentAmount * 100) / 100,
          progress: Math.round(progress * 100) / 100,
          remaining: Math.round(remaining * 100) / 100,
          daysRemaining,
          status
        }
      }))
      
      // Overall financial health score
      const totalGoals = goalsWithProgress.length
      const completedGoals = goalsWithProgress.filter(g => g.status === 'completed').length
      const onTrackGoals = goalsWithProgress.filter(g => g.status === 'on_track').length
      const atRiskGoals = goalsWithProgress.filter(g => g.status === 'at_risk').length
      const criticalGoals = goalsWithProgress.filter(g => g.status === 'critical').length
      
      const overallScore = totalGoals > 0 ? Math.round(
        (completedGoals * 100 + onTrackGoals * 80 + atRiskGoals * 40 + criticalGoals * 20) / totalGoals
      ) : 0
      
      res.json({
        status: 'success',
        data: {
          farmerId,
          goals: goalsWithProgress,
          summary: {
            totalGoals,
            completedGoals,
            onTrackGoals,
            atRiskGoals,
            criticalGoals,
            overallScore
          },
          recommendations: generateGoalRecommendations(goalsWithProgress)
        }
      })
    } catch (error) {
      console.error('Error getting financial goals:', error)
      res.status(500).json({
        status: 'error',
        message: 'Failed to get financial goals'
      })
    }
  },

  // Create financial goal
  async createFinancialGoal(req, res) {
    try {
      const { title, description, type, targetAmount, targetDate, priority, category, startDate } = req.body

      if (!title || !type || !targetAmount || !targetDate) {
        return res.status(400).json({
          status: 'error',
          message: 'Title, type, target amount, and target date are required'
        })
      }

      const FinancialGoal = require('../models/financial-goal.model')

      const goal = await FinancialGoal.create({
        farmer: req.user.id,
        title,
        description,
        type,
        targetAmount: Number(targetAmount),
        targetDate,
        startDate: startDate || undefined,
        priority: priority || undefined,
        category: category || undefined
      })

      res.status(201).json({
        status: 'success',
        data: goal
      })
    } catch (error) {
      console.error('Error creating financial goal:', error)
      res.status(500).json({
        status: 'error',
        message: 'Failed to create financial goal'
      })
    }
  },

  // Update financial goal
  async updateFinancialGoal(req, res) {
    try {
      const { id } = req.params
      const { title, description, type, targetAmount, targetDate, priority, category, currentAmount, status } = req.body

      const FinancialGoal = require('../models/financial-goal.model')

      const goal = await FinancialGoal.findOne({ _id: id, farmer: req.user.id })

      if (!goal) {
        return res.status(404).json({
          status: 'error',
          message: 'Financial goal not found'
        })
      }

      if (title !== undefined) goal.title = title
      if (description !== undefined) goal.description = description
      if (type !== undefined) goal.type = type
      if (targetAmount !== undefined) goal.targetAmount = Number(targetAmount)
      if (targetDate !== undefined) goal.targetDate = targetDate
      if (priority !== undefined) goal.priority = priority
      if (category !== undefined) goal.category = category
      if (currentAmount !== undefined) goal.currentAmount = Number(currentAmount)
      if (status !== undefined) goal.status = status

      await goal.save()

      res.json({
        status: 'success',
        data: goal
      })
    } catch (error) {
      console.error('Error updating financial goal:', error)
      res.status(500).json({
        status: 'error',
        message: 'Failed to update financial goal'
      })
    }
  },

  // Delete financial goal
  async deleteFinancialGoal(req, res) {
    try {
      const { id } = req.params

      const FinancialGoal = require('../models/financial-goal.model')

      const goal = await FinancialGoal.findOneAndDelete({ _id: id, farmer: req.user.id })

      if (!goal) {
        return res.status(404).json({
          status: 'error',
          message: 'Financial goal not found'
        })
      }

      res.json({
        status: 'success',
        message: 'Financial goal deleted successfully'
      })
    } catch (error) {
      console.error('Error deleting financial goal:', error)
      res.status(500).json({
        status: 'error',
        message: 'Failed to delete financial goal'
      })
    }
  },

  // Create credit score
  async createCreditScore(req, res) {
    try {
      const { farmerId, score, factors, recommendations } = req.body

      if (!farmerId || !score) {
        return res.status(400).json({
          status: 'error',
          message: 'Farmer ID and score are required'
        })
      }

      const farmer = await User.findById(farmerId)
      if (!farmer || farmer.role !== 'farmer') {
        return res.status(404).json({
          status: 'error',
          message: 'Farmer not found'
        })
      }

      if (req.user.role === 'partner') {
        if (farmer.partner?.toString() !== req.user.id) {
          return res.status(403).json({
            status: 'error',
            message: 'You can only set credit scores for your own farmers'
          })
        }
      } else if (req.user.role !== 'admin') {
        return res.status(403).json({
          status: 'error',
          message: 'Only partners and admins can create credit scores'
        })
      }

      // Check if credit score already exists
      const existingScore = await CreditScore.findOne({ farmer: farmerId })
      if (existingScore) {
        return res.status(400).json({
          status: 'error',
          message: 'Credit score already exists for this farmer'
        })
      }
      
      const creditScore = await CreditScore.create({
        farmer: farmerId,
        score: Number(score),
        factors: factors || {},
        recommendations: recommendations || [],
        lastUpdated: new Date()
      })
      
      res.status(201).json({
        status: 'success',
        data: creditScore
      })
    } catch (error) {
      console.error('Error creating credit score:', error)
      res.status(500).json({
        status: 'error',
        message: 'Failed to create credit score'
      })
    }
  },

  // Update credit score
  async updateCreditScore(req, res) {
    try {
      const { id } = req.params
      const { score, factors, recommendations } = req.body

      const creditScore = await CreditScore.findById(id)

      if (!creditScore) {
        return res.status(404).json({
          status: 'error',
          message: 'Credit score not found'
        })
      }

      if (req.user.role === 'partner') {
        const farmer = await User.findById(creditScore.farmer)
        if (farmer?.partner?.toString() !== req.user.id) {
          return res.status(403).json({
            status: 'error',
            message: 'You can only update credit scores for your own farmers'
          })
        }
      } else if (req.user.role !== 'admin') {
        return res.status(403).json({
          status: 'error',
          message: 'Only partners and admins can update credit scores'
        })
      }

      if (score !== undefined) creditScore.score = Number(score)
      if (factors !== undefined) creditScore.factors = factors
      if (recommendations !== undefined) creditScore.recommendations = recommendations
      creditScore.lastUpdated = new Date()

      await creditScore.save()

      res.json({
        status: 'success',
        data: creditScore
      })
    } catch (error) {
      console.error('Error updating credit score:', error)
      res.status(500).json({
        status: 'error',
        message: 'Failed to update credit score'
      })
    }
  },

  // Get loan application
  async getLoanApplication(req, res) {
    try {
      const { id } = req.params
      
      const loanApplication = await LoanReferral.findById(id)
        .populate('farmer', 'name email phone')
        .populate('partner', 'name organization')
      
      if (!loanApplication) {
        return res.status(404).json({
          status: 'error',
          message: 'Loan application not found'
        })
      }
      
      res.json({
        status: 'success',
        data: loanApplication
      })
    } catch (error) {
      console.error('Error getting loan application:', error)
      res.status(500).json({
        status: 'error',
        message: 'Failed to get loan application'
      })
    }
  },

  // Update loan application
  async updateLoanApplication(req, res) {
    try {
      const { id } = req.params
      const { status, notes, approvedAmount } = req.body

      const loanApplication = await LoanReferral.findById(id)

      if (!loanApplication) {
        return res.status(404).json({
          status: 'error',
          message: 'Loan application not found'
        })
      }

      // Only the referring partner or an admin may decide on a loan application
      if (req.user.role === 'partner') {
        if (loanApplication.partner?.toString() !== req.user.id) {
          return res.status(403).json({
            status: 'error',
            message: 'You can only update loan applications you referred'
          })
        }
      } else if (req.user.role !== 'admin') {
        return res.status(403).json({
          status: 'error',
          message: 'Only partners and admins can update loan applications'
        })
      }

      if (status !== undefined) loanApplication.status = status
      if (notes !== undefined) loanApplication.notes = notes
      if (approvedAmount !== undefined) loanApplication.approvedAmount = Number(approvedAmount)
      if (status === 'approved') {
        loanApplication.approvedBy = req.user.id
        loanApplication.approvedAt = new Date()
      }

      await loanApplication.save()

      res.json({
        status: 'success',
        data: loanApplication
      })
    } catch (error) {
      console.error('Error updating loan application:', error)
      res.status(500).json({
        status: 'error',
        message: 'Failed to update loan application'
      })
    }
  },

  // Delete loan application
  async deleteLoanApplication(req, res) {
    try {
      const { id } = req.params

      const loanApplication = await LoanReferral.findById(id)

      if (!loanApplication) {
        return res.status(404).json({
          status: 'error',
          message: 'Loan application not found'
        })
      }

      if (req.user.role === 'partner') {
        if (loanApplication.partner?.toString() !== req.user.id) {
          return res.status(403).json({
            status: 'error',
            message: 'You can only delete loan applications you referred'
          })
        }
      } else if (req.user.role !== 'admin') {
        return res.status(403).json({
          status: 'error',
          message: 'Only partners and admins can delete loan applications'
        })
      }

      await loanApplication.deleteOne()

      res.json({
        status: 'success',
        message: 'Loan application deleted successfully'
      })
    } catch (error) {
      console.error('Error deleting loan application:', error)
      res.status(500).json({
        status: 'error',
        message: 'Failed to delete loan application'
      })
    }
  },

  // Create insurance policy
  async createInsurancePolicy(req, res) {
    try {
      const { farmerId, type, provider, policyNumber, coverageAmount, premium, startDate, endDate, region } = req.body

      if (!farmerId || !type || !provider || !policyNumber || !coverageAmount || !premium || !startDate || !endDate || !region) {
        return res.status(400).json({
          status: 'error',
          message: 'All required fields must be provided'
        })
      }

      const farmer = await User.findById(farmerId)
      if (!farmer || farmer.role !== 'farmer') {
        return res.status(404).json({
          status: 'error',
          message: 'Farmer not found'
        })
      }

      if (req.user.role === 'partner') {
        if (farmer.partner?.toString() !== req.user.id) {
          return res.status(403).json({
            status: 'error',
            message: 'You can only create insurance policies for your own farmers'
          })
        }
      } else if (req.user.role !== 'admin') {
        return res.status(403).json({
          status: 'error',
          message: 'Only partners and admins can create insurance policies'
        })
      }

      const InsurancePolicy = require('../models/insurance-policy.model')

      const insurancePolicy = await InsurancePolicy.create({
        farmer: farmerId,
        type,
        provider,
        policyNumber,
        coverageAmount: Number(coverageAmount),
        premium: Number(premium),
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        region
      })
      
      res.status(201).json({
        status: 'success',
        data: insurancePolicy
      })
    } catch (error) {
      console.error('Error creating insurance policy:', error)
      res.status(500).json({
        status: 'error',
        message: 'Failed to create insurance policy'
      })
    }
  },

  // Get insurance policy
  async getInsurancePolicy(req, res) {
    try {
      const { id } = req.params

      const InsurancePolicy = require('../models/insurance-policy.model')

      const insurancePolicy = await InsurancePolicy.findById(id)
        .populate('farmer', 'name email phone partner')
        .populate('claims')

      if (!insurancePolicy) {
        return res.status(404).json({
          status: 'error',
          message: 'Insurance policy not found'
        })
      }

      if (req.user.role === 'farmer') {
        if (insurancePolicy.farmer._id.toString() !== req.user.id) {
          return res.status(403).json({
            status: 'error',
            message: 'You can only view your own insurance policies'
          })
        }
      } else if (req.user.role === 'partner') {
        if (insurancePolicy.farmer.partner?.toString() !== req.user.id) {
          return res.status(403).json({
            status: 'error',
            message: 'You can only view insurance policies for your own farmers'
          })
        }
      } else if (req.user.role !== 'admin') {
        return res.status(403).json({
          status: 'error',
          message: 'You are not authorized to view this insurance policy'
        })
      }

      res.json({
        status: 'success',
        data: insurancePolicy
      })
    } catch (error) {
      console.error('Error getting insurance policy:', error)
      res.status(500).json({
        status: 'error',
        message: 'Failed to get insurance policy'
      })
    }
  },

  // Update insurance policy
  async updateInsurancePolicy(req, res) {
    try {
      const { id } = req.params

      const InsurancePolicy = require('../models/insurance-policy.model')

      const insurancePolicy = await InsurancePolicy.findById(id)

      if (!insurancePolicy) {
        return res.status(404).json({
          status: 'error',
          message: 'Insurance policy not found'
        })
      }

      if (req.user.role === 'partner') {
        const farmer = await User.findById(insurancePolicy.farmer)
        if (farmer?.partner?.toString() !== req.user.id) {
          return res.status(403).json({
            status: 'error',
            message: 'You can only update insurance policies for your own farmers'
          })
        }
      } else if (req.user.role !== 'admin') {
        return res.status(403).json({
          status: 'error',
          message: 'Only partners and admins can update insurance policies'
        })
      }

      const allowedFields = [
        'type', 'provider', 'coverageAmount', 'premium', 'deductible',
        'startDate', 'endDate', 'status', 'region', 'coverageDetails',
        'notes', 'renewalDate', 'autoRenew'
      ]
      for (const field of allowedFields) {
        if (req.body[field] !== undefined) {
          insurancePolicy[field] = req.body[field]
        }
      }

      await insurancePolicy.save()

      res.json({
        status: 'success',
        data: insurancePolicy
      })
    } catch (error) {
      console.error('Error updating insurance policy:', error)
      res.status(500).json({
        status: 'error',
        message: 'Failed to update insurance policy'
      })
    }
  },

  // Delete insurance policy
  async deleteInsurancePolicy(req, res) {
    try {
      const { id } = req.params

      const InsurancePolicy = require('../models/insurance-policy.model')

      const insurancePolicy = await InsurancePolicy.findById(id)

      if (!insurancePolicy) {
        return res.status(404).json({
          status: 'error',
          message: 'Insurance policy not found'
        })
      }

      if (req.user.role === 'partner') {
        const farmer = await User.findById(insurancePolicy.farmer)
        if (farmer?.partner?.toString() !== req.user.id) {
          return res.status(403).json({
            status: 'error',
            message: 'You can only delete insurance policies for your own farmers'
          })
        }
      } else if (req.user.role !== 'admin') {
        return res.status(403).json({
          status: 'error',
          message: 'Only partners and admins can delete insurance policies'
        })
      }

      await insurancePolicy.deleteOne()

      res.json({
        status: 'success',
        message: 'Insurance policy deleted successfully'
      })
    } catch (error) {
      console.error('Error deleting insurance policy:', error)
      res.status(500).json({
        status: 'error',
        message: 'Failed to delete insurance policy'
      })
    }
  },

  // Create insurance claim
  async createInsuranceClaim(req, res) {
    try {
      const {
        policyId,
        policyNumber,
        claimType,
        description,
        incidentDate,
        estimatedLoss,
        location,
        weatherConditions,
        documents
      } = req.body

      if (!claimType || !description || !incidentDate || estimatedLoss === undefined || estimatedLoss === null || (!policyId && !policyNumber)) {
        return res.status(400).json({
          status: 'error',
          message: 'Policy, claim type, description, incident date, and estimated loss are required'
        })
      }

      const validClaimTypes = ['crop_damage', 'equipment_damage', 'livestock_loss', 'natural_disaster', 'theft', 'other']
      if (!validClaimTypes.includes(claimType)) {
        return res.status(400).json({
          status: 'error',
          message: 'Invalid claim type'
        })
      }

      // Resolve the policy being claimed against and verify it exists
      const policy = policyId
        ? await InsurancePolicy.findById(policyId)
        : await InsurancePolicy.findOne({ policyNumber })

      if (!policy) {
        return res.status(404).json({
          status: 'error',
          message: 'Insurance policy not found'
        })
      }

      // Ownership check - only the policyholder, their partner, or an admin may file a claim
      if (req.user.role === 'farmer') {
        if (policy.farmer.toString() !== req.user.id) {
          return res.status(403).json({
            status: 'error',
            message: 'You can only file claims against your own insurance policies'
          })
        }
      } else if (req.user.role === 'partner') {
        const farmer = await User.findById(policy.farmer)
        if (!farmer || farmer.partner?.toString() !== req.user.id) {
          return res.status(403).json({
            status: 'error',
            message: 'You can only file claims for your own farmers'
          })
        }
      } else if (req.user.role !== 'admin') {
        return res.status(403).json({
          status: 'error',
          message: 'Only the policyholder, their partner, or an admin can file a claim'
        })
      }

      // claimAmount is intentionally NOT derived from estimatedLoss here - it is set later
      // by whoever adjudicates the claim (see updateInsuranceClaim)
      const claim = await InsuranceClaim.create({
        farmer: policy.farmer,
        policy: policy._id,
        claimType,
        description,
        incidentDate: new Date(incidentDate),
        estimatedLoss: Number(estimatedLoss),
        location,
        weatherConditions,
        documents: Array.isArray(documents) ? documents : [],
        status: 'pending'
      })

      // Keep the policy's claims list in sync with the dangling ref defined on InsurancePolicy
      await InsurancePolicy.findByIdAndUpdate(policy._id, { $push: { claims: claim._id } })

      const populatedClaim = await InsuranceClaim.findById(claim._id)
        .populate('policy', 'policyNumber type provider coverageAmount')
        .populate('farmer', 'name email phone')

      res.status(201).json({
        status: 'success',
        data: populatedClaim
      })
    } catch (error) {
      console.error('Error creating insurance claim:', error)
      res.status(500).json({
        status: 'error',
        message: 'Failed to create insurance claim'
      })
    }
  },

  // Get insurance claim
  async getInsuranceClaim(req, res) {
    try {
      const { id } = req.params

      const claim = await InsuranceClaim.findById(id)
        .populate('policy', 'policyNumber type provider coverageAmount region')
        .populate('farmer', 'name email phone partner')

      if (!claim) {
        return res.status(404).json({
          status: 'error',
          message: 'Insurance claim not found'
        })
      }

      // Ownership check - farmers can only see their own claims, partners only their farmers' claims
      if (req.user.role === 'farmer') {
        if (claim.farmer._id.toString() !== req.user.id) {
          return res.status(403).json({
            status: 'error',
            message: 'You can only view your own insurance claims'
          })
        }
      } else if (req.user.role === 'partner') {
        if (claim.farmer.partner?.toString() !== req.user.id) {
          return res.status(403).json({
            status: 'error',
            message: 'You can only view claims for your own farmers'
          })
        }
      } else if (req.user.role !== 'admin') {
        return res.status(403).json({
          status: 'error',
          message: 'You do not have permission to view this claim'
        })
      }

      res.json({
        status: 'success',
        data: claim
      })
    } catch (error) {
      console.error('Error getting insurance claim:', error)
      res.status(500).json({
        status: 'error',
        message: 'Failed to get insurance claim'
      })
    }
  },

  // Update insurance claim
  async updateInsuranceClaim(req, res) {
    try {
      const { id } = req.params
      const { status, adjusterNotes, claimAmount, paidAmount, decisionDate } = req.body

      const claim = await InsuranceClaim.findById(id).populate('farmer', 'partner')

      if (!claim) {
        return res.status(404).json({
          status: 'error',
          message: 'Insurance claim not found'
        })
      }

      // Ownership / role check - same rules as getInsuranceClaim
      if (req.user.role === 'farmer') {
        if (claim.farmer._id.toString() !== req.user.id) {
          return res.status(403).json({
            status: 'error',
            message: 'You can only update your own insurance claims'
          })
        }
      } else if (req.user.role === 'partner') {
        if (claim.farmer.partner?.toString() !== req.user.id) {
          return res.status(403).json({
            status: 'error',
            message: 'You can only update claims for your own farmers'
          })
        }
      } else if (req.user.role !== 'admin') {
        return res.status(403).json({
          status: 'error',
          message: 'You do not have permission to update this claim'
        })
      }

      const validStatuses = ['pending', 'under_review', 'approved', 'rejected', 'paid']
      if (status && !validStatuses.includes(status)) {
        return res.status(400).json({
          status: 'error',
          message: 'Invalid status'
        })
      }

      const update = {}
      if (status) update.status = status
      if (adjusterNotes !== undefined) update.adjusterNotes = adjusterNotes
      if (claimAmount !== undefined) update.claimAmount = Number(claimAmount)
      if (paidAmount !== undefined) update.paidAmount = Number(paidAmount)

      // A decision date is set explicitly, or implied the first time a claim reaches a decided status
      if (decisionDate) {
        update.decisionDate = new Date(decisionDate)
      } else if (status && ['approved', 'rejected'].includes(status) && !claim.decisionDate) {
        update.decisionDate = new Date()
      }

      const updatedClaim = await InsuranceClaim.findByIdAndUpdate(
        id,
        update,
        { new: true, runValidators: true }
      )
        .populate('policy', 'policyNumber type provider coverageAmount')
        .populate('farmer', 'name email phone')

      res.json({
        status: 'success',
        data: updatedClaim
      })
    } catch (error) {
      console.error('Error updating insurance claim:', error)
      res.status(500).json({
        status: 'error',
        message: 'Failed to update insurance claim'
      })
    }
  },

  // Get insurance quotes
  async getInsuranceQuotes(req, res) {
    try {
      const { cropType, farmSize, location, budget, coverageType } = req.query

      // Comprehensive insurance quotes data
      const allQuotes = [
        {
          _id: 'quote_001',
          name: 'AgriShield Premium',
          provider: 'Nigerian Agricultural Insurance Corporation',
          type: 'Crop Insurance',
          coverage: 'Comprehensive crop protection against drought, flood, pests, and diseases',
          premium: 75000,
          deductible: 25000,
          maxCoverage: 2000000,
          features: [
            'Weather-related damage coverage',
            'Pest and disease protection',
            'Market price fluctuation protection',
            '24/7 claims support',
            'Expert agronomist consultation'
          ],
          exclusions: [
            'Pre-existing crop conditions',
            'Intentional damage',
            'War and civil unrest',
            'Nuclear incidents'
          ],
          rating: 4.8,
          reviews: 156,
          claimProcess: 'Simple 3-step process with 48-hour response',
          waitingPeriod: 14,
          renewalTerms: 'Annual renewal with loyalty discounts',
          contactInfo: {
            phone: '+234 1 234 5678',
            email: 'info@agrishield.ng',
            website: 'www.agrishield.ng'
          },
          logo: '/naic-logo.png',
          isRecommended: true,
          specialOffers: ['20% discount for first-time farmers', 'Free soil testing included'],
          cropTypes: ['Maize', 'Cassava', 'Tomatoes', 'Beans'],
          farmSize: 'Small (0-2 hectares)',
          regions: ['North Central', 'North East', 'North West']
        },
        {
          _id: 'quote_002',
          name: 'FarmGuard Plus',
          provider: 'Leadway Assurance',
          type: 'Equipment Insurance',
          coverage: 'Protection for farm machinery, tools, and equipment',
          premium: 45000,
          deductible: 15000,
          maxCoverage: 1500000,
          features: [
            'Equipment breakdown coverage',
            'Theft and vandalism protection',
            'Transportation coverage',
            'Replacement cost coverage',
            'Emergency repair services'
          ],
          exclusions: [
            'Wear and tear',
            'Mechanical breakdown due to poor maintenance',
            'Acts of terrorism',
            'War damage'
          ],
          rating: 4.6,
          reviews: 89,
          claimProcess: 'Online claims with photo documentation',
          waitingPeriod: 7,
          renewalTerms: 'Flexible payment plans available',
          contactInfo: {
            phone: '+234 1 987 6543',
            email: 'farmguard@leadway.com',
            website: 'www.leadway.com/farmguard'
          },
          logo: '/leadway-logo.png',
          isRecommended: false,
          specialOffers: ['15% discount for cooperative members', 'Free equipment maintenance check'],
          equipmentTypes: ['Tractor', 'Harvester', 'Irrigation System'],
          farmSize: 'Medium (2-10 hectares)',
          regions: ['South West', 'South East', 'South South']
        },
        {
          _id: 'quote_003',
          name: 'LivestockCare Elite',
          provider: 'AIICO Insurance',
          type: 'Livestock Insurance',
          coverage: 'Comprehensive livestock protection including health and mortality',
          premium: 60000,
          deductible: 20000,
          maxCoverage: 3000000,
          features: [
            'Animal mortality coverage',
            'Veterinary care reimbursement',
            'Breeding stock protection',
            'Transportation coverage',
            'Market value protection'
          ],
          exclusions: [
            'Pre-existing health conditions',
            'Intentional harm',
            'Diseases from poor husbandry',
            'Natural disasters in high-risk areas'
          ],
          rating: 4.7,
          reviews: 124,
          claimProcess: 'Veterinarian assessment required',
          waitingPeriod: 21,
          renewalTerms: 'Quarterly or annual options',
          contactInfo: {
            phone: '+234 1 456 7890',
            email: 'livestock@aiico.com',
            website: 'www.aiico.com/livestock'
          },
          logo: '/aiico-logo.png',
          isRecommended: true,
          specialOffers: ['Free veterinary consultation', '10% discount for large herds'],
          livestockTypes: ['Cattle', 'Poultry', 'Goats', 'Sheep'],
          farmSize: 'Large (10+ hectares)',
          regions: ['All Locations']
        },
        {
          _id: 'quote_004',
          name: 'AgriComplete Basic',
          provider: 'Consolidated Hallmark Insurance',
          type: 'Crop Insurance',
          coverage: 'Basic crop protection for smallholder farmers',
          premium: 25000,
          deductible: 10000,
          maxCoverage: 800000,
          features: [
            'Drought and flood coverage',
            'Basic pest protection',
            'Harvest loss protection',
            'Mobile claims process'
          ],
          exclusions: [
            'War and civil unrest',
            'Intentional damage',
            'Pre-existing conditions'
          ],
          rating: 4.2,
          reviews: 67,
          claimProcess: 'Mobile app claims processing',
          waitingPeriod: 21,
          renewalTerms: 'Annual renewal',
          contactInfo: {
            phone: '+234 1 345 6789',
            email: 'agricomplete@chi.ng',
            website: 'www.chi.ng/agricomplete'
          },
          logo: '/chi-logo.png',
          isRecommended: false,
          specialOffers: ['Free mobile app', 'Community training included'],
          cropTypes: ['Maize', 'Rice', 'Cassava'],
          farmSize: 'Small (0-2 hectares)',
          regions: ['North Central', 'South West']
        },
        {
          _id: 'quote_005',
          name: 'Equipment Shield Pro',
          provider: 'Custodian & Allied Insurance',
          type: 'Equipment Insurance',
          coverage: 'Advanced equipment protection with comprehensive coverage',
          premium: 65000,
          deductible: 20000,
          maxCoverage: 2500000,
          features: [
            'Complete equipment breakdown coverage',
            'Theft and vandalism protection',
            'Third-party liability',
            'Emergency roadside assistance',
            'Replacement value coverage'
          ],
          exclusions: [
            'Wear and tear',
            'Poor maintenance',
            'Acts of terrorism',
            'Nuclear incidents'
          ],
          rating: 4.5,
          reviews: 92,
          claimProcess: '24/7 claims hotline',
          waitingPeriod: 10,
          renewalTerms: 'Flexible payment options',
          contactInfo: {
            phone: '+234 1 567 8901',
            email: 'equipment@caico.ng',
            website: 'www.caico.ng/equipment'
          },
          logo: '/caico-logo.png',
          isRecommended: false,
          specialOffers: ['5% discount for annual payment', 'Free equipment valuation'],
          equipmentTypes: ['Tractor', 'Combine Harvester', 'Irrigation Equipment'],
          farmSize: 'Medium (2-10 hectares)',
          regions: ['All Locations']
        },
        {
          _id: 'quote_006',
          name: 'Premium Livestock Guardian',
          provider: 'African Alliance Insurance',
          type: 'Livestock Insurance',
          coverage: 'Premium livestock protection with veterinary network',
          premium: 80000,
          deductible: 25000,
          maxCoverage: 4000000,
          features: [
            'Complete mortality coverage',
            'Accident and illness protection',
            'Veterinary network access',
            'Market value guarantee',
            'Breeding stock protection',
            'Emergency veterinary services'
          ],
          exclusions: [
            'Pre-existing conditions',
            'Intentional harm',
            'Poor husbandry practices',
            'Acts of terrorism'
          ],
          rating: 4.9,
          reviews: 203,
          claimProcess: 'Dedicated veterinary assessors',
          waitingPeriod: 14,
          renewalTerms: 'Premium loyalty rewards',
          contactInfo: {
            phone: '+234 1 678 9012',
            email: 'livestock@aaico.ng',
            website: 'www.aaico.ng/livestock'
          },
          logo: '/aaico-logo.png',
          isRecommended: true,
          specialOffers: ['Premium veterinary network access', '20% discount for large operations'],
          livestockTypes: ['Cattle', 'Sheep', 'Goats', 'Poultry'],
          farmSize: 'Large (10+ hectares)',
          regions: ['North West', 'North East', 'North Central']
        }
      ]

      // Apply filters
      let filteredQuotes = [...allQuotes]

      if (cropType && cropType !== 'All Crops') {
        filteredQuotes = filteredQuotes.filter(quote =>
          quote.cropTypes && quote.cropTypes.some(crop =>
            crop.toLowerCase().includes(cropType.toLowerCase().split(' ')[0])
          )
        )
      }

      if (farmSize && farmSize !== 'All Farm Sizes') {
        filteredQuotes = filteredQuotes.filter(quote =>
          quote.farmSize === farmSize
        )
      }

      if (location && location !== 'All Locations') {
        filteredQuotes = filteredQuotes.filter(quote =>
          quote.regions && quote.regions.includes(location)
        )
      }

      if (budget && budget !== 'Any Budget') {
        const budgetMap = {
          "Under ₦50,000/year": 50000,
          "₦50,000 - ₦100,000/year": 100000,
          "₦100,000 - ₦200,000/year": 200000,
          "Over ₦200,000/year": 200000
        }

        if (budget in budgetMap) {
          const maxBudget = budgetMap[budget]
          if (budget === "Over ₦200,000/year") {
            filteredQuotes = filteredQuotes.filter(quote => quote.premium > maxBudget)
          } else {
            filteredQuotes = filteredQuotes.filter(quote => quote.premium <= maxBudget)
          }
        }
      }

      if (coverageType && coverageType !== 'All Coverage') {
        filteredQuotes = filteredQuotes.filter(quote =>
          quote.type === coverageType
        )
      }

      res.json({
        status: 'success',
        data: filteredQuotes,
        total: filteredQuotes.length,
        filters: {
          cropType: cropType || 'All Crops',
          farmSize: farmSize || 'All Farm Sizes',
          location: location || 'All Locations',
          budget: budget || 'Any Budget',
          coverageType: coverageType || 'All Coverage'
        }
      })
    } catch (error) {
      console.error('Error getting insurance quotes:', error)
      res.status(500).json({
        status: 'error',
        message: 'Failed to get insurance quotes'
      })
    }
  },

  // Get insurance claims
  async getInsuranceClaims(req, res) {
    try {
      const { page = 1, limit = 10, status } = req.query
      const query = {}

      if (status) query.status = status

      // Role-based filtering - same convention as getLoanApplications
      if (req.user.role === 'farmer') {
        query.farmer = req.user.id
      } else if (req.user.role === 'partner') {
        const partnerFarmers = await User.find({ partner: req.user.id }).select('_id')
        query.farmer = { $in: partnerFarmers.map(f => f._id) }
      }
      // admin: no filter, sees all claims

      const skip = (parseInt(page) - 1) * parseInt(limit)

      const [claims, total] = await Promise.all([
        InsuranceClaim.find(query)
          .populate('policy', 'policyNumber type provider coverageAmount')
          .populate('farmer', 'name email phone')
          .sort({ reportedDate: -1 })
          .skip(skip)
          .limit(parseInt(limit)),
        InsuranceClaim.countDocuments(query)
      ])

      const [pendingClaims, approvedClaims, amountAgg, decidedClaims] = await Promise.all([
        InsuranceClaim.countDocuments({ ...query, status: 'pending' }),
        InsuranceClaim.countDocuments({ ...query, status: { $in: ['approved', 'paid'] } }),
        InsuranceClaim.aggregate([
          { $match: query },
          { $group: { _id: null, totalClaimed: { $sum: '$claimAmount' }, totalPaid: { $sum: '$paidAmount' } } }
        ]),
        InsuranceClaim.find({ ...query, decisionDate: { $exists: true, $ne: null } })
          .select('reportedDate decisionDate')
      ])

      // Derive average processing time from real reportedDate -> decisionDate deltas.
      // No fabricated fallback - 0 when no claims have been decided yet.
      let averageProcessingTime = 0
      if (decidedClaims.length > 0) {
        const totalDays = decidedClaims.reduce((sum, c) => {
          return sum + (new Date(c.decisionDate) - new Date(c.reportedDate)) / (1000 * 60 * 60 * 24)
        }, 0)
        averageProcessingTime = Number((totalDays / decidedClaims.length).toFixed(1))
      }

      res.json({
        status: 'success',
        data: {
          claims,
          pagination: {
            currentPage: parseInt(page),
            totalPages: Math.ceil(total / parseInt(limit)),
            totalItems: total,
            itemsPerPage: parseInt(limit)
          },
          stats: {
            totalClaims: total,
            pendingClaims,
            approvedClaims,
            totalClaimed: amountAgg[0]?.totalClaimed || 0,
            totalPaid: amountAgg[0]?.totalPaid || 0,
            averageProcessingTime
          }
        }
      })
    } catch (error) {
      console.error('Error getting insurance claims:', error)
      res.status(500).json({
        status: 'error',
        message: 'Failed to get insurance claims'
      })
    }
  },

  // Create loan application
  async createLoanApplication(req, res) {
    try {
      const { farmerId, loanAmount, purpose, term, description } = req.body
      
      if (!farmerId || !loanAmount || !purpose || !term) {
        return res.status(400).json({
          status: 'error',
          message: 'Farmer ID, loan amount, purpose, and term are required'
        })
      }
      
      // Verify farmer exists
      const farmer = await User.findById(farmerId)
      if (!farmer || farmer.role !== 'farmer') {
        return res.status(404).json({
          status: 'error',
          message: 'Farmer not found'
        })
      }
      
      // Check if user has permission to create application
      if (req.user.role === 'partner') {
        // Partner can only create applications for their own farmers
        if (farmer.partner?.toString() !== req.user.id) {
          return res.status(403).json({
            status: 'error',
            message: 'You can only create applications for your own farmers'
          })
        }
      } else if (req.user.role !== 'admin') {
        return res.status(403).json({
          status: 'error',
          message: 'Only partners and admins can create loan applications'
        })
      }
      
      // Generate application ID
      const applicationId = `LOAN_APP_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      
      // Create loan application
      const loanApplication = await LoanReferral.create({
        referralId: applicationId,
        partner: req.user.role === 'partner' ? req.user.id : undefined,
        farmer: farmerId,
        loanAmount: Number(loanAmount),
        purpose,
        term: Number(term),
        description,
        status: 'pending',
        submittedBy: req.user.id,
        submittedAt: new Date()
      })
      
      res.status(201).json({
        status: 'success',
        data: loanApplication
      })
    } catch (error) {
      console.error('Error creating loan application:', error)
      res.status(500).json({
        status: 'error',
        message: 'Failed to create loan application'
      })
    }
  }
}

// Helper functions

// Credit scores in this app follow the standard 300-850 range (see calculateInitialCreditScore)
function scoreToGradeAndStatus(score) {
  if (score >= 800) return { grade: 'A', status: 'excellent' }
  if (score >= 740) return { grade: 'B', status: 'good' }
  if (score >= 670) return { grade: 'C', status: 'fair' }
  if (score >= 580) return { grade: 'D', status: 'poor' }
  if (score >= 500) return { grade: 'E', status: 'very_poor' }
  return { grade: 'F', status: 'very_poor' }
}

function calculateEligibility(score) {
  const clamped = Math.max(300, Math.min(850, score))
  const normalized = (clamped - 300) / 550 // 0..1 across the 300-850 range

  return {
    loans: score >= 500,
    insurance: score >= 450,
    marketplace: true,
    limits: {
      loanAmount: Math.round(normalized * 2000000),
      insuranceCoverage: Math.round(normalized * 1000000)
    }
  }
}

async function calculateInitialCreditScore(farmerId) {
  try {
    // Analyze farmer's actual data for more accurate credit scoring
    const farmer = await User.findById(farmerId)

    // Get transaction history for payment analysis
    const transactions = await Transaction.find({
      userId: farmerId,
      type: { $in: ['payment', 'commission'] }
    }).sort({ createdAt: -1 })

    // Get harvest history for consistency analysis
    const harvests = await require('../models/harvest.model').find({
      farmer: farmerId,
      status: 'approved'
    }).sort({ createdAt: -1 })

    // Get marketplace listings for reputation analysis
    const listings = await require('../models/listing.model').find({
      farmer: farmerId
    }).sort({ createdAt: -1 })

    // Calculate payment history score (0-100)
    let paymentHistory = 50 // Base score
    if (transactions.length > 0) {
      const successfulPayments = transactions.filter(t => t.status === 'completed').length
      paymentHistory = Math.min(100, Math.max(30, (successfulPayments / transactions.length) * 100))
    }

    // Calculate harvest consistency score (0-100)
    let harvestConsistency = 40 // Base score for new farmers
    if (harvests.length > 0) {
      // Check regularity of harvests (simplified calculation)
      const totalHarvests = harvests.length
      const completedHarvests = harvests.filter(h => h.status === 'approved').length
      harvestConsistency = Math.min(100, Math.max(30, (completedHarvests / Math.max(totalHarvests, 1)) * 100))
    }

    // Calculate business stability score (0-100)
    let businessStability = 45 // Base score
    if (farmer && farmer.createdAt) {
      const accountAge = Date.now() - new Date(farmer.createdAt).getTime()
      const accountAgeMonths = accountAge / (1000 * 60 * 60 * 24 * 30)
      businessStability = Math.min(100, Math.max(30, accountAgeMonths * 5)) // Older accounts get higher scores
    }

    // Calculate market reputation score (0-100)
    let marketReputation = 50 // Base score
    if (listings.length > 0) {
      const activeListings = listings.filter(l => l.status === 'active').length
      marketReputation = Math.min(100, Math.max(40, (activeListings / listings.length) * 100))
    }

    // Calculate overall credit score (300-850 range typical for credit scores)
    const weightedScore = (
      paymentHistory * 0.4 +      // 40% weight on payment history
      harvestConsistency * 0.25 +  // 25% weight on harvest consistency
      businessStability * 0.2 +    // 20% weight on business stability
      marketReputation * 0.15      // 15% weight on market reputation
    )

    // Convert to standard credit score range (300-850)
    const creditScore = Math.round(300 + (weightedScore * 5.5))

    const factors = {
      paymentHistory: Math.round(paymentHistory),
      harvestConsistency: Math.round(harvestConsistency),
      businessStability: Math.round(businessStability),
      marketReputation: Math.round(marketReputation)
    }

    console.log(`📊 Calculated credit score for farmer ${farmerId}: ${creditScore}`)
    console.log(`   Factors: ${JSON.stringify(factors)}`)

    return {
      score: creditScore,
      factors
    }
  } catch (error) {
    console.error('Error calculating initial credit score:', error)
    // Fallback to default values
    return {
      score: 650,
      factors: {
        paymentHistory: 70,
        harvestConsistency: 60,
        businessStability: 50,
        marketReputation: 55
      }
    }
  }
}

function generateFinancialRecommendations(netIncome, savingsRate) {
  const recommendations = []
  
  if (netIncome < 0) {
    recommendations.push('Focus on reducing expenses and increasing income')
  }
  
  if (savingsRate < 20) {
    recommendations.push('Aim to save at least 20% of your income')
  }
  
  if (savingsRate > 50) {
    recommendations.push('Consider investing excess savings for better returns')
  }
  
  if (recommendations.length === 0) {
    recommendations.push('Maintain your current financial practices')
  }
  
  return recommendations
}

function generateGoalRecommendations(goals) {
  const recommendations = []
  
  const criticalGoals = goals.filter(g => g.status === 'critical')
  const atRiskGoals = goals.filter(g => g.status === 'at_risk')
  
  if (criticalGoals.length > 0) {
    recommendations.push({
      type: 'urgent',
      message: `${criticalGoals.length} goal(s) are in critical condition. Immediate action required.`
    })
  }
  
  if (atRiskGoals.length > 0) {
    recommendations.push({
      type: 'warning',
      message: `${atRiskGoals.length} goal(s) are at risk. Review strategies and consider adjustments.`
    })
  }
  
  const lowProgressGoals = goals.filter(g => g.progress < 30 && g.daysRemaining < 60)
  if (lowProgressGoals.length > 0) {
    recommendations.push({
      type: 'strategy',
      message: `${lowProgressGoals.length} goal(s) have low progress. Consider revising targets or strategies.`
    })
  }
  
  if (recommendations.length === 0) {
    recommendations.push({
      type: 'positive',
      message: 'All goals are on track! Keep up the excellent work.'
    })
  }
  
  return recommendations
}

module.exports = fintechController
