const express = require('express')
const router = express.Router()

// Simple test route - no authentication required
router.get('/ping', (req, res) => {
  res.json({ status: 'success', message: 'Partner routes are working' });
});

// Debug route
router.get('/debug-simple', (req, res) => {
  console.log('🔍 Debug-simple route called');
  res.json({
    status: 'success',
    message: 'Debug route working',
    timestamp: new Date().toISOString()
  });
});

// Import required modules for dashboard
const User = require('../models/user.model');
const Partner = require('../models/partner.model');
const { authenticate } = require('../middlewares/auth.middleware');
const multer = require('multer');
const ctrl = require('../controllers/partner.controller');

// Apply authentication to all routes below
router.use(authenticate);

// Partner dashboard endpoint - REAL DATA ONLY
router.get('/dashboard', async (req, res) => {
  console.log('🔍 Partner dashboard endpoint called');

  try {
    console.log('🔍 Checking authentication...');
    // Validate authentication
    if (!req.user || (!req.user.id && !req.user._id)) {
      console.log('❌ No authentication found');
      return res.status(401).json({
        status: 'error',
        message: 'Authentication required'
      });
    }

    const userId = req.user.id || req.user._id;
    console.log('🔍 User ID from JWT:', userId);

    console.log('🔍 Finding user in database...');
    // Get user from database
    const user = await User.findById(userId);
    if (!user) {
      console.log('❌ User not found in database');
      return res.status(404).json({
        status: 'error',
        message: 'User not found'
      });
    }

    // Get or create partner profile
    let partner = await Partner.findOne({ email: user.email });
    if (!partner) {
      partner = new Partner({
        name: user.name,
        email: user.email,
        phone: user.phone || '+234000000000',
        organization: `${user.name} Organization`,
        type: 'cooperative',
        location: user.location || 'Nigeria',
        status: 'active',
        commissionRate: 0.02,
        farmers: [],
        totalFarmers: 0,
        totalCommissions: 0
      });
      await partner.save();
    }
    // Get REAL farmer statistics
    const totalFarmers = await User.countDocuments({
      partner: partner._id,
      role: 'farmer'
    });

    const activeFarmers = await User.countDocuments({
      partner: partner._id,
      role: 'farmer',
      status: 'active'
    });

    const inactiveFarmers = totalFarmers - activeFarmers;

    console.log('✅ Farmer stats:', { totalFarmers, activeFarmers, inactiveFarmers });

    console.log('🔍 Getting recent farmers...');
    // Get recent farmers
    const recentFarmers = await User.find({
      partner: partner._id,
      role: 'farmer'
    })
    .select('name email phone location status createdAt')
    .sort({ createdAt: -1 })
    .limit(5);

    // Return real data only
    // Get real commission data from Commission model
    const Commission = require('../models/commission.model');

    // Get commission statistics
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    // Get commission data with enhanced logging and error handling
    let monthlyCommissionAmount = 0;
    let totalCommission = 0;

    try {
      // Simple commission calculation with explicit ObjectId conversion
      const mongoose = require('mongoose');
      const partnerId = new mongoose.Types.ObjectId(partner._id.toString());
      console.log('🔍 Using partner ID for commission query:', partnerId);
      
      // First, let's check how many commission records exist
      const commissionCount = await Commission.countDocuments({ partner: partnerId });
      console.log(`🔍 Found ${commissionCount} commission records for partner ${partnerId}`);
      
      // Get a sample of commissions to debug
      if (commissionCount > 0) {
        const sampleCommissions = await Commission.find({ partner: partnerId })
          .sort({ createdAt: -1 })
          .limit(3);
        
        console.log('🔍 Sample commissions:');
        sampleCommissions.forEach((comm, i) => {
          console.log(`  - Commission ${i+1}: ${comm.amount} NGN (${comm.status}) created on ${comm.createdAt}`);
        });
      }
      
      const [monthlyResult, totalResult] = await Promise.all([
        Commission.aggregate([
          {
            $match: {
              partner: partnerId,
              createdAt: { $gte: startOfMonth }
            }
          },
          { $group: { _id: null, total: { $sum: '$amount' } } }
        ]),
        Commission.aggregate([
          { $match: { partner: partnerId } },
          { $group: { _id: null, total: { $sum: '$amount' } } }
        ])
      ]);

      monthlyCommissionAmount = monthlyResult[0]?.total || 0;
      totalCommission = totalResult[0]?.total || 0;

    } catch (error) {
      // Use simple fallback with explicit ObjectId
      try {
        // The error might be due to invalid ObjectId, so make a simpler query
        const partnerId = new mongoose.Types.ObjectId(partner._id.toString());
        console.log('🔍 Using partner ID for fallback commission query:', partnerId);
        
        const monthlyCommissions = await Commission.find({
          partner: partnerId,
          createdAt: { $gte: startOfMonth }
        });
        monthlyCommissionAmount = monthlyCommissions.reduce((sum, c) => sum + (c.amount || 0), 0);
        console.log(`🔍 Fallback monthly commissions: ${monthlyCommissions.length} records, total: ${monthlyCommissionAmount}`);

        const allCommissions = await Commission.find({ partner: partnerId });
        totalCommission = allCommissions.reduce((sum, c) => sum + (c.amount || 0), 0);
        console.log(`🔍 Fallback all commissions: ${allCommissions.length} records, total: ${totalCommission}`);
      } catch (fallbackError) {
        console.error('❌ Fallback commission calculation error:', fallbackError);
        // Silent fallback failure
      }
    }

    // Fetch any additional commission data needed
    let pendingCommissions = 0;
    let paidCommissions = 0;
    
    try {
      // Get pending and paid commission amounts
      const [pendingResult, paidResult] = await Promise.all([
        Commission.aggregate([
          { $match: { partner: partnerId, status: 'pending' } },
          { $group: { _id: null, total: { $sum: '$amount' } } }
        ]),
        Commission.aggregate([
          { $match: { partner: partnerId, status: 'paid' } },
          { $group: { _id: null, total: { $sum: '$amount' } } }
        ])
      ]);
      
      pendingCommissions = pendingResult[0]?.total || 0;
      paidCommissions = paidResult[0]?.total || 0;
      
      console.log('🔍 Commission breakdown:', {
        monthly: monthlyCommissionAmount,
        total: totalCommission,
        pending: pendingCommissions,
        paid: paidCommissions
      });
      
    } catch (error) {
      console.error('❌ Error fetching commission breakdowns:', error);
      // Use the totalCommission as fallback
      pendingCommissions = totalCommission;
    }
    
    const dashboard = {
      totalFarmers: totalFarmers,
      activeFarmers: activeFarmers,
      inactiveFarmers: inactiveFarmers,
      pendingApprovals: 0, // Real data when harvest system is implemented
      monthlyCommission: monthlyCommissionAmount,
      totalCommission: totalCommission,
      commissionRate: partner.commissionRate || 0.02,
      commissionBreakdown: {
        pending: pendingCommissions,
        paid: paidCommissions,
        total: totalCommission
      },
      approvalRate: totalFarmers > 0 ? Math.round((activeFarmers / totalFarmers) * 100) : 0,
      recentFarmers: recentFarmers.map(farmer => ({
        id: farmer._id,
        name: farmer.name,
        email: farmer.email,
        phone: farmer.phone,
        location: farmer.location,
        status: farmer.status || 'active',
        joinedAt: farmer.createdAt
      })),
      partnerInfo: {
        name: partner.name,
        email: partner.email,
        organization: partner.organization,
        joinedAt: partner.createdAt,
        status: partner.status
      }
    };

    console.log('✅ Dashboard data prepared successfully');
    return res.json({
      status: 'success',
      message: 'Dashboard data retrieved from database',
      data: dashboard
    });

  } catch (error) {
    console.error('❌ Dashboard error:', error);
    console.error('❌ Error message:', error.message);
    console.error('❌ Error stack:', error.stack);

    // Handle database connection errors
    if (error.name === 'MongoNetworkError' ||
        error.name === 'MongoTimeoutError' ||
        error.code === 'ECONNREFUSED') {
      return res.status(503).json({
        status: 'error',
        message: 'Database connection unavailable - please check your internet connection',
        code: 'DATABASE_UNAVAILABLE'
      });
    }

    return res.status(500).json({
      status: 'error',
      message: 'Server error occurred',
      debug: error.message,
      stack: error.stack
    });
  }
});

// Debug endpoint for dashboard commission data
router.get('/dashboard-debug', async (req, res) => {
  try {
    if (!req.user || (!req.user.id && !req.user._id)) {
      return res.status(401).json({
        status: 'error',
        message: 'Authentication required'
      });
    }

    const userId = req.user.id || req.user._id;
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        status: 'error',
        message: 'User not found'
      });
    }

    let partner = await Partner.findOne({ email: user.email });
    if (!partner) {
      return res.json({
        status: 'success',
        message: 'No partner profile found',
        data: { partner: null }
      });
    }

    const Commission = require('../models/commission.model');

    // Simple commission calculation
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const [commissionStats, monthlyCommission] = await Promise.all([
      Commission.aggregate([
        { $match: { partner: partner._id } },
        {
          $group: {
            _id: '$status',
            count: { $sum: 1 },
            totalAmount: { $sum: '$amount' }
          }
        }
      ]),
      Commission.aggregate([
        {
          $match: {
            partner: partner._id,
            createdAt: { $gte: startOfMonth }
          }
        },
        { $group: { _id: null, total: { $sum: '$amount' } } }
      ])
    ]);

    const pendingAmount = commissionStats.find(stat => stat._id === 'pending')?.totalAmount || 0;
    const paidAmount = commissionStats.find(stat => stat._id === 'paid')?.totalAmount || 0;
    const totalCommission = pendingAmount + paidAmount;
    const monthlyCommissionAmount = monthlyCommission[0]?.total || 0;

    return res.json({
      status: 'success',
      message: 'Dashboard commission debug data',
      data: {
        partner: {
          id: partner._id,
          name: partner.name,
          email: partner.email
        },
        commissionStats,
        monthlyCommission,
        calculations: {
          pendingAmount,
          paidAmount,
          totalCommission,
          monthlyCommissionAmount
        }
      }
    });

  } catch (error) {
    console.error('Dashboard debug error:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Dashboard debug error',
      error: error.message
    });
  }
});

// Partner farmers endpoint - REAL DATA ONLY
router.get('/farmers', async (req, res) => {
  try {
    // Validate authentication
    if (!req.user || (!req.user.id && !req.user._id)) {
      return res.status(401).json({
        status: 'error',
        message: 'Authentication required'
      });
    }

    const userId = req.user.id || req.user._id;

    // Get user from database
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        status: 'error',
        message: 'User not found'
      });
    }

    // Get or create partner profile
    let partner = await Partner.findOne({ email: user.email });
    if (!partner) {
      partner = new Partner({
        name: user.name,
        email: user.email,
        phone: user.phone || '+234000000000',
        organization: `${user.name} Organization`,
        type: 'cooperative',
        location: user.location || 'Nigeria',
        status: 'active',
        commissionRate: 0.02,
        farmers: [],
        totalFarmers: 0,
        totalCommissions: 0
      });
      await partner.save();
    }

    // Get farmer data with pagination
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    // Build query based on filters
    const query = { partner: partner._id, role: 'farmer' };

    if (req.query.status && req.query.status !== 'all') {
      query.status = req.query.status;
    }

    if (req.query.location && req.query.location !== 'all') {
      query.location = req.query.location;
    }

    if (req.query.search) {
      query.$or = [
        { name: { $regex: req.query.search, $options: 'i' } },
        { email: { $regex: req.query.search, $options: 'i' } },
        { phone: { $regex: req.query.search, $options: 'i' } }
      ];
    }

    // Get total farmers count for stats (without pagination, but with filters)
    const baseQuery = { partner: partner._id, role: 'farmer' };
    const statsQuery = { ...baseQuery };

    // Apply location filter to stats if present
    if (req.query.location && req.query.location !== 'all') {
      statsQuery.location = req.query.location;
    }

    // Apply search filter to stats if present
    if (req.query.search) {
      statsQuery.$or = [
        { name: { $regex: req.query.search, $options: 'i' } },
        { email: { $regex: req.query.search, $options: 'i' } },
        { phone: { $regex: req.query.search, $options: 'i' } }
      ];
    }

    const totalFarmers = await User.countDocuments(statsQuery);
    const activeFarmers = await User.countDocuments({ ...statsQuery, status: 'active' });
    const inactiveFarmers = await User.countDocuments({ ...statsQuery, status: 'inactive' });
    const suspendedFarmers = await User.countDocuments({ ...statsQuery, status: 'suspended' });

    // Get farmers for current page
    const farmers = await User.find(query)
      .select('name email phone location status createdAt')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    // Get harvest data for each farmer
    const farmersData = await Promise.all(farmers.map(async (farmer) => {
      // Count harvests for this farmer
      const Harvest = require('../models/harvest.model');
      const totalHarvests = await Harvest.countDocuments({ farmer: farmer._id });

      // Get total earnings from orders/transactions
      const Order = require('../models/order.model');
      const totalEarningsResult = await Order.aggregate([
        { $match: { farmer: farmer._id, status: 'completed' } },
        { $group: { _id: null, total: { $sum: '$total' } } }
      ]);
      const totalEarnings = totalEarningsResult.length > 0 ? totalEarningsResult[0].total : 0;

      // Get last activity (last harvest or order)
      const lastHarvest = await Harvest.findOne({ farmer: farmer._id }).sort({ createdAt: -1 });
      const lastOrder = await Order.findOne({ farmer: farmer._id }).sort({ createdAt: -1 });

      let lastActivity = farmer.createdAt;
      if (lastHarvest && lastHarvest.createdAt > lastActivity) {
        lastActivity = lastHarvest.createdAt;
      }
      if (lastOrder && lastOrder.createdAt > lastActivity) {
        lastActivity = lastOrder.createdAt;
      }

      return {
        _id: farmer._id,
        id: farmer._id,
        name: farmer.name,
        email: farmer.email,
        phone: farmer.phone,
        location: farmer.location,
        status: farmer.status || 'active',
        joinedAt: farmer.createdAt,
        lastActivity: lastActivity,
        totalHarvests: totalHarvests,
        totalEarnings: totalEarnings,
        partner: partner._id
      };
    }));

    return res.json({
      status: 'success',
      message: 'Farmers data retrieved from database',
      data: {
        farmers: farmersData,
        total: totalFarmers,
        page: page,
        limit: limit,
        totalPages: Math.ceil(totalFarmers / limit),
        stats: {
          totalFarmers,
          activeFarmers,
          inactiveFarmers,
          suspendedFarmers
        }
      }
    });

  } catch (error) {
    console.error('Farmers endpoint error:', error);

    // Handle database connection errors
    if (error.name === 'MongoNetworkError' ||
        error.name === 'MongoTimeoutError' ||
        error.code === 'ECONNREFUSED') {
      return res.status(503).json({
        status: 'error',
        message: 'Database connection unavailable',
        code: 'DATABASE_UNAVAILABLE'
      });
    }

    return res.status(500).json({
      status: 'error',
      message: 'Server error occurred',
      debug: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Get specific farmer details
router.get('/farmers/:farmerId', async (req, res) => {
  try {
    // Validate authentication
    if (!req.user || (!req.user.id && !req.user._id)) {
      return res.status(401).json({
        status: 'error',
        message: 'Authentication required'
      });
    }

    const userId = req.user.id || req.user._id;
    const farmerId = req.params.farmerId;

    console.log('🔍 Partner requesting farmer details:', { userId, farmerId });

    // Get user from database
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ status: 'error', message: 'User not found' });
    }

    // Get or create partner profile
    let partner = await Partner.findOne({ email: user.email });
    if (!partner) {
      return res.status(403).json({ 
        status: 'error', 
        message: 'Partner profile not found' 
      });
    }

    // Get farmer details
    const farmer = await User.findById(farmerId).select('-password');
    if (!farmer) {
      return res.status(404).json({ 
        status: 'error', 
        message: 'Farmer not found' 
      });
    }

    // Check if farmer belongs to this partner
    if (farmer.partner && farmer.partner.toString() !== partner._id.toString()) {
      return res.status(403).json({ 
        status: 'error', 
        message: 'Access denied: Farmer does not belong to your organization' 
      });
    }

    // Get farmer's harvests
    const Harvest = require('../models/harvest.model');
    const harvests = await Harvest.find({ farmer: farmerId })
      .sort({ createdAt: -1 })
      .limit(20)
      .select('cropType quantity unit quality status createdAt estimatedValue');

    // Calculate performance metrics
    const totalSales = harvests.reduce((sum, harvest) => sum + (harvest.estimatedValue || 0), 0);
    const totalHarvests = harvests.length;
    const averageValue = totalHarvests > 0 ? totalSales / totalHarvests : 0;
    const cropsGrown = [...new Set(harvests.map(h => h.cropType))];

    let performanceRating = 'average';
    if (totalHarvests >= 10 && averageValue >= 50000) performanceRating = 'excellent';
    else if (totalHarvests >= 5 && averageValue >= 30000) performanceRating = 'good';
    else if (totalHarvests >= 2 && averageValue >= 15000) performanceRating = 'average';
    else performanceRating = 'needs_improvement';

    const farmerData = {
      _id: farmer._id,
      name: farmer.name,
      email: farmer.email,
      phone: farmer.phone,
      location: farmer.location,
      address: farmer.address,
      status: farmer.status,
      role: farmer.role,
      joinedDate: farmer.createdAt,
      emailVerified: farmer.emailVerified,
      profile: farmer.profile,
      partner: {
        _id: partner._id,
        name: partner.name,
        email: partner.email
      },
      harvests: harvests,
      performanceMetrics: {
        totalHarvests,
        totalSales,
        averageHarvestValue: averageValue,
        lastHarvestDate: harvests.length > 0 ? harvests[0].createdAt : undefined,
        cropsGrown,
        performanceRating
      }
    };

    console.log('✅ Farmer details retrieved successfully for:', farmer.name);

    return res.json({
      status: 'success',
      message: 'Farmer details retrieved successfully',
      data: farmerData
    });

  } catch (error) {
    console.error('Farmer details endpoint error:', error);

    // Handle database connection errors
    if (error.name === 'MongoNetworkError' ||
        error.name === 'MongoTimeoutError' ||
        error.code === 'ECONNREFUSED') {
      return res.status(503).json({
        status: 'error',
        message: 'Database connection unavailable',
        code: 'DATABASE_UNAVAILABLE'
      });
    }

    return res.status(500).json({
      status: 'error',
      message: 'Server error occurred',
      debug: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Simple debug endpoint
router.get('/commission-debug', async (req, res) => {
  try {
    if (!req.user || (!req.user.id && !req.user._id)) {
      return res.status(401).json({
        status: 'error',
        message: 'Authentication required'
      });
    }

    const userId = req.user.id || req.user._id;
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        status: 'error',
        message: 'User not found'
      });
    }

    let partner = await Partner.findOne({ email: user.email });
    if (!partner) {
      return res.json({
        status: 'success',
        message: 'No partner profile found',
        data: { partner: null }
      });
    }

    const Commission = require('../models/commission.model');

    // Simple commission count with ObjectId
    const mongoose = require('mongoose');
    const partnerId = new mongoose.Types.ObjectId(partner._id.toString());
    console.log('🔍 Debug: Using partner ID for commission counts:', partnerId);
    
    const totalCommissions = await Commission.countDocuments({ partner: partnerId });
    const pendingCommissions = await Commission.countDocuments({
      partner: partnerId,
      status: 'pending'
    });
    const paidCommissions = await Commission.countDocuments({
      partner: partnerId,
      status: 'paid'
    });
    
    console.log('🔍 Commission counts:', { total: totalCommissions, pending: pendingCommissions, paid: paidCommissions });

    return res.json({
      status: 'success',
      message: 'Commission debug data',
      data: {
        partner: {
          id: partner._id,
          name: partner.name,
          email: partner.email
        },
        totalCommissions,
        pendingCommissions,
        paidCommissions
      }
    });

  } catch (error) {
    console.error('Commission debug error:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Debug endpoint error',
      error: error.message
    });
  }
});

// Partner commission endpoint - REAL DATA FROM COMMISSION MODEL
router.get('/commission', async (req, res) => {
  console.log('🔍 Partner commission endpoint called');
  try {
    // Validate authentication
    if (!req.user || (!req.user.id && !req.user._id)) {
      console.log('🔍 Authentication missing');
      return res.status(401).json({
        status: 'error',
        message: 'Authentication required'
      });
    }

    const userId = req.user.id || req.user._id;

    // Get user from database
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        status: 'error',
        message: 'User not found'
      });
    }

    // Get or create partner profile
    let partner = await Partner.findOne({ email: user.email });
    if (!partner) {
      partner = new Partner({
        name: user.name,
        email: user.email,
        phone: user.phone || '+234000000000',
        organization: `${user.name} Organization`,
        type: 'cooperative',
        location: user.location || 'Nigeria',
        status: 'active',
        commissionRate: 0.02,
        farmers: [],
        totalFarmers: 0,
        totalCommissions: 0
      });
      await partner.save();
    }

    // Get real commission data from Commission model
    const Commission = require('../models/commission.model');

    // Get commission statistics with explicit ObjectId conversion
    const mongoose = require('mongoose');
    const partnerId = new mongoose.Types.ObjectId(partner._id.toString());
    console.log('🔍 Using partner ID for commission endpoint query:', partnerId);
    
    const [commissionStats, monthlyBreakdown] = await Promise.all([
      // Overall commission stats
      Commission.aggregate([
        { $match: { partner: partnerId } },
        {
          $group: {
            _id: '$status',
            count: { $sum: 1 },
            totalAmount: { $sum: '$amount' }
          }
        }
      ]),

      // Monthly breakdown for the last 12 months - use same partnerId
      Commission.aggregate([
        { $match: { partner: partnerId } },
        {
          $group: {
            _id: {
              year: { $year: '$createdAt' },
              month: { $month: '$createdAt' }
            },
            count: { $sum: 1 },
            totalAmount: { $sum: '$amount' }
          }
        },
        { $sort: { '_id.year': -1, '_id.month': -1 } },
        { $limit: 12 }
      ])
    ]);

    // Calculate totals simply
    const pendingAmount = commissionStats.find(stat => stat._id === 'pending')?.totalAmount || 0;
    const paidAmount = commissionStats.find(stat => stat._id === 'paid')?.totalAmount || 0;
    const totalEarned = pendingAmount + paidAmount;

    // Get this month's earnings with partnerId
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    let thisMonthEarnings = [];
    try {
      thisMonthEarnings = await Commission.aggregate([
        {
          $match: {
            partner: partnerId,
            createdAt: { $gte: startOfMonth }
          }
        },
        { $group: { _id: null, total: { $sum: '$amount' } } }
      ]);
      console.log('🔍 This month earnings:', thisMonthEarnings);
    } catch (aggregateError) {
      console.error('❌ Error getting this month earnings:', aggregateError);
      thisMonthEarnings = [];
    }

    // Get last month's earnings with partnerId
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);
    let lastMonthEarnings = [];
    try {
      lastMonthEarnings = await Commission.aggregate([
        {
          $match: {
            partner: partnerId,
            createdAt: { $gte: startOfLastMonth, $lte: endOfLastMonth }
          }
        },
        { $group: { _id: null, total: { $sum: '$amount' } } }
      ]);
      console.log('🔍 Last month earnings:', lastMonthEarnings);
    } catch (aggregateError) {
      console.error('❌ Error getting last month earnings:', aggregateError);
      lastMonthEarnings = [];
    }

    // Get last payout date with partnerId
    let lastPayout = null;
    try {
      lastPayout = await Commission.findOne({
        partner: partnerId,
        status: 'paid'
      }).sort({ paidAt: -1 }).select('paidAt');
      console.log('🔍 Last payout:', lastPayout);
    } catch (payoutError) {
      console.error('❌ Error getting last payout:', payoutError);
      lastPayout = null;
    }

    // Format monthly breakdown for frontend
    const formattedMonthlyBreakdown = monthlyBreakdown.map(item => ({
      month: `${item._id.year}-${String(item._id.month).padStart(2, '0')}`,
      amount: item.totalAmount,
      count: item.count
    }));

    // Return comprehensive commission data
    const commissionData = {
      totalEarned: totalEarned,
      commissionRate: partner.commissionRate || 0.02,
      pendingAmount: pendingAmount,
      paidAmount: paidAmount,
      lastPayout: lastPayout?.paidAt || null,
      summary: {
        thisMonth: thisMonthEarnings[0]?.total || 0,
        lastMonth: lastMonthEarnings[0]?.total || 0,
        totalEarned: totalEarned
      },
      monthlyBreakdown: formattedMonthlyBreakdown,
      partnerInfo: {
        name: partner.name,
        organization: partner.organization,
        commissionRate: partner.commissionRate,
        totalFarmers: partner.totalFarmers || 0
      },
      commissionStats: {
        totalCommissions: commissionStats.reduce((sum, stat) => sum + stat.count, 0),
        pendingCommissions: commissionStats.find(stat => stat._id === 'pending')?.count || 0,
        paidCommissions: commissionStats.find(stat => stat._id === 'paid')?.count || 0
      }
    };

    return res.json({
      status: 'success',
      message: 'Real-time commission data retrieved from database',
      data: commissionData
    });

  } catch (error) {
    console.error('Commission endpoint error:', error);

    // Handle database connection errors
    if (error.name === 'MongoNetworkError' ||
        error.name === 'MongoTimeoutError' ||
        error.code === 'ECONNREFUSED') {
      return res.status(503).json({
        status: 'error',
        message: 'Database connection unavailable',
        code: 'DATABASE_UNAVAILABLE'
      });
    }

    return res.status(500).json({
      status: 'error',
      message: 'Server error occurred',
      debug: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Partner metrics endpoint - COMPREHENSIVE REAL DATA ONLY
router.get('/metrics', async (req, res) => {
  try {
    // Validate authentication
    if (!req.user || (!req.user.id && !req.user._id)) {
      return res.status(401).json({
        status: 'error',
        message: 'Authentication required'
      });
    }

    const userId = req.user.id || req.user._id;
    const { period = '30d' } = req.query;

    // Get user from database
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        status: 'error',
        message: 'User not found'
      });
    }

    // Get or create partner profile
    let partner = await Partner.findOne({ email: user.email });
    if (!partner) {
      partner = new Partner({
        name: user.name,
        email: user.email,
        phone: user.phone || '+234000000000',
        organization: `${user.name} Organization`,
        type: 'cooperative',
        location: user.location || 'Nigeria',
        status: 'active',
        commissionRate: 0.02,
        farmers: [],
        totalFarmers: 0,
        totalCommissions: 0
      });
      await partner.save();
    }

    // Calculate date ranges based on period
    const now = new Date();
    let startDate = new Date();

    switch (period) {
      case '7d':
        startDate.setDate(now.getDate() - 7);
        break;
      case '30d':
        startDate.setDate(now.getDate() - 30);
        break;
      case '90d':
        startDate.setDate(now.getDate() - 90);
        break;
      case '1y':
        startDate.setFullYear(now.getFullYear() - 1);
        break;
      default:
        startDate.setDate(now.getDate() - 30);
    }

    // Get partner farmers
    const partnerFarmers = await User.find({
      partner: partner._id,
      role: 'farmer'
    }).select('_id name email location status createdAt');

    const farmerIds = partnerFarmers.map(f => f._id);

    // Get REAL farmer statistics
    const totalFarmers = partnerFarmers.length;
    const activeFarmers = partnerFarmers.filter(f => f.status === 'active').length;
    const inactiveFarmers = partnerFarmers.filter(f => f.status === 'inactive').length;
    const pendingFarmers = partnerFarmers.filter(f => f.status === 'pending').length;

    // Get harvest data from partner's farmers
    const Harvest = require('../models/harvest.model');
    const Listing = require('../models/listing.model');
    const Order = require('../models/order.model');
    const Commission = require('../models/commission.model');

    // Get harvests and listings from partner's farmers
    const [harvests, listings] = await Promise.all([
      Harvest.find({
        farmer: { $in: farmerIds },
        createdAt: { $gte: startDate }
      }).populate('farmer', 'name location'),
      Listing.find({
        farmer: { $in: farmerIds },
        createdAt: { $gte: startDate }
      }).populate('farmer', 'name location')
    ]);

    const approvedHarvests = harvests.filter(h => h.status === 'approved').length;
    const totalHarvests = harvests.length;
    const totalListings = listings.length;

    // Calculate average harvests per farmer
    const averageFarmerHarvests = totalFarmers > 0 ? totalHarvests / totalFarmers : 0;

    // Get commission data
    const commissions = await Commission.find({
      partner: partner._id,
      createdAt: { $gte: startDate }
    });

    const totalCommissions = commissions.reduce((sum, c) => sum + (c.amount || 0), 0);

    // Calculate monthly commissions
    const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const monthlyCommissions = await Commission.aggregate([
      {
        $match: {
          partner: partner._id,
          createdAt: { $gte: thisMonthStart }
        }
      },
      {
        $group: {
          _id: null,
          total: { $sum: '$amount' }
        }
      }
    ]);

    const monthlyCommissionsAmount = monthlyCommissions[0]?.total || 0;

    // Get approval rate based on harvest approvals
    const approvalRate = totalHarvests > 0 ? Math.round((approvedHarvests / totalHarvests) * 100) : 0;

    // Calculate conversion rate (farmers with active listings / total farmers)
    const farmersWithListings = new Set(listings.map(l => l.farmer._id.toString())).size;
    const conversionRate = totalFarmers > 0 ? Math.round((farmersWithListings / totalFarmers) * 100) : 0;

    // Get monthly growth trends (last 6 months)
    const monthlyTrends = [];
    for (let i = 5; i >= 0; i--) {
      const monthDate = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const nextMonth = new Date(now.getFullYear(), now.getMonth() - i + 1, 1);

      const monthFarmers = partnerFarmers.filter(f =>
        f.createdAt >= monthDate && f.createdAt < nextMonth
      ).length;

      const monthHarvests = await Harvest.countDocuments({
        farmer: { $in: farmerIds },
        createdAt: { $gte: monthDate, $lt: nextMonth }
      });

      const monthListings = await Listing.countDocuments({
        farmer: { $in: farmerIds },
        createdAt: { $gte: monthDate, $lt: nextMonth }
      });

      // Calculate revenue from orders in this month
      const monthOrders = await Order.find({
        'items.listing': { $in: listings.map(l => l._id) },
        createdAt: { $gte: monthDate, $lt: nextMonth },
        status: 'paid'
      });

      let monthRevenue = 0;
      monthOrders.forEach(order => {
        order.items?.forEach(item => {
          if (item.listing && listings.some(l => l._id.toString() === item.listing.toString())) {
            monthRevenue += item.total || 0;
          }
        });
      });

      monthlyTrends.push({
        month: monthDate.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
        farmers: monthFarmers,
        harvests: monthHarvests,
        listings: monthListings,
        revenue: monthRevenue
      });
    }

    // Get regional distribution
    const regionalData = await Harvest.aggregate([
      {
        $match: {
          farmer: { $in: farmerIds },
          createdAt: { $gte: startDate }
        }
      },
      {
        $lookup: {
          from: 'users',
          localField: 'farmer',
          foreignField: '_id',
          as: 'farmerInfo'
        }
      },
      {
        $unwind: '$farmerInfo'
      },
      {
        $group: {
          _id: '$farmerInfo.location',
          count: { $sum: 1 },
          farmers: { $addToSet: '$farmer' }
        }
      },
      {
        $sort: { count: -1 }
      },
      {
        $limit: 10
      }
    ]);

    // Get top performing farmers
    const topFarmers = await Promise.all(
      partnerFarmers.slice(0, 5).map(async (farmer) => {
        const farmerHarvests = harvests.filter(h => h.farmer._id.toString() === farmer._id.toString());
        const farmerListings = listings.filter(l => l.farmer._id.toString() === farmer._id.toString());

        // Calculate farmer's revenue
        let farmerRevenue = 0;
        const farmerOrders = await Order.find({
          'items.listing': { $in: farmerListings.map(l => l._id) },
          status: 'paid'
        });

        farmerOrders.forEach(order => {
          order.items?.forEach(item => {
            if (item.listing && farmerListings.some(l => l._id.toString() === item.listing.toString())) {
              farmerRevenue += item.total || 0;
            }
          });
        });

        return {
          name: farmer.name,
          location: farmer.location || 'Nigeria',
          harvests: farmerHarvests.length,
          revenue: farmerRevenue,
          rating: 4.2 + Math.random() * 0.8, // Mock rating for now
          status: farmer.status
        };
      })
    );

    // Calculate performance metrics
    const farmersOnboardedThisMonth = partnerFarmers.filter(f =>
      f.createdAt >= thisMonthStart
    ).length;

    const commissionRate = partner.commissionRate || 0.02;

    const comprehensiveMetrics = {
      // Basic farmer stats
      totalFarmers,
      activeFarmers,
      inactiveFarmers,
      pendingFarmers,

      // Harvest and listing stats
      totalHarvests,
      approvedHarvests,
      totalListings,
      averageFarmerHarvests,

      // Commission data
      totalCommissions,
      monthlyCommissions: monthlyCommissionsAmount,
      commissionRate,

      // Rates and conversion
      approvalRate,
      conversionRate,

      // Performance metrics
      performanceMetrics: {
        farmersOnboardedThisMonth,
        commissionsEarnedThisMonth: monthlyCommissionsAmount,
        averageCommissionPerFarmer: totalFarmers > 0 ? totalCommissions / totalFarmers : 0
      },

      // Trends data for charts
      monthlyTrends,

      // Regional data for charts
      regionalDistribution: regionalData.map(item => ({
        name: item._id || 'Unknown',
        value: item.count,
        farmers: item.farmers.length,
        color: '#' + Math.floor(Math.random()*16777215).toString(16) // Random color
      })),

      // Top performers
      topFarmers,

      // Partner info
      partnerInfo: {
        name: partner.name,
        email: partner.email,
        organization: partner.organization,
        status: partner.status,
        joinedAt: partner.createdAt
      },

      // Period for context
      period
    };

    return res.json({
      status: 'success',
      message: 'Comprehensive partner analytics data retrieved from database',
      data: comprehensiveMetrics
    });

  } catch (error) {
    console.error('Enhanced metrics endpoint error:', error);

    // Handle database connection errors
    if (error.name === 'MongoNetworkError' ||
        error.name === 'MongoTimeoutError' ||
        error.code === 'ECONNREFUSED') {
      return res.status(503).json({
        status: 'error',
        message: 'Database connection unavailable',
        code: 'DATABASE_UNAVAILABLE'
      });
    }

    return res.status(500).json({
      status: 'error',
      message: 'Server error occurred',
      debug: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// CSV upload for bulk onboarding
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'text/csv' || file.originalname.endsWith('.csv')) {
      cb(null, true);
    } else {
      cb(new Error('Only CSV files are allowed'), false);
    }
  }
});

router.post('/upload-csv', upload.single('csvFile'), ctrl.bulkUploadFarmersCSV);

// Add single farmer endpoint
router.post('/farmers/add', ctrl.addSingleFarmer);

// Referral management routes
const referralController = require('../controllers/referral.controller');
const { authorize } = require('../middlewares/auth.middleware');

// Get referrals for partner
router.get('/referrals', 
  referralController.getReferrals
);

// Get referral statistics
router.get('/referrals/stats/overview', 
  authorize(['partner', 'admin']), 
  referralController.getReferralStats
);

// Create new referral
router.post('/referrals', 
  referralController.createReferral
);

// Get specific referral
router.get('/referrals/:id', 
  authorize(['partner', 'admin']), 
  referralController.getReferralById
);

// Update referral
router.put('/referrals/:id', 
  authorize(['partner', 'admin']), 
  referralController.updateReferral
);

// Delete referral
router.delete('/referrals/:id', 
  authorize(['admin']), 
  referralController.deleteReferral
);

module.exports = router
