import React, { useState, useEffect } from 'react';
import {
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Grid,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
} from '@mui/material';
import axios from 'axios';
import { useAuth } from '../auth/AuthContext';

console.log('TaskForm component rendered');

const TaskForm = ({ task, onSave, onCancel }) => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    assigned_to: '',
    due_date: '',
    status: 'pending',
  });

  //const [employees, setEmployees] = useState([]);
  //const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { user,role } = useAuth();


  useEffect(() => {
    //console.log('TaskForm useEffect triggered', { task }); // Debug 1
    if (task) {
      //console.log('Setting task data', task); // Debug 2
      setFormData({
        title: task.title || '',
        description: task.description || '',
        assigned_to: task.assigned_to || '',
        due_date: task.due_date ? task.due_date.split('T')[0] : '',
        status: task.status || 'pending',
      });
    }
    //console.log('Calling fetchEmployees'); // Debug 3
    //fetchEmployees();
  }, [task]);

  /*const fetchEmployees = async () => {
    try {
      setLoading(true);
      setError(null);
      const token = localStorage.getItem('token');
      const response = await axios.get('http://localhost:5000/api/users/employees', {
        headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
  
      console.log('Employees API Response:', response.data); // Debug log
      if (!Array.isArray(response.data)) {
        throw new Error('Invalid employee data format');
      }

      setEmployees(response.data.map(emp => ({
        user_id: emp.user_id,
        name: emp.name || emp.full_name || `Employee ${emp.user_id}`
      })));
  
    } catch (error) {
      console.error('Failed to fetch employees:', error);
      setError('Failed to load employee list');
      setEmployees([]); 
    }finally {
      setLoading(false);
    }
  };*/
  
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
  
    // Basic validation
    if (!formData.title || !formData.description || !formData.assigned_to || !formData.due_date) {
      setError('Please fill all required fields');
      return;
    }
  
    try {
      // Call backend to validate employee
      const token = localStorage.getItem('token');
      const validationResponse = await axios.post(
        'http://localhost:5000/api/tasks/validate-employee',
        { employeeName: formData.assigned_to },
        { headers: { Authorization: `Bearer ${token}` } }
      );
  
      if (!validationResponse.data.valid) {
        setError('Employee not found. Please check the name.');
        return;
      }
  
      // Proceed if employee is valid
      onSave({
        ...formData,
        assigned_to: validationResponse.data.employeeId, // Save ID, not name
      });
    } catch (err) {
      setError('Failed to validate employee. Try again.');
    }
  };


  return (
    <form onSubmit={handleSubmit}>
      <DialogTitle>
        {task ? 'Edit Task' : 'Create New Task'}
      </DialogTitle>
      <DialogContent>
        <Grid container spacing={2} sx={{ mt: 1 }}>
          <Grid item xs={12}>
            <TextField
              required
              fullWidth
              label="Title"
              name="title"
              value={formData.title}
              onChange={handleChange}
              disabled={role === 'employee' || role === 'farmer'}
            />
          </Grid>
          <Grid item xs={12}>
            <TextField
              required
              fullWidth
              multiline
              rows={3}
              label="Description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              disabled={role === 'employee' || role === 'farmer'}
            />
          </Grid>
          <Grid item xs={12}>
            <TextField
              required
              fullWidth
              label="Assign To (Employee Name)"
              name="assigned_to"
              value={formData.assigned_to}
              onChange={handleChange}
              disabled={role === 'employee' || role === 'farmer'}
            />
          </Grid>
          <Grid item xs={12}>
            <TextField
              required
              fullWidth
              type="date"
              label="Due Date"
              name="due_date"
              value={formData.due_date}
              onChange={handleChange}
              InputLabelProps={{
                shrink: true,
              }}
              disabled={role === 'employee' || role === 'farmer'}
            />
          </Grid>
          {user && role !== 'admin' && (
            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel>Status</InputLabel>
                <Select
                  name="status"
                  value={formData.status}
                  onChange={handleChange}
                  label="Status"
                >
                  <MenuItem value="pending">Pending</MenuItem>
                  <MenuItem value="in_progress">In Progress</MenuItem>
                  <MenuItem value="completed">Completed</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          )}
        </Grid>
      </DialogContent>
      <DialogActions>
        <Button onClick={onCancel}>Cancel</Button>
        <Button type="submit" variant="contained" color="primary">
          {task ? 'Update' : 'Create'}
        </Button>
      </DialogActions>
    </form>
  );
};

export default TaskForm;