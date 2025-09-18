const express = require('express');
const router = express.Router();
const shippingUpdateService = require('../services/shipping-update.service');
const { authenticate, authorize } = require('../middlewares/auth.middleware');

// Manual shipping update endpoint (admin only)
router.post('/update', 
  authenticate, 
  authorize(['admin']), 
  async (req, res) => {
    try {
      console.log('🚚 Manual shipping update triggered by admin');
      await shippingUpdateService.runOnce();
      
      res.json({
        status: 'success',
        message: 'Shipping update completed successfully'
      });
    } catch (error) {
      console.error('❌ Manual shipping update error:', error);
      res.status(500).json({
        status: 'error',
        message: 'Failed to update shipping costs',
        error: error.message
      });
    }
  }
);

// Get shipping update service status
router.get('/status', 
  authenticate, 
  authorize(['admin']), 
  (req, res) => {
    res.json({
      status: 'success',
      data: {
        isRunning: shippingUpdateService.isRunning,
        intervalId: shippingUpdateService.intervalId ? 'active' : 'inactive'
      }
    });
  }
);

module.exports = router;

