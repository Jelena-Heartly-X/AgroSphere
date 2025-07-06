const express = require('express');
const router = express.Router();
const employeeController = require('../controllers/employeeController');
const auth = require('../middleware/auth');
const roleCheck = require('../middleware/roleCheck');

router.get('/stats', auth, roleCheck(['employee']), employeeController.getStats);
router.get('/activities', auth, roleCheck(['employee']), employeeController.getActivities);
router.get('/tasks', auth, roleCheck(['employee']), employeeController.getTasks);

module.exports = router;