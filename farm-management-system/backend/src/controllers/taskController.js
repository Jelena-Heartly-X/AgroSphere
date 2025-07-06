const Task = require('../models/Task');
const User = require('../models/User');

exports.createTask = async (req, res) => {
  try {
    const { title, description, due_date, assigned_to } = req.body;
    const task_id = await Task.create({
      title,
      description,
      due_date,
      status: 'pending',
      created_by: req.user.userId,
      assigned_to
    });
    const newTask = await Task.findById(task_id);
    res.status(201).json(newTask);
  } catch (error) {
    console.error('Create task error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

exports.getTasks = async (req, res) => {
  try {
    let tasks;
    if (req.user.role === 'farmer' || req.user.role === 'employee') {
      tasks = await Task.findAll({ assigned_to: req.user.userId });
    } else {
      tasks = await Task.findAll();
    }
    res.json(tasks);
  } catch (error) {
    console.error('Get tasks error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

exports.getMyTasks = async (req, res) => {
  try {
    const tasks = await Task.findAll({ assigned_to: req.user.userId });
    res.json(tasks);
  } catch (error) {
    console.error('Get my tasks error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

exports.getCreatedTasks = async (req, res) => {
  try {
    const tasks = await Task.findAll({ created_by: req.user.userId });
    res.json(tasks);
  } catch (error) {
    console.error('Get created tasks error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

exports.getTasksByStatus = async (req, res) => {
  try {
    const tasks = await Task.findAll({ status: req.params.status });
    res.json(tasks);
  } catch (error) {
    console.error('Get tasks by status error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

exports.getTasksByDate = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const tasks = await Task.findAll({
      where: {
        due_date: {
          $gte: new Date(startDate),  // Greater than or equal to startDate
          $lte: new Date(endDate)     // Less than or equal to endDate
        }
      }
    });
    res.json(tasks);
  } catch (error) {
    console.error('Get tasks by date error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

exports.getTaskById = async (req, res) => {
  try {
    const task = await Task.findById(req.params.task_id);
    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }
    res.json(task);
  } catch (error) {
    console.error('Get task error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

/*exports.updateTask = async (req, res) => {
  try {
    const { task_id } = req.params;
    const { title, description, status, assigned_to, due_date } = req.body;
    
    const updated = await Task.update(task_id, {
      title,
      description,
      status,
      assigned_to,
      due_date
    });
    
    if (!updated) {
      return res.status(404).json({ error: 'Task not found' });
    }
    
    const updatedTask = await Task.findById(task_id);
    res.json(updatedTask);
  } catch (error) {
    console.error('Update task error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};*/

// Modify updateTask to restrict non-admin users to only update status
exports.updateTask = async (req, res) => {
  try {
    const { task_id } = req.params;
    const task = await Task.findById(task_id);
    
    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }

    // For non-admin users, they can only update status of their own tasks
    if (req.user.role !== 'admin') {
      // Check if task is assigned to current user
      if (task.assigned_to !== req.user.userId) {
        return res.status(403).json({ error: 'You can only update your own tasks' });
      }

      // Only allow status updates
      const updated = await Task.update(task_id, {
        status: req.body.status
      });
      
      if (!updated) {
        return res.status(400).json({ error: 'Failed to update task' });
      }
    } else {
      // Admin can update all fields
      const updated = await Task.update(task_id, req.body);
      if (!updated) {
        return res.status(400).json({ error: 'Failed to update task' });
      }
    }
    
    const updatedTask = await Task.findById(task_id);
    res.json(updatedTask);
  } catch (error) {
    console.error('Update task error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

exports.deleteTask = async (req, res) => {
  try {
    const { task_id } = req.params;
    const deleted = await Task.delete(task_id);
    if (!deleted) {
      return res.status(404).json({ error: 'Task not found' });
    }
    res.json({ message: 'Task deleted successfully' });
  } catch (error) {
    console.error('Delete task error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

exports.updateTaskStatus = async (req, res) => {
  try {
    const { task_id } = req.params;
    const { status } = req.body;
    
    // Validate status value
    const validStatuses = ['pending', 'in_progress', 'completed'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: 'Invalid status value' });
    }

    const task = await Task.findById(task_id);
    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }

    // Verify user is assigned to the task
    if (task.assigned_to !== req.user.userId) {
      return res.status(403).json({ error: 'You can only update your own tasks' });
    }

    const updated = await Task.update(task_id, { status });
    
    if (!updated) {
      return res.status(400).json({ error: 'Failed to update task status' });
    }
    
    const updatedTask = await Task.findById(task_id);
    res.json(updatedTask);
  } catch (error) {
    console.error('Update task status error:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      details: error.message // Include error details for debugging
    });
  }
};

exports.validateEmployee = async (req, res) => {
  const { employeeName } = req.body;
  
  try {
    const employee = await User.validateEmployee(employeeName); // Use your SQL model method
    
    if (!employee) {
      return res.json({ valid: false });
    }

    res.json({ 
      valid: true,
      employeeId: employee.user_id 
    });
  } catch (error) {
    console.error('Validation error:', error);
    res.status(500).json({ 
      error: 'Validation failed',
      details: error.message // For debugging
    });
  }
};