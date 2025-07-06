const db = require('../config/database');

exports.getStats = async (req, res) => {
  try {
    const farmerId = req.user.userId;
    
    // Get pending orders count through product relationship
    const [orders] = await db.query(
      `SELECT COUNT(DISTINCT o.order_id) as count 
       FROM orders o
       JOIN order_items oi ON o.order_id = oi.order_id
       JOIN products p ON oi.product_id = p.product_id
       WHERE p.farmer_id = ? AND o.status = 'pending'`, 
      [farmerId]
    );
    
    // Get active products count
    const [products] = await db.query(
      `SELECT COUNT(*) as count FROM products 
       WHERE farmer_id = ? AND stock_quantity > 0`, 
      [farmerId]
    );
    
    // Get pending tasks count
    const [tasks] = await db.query(
      `SELECT COUNT(*) as count FROM tasks 
       WHERE assigned_to = ? AND status = 'pending'`, 
      [farmerId]
    );
    
    // Get low stock items count
    const [inventory] = await db.query(
      `SELECT COUNT(*) as count FROM inventory i
       JOIN products p ON i.product_id = p.product_id
       WHERE p.farmer_id = ? AND i.quantity < i.threshold`, 
      [farmerId]
    );

    res.json({
      pendingOrders: Number(orders[0].count),
      activeProducts: Number(products[0].count),
      pendingTasks: Number(tasks[0].count),
      lowStockItems: Number(inventory[0].count)
    });
  } catch (error) {
    console.error('Error fetching farmer stats:', error);
    res.status(500).json({ error: 'Failed to fetch farmer stats' });
  }
};

exports.getActivities = async (req, res) => {
  try {
    const farmerId = req.user.userId;
    
    // Get recent orders through product relationship
    const [orders] = await db.query(
      `SELECT DISTINCT
        o.order_id as id,
        o.created_at as timestamp,
        CONCAT('Order #', o.order_id) as description,
        'order' as type
       FROM orders o
       JOIN order_items oi ON o.order_id = oi.order_id
       JOIN products p ON oi.product_id = p.product_id
       WHERE p.farmer_id = ?
       ORDER BY o.created_at DESC
       LIMIT 5`, 
      [farmerId]
    );
    
    // Get recent inventory updates
    const [inventory] = await db.query(
      `SELECT 
        i.inventory_id as id,
        i.last_updated as timestamp,
        CONCAT('Inventory update: ', p.name) as description,
        'inventory' as type
       FROM inventory i
       JOIN products p ON i.product_id = p.product_id
       WHERE p.farmer_id = ?
       ORDER BY i.last_updated DESC
       LIMIT 5`, 
      [farmerId]
    );
    
    // Combine and sort activities
    const activities = [...orders, ...inventory]
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
      .slice(0, 5);
    
    res.json(activities);
  } catch (error) {
    console.error('Error fetching farmer activities:', error);
    res.status(500).json({ error: 'Failed to fetch activities' });
  }
};

exports.getRecentOrders = async (req, res) => {
  try {
    const farmerId = req.user.userId;
    
    const [orders] = await db.query(
      `SELECT DISTINCT o.* 
       FROM orders o
       JOIN order_items oi ON o.order_id = oi.order_id
       JOIN products p ON oi.product_id = p.product_id
       WHERE p.farmer_id = ?
       ORDER BY o.order_date DESC
       LIMIT 5`, 
      [farmerId]
    );
    
    res.json(orders);
  } catch (error) {
    console.error('Error fetching recent orders:', error);
    res.status(500).json({ error: 'Failed to fetch recent orders' });
  }
};