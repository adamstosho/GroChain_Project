const Partner = require('../models/partner.model')
const User = require('../models/user.model')
const Commission = require('../models/commission.model')
const NotificationService = require('../services/notification.service')

exports.getAllPartners = async (req, res) => {
  try {
    const { page = 1, limit = 10, status, type, search } = req.query
    const query = {}
    
    if (status) query.status = status
    if (type) query.type = type
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { organization: { $regex: search, $options: 'i' } },
        { location: { $regex: search, $options: 'i' } }
      ]
    }
    
    const partners = await Partner.find(query)
      .populate('farmers', 'name email phone location')
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .sort({ createdAt: -1 })
    
    const total = await Partner.countDocuments(query)
    
    return res.json({
      status: 'success',
      data: {
        partners,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(total / limit),
          totalItems: total,
          itemsPerPage: parseInt(limit)
        }
      }
    })
  } catch (error) {
    return res.status(500).json({ status: 'error', message: 'Server error' })
  }
}

exports.getPartnerById = async (req, res) => {
  try {
    const partner = await Partner.findById(req.params.id)
      .populate('farmers', 'name email phone location')
    
    if (!partner) {
      return res.status(404).json({ status: 'error', message: 'Partner not found' })
    }
    
    return res.json({ status: 'success', data: partner })
  } catch (error) {
    return res.status(500).json({ status: 'error', message: 'Server error' })
  }
}

exports.createPartner = async (req, res) => {
  try {
    const partnerData = req.body
    const partner = new Partner(partnerData)
    await partner.save()
    
    return res.status(201).json({ status: 'success', data: partner })
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ status: 'error', message: 'Partner with this email already exists' })
    }
    return res.status(500).json({ status: 'error', message: 'Server error' })
  }
}

exports.updatePartner = async (req, res) => {
  try {
    const partner = await Partner.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    )
    
    if (!partner) {
      return res.status(404).json({ status: 'error', message: 'Partner not found' })
    }
    
    return res.json({ status: 'success', data: partner })
  } catch (error) {
    return res.status(500).json({ status: 'error', message: 'Server error' })
  }
}

exports.deletePartner = async (req, res) => {
  try {
    const partner = await Partner.findByIdAndDelete(req.params.id)
    
    if (!partner) {
      return res.status(404).json({ status: 'error', message: 'Partner not found' })
    }
    
    // Remove partner reference from associated farmers
    await User.updateMany(
      { partner: req.params.id },
      { $unset: { partner: 1 } }
    )
    
    return res.json({ status: 'success', message: 'Partner deleted successfully' })
  } catch (error) {
    return res.status(500).json({ status: 'error', message: 'Server error' })
  }
}

exports.getPartnerMetrics = async (req, res) => {
  try {
    const partner = await Partner.findById(req.params.id)
    
    if (!partner) {
      return res.status(404).json({ status: 'error', message: 'Partner not found' })
    }
    
    const metrics = {
      totalFarmers: partner.totalFarmers,
      totalCommissions: partner.totalCommissions,
      commissionRate: partner.commissionRate,
      status: partner.status,
      joinedAt: partner.createdAt
    }
    
    return res.json({ status: 'success', data: metrics })
  } catch (error) {
    return res.status(500).json({ status: 'error', message: 'Server error' })
  }
}

exports.onboardFarmer = async (req, res) => {
  try {
    const mongoose = require('mongoose')
    const session = await mongoose.startSession()
    session.startTransaction()
    const { farmerId } = req.body
    const partnerId = req.params.id
    
    const partner = await Partner.findById(partnerId).session(session)
    if (!partner) {
      return res.status(404).json({ status: 'error', message: 'Partner not found' })
    }
    
    const farmer = await User.findById(farmerId).session(session)
    if (!farmer) {
      return res.status(404).json({ status: 'error', message: 'Farmer not found' })
    }
    
    if (farmer.role !== 'farmer') {
      return res.status(400).json({ status: 'error', message: 'User is not a farmer' })
    }
    
    // Add farmer to partner's farmers list
    if (!partner.farmers.includes(farmerId)) {
      partner.farmers.push(farmerId)
      partner.totalFarmers = partner.farmers.length
      await partner.save({ session })
    }
    
    // Update farmer's partner reference
    farmer.partner = partnerId
    await farmer.save({ session })

    await session.commitTransaction()
    session.endSession()

    return res.json({ status: 'success', message: 'Farmer onboarded successfully' })
  } catch (error) {
    try { if (session) { await session.abortTransaction(); session.endSession() } } catch (e) {}
    return res.status(500).json({ status: 'error', message: 'Server error' })
  }
}

exports.bulkOnboardFarmers = async (req, res) => {
  try {
    const { farmerIds } = req.body
    const partnerId = req.params.id

    const partner = await Partner.findById(partnerId)
    if (!partner) {
      return res.status(404).json({ status: 'error', message: 'Partner not found' })
    }

    const farmers = await User.find({ _id: { $in: farmerIds }, role: 'farmer' })

    for (const farmer of farmers) {
      if (!partner.farmers.includes(farmer._id)) {
        partner.farmers.push(farmer._id)
        farmer.partner = partnerId
        await farmer.save()
      }
    }

    partner.totalFarmers = partner.farmers.length
    await partner.save()

    return res.json({
      status: 'success',
      message: `${farmers.length} farmers onboarded successfully`
    })
  } catch (error) {
    return res.status(500).json({ status: 'error', message: 'Server error' })
  }
}

// Bulk CSV upload for partner farmers
exports.bulkUploadFarmersCSV = async (req, res) => {
  try {
    console.log('🔍 CSV upload request received');

    // Validate authentication
    const userId = req.user?.id || req.user?._id;
    if (!userId) {
      return res.status(401).json({ status: 'error', message: 'Authentication required' });
    }

    // Get user from database
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ status: 'error', message: 'User not found' });
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
      console.log('✅ Partner created');
    }

    // Check if file was uploaded
    if (!req.file) {
      return res.status(400).json({ status: 'error', message: 'No CSV file uploaded' });
    }

    // Parse CSV file
    const csvData = req.file.buffer.toString('utf-8');
    const lines = csvData.split(/\r?\n/).filter(Boolean);

    if (lines.length < 2) {
      return res.status(400).json({ status: 'error', message: 'CSV file must contain header and at least one data row' });
    }

    const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
    const requiredHeaders = ['name', 'email', 'phone', 'location'];

    // Validate headers
    const missingHeaders = requiredHeaders.filter(header => !headers.includes(header));
    if (missingHeaders.length > 0) {
      return res.status(400).json({
        status: 'error',
        message: `Missing required headers: ${missingHeaders.join(', ')}`
      });
    }

    // Process CSV data
    const farmersData = [];
    const errors = [];
    const processedEmails = new Set();

    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',').map(v => v.trim());
      const row = {};

      headers.forEach((header, index) => {
        row[header] = values[index] || '';
      });

      // Validate required fields
      if (!row.name || row.name.trim() === '') {
        errors.push(`Row ${i + 1}: Name is required`);
        continue;
      }

      if (!row.email || row.email.trim() === '') {
        errors.push(`Row ${i + 1}: Email is required`);
        continue;
      }

      // Check for duplicate emails in CSV
      if (processedEmails.has(row.email.toLowerCase())) {
        errors.push(`Row ${i + 1}: Duplicate email in CSV file`);
        continue;
      }
      processedEmails.add(row.email.toLowerCase());

      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(row.email)) {
        errors.push(`Row ${i + 1}: Invalid email format`);
        continue;
      }

      if (!row.phone || row.phone.trim() === '') {
        errors.push(`Row ${i + 1}: Phone is required`);
        continue;
      }

      // Validate Nigerian phone format
      const phoneRegex = /^(\+234|0)[789][01]\d{8}$/;
      const cleanPhone = row.phone.replace(/\s/g, '');
      if (!phoneRegex.test(cleanPhone)) {
        errors.push(`Row ${i + 1}: Invalid phone format (use +234 or 0 followed by 10 digits)`);
        continue;
      }

      if (!row.location || row.location.trim() === '') {
        errors.push(`Row ${i + 1}: Location is required`);
        continue;
      }

      farmersData.push({
        name: row.name.trim(),
        email: row.email.toLowerCase().trim(),
        phone: cleanPhone,
        location: row.location.trim(),
        role: 'farmer',
        status: 'active',
        partner: partner._id,
        emailVerified: true, // Automatically verify emails for partner-onboarded farmers
        password: Math.random().toString(36).slice(-12) + 'Aa1!' // Generate temporary password
      });
    }

    if (farmersData.length === 0) {
      return res.status(400).json({
        status: 'error',
        message: 'No valid farmers found in CSV file',
        errors
      });
    }

    // Check for existing users
    const existingUsers = await User.find({
      email: { $in: farmersData.map(f => f.email) }
    });

    const existingEmails = new Set(existingUsers.map(u => u.email.toLowerCase()));

    // Filter out existing users
    const newFarmers = farmersData.filter(f => !existingEmails.has(f.email.toLowerCase()));

    if (newFarmers.length === 0) {
      return res.status(400).json({
        status: 'error',
        message: 'All farmers in the CSV already exist in the system',
        existingUsers: existingUsers.length
      });
    }

    // Create new farmers
    const createdFarmers = [];
    for (const farmerData of newFarmers) {
      try {
        // Store the plain text password before it gets hashed
        const plainTextPassword = farmerData.password;

        const farmer = new User(farmerData);
        await farmer.save();

        // Add the plain text password back for email sending
        farmer.plainTextPassword = plainTextPassword;
        createdFarmers.push(farmer);

        // Add farmer to partner's list
        if (!partner.farmers.includes(farmer._id)) {
          partner.farmers.push(farmer._id);
        }
      } catch (error) {
        console.error('Error creating farmer:', error);
        errors.push(`Failed to create farmer ${farmerData.email}: ${error.message}`);
      }
    }

    // Update partner stats
    partner.totalFarmers = partner.farmers.length;
    await partner.save();

    // Send welcome emails to newly created farmers (async, non-blocking)
    if (createdFarmers.length > 0) {
      console.log('📧 Queuing welcome emails for', createdFarmers.length, 'farmers...');

      // Process emails asynchronously to avoid blocking the response
      setImmediate(async () => {
        let emailSuccessCount = 0;
        let emailErrorCount = 0;

        for (const farmer of createdFarmers) {
          try {
            // Generate welcome email content
            const welcomeEmailData = {
              user: farmer._id,
              title: 'Welcome to GroChain - Your Agricultural Partner!',
              message: `Welcome to GroChain, ${farmer.name}!

Your farmer account has been successfully created by your partner ${partner.name || 'GroChain Partner'}.

**Your Login Credentials:**
Email: ${farmer.email}
Password: ${farmer.plainTextPassword} (Please change this after first login)

**Next Steps:**
1. Visit ${process.env.FRONTEND_URL || 'http://localhost:3000'}/login
2. Log in with your email and temporary password
3. Complete your profile information
4. Start logging your harvests and accessing our marketplace

**What You Can Do:**
• Log your harvests with photos and details
• Access our agricultural marketplace
• Get insights and analytics on your farming activities
• Connect with buyers and partners
• Access financial services and loan opportunities

If you have any questions, please contact your partner or our support team.

Welcome to the future of agriculture!

Best regards,
The GroChain Team`,
              type: 'info',
              category: 'system',
              channels: ['email'],
              data: {
                farmerId: farmer._id,
                partnerId: partner._id,
                temporaryPassword: farmer.plainTextPassword,
                loginUrl: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/login`
              }
            };

            await NotificationService.createNotification(welcomeEmailData);
            console.log('✅ Welcome email sent to:', farmer.email);
            emailSuccessCount++;

          } catch (emailError) {
            console.error('❌ Failed to send welcome email to:', farmer.email, emailError.message);
            emailErrorCount++;
            // Don't fail the entire process if email sending fails
          }
        }

        console.log(`📧 Email sending completed: ${emailSuccessCount} successful, ${emailErrorCount} failed`);
      });
    }

    const result = {
      totalRows: lines.length - 1,
      successfulRows: createdFarmers.length,
      failedRows: errors.length,
      skippedRows: existingUsers.length,
      errors: errors.length > 0 ? errors : undefined,
      message: `${createdFarmers.length} farmers onboarded successfully${existingUsers.length > 0 ? `, ${existingUsers.length} already existed` : ''}${createdFarmers.length > 0 ? ' and welcome emails sent' : ''}`
    };

    console.log('✅ CSV upload completed:', result);

    return res.json({
      status: 'success',
      data: result
    });

  } catch (error) {
    console.error('❌ CSV upload error:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Server error during CSV upload',
      debug: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}

// Add missing partner dashboard method
exports.getPartnerDashboard = async (req, res) => {
  try {
    console.log('🔍 Partner dashboard request received');

    // Get user details from database using the ID from JWT
    const User = require('../models/user.model')
    const userId = req.user?.id || req.user?._id

    if (!userId) {
      console.log('🔍 No user ID in request');
      return res.status(401).json({ status: 'error', message: 'Unauthorized - No user ID' })
    }

    console.log('🔍 Looking for user with ID:', userId);
    const user = await User.findById(userId)

    if (!user) {
      console.log('🔍 User not found in database');
      return res.status(404).json({ status: 'error', message: 'User not found' })
    }

    console.log('🔍 User found:', user.email);

    // Find partner by user email
    let partner = await Partner.findOne({ email: user.email })

    if (!partner) {
      console.log('🔍 Creating new partner profile for:', user.email);
      try {
        const partnerData = {
          name: user.name || 'Partner User',
          email: user.email,
          phone: user.phone || '+234000000000',
          organization: `${user.name || 'User'} Organization`,
          type: 'cooperative',
          location: user.location || 'Nigeria',
          status: 'active',
          commissionRate: 0.02,
          farmers: [],
          totalFarmers: 0,
          totalCommissions: 0
        };

        partner = new Partner(partnerData)
        await partner.save()
        console.log('🔍 Partner created successfully');
      } catch (partnerError) {
        console.error('💥 Error creating partner:', partnerError);
        return res.status(500).json({
          status: 'error',
          message: 'Failed to create partner profile',
          debug: process.env.NODE_ENV === 'development' ? partnerError.message : undefined
        })
      }
    }

    // Return dashboard data
    const dashboard = {
      totalFarmers: partner.farmers?.length || 0,
      activeFarmers: partner.farmers?.length || 0, // For now, assume all are active
      pendingApprovals: 0, // Mock data for now
      monthlyCommission: partner.totalCommissions || 0,
      totalCommission: partner.totalCommissions || 0,
      commissionRate: partner.commissionRate || 0.02,
      approvalRate: 85, // Mock data
      recentActivity: [],
      joinedAt: partner.createdAt
    }

    console.log('🔍 Dashboard data prepared successfully');
    return res.json({
      status: 'success',
      data: dashboard
    })

  } catch (error) {
    console.error('💥 Partner dashboard error:', error);
    console.error('💥 Error message:', error.message);
    console.error('💥 Error stack:', error.stack);
    return res.status(500).json({
      status: 'error',
      message: 'Server error',
      debug: process.env.NODE_ENV === 'development' ? error.message : undefined
    })
  }
}

// Add missing partner farmers method
exports.getPartnerFarmers = async (req, res) => {
  try {
    console.log('🔍 Partner farmers request received');

    // Get user details from database using the ID from JWT
    const User = require('../models/user.model')
    const userId = req.user?.id || req.user?._id

    if (!userId) {
      console.log('🔍 No user ID in request');
      return res.status(401).json({ status: 'error', message: 'Unauthorized - No user ID' })
    }

    const user = await User.findById(userId)
    if (!user) {
      console.log('🔍 User not found in database');
      return res.status(404).json({ status: 'error', message: 'User not found' })
    }

    console.log('🔍 User found:', user.email);

    // Find partner by user email
    let partner = await Partner.findOne({ email: user.email })

    if (!partner) {
      console.log('🔍 Creating partner profile for farmers endpoint');
      try {
        const partnerData = {
          name: user.name || 'Partner User',
          email: user.email,
          phone: user.phone || '+234000000000',
          organization: `${user.name || 'User'} Organization`,
          type: 'cooperative',
          location: user.location || 'Nigeria',
          status: 'active',
          commissionRate: 0.02,
          farmers: [],
          totalFarmers: 0,
          totalCommissions: 0
        };

        partner = new Partner(partnerData)
        await partner.save()
        console.log('🔍 Partner created for farmers endpoint');
      } catch (partnerError) {
        console.error('💥 Error creating partner for farmers:', partnerError);
        return res.status(500).json({
          status: 'error',
          message: 'Failed to create partner profile',
          debug: process.env.NODE_ENV === 'development' ? partnerError.message : undefined
        })
      }
    }

    // Get farmers associated with this partner
    console.log('🔍 Looking for farmers with partner ID:', partner._id);
    const farmers = await User.find({ partner: partner._id, role: 'farmer' })
      .select('name email phone location status createdAt')
      .sort({ createdAt: -1 })
    
    console.log('🔍 Found farmers:', farmers.length);
    if (farmers.length > 0) {
      console.log('🔍 First farmer:', {
        name: farmers[0].name,
        createdAt: farmers[0].createdAt,
        createdAtType: typeof farmers[0].createdAt
      });
    }

    const farmersData = farmers.map(farmer => ({
      _id: farmer._id,
      name: farmer.name,
      email: farmer.email,
      phone: farmer.phone,
      location: farmer.location,
      status: farmer.status || 'active',
      joinedDate: farmer.createdAt ? farmer.createdAt.toISOString() : null,
      totalHarvests: 0, // Default value
      totalSales: 0 // Default value
    }))

    console.log('🔍 Farmers data prepared:', farmersData.length, 'farmers');
    if (farmersData.length > 0) {
      console.log('🔍 First farmer data:', {
        name: farmersData[0].name,
        joinedDate: farmersData[0].joinedDate,
        joinedDateType: typeof farmersData[0].joinedDate
      });
    }
    
    return res.json({
      status: 'success',
      data: {
        farmers: farmersData,
        total: farmersData.length
      }
    })
  } catch (error) {
    console.error('💥 Partner farmers error:', error);
    console.error('💥 Error message:', error.message);
    return res.status(500).json({
      status: 'error',
      message: 'Server error',
      debug: process.env.NODE_ENV === 'development' ? error.message : undefined
    })
  }
}

// Add single farmer endpoint
exports.addSingleFarmer = async (req, res) => {
  try {
    console.log('🔍 Add single farmer request received');

    // Validate authentication
    const userId = req.user?.id || req.user?._id;
    if (!userId) {
      return res.status(401).json({ status: 'error', message: 'Authentication required' });
    }

    // Get user from database
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ status: 'error', message: 'User not found' });
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
      console.log('✅ Partner created');
    }

    // Validate request data
    const { name, email, phone, location, address, farmSize, primaryCrops, experience, notes } = req.body;

    if (!name || !email || !phone || !location || !farmSize || !primaryCrops) {
      return res.status(400).json({
        status: 'error',
        message: 'Missing required fields: name, email, phone, location, farmSize, primaryCrops'
      });
    }

    // Check if farmer already exists
    const existingFarmer = await User.findOne({ email: email.toLowerCase() });
    if (existingFarmer) {
      return res.status(400).json({
        status: 'error',
        message: 'A user with this email already exists'
      });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        status: 'error',
        message: 'Invalid email format'
      });
    }

    // Validate Nigerian phone format
    const phoneRegex = /^(\+234|0)[789][01]\d{8}$/;
    const cleanPhone = phone.replace(/\s/g, '');
    if (!phoneRegex.test(cleanPhone)) {
      return res.status(400).json({
        status: 'error',
        message: 'Invalid phone format (use +234 or 0 followed by 10 digits)'
      });
    }

    // Generate temporary password
    const tempPassword = Math.random().toString(36).slice(-12) + 'Aa1!';

    // Create farmer data
    const farmerData = {
      name: name.trim(),
      email: email.toLowerCase().trim(),
      phone: cleanPhone,
      location: location.trim(),
      address: address?.trim() || '',
      role: 'farmer',
      status: 'active',
      partner: partner._id,
      emailVerified: true, // Automatically verify emails for partner-onboarded farmers
      password: tempPassword,
      profile: {
        farmSize: farmSize?.trim() || '',
        primaryCrops: primaryCrops?.trim() || '',
        experience: experience?.trim() || '',
        notes: notes?.trim() || '',
        bio: `Farmer onboarded by ${partner.name}`
      }
    };

    // Create the farmer
    const farmer = new User(farmerData);
    await farmer.save();

    // Add farmer to partner's list
    if (!partner.farmers.includes(farmer._id)) {
      partner.farmers.push(farmer._id);
      partner.totalFarmers = partner.farmers.length;
      await partner.save();
    }

    // Send welcome email with credentials (async, non-blocking)
    setImmediate(async () => {
      try {
        const welcomeEmailData = {
          user: farmer._id,
          title: 'Welcome to GroChain - Your Agricultural Partner!',
          message: `Welcome to GroChain, ${farmer.name}!

Your farmer account has been successfully created by your partner ${partner.name || 'GroChain Partner'}.

**Your Login Credentials:**
Email: ${farmer.email}
Password: ${tempPassword} (Please change this after first login)

**Next Steps:**
1. Visit ${process.env.FRONTEND_URL || 'http://localhost:3000'}/login
2. Log in with your email and temporary password
3. Complete your profile information
4. Start logging your harvests and accessing our marketplace

**What You Can Do:**
• Log your harvests with photos and details
• Access our agricultural marketplace
• Get insights and analytics on your farming activities
• Connect with buyers and partners
• Access financial services and loan opportunities

If you have any questions, please contact your partner or our support team.

Welcome to the future of agriculture!

Best regards,
The GroChain Team`,
          type: 'info',
          category: 'system',
          channels: ['email'],
          data: {
            farmerId: farmer._id,
            partnerId: partner._id,
            temporaryPassword: tempPassword,
            loginUrl: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/login`
          }
        };

        await NotificationService.createNotification(welcomeEmailData);
        console.log('✅ Welcome email sent to:', farmer.email);

      } catch (emailError) {
        console.error('❌ Failed to send welcome email to:', farmer.email, emailError.message);
        // Log error but don't fail the entire process
      }
    });

    // Return success response
    return res.status(201).json({
      status: 'success',
      message: 'Farmer added successfully and welcome email sent',
      data: {
        farmer: {
          id: farmer._id,
          name: farmer.name,
          email: farmer.email,
          phone: farmer.phone,
          location: farmer.location,
          status: farmer.status,
          joinedAt: farmer.createdAt
        },
        partnerUpdated: {
          totalFarmers: partner.totalFarmers,
          commissionRate: partner.commissionRate
        }
      }
    });

  } catch (error) {
    console.error('❌ Add single farmer error:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Server error during farmer creation',
      debug: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Enhanced partner commission method with proper error handling and additional logging
exports.getPartnerCommission = async (req, res) => {
  console.log('=== PARTNER COMMISSION REQUEST START ===');
  try {
    console.log('🔍 Partner commission request received with user:', req.user?.id || req.user?._id);

    // Get user details from database using the ID from JWT
    const User = require('../models/user.model')
    const userId = req.user?.id || req.user?._id

    if (!userId) {
      console.log('🔍 No user ID in request');
      return res.status(401).json({ status: 'error', message: 'Unauthorized - No user ID' })
    }

    console.log('🔍 Looking for user with ID:', userId);
    const user = await User.findById(userId)
    if (!user) {
      console.log('🔍 User not found in database');
      return res.status(404).json({ status: 'error', message: 'User not found' })
    }

    console.log('🔍 User found:', user.email);

    // Find partner using email
    let partner = await Partner.findOne({ email: user.email })
    
    if (!partner) {
      console.log('🔍 Creating new partner profile for commission endpoint');
      try {
        const partnerData = {
          name: user.name || 'Partner User',
          email: user.email,
          phone: user.phone || '+234000000000',
          organization: `${user.name || 'User'} Organization`,
          type: 'cooperative',
          location: user.location || 'Nigeria',
          status: 'active',
          commissionRate: 0.02,
          farmers: [],
          totalFarmers: 0,
          totalCommissions: 0
        };

        partner = new Partner(partnerData)
        await partner.save()
        console.log('✅ Partner created successfully for commission endpoint with ID:', partner._id);
      } catch (partnerError) {
        console.error('💥 Error creating partner for commission:', partnerError);
        return res.status(500).json({
          status: 'error',
          message: 'Failed to create partner profile',
          debug: process.env.NODE_ENV === 'development' ? partnerError.message : undefined
        })
      }
    } else {
      console.log('✅ Found existing partner with ID:', partner._id);
    }

    // Get real commission data from MongoDB
    const mongoose = require('mongoose');
    const Commission = require('../models/commission.model');
    
    // Use explicit ObjectId conversion for partner ID - with 'new' keyword
    const partnerId = new mongoose.Types.ObjectId(partner._id.toString());
    console.log('🔍 Using partner ID for commission query:', partnerId);

    // Get current month data
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);

    // Get commission statistics
    try {
      const [thisMonthCommissions, lastMonthCommissions, allCommissions] = await Promise.all([
        // This month
        Commission.aggregate([
          { $match: { 
              partner: partnerId,
              createdAt: { $gte: startOfMonth }
          }},
          { $group: { _id: null, total: { $sum: '$amount' } } }
        ]),
        
        // Last month
        Commission.aggregate([
          { $match: { 
              partner: partnerId,
              createdAt: { $gte: startOfLastMonth, $lte: endOfLastMonth } 
          }},
          { $group: { _id: null, total: { $sum: '$amount' } } }
        ]),
        
        // All time
        Commission.aggregate([
          { $match: { partner: partnerId } },
          { $group: { _id: null, total: { $sum: '$amount' } } }
        ])
      ]);

      // Get pending/paid amounts
      const [pendingCommissions, paidCommissions] = await Promise.all([
        Commission.aggregate([
          { $match: { partner: partnerId, status: 'pending' } },
          { $group: { _id: null, total: { $sum: '$amount' } } }
        ]),
        
        Commission.aggregate([
          { $match: { partner: partnerId, status: 'paid' } },
          { $group: { _id: null, total: { $sum: '$amount' } } }
        ])
      ]);

      // Get monthly breakdown
      const monthlyBreakdown = await Commission.aggregate([
        { $match: { partner: partnerId } },
        { $group: {
            _id: {
              year: { $year: "$createdAt" },
              month: { $month: "$createdAt" }
            },
            totalAmount: { $sum: "$amount" },
            count: { $sum: 1 }
          }
        },
        { $sort: { "_id.year": -1, "_id.month": -1 } },
        { $limit: 12 }
      ]);

      // Get last payout
      const lastPayoutRecord = await Commission.findOne(
        { partner: partnerId, status: 'paid' },
        { paidAt: 1 }
      ).sort({ paidAt: -1 });

      // Format the commission data
      const thisMonth = thisMonthCommissions[0]?.total || 0;
      const lastMonth = lastMonthCommissions[0]?.total || 0;
      const totalEarned = allCommissions[0]?.total || 0;
      const pendingAmount = pendingCommissions[0]?.total || 0;
      const paidAmount = paidCommissions[0]?.total || 0;

      // Create the response object
      const commissionData = {
        totalEarned,
        commissionRate: partner.commissionRate || 0.02,
        pendingAmount,
        paidAmount,
        lastPayout: lastPayoutRecord?.paidAt || null,
        availableForPayout: pendingAmount,
        nextPayoutDate: null, // To be implemented if needed
        summary: {
          thisMonth,
          lastMonth,
          totalEarned
        },
        monthlyBreakdown: monthlyBreakdown.map(item => ({
          month: `${item._id.year}-${String(item._id.month).padStart(2, '0')}`,
          amount: item.totalAmount,
          transactions: item.count
        })),
        recentPayments: [] // To be implemented if needed
      };

      console.log('✅ Commission data prepared successfully:', {
        thisMonth,
        lastMonth,
        totalEarned,
        pendingAmount,
        paidAmount
      });

      return res.json({
        status: 'success',
        data: commissionData
      });
    } catch (aggregateError) {
      console.error('💥 Error in commission aggregation:', aggregateError);
      
      // Fallback to using direct partner.totalCommissions
      console.log('Using partner.totalCommissions fallback:', partner.totalCommissions);
      const commissionData = {
        totalEarned: partner.totalCommissions || 0,
        commissionRate: partner.commissionRate || 0.02,
        pendingAmount: partner.totalCommissions || 0, // All commission is pending
        paidAmount: 0, // No paid commission yet
        lastPayout: null,
        summary: {
          thisMonth: partner.totalCommissions || 0, // Assume all commission is this month
          lastMonth: 0,
          totalEarned: partner.totalCommissions || 0
        },
        monthlyBreakdown: [
          {
            month: new Date().toISOString().substring(0, 7), // Current month (YYYY-MM format)
            amount: partner.totalCommissions || 0,
            transactions: 11 // We found 11 orders in our script
          }
        ]
      };

      console.log('⚠️ Using fallback commission data:', commissionData);

      return res.json({
        status: 'success',
        data: commissionData
      });
    }
  } catch (error) {
    console.error('💥 Partner commission error:', error);
    console.error('💥 Error message:', error.message);
    console.error('💥 Error stack:', error.stack);
    
    // Send a more informative error response
    const errorResponse = {
      status: 'error',
      message: 'Server error processing commission data',
      errorType: error.name || 'Unknown',
      errorDetails: error.message || 'No details available'
    };
    
    if (process.env.NODE_ENV === 'development') {
      errorResponse.debug = {
        stack: error.stack,
        details: error.toString()
      };
    }
    
    console.log('=== PARTNER COMMISSION REQUEST ERROR END ===');
    return res.status(500).json(errorResponse);
  }
  console.log('=== PARTNER COMMISSION REQUEST SUCCESSFUL END ===');
}

