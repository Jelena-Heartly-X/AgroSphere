const express = require('express');
const router = express.Router();
const { 
  getProducts,
  createOrder,
  getOrders,
  getOrderById,
  updateOrder,
  deleteOrder,
  updateOrderStatus,
  getRecentOrders
} = require('../controllers/orderController'); // Destructured import
const auth = require('../middleware/auth');
const roleCheck = require('../middleware/roleCheck');

// Public routes
router.get('/products', getProducts);

// Protected routes
router.post('/', auth, roleCheck(['customer']), createOrder);
router.get('/', auth, getOrders);
router.get('/:order_id', auth, getOrderById);
router.put('/:order_id', auth, roleCheck(['admin', 'farmer']), updateOrder);
router.delete('/:order_id', auth, roleCheck(['admin', 'farmer']), deleteOrder);
router.put('/:order_id/status', auth, roleCheck(['admin', 'employee']), updateOrderStatus);
// In orderRoutes.js
router.get('/recent-orders/customer', auth, getRecentOrders);

module.exports = router;