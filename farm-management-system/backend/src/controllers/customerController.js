const db = require('../config/database');

// In customerController.js
exports.getCustomerProfile = async (req, res) => {
  try {
    const [customer] = await db.query(
      `SELECT 
        customer_id,
        user_id,
        full_name,
        shipping_address,
        billing_address,
        phone_number
       FROM customers WHERE user_id = ?`,
      [req.user.userId]
    );
    
    if (!customer.length) {
      // Create a new customer profile with all required fields
      const [newCustomer] = await db.query(
        `INSERT INTO customers 
         (user_id, full_name, phone_number, shipping_address, billing_address)
         VALUES (?, ?, ?, ?, ?)`,
        [
          req.user.userId, 
          'New Customer', 
          '000-000-0000', 
          'Please update your address', 
          'Please update your address'
        ]
      );
      
      return res.json({
        success: true,
        customer: {
          customer_id: newCustomer.insertId,
          user_id: req.user.userId,
          full_name: 'New Customer',
          phone_number: '000-000-0000',
          shipping_address: 'Please update your address',
          billing_address: 'Please update your address'
        }
      });
    }
    
    res.json({
      success: true,
      customer: customer[0]
    });
  } catch (error) {
    console.error('Error in getCustomerProfile:', error);
    res.status(500).json({ 
      success: false,
      error: 'Internal server error'
    });
  }
};

exports.createCustomerProfile = async (req, res) => {
  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();

    const { full_name, phone_number, delivery_address } = req.body;
    const user_id = req.user.userId;

    // Check if profile already exists
    const [existing] = await connection.query(
      'SELECT customer_id FROM customers WHERE user_id = ?',
      [user_id]
    );
    
    if (existing.length > 0) {
      return res.status(400).json({
        success: false,
        error: 'Customer profile already exists'
      });
    }

    // Create new customer profile
    const [result] = await connection.query(
      `INSERT INTO customers 
       (user_id, full_name, phone_number, delivery_address)
       VALUES (?, ?, ?, ?)`,
      [user_id, full_name, phone_number, delivery_address]
    );

    await connection.commit();
    
    res.status(201).json({
      success: true,
      customer_id: result.insertId
    });
  } catch (error) {
    await connection.rollback();
    console.error('Create customer profile error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create customer profile',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  } finally {
    connection.release();
  }
};

exports.updateCustomerProfile = async (req, res) => {
  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();

    const { full_name, phone_number, shipping_address, billing_address } = req.body;
    const user_id = req.user.userId;

    const [result] = await connection.query(
      `UPDATE customers SET
        full_name = ?,
        phone_number = ?,
        shipping_address = ?,
        billing_address = ?,
        updated_at = CURRENT_TIMESTAMP
       WHERE user_id = ?`,
      [full_name, phone_number, shipping_address || null, billing_address || null, user_id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Customer profile not found' });
    }

    await connection.commit();
    
    res.json({ success: true, message: 'Profile updated successfully' });
  } catch (error) {
    await connection.rollback();
    console.error('Update profile error:', error);
    res.status(500).json({ 
      error: 'Failed to update profile',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  } finally {
    connection.release();
  }
};

exports.getCustomerStats = async (req, res) => {
  try {
    const userId = req.user.userId;
    
    const [customerRows] = await db.query(
      'SELECT customer_id FROM customers WHERE user_id = ?',
      [userId]
    );

    if (customerRows.length === 0) {
      return res.status(404).json({ error: 'Customer not found' });
    }

    const customerId = customerRows[0].customer_id;

    // Get order counts
    const [orders] = await db.query(
      `SELECT 
        COUNT(*) as totalOrders,
        SUM(CASE WHEN status = 'pending' OR status = 'processing' THEN 1 ELSE 0 END) as pendingDeliveries,
        SUM(total_amount) as totalSpent
       FROM orders
       WHERE customer_id = ?`, 
      [customerId]
    );
    
    // Get wishlist count (if you have a wishlist table)
    /*const [wishlist] = await db.query(
      `SELECT COUNT(*) as count FROM wishlist
       WHERE customer_id = ?`, 
      [customerId]
    ); */
    

    res.json({
      totalOrders: Number(orders[0].totalOrders) || 0,
      pendingDeliveries: Number(orders[0].pendingDeliveries) || 0,
      totalSpent: Number(orders[0].totalSpent) || 0,
      //wishlistItems: Number(wishlist[0]?.count) || 0
    });
  } catch (error) {
    console.error('Error fetching customer stats:', error);
    res.status(500).json({ error: 'Failed to fetch customer stats' });
  }
};