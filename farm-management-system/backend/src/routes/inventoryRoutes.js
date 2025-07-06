const express = require('express');
const router = express.Router();
const inventoryController = require('../controllers/inventoryController');
const auth = require('../middleware/auth');
const roleCheck = require('../middleware/roleCheck');

// Protected routes
router.post('/', auth, roleCheck(['admin', 'farmer']), inventoryController.createInventory);
router.get('/', auth, inventoryController.getInventory);
router.get('/:inventory_id', auth, inventoryController.getInventoryById);
router.get('/product/:product_id', auth, inventoryController.getInventoryByProduct);
router.put('/:inventory_id', auth, roleCheck(['admin', 'farmer']), inventoryController.updateInventory);
router.delete('/:inventory_id', auth, roleCheck(['admin', 'farmer']), inventoryController.deleteInventory);

module.exports = router;