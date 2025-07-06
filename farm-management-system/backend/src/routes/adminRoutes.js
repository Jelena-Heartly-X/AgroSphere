const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const auth = require('../middleware/auth');
const roleCheck = require('../middleware/roleCheck');

// Admin dashboard routes
router.get('/stats', auth, roleCheck(['admin']), adminController.getStats);
router.get('/activities', auth, roleCheck(['admin']), adminController.getActivities);
router.get('/sales', auth, roleCheck(['admin']), adminController.getSalesData);

module.exports = router;