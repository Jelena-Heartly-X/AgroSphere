const db = require('../config/database');

class Inventory {
  static async findAll() {
    try {
      const [rows] = await db.query(`
        SELECT 
          i.inventory_id,
          i.product_id,
          i.quantity,
          i.threshold,
          i.price,
          i.last_updated,
          i.unit,
          i.description,
          p.name,
          p.description AS product_description,
          p.category,
          p.price AS product_price,
          p.stock_quantity
        FROM inventory i
        JOIN products p ON i.product_id = p.product_id
        ORDER BY i.last_updated DESC
      `);
      return rows;
    } catch (error) {
      console.error('Database error in findAll:', error);
      throw error;
    }
  }

  static async findById(inventory_id) {
    try {
      const [rows] = await db.query(`
        SELECT 
          i.*,
          p.name,
          p.description AS product_description,
          p.category
        FROM inventory i
        JOIN products p ON i.product_id = p.product_id
        WHERE i.inventory_id = ?
      `, [inventory_id]);
      return rows[0] || null;
    } catch (error) {
      console.error('Database error in findById:', error);
      throw error;
    }
  }

  static async findByProductId(product_id) {
    try {
      const [rows] = await db.query(`
        SELECT 
          i.*,
          p.name,
          p.description AS product_description,
          p.category
        FROM inventory i
        JOIN products p ON i.product_id = p.product_id
        WHERE i.product_id = ?
      `, [product_id]);
      return rows[0] || null;
    } catch (error) {
      console.error('Database error in findByProductId:', error);
      throw error;
    }
  }

  static async create(inventoryData) {
    try {
      const [result] = await db.query(
        `INSERT INTO inventory 
          (product_id, quantity, threshold, unit, description, price) 
          VALUES (?, ?, ?, ?, ?, ?)`,
        [
          inventoryData.product_id,
          inventoryData.quantity,
          inventoryData.threshold || 10,
          inventoryData.unit || 'units',
          inventoryData.description || '',
          inventoryData.price || 0
        ]
      );
      
      return {
        inventory_id: result.insertId,
        ...inventoryData
      };
    } catch (error) {
      console.error('Database error in create:', error);
      throw error;
    }
  }

  static async update(inventory_id, inventoryData) {
    try {
      const [result] = await db.query(
        `UPDATE inventory SET
          quantity = ?,
          threshold = ?,
          unit = ?,
          description = ?,
          price = ?,
          last_updated = NOW()
        WHERE inventory_id = ?`,
        [
          inventoryData.quantity,
          inventoryData.threshold,
          inventoryData.unit,
          inventoryData.description,
          inventoryData.price,
          inventory_id
        ]
      );
      
      if (result.affectedRows === 0) {
        throw new Error('No inventory record found to update');
      }
      
      return this.findById(inventory_id);
    } catch (error) {
      console.error('Database error in update:', error);
      throw error;
    }
  }

  static async delete(inventory_id) {
    try {
      const [result] = await db.query(
        'DELETE FROM inventory WHERE inventory_id = ?',
        [inventory_id]
      );
      return result.affectedRows > 0;
    } catch (error) {
      console.error('Database error in delete:', error);
      throw error;
    }
  }
}

module.exports = Inventory;