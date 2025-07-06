const express = require('express');
const router = express.Router();
const ProductController = require('../controllers/productController'); // Note: Importing the class
const auth = require('../middleware/auth');
const roleCheck = require('../middleware/roleCheck');

// Public routes
router.get('/', ProductController.getAllProducts); // Changed to use class method
router.get('/:product_id', ProductController.getProductById);

// Protected routes
router.post('/', auth, roleCheck(['admin', 'farmer']), ProductController.createProduct);
router.put('/:product_id', auth, roleCheck(['admin', 'farmer']), ProductController.updateProduct);
router.delete('/:product_id', auth, roleCheck(['admin', 'farmer']), ProductController.deleteProduct);

// Additional farmer-specific routes
router.get('/farmer/:farmer_id?', auth,roleCheck(['admin','farmer']), ProductController.getProductsByFarmer);
router.put('/:product_id/stock', auth, roleCheck(['admin', 'farmer']), ProductController.updateStock);

module.exports = router;