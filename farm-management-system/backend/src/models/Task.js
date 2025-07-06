const db = require('../config/database');

class Task {
  static async findAll(filter = {}) {
    try {
      let query = `SELECT t.*, u.username as assigned_to_name 
      FROM tasks t
      LEFT JOIN users u ON t.assigned_to = u.user_id`;
      const params = [];
      
      // Build WHERE clause based on filter
      const conditions = [];
      if (filter.assigned_to) {
        conditions.push('assigned_to = ?');
        params.push(filter.assigned_to);
      }
      if (filter.created_by) {
        conditions.push('created_by = ?');
        params.push(filter.created_by);
      }
      if (filter.status) {
        conditions.push('status = ?');
        params.push(filter.status);
      }
      if (filter.where?.due_date?.between) {
        conditions.push('due_date BETWEEN ? AND ?');
        params.push(...filter.where.due_date.between);
      }
      
      if (conditions.length) {
        query += ' WHERE ' + conditions.join(' AND ');
      }
      
      const [rows] = await db.query(query, params);
      return rows;
    } catch (error) {
      console.error('Error finding tasks:', error);
      throw new Error('Failed to retrieve tasks');
    }
  }

  static async findById(task_id) {
    try {
      const [rows] = await db.query('SELECT * FROM tasks WHERE task_id = ?', [task_id]);
      return rows[0] || null;
    } catch (error) {
      console.error(`Error finding task ${task_id}:`, error);
      throw new Error('Failed to retrieve task');
    }
  }

  static async create(taskData) {
    try {
      const [result] = await db.query(
        `INSERT INTO tasks 
         (title, description, status, assigned_to, due_date, created_by) 
         VALUES (?, ?, ?, ?, ?, ?)`,
        [
          taskData.title,
          taskData.description,
          taskData.status || 'pending',
          taskData.assigned_to,
          taskData.due_date,
          taskData.created_by
        ]
      );
      return result.insertId;
    } catch (error) {
      console.error('Error creating task:', error);
      throw new Error('Failed to create task');
    }
  }

  /*static async update(task_id, taskData) {
    try {
      const [result] = await db.query(
        `UPDATE tasks SET 
          title = ?,
          description = ?,
          status = ?,
          assigned_to = ?,
          due_date = ?
         WHERE task_id = ?`,
        [
          taskData.title,
          taskData.description,
          taskData.status,
          taskData.assigned_to,
          taskData.due_date,
          task_id
        ]
      );
      return result.affectedRows > 0;
    } catch (error) {
      console.error(`Error updating task ${task_id}:`, error);
      throw new Error('Failed to update task');
    }
  }
  */

  static async update(task_id, updateData) {
    try {
      // Build SET clause dynamically based on provided fields
      const setClause = Object.keys(updateData)
        .map(key => `${key} = ?`)
        .join(', ');
      
      const values = Object.values(updateData);
      values.push(task_id); // Add task_id for WHERE clause
  
      const [result] = await db.query(
        `UPDATE tasks SET ${setClause} WHERE task_id = ?`,
        values
      );
      
      return result.affectedRows > 0;
    } catch (error) {
      console.error(`Error updating task ${task_id}:`, error);
      throw new Error('Failed to update task');
    }
  }

  static async delete(task_id) {
    try {
      const [result] = await db.query('DELETE FROM tasks WHERE task_id = ?', [task_id]);
      return result.affectedRows > 0;
    } catch (error) {
      console.error(`Error deleting task ${task_id}:`, error);
      throw new Error('Failed to delete task');
    }
  }
}

module.exports = Task;