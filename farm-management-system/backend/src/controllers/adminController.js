const db = require('../config/database');

exports.getStats = async (req, res) => {
    try {
      /*const [results] = await db.query(`
        SELECT 
          COUNT(*) as totalUsers FROM users;
        SELECT 
          COUNT(*) as totalOrders FROM orders;
        SELECT 
          COUNT(*) as totalProducts FROM products;
        SELECT 
          COALESCE(SUM(total_amount), 0) as totalRevenue 
        FROM orders 
        WHERE status != 'cancelled';
      `);*/
      const [totalUsers] = await db.query(`SELECT COUNT(*) as totalUsers FROM users;`);
      const [totalOrders] = await db.query(`SELECT COUNT(*) as totalOrders FROM orders;`);
      const [totalProducts] = await db.query(`SELECT COUNT(*) as totalProducts FROM products;`);
      const [totalRevenue] = await db.query(`SELECT 
          COALESCE(SUM(total_amount), 0) as totalRevenue 
        FROM orders 
        WHERE status != 'cancelled';`);
  
      // MySQL returns multiple result sets for multiple queries
      /*res.json({
        totalUsers: Number(results[0][0].totalUsers),
        totalOrders: Number(results[1][0].totalOrders),
        totalProducts: Number(results[2][0].totalProducts),
        totalRevenue: Number(results[3][0].totalRevenue)
      });*/
      res.json({
        totalUsers: Number(totalUsers[0].totalUsers),
        totalOrders: Number(totalOrders[0].totalOrders),
        totalProducts: Number(totalProducts[0].totalProducts),
        totalRevenue: Number(totalRevenue[0].totalRevenue),
      });

    } catch (error) {
      console.error('Error fetching stats:', error);
      res.status(500).json({ 
        error: 'Failed to fetch dashboard stats',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  };

exports.getActivities = async (req, res) => {
    try {
      // Get recent orders
      const [orders] = await db.query(`
        SELECT 
          'order' as type, 
          order_id as id, 
          created_at as timestamp, 
          CONCAT('Order #', order_id) as description
        FROM orders
        ORDER BY created_at DESC
        LIMIT 5
      `);
  
      // Get recent users
      const [users] = await db.query(`
        SELECT 
          'user' as type, 
          user_id as id, 
          created_at as timestamp, 
          CONCAT('New user: ', email) as description
        FROM users
        ORDER BY created_at DESC
        LIMIT 5
      `);
  
      // Combine results in JavaScript rather than SQL
      const activities = [...orders, ...users]
        .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
        .slice(0, 10); // Get top 10 most recent activities
  
      res.json(activities);
    } catch (error) {
      console.error('Error fetching activities:', error);
      res.status(500).json({ error: 'Failed to fetch activities' });
    }
  };

  exports.getSalesData = async (req, res) => {
    try {
      const [sales] = await db.query(`
        SELECT 
          DATE(order_date) as date,
          SUM(total_amount) as amount
        FROM orders
        WHERE order_date >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)
          AND status != 'cancelled'
        GROUP BY DATE(order_date)
        ORDER BY DATE(order_date) ASC
      `);
  
      res.json(sales);
    } catch (error) {
      console.error('Error fetching sales data:', error);
      res.status(500).json({ error: 'Failed to fetch sales data' });
    }
  };