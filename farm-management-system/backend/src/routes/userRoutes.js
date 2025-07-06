const express = require('express');
const router = express.Router();
const { 
  register,
  login,
  getProfile,
  updateProfile,
  getAllUsers,
  getUserById,
  updateUser,
  deleteUser,
  createUser,
  getEmployees
} = require('../controllers/userController'); // Destructured import
const auth = require('../middleware/auth');
const roleCheck = require('../middleware/roleCheck');

// Public routes
router.post('/register', register);
router.post('/login', login);

// Protected routes
router.get('/profile', auth, getProfile);
router.put('/profile', auth, updateProfile);
router.get('/', auth, roleCheck(['admin']), getAllUsers);
router.get('/:user_id', auth, roleCheck(['admin']), getUserById);
router.put('/:user_id', auth, roleCheck(['admin']), updateUser);
router.delete('/:user_id', auth, roleCheck(['admin']), deleteUser);
router.post('/', auth, roleCheck(['admin']), createUser); // Keep this
router.get('/employees', auth, roleCheck(['admin', 'farmer']), getEmployees);

module.exports = router;