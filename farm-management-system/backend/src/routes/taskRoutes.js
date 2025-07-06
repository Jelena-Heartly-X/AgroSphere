// taskRoutes.js
const express = require('express');
const router = express.Router();
const taskController = require('../controllers/taskController');
const auth = require('../middleware/auth');
const roleCheck = require('../middleware/roleCheck');

router.post('/', auth, roleCheck(['admin']), taskController.createTask);

// Task retrieval
router.get('/', auth, taskController.getTasks); // Make sure getTasks exists in controller
router.get('/my-tasks', auth, taskController.getMyTasks); // Ensure this exists
router.get('/created-tasks', auth, taskController.getCreatedTasks); // Ensure this exists
router.get('/status/:status', auth, taskController.getTasksByStatus); // Ensure this exists
router.get('/date-range', auth, taskController.getTasksByDate); // Ensure this exists
router.get('/:task_id', auth, taskController.getTaskById); // Ensure this exists

// Task modification (admin/farmer only)
router.put('/:task_id', auth, roleCheck(['admin']), taskController.updateTask);
router.delete('/:task_id', auth, roleCheck(['admin', 'farmer']), taskController.deleteTask);
router.patch('/:task_id/status', auth, roleCheck(['employee', 'farmer']), taskController.updateTaskStatus);
router.post('/validate-employee', auth, roleCheck(['admin', 'manager']), taskController.validateEmployee);

module.exports = router;