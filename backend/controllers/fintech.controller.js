const CreditScore = require('../models/credit-score.model')
const LoanReferral = require('../models/loanReferral.model')
const User = require('../models/user.model')
const Partner = require('../models/partner.model')
const Transaction = require('../models/transaction.model')

// Import additional models
const FinancialGoal = require('../models/financial-goal.model')
const LoanApplication = require('../models/loan-application.model')
const InsurancePolicy = require('../models/insurance-policy.model')

// Control sample data creation via environment variable
const ENABLE_SAMPLE_DATA = process.env.ENABLE_SAMPLE_DATA !== 'false' // Default to true for demo

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

      // Get credit score
      let creditScore = await CreditScore.findOne({ farmer: userId }).sort({ createdAt: -1 })

      // If no credit score, create sample credit score (only if enabled)
      if (!creditScore && ENABLE_SAMPLE_DATA) {
        console.log('⚠️  No credit score found, creating sample credit score...')

        creditScore = await CreditScore.create({
          farmer: userId,
          score: 720,
          factors: {
            paymentHistory: 85,
            creditUtilization: 70,
            creditHistory: 75,
            newCredit: 80,
            creditMix: 65
          },
          recommendations: [
            'Continue making timely payments',
            'Consider reducing credit utilization below 30%',
            'Maintain good payment history'
          ]
        })
        console.log('✅ Created sample credit score:', creditScore.score)
      }

      // Get total earnings from transactions
      let earningsQuery = {}
      let totalEarnings = 0

      if (user.role === 'farmer') {
        // For farmers, calculate earnings from orders where they own the listings
        const Order = require('../models/order.model')
        const Listing = require('../models/listing.model')

        // Get farmer's listings
        const farmerListings = await Listing.find({ farmer: userId }).select('_id')
        const listingIds = farmerListings.map(listing => listing._id)

        // Check if farmer has a partner
        const farmer = await User.findById(userId).select('partner')
        const hasPartner = farmer && farmer.partner

        // Platform fee rate (3%)
        const platformFeeRate = 0.03
        // Partner commission rate (5%)
        const partnerCommissionRate = hasPartner ? 0.05 : 0

        // Calculate total earnings from completed orders
        const earningsResult = await Order.aggregate([
          {
            $match: {
              'items.listing': { $in: listingIds },
              paymentStatus: 'paid'
            }
          },
          {
            $unwind: '$items'
          },
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

        // Calculate net earnings after fees
        let grossEarnings = earningsResult[0]?.total || 0
        const platformFee = grossEarnings * platformFeeRate
        const partnerCommission = grossEarnings * partnerCommissionRate
        totalEarnings = grossEarnings - platformFee - partnerCommission
      } else {
        earningsQuery = { userId: userId, type: { $in: ['payment', 'commission'] }, status: 'completed' }
      }

      const earnings = await Transaction.aggregate([
        { $match: earningsQuery },
        { $group: { _id: null, total: { $sum: '$amount' } } }
      ])

      // If no earnings data, create sample data (only if enabled)
      if ((!earnings[0] || earnings[0].total === 0) && ENABLE_SAMPLE_DATA) {
        console.log('⚠️  No earnings data found, creating sample transactions...')

        const sampleTransactions = [
          {
            type: 'payment',
            status: 'completed',
            amount: 250000,
            currency: 'NGN',
            reference: 'TXN-SAMPLE-001-' + Date.now(),
            description: 'Harvest sale - Cassava',
            userId: userId,
            createdAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000)
          },
          {
            type: 'commission',
            status: 'completed',
            amount: 15000,
            currency: 'NGN',
            reference: 'TXN-SAMPLE-002-' + Date.now(),
            description: 'Referral commission',
            userId: userId,
            createdAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000)
          },
          {
            type: 'payment',
            status: 'completed',
            amount: 180000,
            currency: 'NGN',
            reference: 'TXN-SAMPLE-003-' + Date.now(),
            description: 'Harvest sale - Maize',
            userId: userId,
            createdAt: new Date(Date.now() - 16 * 24 * 60 * 60 * 1000)
          },
          {
            type: 'payment',
            status: 'completed',
            amount: 320000,
            currency: 'NGN',
            reference: 'TXN-SAMPLE-004-' + Date.now(),
            description: 'Harvest sale - Tomatoes',
            userId: userId,
            createdAt: new Date(Date.now() - 17 * 24 * 60 * 60 * 1000)
          }
        ]

        await Transaction.insertMany(sampleTransactions)
        console.log('✅ Created sample transactions')
      }

      // Get total savings from financial goals
      const savings = await FinancialGoal.aggregate([
        { $match: { farmer: userId, status: 'active' } },
        { $group: { _id: null, total: { $sum: '$currentAmount' } } }
      ])

      // If no savings data, create sample financial goals (only if enabled)
      if ((!savings[0] || savings[0].total === 0) && ENABLE_SAMPLE_DATA) {
        console.log('⚠️  No savings data found, creating sample financial goals...')

        const sampleGoals = [
          {
            farmer: userId,
            title: 'Emergency Fund',
            description: 'Build emergency fund for unexpected expenses',
            type: 'emergency_fund',
            targetAmount: 500000,
            currentAmount: 150000,
            targetDate: new Date(new Date().getFullYear(), 11, 31),
            priority: 'high',
            category: 'short_term',
            status: 'active'
          },
          {
            farmer: userId,
            title: 'Equipment Purchase',
            description: 'Save for new tractor',
            type: 'equipment_purchase',
            targetAmount: 2000000,
            currentAmount: 450000,
            targetDate: new Date(new Date().getFullYear(), 5, 30),
            priority: 'medium',
            category: 'medium_term',
            status: 'active'
          },
          {
            farmer: userId,
            title: 'Business Expansion',
            description: 'Expand farm operations',
            type: 'business_expansion',
            targetAmount: 1000000,
            currentAmount: 200000,
            targetDate: new Date('2026-12-31'),
            priority: 'medium',
            category: 'long_term',
            status: 'active'
          }
        ]

        await FinancialGoal.insertMany(sampleGoals)
        console.log('✅ Created sample financial goals')
      }

      // Get active loans
      const activeLoans = await LoanApplication.find({
        farmer: userId,
        status: { $in: ['approved', 'disbursed'] }
      })

      // If no active loans, create sample loan applications (only if enabled)
      if (activeLoans.length === 0 && ENABLE_SAMPLE_DATA) {
        console.log('⚠️  No active loans found, creating sample loan applications...')

        const sampleLoans = [
          {
            farmer: userId,
            amount: 500000,
            purpose: 'Equipment purchase - Tractor',
            duration: 12,
            interestRate: 15,
            status: 'approved',
            approvedAmount: 500000,
            approvedDuration: 12,
            approvedInterestRate: 15,
            repaymentSchedule: [
              {
                dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
                amount: 45000,
                status: 'pending'
              },
              {
                dueDate: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000),
                amount: 45000,
                status: 'pending'
              },
              {
                dueDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
                amount: 45000,
                status: 'pending'
              }
            ]
          },
          {
            farmer: userId,
            amount: 300000,
            purpose: 'Seed and fertilizer purchase',
            duration: 6,
            interestRate: 12,
            status: 'disbursed',
            approvedAmount: 300000,
            approvedDuration: 6,
            approvedInterestRate: 12,
            disbursedAt: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000),
            repaymentSchedule: [
              {
                dueDate: new Date(Date.now() + 25 * 24 * 60 * 60 * 1000),
                amount: 53000,
                status: 'pending'
              },
              {
                dueDate: new Date(Date.now() + 55 * 24 * 60 * 60 * 1000),
                amount: 53000,
                status: 'pending'
              }
            ]
          }
        ]

        await LoanApplication.insertMany(sampleLoans)
        console.log('✅ Created sample loan applications')
      }

      // Get active insurance policies
      const activeInsurance = await InsurancePolicy.find({
        farmer: userId,
        status: 'active',
        endDate: { $gt: new Date() }
      })

      // If no active insurance policies, create sample policies (only if enabled)
      if (activeInsurance.length === 0 && ENABLE_SAMPLE_DATA) {
        console.log('⚠️  No active insurance policies found, creating sample policies...')

        const samplePolicies = [
          {
            farmer: userId,
            type: 'crop',
            provider: 'GroChain Insurance',
            policyNumber: 'POL-SAMPLE-001-' + Date.now(),
            coverageAmount: 1000000,
            premium: 25000,
            startDate: new Date(new Date().getFullYear(), 0, 1),
            endDate: new Date(new Date().getFullYear(), 11, 31),
            status: 'active',
            region: 'Lagos',
            coverageDetails: {
              crops: ['Cassava', 'Maize'],
              exclusions: ['Natural disasters']
            }
          },
          {
            farmer: userId,
            type: 'equipment',
            provider: 'Farm Equipment Insurance',
            policyNumber: 'POL-SAMPLE-002-' + Date.now(),
            coverageAmount: 500000,
            premium: 15000,
            startDate: new Date(new Date().getFullYear(), 0, 1),
            endDate: new Date(new Date().getFullYear(), 11, 31),
            status: 'active',
            region: 'Lagos',
            coverageDetails: {
              equipment: ['Tractor', 'Harvester'],
              exclusions: ['Operator negligence']
            }
          },
          {
            farmer: userId,
            type: 'livestock',
            provider: 'Livestock Protection',
            policyNumber: 'POL-SAMPLE-003-' + Date.now(),
            coverageAmount: 300000,
            premium: 12000,
            startDate: new Date(new Date().getFullYear(), 0, 1),
            endDate: new Date(new Date().getFullYear(), 11, 31),
            status: 'active',
            region: 'Lagos',
            coverageDetails: {
              livestock: ['Goats', 'Sheep'],
              exclusions: ['Disease outbreaks']
            }
          }
        ]

        await InsurancePolicy.insertMany(samplePolicies)
        console.log('✅ Created sample insurance policies')
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

      // Get financial goals count
      const financialGoalsCount = await FinancialGoal.countDocuments({
        farmer: userId,
        status: 'active'
      })

      // Get recent transactions
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
          totalEarnings: earnings[0]?.total || 0,
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

      res.json({
        status: 'success',
        data: {
          farmerId: userId,
          score: creditScore.score,
          factors: creditScore.factors,
          recommendations: creditScore.recommendations || [],
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
      // Mock insurance policies for now
      const policies = [
        {
          id: 'crop_insurance_001',
          name: 'Crop Insurance Basic',
          type: 'crop',
          coverage: 'Basic crop protection',
          premium: 5000,
          coverageAmount: 100000,
          duration: '1 year'
        },
        {
          id: 'equipment_insurance_001',
          name: 'Farm Equipment Insurance',
          type: 'equipment',
          coverage: 'Farm machinery protection',
          premium: 8000,
          coverageAmount: 200000,
          duration: '1 year'
        }
      ]
      
      res.json({
        status: 'success',
        data: policies
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
      
      const creditScore = await CreditScore.findByIdAndUpdate(
        id,
        {
          score: score ? Number(score) : undefined,
          factors: factors || undefined,
          recommendations: recommendations || undefined,
          lastUpdated: new Date()
        },
        { new: true, runValidators: true }
      )
      
      if (!creditScore) {
        return res.status(404).json({
          status: 'error',
          message: 'Credit score not found'
        })
      }
      
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
      const { status, notes, approvedAmount, approvedBy } = req.body
      
      const loanApplication = await LoanReferral.findByIdAndUpdate(
        id,
        {
          status: status || undefined,
          notes: notes || undefined,
          approvedAmount: approvedAmount ? Number(approvedAmount) : undefined,
          approvedBy: approvedBy || undefined,
          approvedAt: status === 'approved' ? new Date() : undefined
        },
        { new: true, runValidators: true }
      )
      
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
      
      const loanApplication = await LoanReferral.findByIdAndDelete(id)
      
      if (!loanApplication) {
        return res.status(404).json({
          status: 'error',
          message: 'Loan application not found'
        })
      }
      
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
        .populate('farmer', 'name email phone')
      
      if (!insurancePolicy) {
        return res.status(404).json({
          status: 'error',
          message: 'Insurance policy not found'
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
      const updateData = req.body
      
      const InsurancePolicy = require('../models/insurance-policy.model')
      
      const insurancePolicy = await InsurancePolicy.findByIdAndUpdate(
        id,
        updateData,
        { new: true, runValidators: true }
      )
      
      if (!insurancePolicy) {
        return res.status(404).json({
          status: 'error',
          message: 'Insurance policy not found'
        })
      }
      
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
      
      const insurancePolicy = await InsurancePolicy.findByIdAndDelete(id)
      
      if (!insurancePolicy) {
        return res.status(404).json({
          status: 'error',
          message: 'Insurance policy not found'
        })
      }
      
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
      const { policyId, claimAmount, description, incidentDate, documents } = req.body
      
      if (!policyId || !claimAmount || !description || !incidentDate) {
        return res.status(400).json({
          status: 'error',
          message: 'Policy ID, claim amount, description, and incident date are required'
        })
      }
      
      // Mock implementation - in real app, you'd have an InsuranceClaim model
      const claim = {
        id: `CLAIM_${Date.now()}`,
        policyId,
        claimAmount: Number(claimAmount),
        description,
        incidentDate: new Date(incidentDate),
        documents: documents || [],
        status: 'pending',
        submittedAt: new Date()
      }
      
      res.status(201).json({
        status: 'success',
        data: claim
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
      
      // Mock implementation - in real app, you'd fetch from InsuranceClaim model
      const claim = {
        id,
        policyId: 'POLICY_123',
        claimAmount: 50000,
        description: 'Crop damage due to flooding',
        incidentDate: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000),
        status: 'pending',
        submittedAt: new Date(Date.now() - 9 * 24 * 60 * 60 * 1000)
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
      const { status, notes, approvedAmount } = req.body
      
      // Mock implementation - in real app, you'd update InsuranceClaim model
      const claim = {
        id,
        policyId: 'POLICY_123',
        claimAmount: 50000,
        description: 'Crop damage due to flooding',
        incidentDate: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000),
        status: status || 'pending',
        notes: notes || undefined,
        approvedAmount: approvedAmount ? Number(approvedAmount) : undefined,
        submittedAt: new Date(Date.now() - 9 * 24 * 60 * 60 * 1000)
      }
      
      res.json({
        status: 'success',
        data: claim
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
      // Mock insurance claims for now
      const claims = [
        {
          id: 'claim_001',
          policyId: 'POLICY_123',
          farmerId: 'farmer_001',
          claimAmount: 50000,
          description: 'Crop damage due to flooding',
          incidentDate: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000),
          status: 'pending',
          submittedAt: new Date(Date.now() - 9 * 24 * 60 * 60 * 1000),
          documents: ['flood_photos.pdf', 'damage_assessment.pdf']
        },
        {
          id: 'claim_002',
          policyId: 'POLICY_124',
          farmerId: 'farmer_002',
          claimAmount: 30000,
          description: 'Equipment breakdown',
          incidentDate: new Date(Date.now() - 19 * 24 * 60 * 60 * 1000),
          status: 'approved',
          submittedAt: new Date(Date.now() - 17 * 24 * 60 * 60 * 1000),
          approvedAt: new Date(Date.now() - 11 * 24 * 60 * 60 * 1000),
          approvedAmount: 28000
        }
      ]
      
      res.json({
        status: 'success',
        data: claims
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
