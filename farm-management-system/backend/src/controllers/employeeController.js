const db = require('../config/database');

exports.getStats = async (req, res) => {
  try {
    const employeeId = req.user.userId;
    
    // Get all task counts
    const [taskStats] = await db.query(
      `SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed
       FROM tasks 
       WHERE assigned_to = ?`, 
      [employeeId]
    );
    
    // Estimate handled orders by counting processed/shipped orders
    const [orderStats] = await db.query(
      `SELECT COUNT(*) as handled
       FROM orders
       WHERE status IN ('processing', 'shipped','delivered')`, 
      // Note: This counts all processed orders, not employee-specific
    );

    res.json({
      assignedTasks: Number(taskStats[0].total) || 0,
      completedTasks: Number(taskStats[0].completed) || 0,
      handledOrders: Number(orderStats[0].handled) || 0,
    });
  } catch (error) {
    console.error('Error fetching employee stats:', error);
    res.status(500).json({ error: 'Failed to fetch employee stats' });
  }
};

exports.getActivities = async (req, res) => {
  try {
    const employeeId = req.user.userId;
    
    // Get recent tasks (5 most recent)
    const [tasks] = await db.query(
      `SELECT 
        'task' as type,
        task_id as id,
        created_at as timestamp,
        CONCAT('Task: ', title) as description,
        status
       FROM tasks
       WHERE assigned_to = ?
       ORDER BY created_at DESC
       LIMIT 5`, 
      [employeeId]
    );
    
    // Get recent order status changes (5 most recent)
    const [orders] = await db.query(
      `SELECT 
        'order' as type,
        order_id as id,
        order_date as timestamp,
        CONCAT('Order #', order_id, ' (', status, ')') as description,
        status
       FROM orders
       WHERE status IN ('processing', 'shipped')
       ORDER BY order_date DESC
       LIMIT 5`
    );
    
    // Combine activities with proper sorting
    const activities = [...tasks, ...orders]
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
      .slice(0, 5);
    
    res.json(activities);
  } catch (error) {
    console.error('Error fetching employee activities:', error);
    res.status(500).json({ error: 'Failed to fetch activities' });
  }
};

exports.getTasks = async (req, res) => {
  try {
    const employeeId = req.user.userId;
    
    const [tasks] = await db.query(
      `SELECT 
        task_id as id,
        title,
        description,
        status,
        due_date
       FROM tasks
       WHERE assigned_to = ?
       ORDER BY 
         CASE status
           WHEN 'pending' THEN 1
           WHEN 'in_progress' THEN 2
           ELSE 3
         END,
         due_date ASC
       LIMIT 5`, 
      [employeeId]
    );
    
    res.json(tasks);
  } catch (error) {
    console.error('Error fetching employee tasks:', error);
    res.status(500).json({ error: 'Failed to fetch tasks' });
  }
};