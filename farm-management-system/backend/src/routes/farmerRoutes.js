const express = require('express');
const router = express.Router();
const farmerController = require('../controllers/farmerController');
const auth = require('../middleware/auth');
const roleCheck = require('../middleware/roleCheck');

router.get('/stats', auth, roleCheck(['farmer']), farmerController.getStats);
router.get('/activities', auth, roleCheck(['farmer']), farmerController.getActivities);
router.get('/recent-orders', auth, roleCheck(['farmer']), farmerController.getRecentOrders);

module.exports = router;