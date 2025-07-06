const express = require('express');
const router = express.Router();
const { 
  getCustomerProfile,
  createCustomerProfile,
  updateCustomerProfile,
  getCustomerStats
} = require('../controllers/customerController');
const auth = require('../middleware/auth');

router.get('/me', auth, getCustomerProfile);
router.post('/', auth, createCustomerProfile);
router.put('/', auth, updateCustomerProfile);
router.get('/stats', auth, getCustomerStats);

module.exports = router;