  const db = require('../config/database');

  class Order {
    static async findAll() {
      try {
        const [rows] = await db.query(`
          SELECT 
            o.*,
            c.full_name AS customer_name,
            c.phone_number AS customer_phone
          FROM orders o
          JOIN customers c ON o.customer_id = c.customer_id
          ORDER BY o.created_at DESC
        `);
        return rows;
      } catch (error) {
        console.error('Error finding all orders:', error);
        throw new Error('Failed to retrieve orders');
      }
    }

    static async findById(order_id) {
      try {
        const [rows] = await db.query(`
          SELECT o.*, 
                c.full_name AS customer_name,
                c.phone_number AS customer_phone,
                u.email AS customer_email
          FROM orders o
          JOIN customers c ON o.customer_id = c.customer_id
          JOIN users u ON c.user_id = u.user_id
          WHERE o.order_id = ?
        `, [order_id]);
        if (!rows.length) return null;
        return rows[0];
      } catch (error) {
        console.error(`Error finding order ${order_id}:`, error);
        throw new Error('Failed to retrieve order');
      }
    }

    static async create(orderData) {
      try {
        const [result] = await db.query(
          `INSERT INTO orders 
          (customer_id, total_amount, status, delivery_address) 
          VALUES (?, ?, ?, ?)`,
          [
            orderData.customer_id,
            orderData.total_amount,
            orderData.status || 'pending',
            orderData.delivery_address
          ]
        );
        return result.insertId; // Return just the ID to match controller expectations
      } catch (error) {
        console.error('Error creating order:', error);
        throw new Error('Failed to create order');
      }
    }

    static async update(order_id, orderData) {
      try {
        const [result] = await db.query(
          `UPDATE orders SET 
            status = ?, 
            delivery_address = ? 
          WHERE order_id = ?`,
          [
            orderData.status,
            orderData.delivery_address,
            order_id
          ]
        );
        return result.affectedRows > 0; // Return boolean for success
      } catch (error) {
        console.error(`Error updating order ${order_id}:`, error);
        throw new Error('Failed to update order');
      }
    }

    static async delete(order_id) {
      try {
        // First delete order items to maintain referential integrity
        await db.query('DELETE FROM order_items WHERE order_id = ?', [order_id]);
        
        const [result] = await db.query('DELETE FROM orders WHERE order_id = ?', [order_id]);
        return result.affectedRows > 0; // Return boolean for success
      } catch (error) {
        console.error(`Error deleting order ${order_id}:`, error);
        throw new Error('Failed to delete order');
      }
    }

    static async getItems(order_id) {
      try {
        const [rows] = await db.query(
          `SELECT 
            oi.order_id, oi.product_id, oi.quantity, oi.price_at_purchase,
            p.name as product_name
           FROM order_items oi
           JOIN products p ON oi.product_id = p.product_id
           WHERE oi.order_id = ?`,
          [order_id]
        );
        return rows;
      } catch (error) {
        console.error(`Error getting items for order ${order_id}:`, error);
        throw new Error('Failed to retrieve order items');
      }
    }

    static async addItem(order_id, product_id, quantity) {
      try {
        // First get the product price
        const [product] = await db.query(
          'SELECT price FROM products WHERE product_id = ?',
          [product_id]
        );
        
        if (!product.length) {
          throw new Error('Product not found');
        }
    
        const price = product[0].price;
        
        const [result] = await db.query(
          `INSERT INTO order_items 
           (order_id, product_id, quantity, price_at_purchase) 
           VALUES (?, ?, ?, ?)`,
          [order_id, product_id, quantity, price]
        );
        
        return result.affectedRows > 0;
      } catch (error) {
        console.error(`Error adding item to order ${order_id}:`, error);
        throw new Error('Failed to add order item');
      }
    }
  }

  module.exports = Order;