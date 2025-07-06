const db = require('../config/database');

class User {
  static async findByEmail(email) {
    try {
      const [rows] = await db.query('SELECT * FROM users WHERE email = ?', [email]);
      return rows[0];
    } catch (error) {
      throw error;
    }
  }

  static async findById(user_id) {
    try {
      const [rows] = await db.query('SELECT * FROM users WHERE user_id = ?', [user_id]);
      return rows[0];
    } catch (error) {
      throw error;
    }
  }

  static async create({ username, email, password, full_name, phone, role = 'customer' }) {
    try {
      const [result] = await db.query(
        `INSERT INTO users 
         (username, email, password, full_name, phone, role) 
         VALUES (?, ?, ?, ?, ?, ?)`,
        [username, email, password, full_name, phone, role]
      );
      
      const [user] = await db.query(
        `SELECT user_id, username, email, full_name, phone, role, created_at 
         FROM users WHERE user_id = ?`,
        [result.insertId]
      );
      
      return user[0];
    } catch (error) {
      throw error;
    }
  }

  static async update(user_id, { username, email, role }) {
    try {
      await db.query(
        'UPDATE users SET username = ?, email = ?, role = ? WHERE user_id = ?',
        [username, email, role, user_id]
      );
      return this.findById(user_id);
    } catch (error) {
      throw error;
    }
  }

  static async delete(user_id) {
    try {
      await db.query('DELETE FROM users WHERE user_id = ?', [user_id]);
      return true;
    } catch (error) {
      throw error;
    }
  }

  static async findAll() {
    try {
      const [rows] = await db.query('SELECT user_id, username, email, role FROM users');
      return rows;
    } catch (error) {
      throw error;
    }
  }

  static async getEmployees() {
    try {
      const [rows] = await db.query(
        `SELECT user_id, COALESCE(full_name, username) AS name 
         FROM users 
         WHERE role = 'employee'`
      );
      return rows;
    } catch (error) {
      throw error;
    }
  }

  static async validateEmployee(employeeName) {
    try {
      console.log('Validating employee:', employeeName); // Debug log
      const [rows] = await db.query(
        `SELECT user_id 
         FROM users 
         WHERE (LOWER(full_name) = LOWER(?) OR LOWER(username) = LOWER(?)) 
         AND role = 'employee' LIMIT 1`,
        [employeeName.trim(), employeeName.trim()]
      );
      console.log('Validation result:', rows[0]); // Debug log
      return rows[0] || null;
    } catch (error) {
      console.error('Validation error:', error);
      throw error;
    }
  }
}


module.exports = User;