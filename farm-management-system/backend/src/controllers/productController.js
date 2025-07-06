const ProductModel = require('../models/Product');
const Inventory = require('../models/Inventory');
const { determineUnit } = require('./inventoryController');

class ProductController {
  static async createProduct(req, res) {
    try {
      const { name, description, category, price, stock_quantity } = req.body;
      const farmer_id = req.user.userId;

      const product_id = await ProductModel.createProduct({
        name,
        description,
        category,
        price,
        stock_quantity,
        farmer_id
      });

      const inventory = await Inventory.create({ 
        product_id, 
        quantity: Number(stock_quantity),
        location: 'Default',
        threshold: 10, // Default threshold
        unit: determineUnit(category), // Get unit based on category
        description,
        price
      });

      res.status(201).json({ 
        message: 'Product created successfully', 
        product_id ,
        inventory_id: inventory.inventory_id
      });
    } catch (error) {
      console.error('Create product error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  static async getAllProducts(req, res) {
    try {
      const products = await ProductModel.getAllProducts();
      res.json(products);
    } catch (error) {
      console.error('Get all products error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  static async getProductById(req, res) {
    try {
      const product = await ProductModel.getProductById(req.params.product_id);
      if (!product) {
        return res.status(404).json({ error: 'Product not found' });
      }
      res.json(product);
    } catch (error) {
      console.error('Get product error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  static async updateProduct(req, res) {
    try {
      const { product_id } = req.params;
      const { name, description, category, price, stock_quantity } = req.body;
      const farmer_id = req.user.userId;

      const product = await ProductModel.getProductById(product_id);
      if (!product) {
        return res.status(404).json({ error: 'Product not found' });
      }
      if (product.farmer_id !== farmer_id && req.user.role !== 'admin') {
        return res.status(403).json({ error: 'Not authorized to update this product' });
      }

      const success = await ProductModel.updateProduct(product_id, {
        name,
        description,
        category,
        price,
        stock_quantity
      });

      if (!success) {
        return res.status(400).json({ error: 'Failed to update product' });
      }

      const inventory = await Inventory.findByProductId(product_id);
      if (inventory) {
        await Inventory.update(inventory.inventory_id, {
          product_id: inventory.product_id,
          quantity: Number(stock_quantity || inventory.quantity),
          threshold: inventory.threshold, // Keep existing threshold
          unit: inventory.unit, // Keep existing unit
          description: description || inventory.description,
          price: price || inventory.price
        });
      }

      res.json({ message: 'Product updated successfully' });
    } catch (error) {
      console.error('Update product error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  static async deleteProduct(req, res) {
    try {
      const { product_id } = req.params;
      const farmer_id = req.user.userId;

      const product = await ProductModel.getProductById(product_id);
      if (!product) {
        return res.status(404).json({ error: 'Product not found' });
      }
      if (product.farmer_id !== farmer_id && req.user.role !== 'admin') {
        return res.status(403).json({ error: 'Not authorized to delete this product' });
      }

      const success = await ProductModel.deleteProduct(product_id);
      if (!success) {
        return res.status(400).json({ error: 'Failed to delete product' });
      }

      res.json({ message: 'Product deleted successfully' });
    } catch (error) {
      console.error('Delete product error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  static async getProductsByFarmer(req, res) {
    try {
      const farmer_id = req.params.farmer_id || req.user.userId;
      const products = await ProductModel.getProductsByFarmer(farmer_id);
      res.json(products);
    } catch (error) {
      console.error('Get farmer products error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  static async updateStock(req, res) {
    try {
      const { product_id } = req.params;
      const { quantity } = req.body;
      const farmer_id = req.user.userId;

      const product = await ProductModel.getProductById(product_id);
      if (!product) {
        return res.status(404).json({ error: 'Product not found' });
      }
      if (product.farmer_id !== farmer_id && req.user.role !== 'admin') {
        return res.status(403).json({ error: 'Not authorized to update this product stock' });
      }

      const success = await ProductModel.updateStock(product_id, quantity);
      if (!success) {
        return res.status(400).json({ error: 'Failed to update stock' });
      }

      res.json({ message: 'Stock updated successfully' });
    } catch (error) {
      console.error('Update stock error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
}

// Export the class directly
module.exports = ProductController;