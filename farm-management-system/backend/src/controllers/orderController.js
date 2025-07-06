const Order = require('../models/Order');
const Product = require('../models/Product');
const db = require('../config/database');

exports.getProducts = async (req, res) => {
  try {
    const products = await Product.getAllProducts();
    res.json(products);
  } catch (error) {
    console.error('Get products error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

/*exports.createOrder = async (req, res) => {
  try {
    const { items } = req.body;
    const user_id = req.user.userId; // Get from authenticated user

    // Validate input
    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'Invalid items format' });
    }
    
    for (const item of items) {
      if (!item.product_id || !item.quantity || item.quantity <= 0) {
        return res.status(400).json({ 
          error: 'Invalid item data',
          details: `Product ${item.product_id} has invalid quantity`
        });
      }
    }

    // Get customer_id from customers table
    const [customer] = await db.query(
      `SELECT customer_id, shipping_address 
       FROM customers WHERE user_id = ?`, 
      [req.user.userId]
    );
    
    if (!customer.length) {
      return res.status(400).json({ 
        error: 'Complete your customer profile before placing orders',
        redirect: '/profile'
      });
    }

    if (!customer[0].shipping_address || customer[0].shipping_address.includes('Please update')) {
      return res.status(400).json({
        error: 'Please update your shipping address before placing orders',
        redirect: '/profile'
      });
    }

    const customer_id = customer[0].customer_id;
    const shipping_address = customer[0].shipping_address;

    // Calculate total amount
    let totalAmount = 0;
    const productsInfo = [];
    
    for (const item of items) {
      const product = await Product.getProductById(item.product_id);
      if (!product) {
        return res.status(404).json({ error: `Product ${item.product_id} not found` });
      }
      totalAmount += product.price * item.quantity;
      productsInfo.push({
        product_id: item.product_id,
        price: product.price,
        quantity: item.quantity,
        price_at_purchase: product.price
      });
    }

    // Create order with shipping_address from customer profile
    const order_id = await Order.create({
      customer_id,
      total_amount: totalAmount,
      status: 'pending',
      delivery_address: shipping_address // Using customer's shipping_address
    });

    // Add order items
    for (const product of productsInfo) {
      await Order.addItem(order_id, product.product_id, product.quantity,product.price);
    }

    // Return success response
    res.status(201).json({
      success: true,
      order_id,
      message: 'Order created successfully'
    });

  } catch (error) {
    console.error('Create order error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}; */

exports.createOrder = async (req, res) => {
  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();

    const { items } = req.body;
    const user_id = req.user.userId;

    // Validate input
    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'Invalid items format' });
    }
    
    // Check customer profile
    const [customer] = await connection.query(
      `SELECT customer_id, shipping_address 
       FROM customers WHERE user_id = ?`, 
      [user_id]
    );
    
    if (!customer.length) {
      return res.status(400).json({ 
        error: 'Complete your customer profile before placing orders',
        redirect: '/profile'
      });
    }

    if (!customer[0].shipping_address || customer[0].shipping_address.includes('Please update')) {
      return res.status(400).json({
        error: 'Please update your shipping address before placing orders',
        redirect: '/profile'
      });
    }

    // Check stock availability and calculate total
    let totalAmount = 0;
    const productsInfo = [];
    
    for (const item of items) {
      const product = await Product.getProductById(item.product_id);
      if (!product) {
        throw new Error(`Product ${item.product_id} not found`);
      }
      
      // Check stock
      if (product.stock_quantity < item.quantity) {
        throw new Error(`Insufficient stock for product ${product.name}`);
      }
      
      totalAmount += product.price * item.quantity;
      productsInfo.push({
        product_id: item.product_id,
        price: product.price,
        quantity: item.quantity,
        price_at_purchase: product.price
      });
    }

    // Create order
    const [orderResult] = await connection.query(
      `INSERT INTO orders 
       (customer_id, total_amount, status, delivery_address) 
       VALUES (?, ?, ?, ?)`,
      [
        customer[0].customer_id,
        totalAmount,
        'pending',
        customer[0].shipping_address
      ]
    );
    const order_id = orderResult.insertId;

    // Add order items and update stock
    for (const product of productsInfo) {
      // Add order item
      await connection.query(
        `INSERT INTO order_items 
         (order_id, product_id, quantity, price_at_purchase) 
         VALUES (?, ?, ?, ?)`,
        [order_id, product.product_id, product.quantity, product.price]
      );
      
      /*// Update product stock
      await connection.query(
        `UPDATE products SET stock_quantity = stock_quantity - ? 
         WHERE product_id = ?`,
        [product.quantity, product.product_id]
      );
      
      // Update inventory
      await connection.query(
        `UPDATE inventory SET quantity = quantity - ? 
         WHERE product_id = ?`,
        [product.quantity, product.product_id]
      );*/

      await Product.updateStock(product.product_id, -product.quantity, connection);
    }

    await connection.commit();
    
    res.status(201).json({
      success: true,
      order_id,
      message: 'Order created successfully'
    });

  } catch (error) {
    await connection.rollback();
    console.error('Create order error:', error);
    res.status(500).json({ 
      error: error.message || 'Internal server error',
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  } finally {
    connection.release();
  }
};

exports.getOrders = async (req, res) => {
  try {
    let query = `
      SELECT o.*, 
             c.full_name AS customer_name,
             c.phone_number AS customer_phone,
             u.email AS customer_email
      FROM orders o
      JOIN customers c ON o.customer_id = c.customer_id
      JOIN users u ON c.user_id = u.user_id
    `;

    // For customers, only show their own orders
    if (req.user.role === 'customer') {
      const [customer] = await db.query(
        'SELECT customer_id FROM customers WHERE user_id = ?',
        [req.user.userId]  // Changed from user_id to userId
      );
      
      if (!customer.length) {
        return res.status(400).json({ error: 'Customer profile not found' });
      }
      
      query += ` WHERE o.customer_id = ${customer[0].customer_id}`;
    }

    query += ' ORDER BY o.created_at DESC';
    
    const [orders] = await db.query(query);

    // Get items for each order
    const ordersWithItems = await Promise.all(
      orders.map(async (order) => {
        const items = await Order.getItems(order.order_id);
        return { ...order, items };
      })
    );

    res.json(ordersWithItems);
  } catch (error) {
    console.error('Get orders error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// In orderController.js - Update getOrderById
exports.getOrderById = async (req, res) => {
  try {
    const [order] = await db.query(`
      SELECT 
        o.*,
        c.full_name AS customer_name,
        c.phone_number AS customer_phone,
        u.email AS customer_email
      FROM orders o
      JOIN customers c ON o.customer_id = c.customer_id
      JOIN users u ON c.user_id = u.user_id
      WHERE o.order_id = ?
    `, [req.params.order_id]);

    if (!order.length) {
      return res.status(404).json({ error: 'Order not found' });
    }

    const items = await Order.getItems(req.params.order_id);
    res.json({ ...order[0], items });
  } catch (error) {
    console.error('Get order error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

exports.updateOrder = async (req, res) => {
  try {
    const { order_id } = req.params;
    const { status, delivery_address } = req.body;

    // Validate status
    const validStatuses = ['pending', 'processing', 'shipped', 'delivered', 'cancelled'];
    if (status && !validStatuses.includes(status)) {
      return res.status(400).json({ error: 'Invalid order status' });
    }

    const updated = await Order.update(order_id, { status, delivery_address });
    if (!updated) {
      return res.status(404).json({ error: 'Order not found' });
    }

    const updatedOrder = await Order.findById(order_id);
    const items = await Order.getItems(order_item_id);
    
    res.json({ ...updatedOrder, items });
  } catch (error) {
    console.error('Update order error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

exports.deleteOrder = async (req, res) => {
  try {
    const { order_id } = req.params;
    const deleted = await Order.delete(order_id);
    if (!deleted) {
      return res.status(404).json({ error: 'Order not found' });
    }
    res.json({ message: 'Order deleted successfully' });
  } catch (error) {
    console.error('Delete order error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

exports.updateOrderStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const validStatuses = ['pending', 'processing', 'shipped', 'delivered', 'cancelled'];
    
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    const [result] = await db.query(
      'UPDATE orders SET status = ? WHERE order_id = ?',
      [status, req.params.order_id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Order not found' });
    }

    res.json({ message: 'Order status updated' });
  } catch (error) {
    console.error('Update status error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

exports.getRecentOrders = async (req, res) => {
  try {
    const [customer] = await db.query(
      'SELECT customer_id FROM customers WHERE user_id = ?',
      [req.user.userId]
    );
    
    if (!customer.length) {
      return res.status(404).json({ error: 'Customer profile not found' });
    }

    const [orders] = await db.query(
      `SELECT 
        o.order_id, 
        o.total_amount, 
        o.status, 
        o.order_date,
        COUNT(oi.order_item_id) as item_count
       FROM orders o
       LEFT JOIN order_items oi ON o.order_id = oi.order_id
       WHERE o.customer_id = ?
       GROUP BY o.order_id
       ORDER BY o.order_date DESC
       LIMIT 5`,
      [customer[0].customer_id]
    );

    // Format dates to ISO string for consistent parsing
    const formattedOrders = orders.map(order => ({
      ...order,
      order_date: new Date(order.order_date).toISOString(),
      item_count: parseInt(order.item_count) || 0,
      total_amount: Number(order.total_amount) || 0
    }));

    res.json(formattedOrders);
  } catch (error) {
    console.error('Get recent orders error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};