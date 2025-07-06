const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const pool = require('../config/database');
const { validationResult } = require('express-validator');

exports.register = async (req, res) => {
  const connection = await pool.getConnection();
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    await connection.beginTransaction();
    const { username, email, password, full_name } = req.body;
    
    // Validate required fields
    if (!username || !email || !password || !full_name) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    // Set default role to 'farmer' if not provided
    // Set role from request body or default to 'customer'
  // Allow admin to set any role, others default to 'customer'
  const allowedRoles = ['customer', 'farmer', 'employee'];
  const role = allowedRoles.includes(req.body.role) ? req.body.role : 'customer';

    // Check for existing user
    const [existing] = await pool.query(
      'SELECT user_id FROM users WHERE email = ? OR username = ?', 
      [email, username]
    );
    
    if (existing.length > 0) {
      return res.status(400).json({ error: 'User already exists' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Create user
    const [result] = await pool.query(
      'INSERT INTO users (username, email, password, full_name, role) VALUES (?, ?, ?, ?, ?)',
      [username, email, hashedPassword, full_name, role]
    );
    await connection.query(
      `INSERT INTO customers 
       (user_id, full_name, phone_number)
       VALUES (?, ?, ?)`,
      [result.insertId, full_name, '000-000-0000']
    );

    await connection.commit();
    // Generate token
    const token = jwt.sign(
      { user_id: result.insertId, role },
      process.env.JWT_SECRET || 'your_jwt_secret_key',
      { expiresIn: '24h' }
    );

    res.status(201).json({
      token,
      user: { 
        user_id: result.insertId,
        username,
        email, 
        role, 
        full_name 
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    await connection.rollback();
    res.status(500).json({ 
      error: 'Registration failed',
      details: {
        message: error.message,
        sqlError: error.sqlMessage,
        missingFields: {
          username: !req.body.username,
          email: !req.body.email,
          password: !req.body.password,
          full_name: !req.body.full_name
        }
      }
    });
  } finally {
    connection.release();
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find user (using user_id)
    const [users] = await pool.query(
      'SELECT user_id , username, email, password, role, full_name FROM users WHERE email = ?', 
      [email]
    );
    const user = users[0];
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Verify password
    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Generate token
    const token = jwt.sign(
      { userId: user.user_id, role: user.role }, // Using user.id (aliased from user_id)
      process.env.JWT_SECRET || 'your_jwt_secret_key',
      { expiresIn: '24h' }
    );

    res.json({
      token,
      user: {
        user_id: user.user_id, // Consistent naming
        name: user.name,
        email: user.email,
        role: user.role,
        full_name: user.full_name
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      details: error.message 
    });
  }
};

exports.getProfile = async (req, res) => {
  try {
    const [users] = await pool.query(
      'SELECT user_id, username, email, role, full_name FROM users WHERE user_id = ?',
      [req.user.user_id]
    );
    if (!users[0]) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json(users[0]);
  } catch (error) {
    console.error('Profile error:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      details: error.message 
    });
  }
};

exports.updateProfile = async (req, res) => {
  try {
    const { username, email, full_name } = req.body;
    const [result] = await pool.query(
      'UPDATE users SET username = ?, email = ?, full_name = ? WHERE user_id = ?',
      [username, email, full_name, req.user.user_id]
    );
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ 
      user_id: req.user.user_id, 
      username, 
      email, 
      full_name 
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      details: error.message 
    });
  }
};