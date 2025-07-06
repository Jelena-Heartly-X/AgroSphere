const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const pool = require('../config/database');

// User registration


exports.register = async (req, res) => {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    const { username, email, password, full_name, phone, role = 'customer' } = req.body;

    // Check for existing user WITH LOCK
    const [existing] = await connection.query(
      'SELECT user_id FROM users WHERE email = ? OR username = ? FOR UPDATE',
      [email, username]
    );
    
    if (existing.length > 0) {
      await connection.rollback();
      return res.status(400).json({ 
        error: 'User already exists',
        existing: existing[0]
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Create user
    const [result] = await connection.query(
      `INSERT INTO users (username, email, password, full_name, phone, role) 
       VALUES (?, ?, ?, ?, ?, ?)`,
      [username, email, hashedPassword, full_name, phone, role]
    );

    // Generate token
    const token = jwt.sign(
      { user_id: result.insertId, username, email, role },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    await connection.commit();
    
    res.status(201).json({
      success: true,
      token,
      user: {
        user_id: result.insertId,
        username,
        email,
        full_name,
        phone,
        role
      }
    });

  } catch (error) {
    await connection.rollback();
    
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({ 
        error: 'User already exists',
        details: 'The username or email is already registered'
      });
    }
    
    console.error('Registration error:', error);
    res.status(500).json({ 
      error: 'Registration failed',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  } finally {
    connection.release();
  }
};

// User login
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find user
    const [users] = await pool.query(
      'SELECT * FROM users WHERE email = ?',
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
      { user_id: user.user_id, username: user.username, role: user.role },
      process.env.JWT_SECRET || 'your_jwt_secret_key',
      { expiresIn: '24h' }
    );

    res.json({
      token,
      user: {
        user_id: user.user_id,
        username: user.username,
        email: user.email,
        role: user.role,
        full_name: user.full_name
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Get user profile
exports.getProfile = async (req, res) => {
  try {
    const [users] = await pool.query(
      'SELECT user_id, username, email, role, full_name FROM users WHERE user_id = ?',
      [req.user.user_id]
    );
    res.json(users[0]);
  } catch (error) {
    console.error('Profile error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Update profile
exports.updateProfile = async (req, res) => {
  try {
    const { full_name, email } = req.body;
    await pool.query(
      'UPDATE users SET full_name = ?, email = ? WHERE user_id = ?',
      [full_name, email, req.user.user_id]
    );
    res.json({ message: 'Profile updated' });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Get all users (admin only)
exports.getAllUsers = async (req, res) => {
  try {
    const [users] = await pool.query(
      'SELECT user_id, username, email, role, full_name FROM users'
    );
    res.json(users);
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Get user by ID (admin only)
exports.getUserById = async (req, res) => {
  try {
    const [users] = await pool.query(
      'SELECT user_id, username, email, role, full_name FROM users WHERE user_id = ?',
      [req.params.user_id]
    );
    res.json(users[0] || null);
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Update user (admin only)
exports.updateUser = async (req, res) => {
  try {
    const { user_id } = req.params;
    const { full_name, email, role } = req.body;
    await pool.query(
      'UPDATE users SET full_name = ?, email = ?, role = ? WHERE user_id = ?',
      [full_name, email, role, user_id]
    );
    res.json({ message: 'User updated' });
  } catch (error) {
    console.error('Update error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Delete user (admin only)
exports.deleteUser = async (req, res) => {
  try {
    await pool.query('DELETE FROM users WHERE user_id = ?', [req.params.user_id]);
    res.json({ message: 'User deleted' });
  } catch (error) {
    console.error('Delete error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// In controllers/userController.js
exports.createUser = async (req, res) => {
  try {
    const { username, email, password, full_name, role } = req.body;
    
    // Validation
    if (!username || !email || !password || !full_name) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    // Check if user exists
    const [existing] = await pool.query(
      'SELECT user_id FROM users WHERE email = ? OR username = ?', 
      [email, username]
    );
    
    if (existing.length > 0) {
      return res.status(400).json({ error: 'User already exists' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const [result] = await pool.query(
      'INSERT INTO users (username, email, password, full_name, role) VALUES (?, ?, ?, ?, ?)',
      [username, email, hashedPassword, full_name, role || 'customer']
    );

    res.status(201).json({
      id: result.insertId,
      username,
      email,
      full_name,
      role: role || 'customer'
    });
    
  } catch (error) {
    console.error('Create user error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};


exports.getEmployees = async (req, res) => {
  try {
    const employees = await User.findAll({
      where: { role: 'employee' },
      attributes: ['user_id', 'full_name', 'username']
    });
    
    const formattedEmployees = employees.map(emp => ({
      user_id: emp.user_id,
      name: emp.full_name || emp.username
    }));
    
    res.json(formattedEmployees);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch employees' });
  }
};