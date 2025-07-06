const db = require('../config/database');

class Product {
  static async getAllProducts() {
    try {
      const [rows] = await db.query('SELECT * FROM products');
      return rows;
    } catch (error) {
      console.error('Error fetching all products:', error);
      throw new Error('Failed to retrieve products');
    }
  }

  static async getProductById(product_id) {
    try {
      const [rows] = await db.query('SELECT * FROM products WHERE product_id = ?', [product_id]);
      return rows[0] || null;
    } catch (error) {
      console.error(`Error fetching product ${product_id}:`, error);
      throw new Error('Failed to retrieve product');
    }
  }

  static async createProduct({ name, description, category, price, stock_quantity, farmer_id }) {
    try { 
      const [result] = await db.query(
        `INSERT INTO products 
         (name, description, category, price, stock_quantity, farmer_id) 
         VALUES (?, ?, ?, ?, ?, ?)`,
        [name, description, category, price || 0, stock_quantity || 0, farmer_id]
      );
      return result.insertId;
    } catch (error) {
      console.error('Error creating product:', error);
      throw new Error('Failed to create product');
    }
  }

  static async updateProduct(product_id, { name, description, category, price, stock_quantity }) {
    try {
      const [result] = await db.query(
        `UPDATE products SET 
          name = ?, 
          description = ?, 
          category = ?,
          price = ?, 
          stock_quantity = ? 
         WHERE product_id = ?`,
        [name, description,category, price, stock_quantity, product_id]
      );
      return result.affectedRows > 0;
    } catch (error) {
      console.error(`Error updating product ${product_id}:`, error);
      throw new Error('Failed to update product');
    }
  }

  static async deleteProduct(product_id) {
    try {
      const [result] = await db.query('DELETE FROM products WHERE product_id = ?', [product_id]);
      return result.affectedRows > 0;
    } catch (error) {
      console.error(`Error deleting product ${product_id}:`, error);
      throw new Error('Failed to delete product');
    }
  }

  static async getProductsByFarmer(farmer_id) {
    try {
      const [rows] = await db.query(
        'SELECT * FROM products WHERE farmer_id = ?', 
        [farmer_id]
      );
      return rows;
    } catch (error) {
      console.error(`Error fetching products for farmer ${farmer_id}:`, error);
      throw new Error('Failed to retrieve farmer products');
    }
  }

  static async updateStock(product_id, quantityChange,connection = null) {
    const query = connection ? connection.query.bind(connection) : db.query.bind(db);
    try {
      //await connection.beginTransaction();
  
      // 1. First get current stock to validate
      const [product] = await query(
        'SELECT stock_quantity FROM products WHERE product_id = ? FOR UPDATE',
        [product_id]
      );
      
      if (!product.length) {
        throw new Error('Product not found');
      }
  
      const newQuantity = product[0].stock_quantity + quantityChange;
      
      // Prevent negative stock
      if (newQuantity < 0) {
        throw new Error('Insufficient stock available');
      }
  
      // 2. Update product stock
      const [productResult] = await query(
        'UPDATE products SET stock_quantity = ? WHERE product_id = ?',
        [newQuantity, product_id]
      );
  
      // 3. Update inventory
      const [inventoryResult] = await query(
        'UPDATE inventory SET quantity = quantity + ? WHERE product_id = ?',
        [quantityChange, product_id]
      );
  
      // If inventory entry doesn't exist, you might want to create it
      /*if (inventoryResult.affectedRows === 0) {
        await connection.query(
          'INSERT INTO inventory (product_id, quantity) VALUES (?, ?)',
          [product_id, quantityChange]
        );
      }*/
  
      //await connection.commit();
      return true;
    } catch (error) {
      //await connection.rollback();
      console.error(`Error updating stock for product ${product_id}:`, error);
      throw new Error('Failed to update stock: ' + error.message);
    } /*finally {
      connection.release();
    }*/
  }
  
}


module.exports = Product;