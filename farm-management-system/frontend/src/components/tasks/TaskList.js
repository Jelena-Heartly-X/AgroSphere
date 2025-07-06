import React, { useState, useEffect } from 'react';
import {
  Container,
  Grid,
  Paper,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
  IconButton,
  Chip,
  Dialog,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
} from '@mui/icons-material';
import axios from 'axios';
import TaskForm from './TaskForm';
import TaskStatusForm from './TaskStatusForm';
import { useAuth } from '../auth/AuthContext';

console.log('TaskList component mounted');  // Debug 3


const TaskList = () => {
  const [tasks, setTasks] = useState([]);
  const [open, setOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [statusFormOpen, setStatusFormOpen] = useState(false);
  const [selectedTaskForStatus, setSelectedTaskForStatus] = useState(null);
  const { role } = useAuth();

  useEffect(() => {
    console.log('Open state changed to:', open); // Track state changes
    fetchTasks();
  }, [open]);

  const fetchTasks = async () => {
    try {
      const token = localStorage.getItem('token');
      const endpoint = (role === 'employee' || role === 'farmer') ? '/my-tasks' : '';
      const response = await axios.get(`http://localhost:5000/api/tasks${endpoint}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setTasks(response.data);
    } catch (error) {
      console.error('Error fetching tasks:', error);
    }
  };
  

  const handleAddClick = () => {
    console.log('Add button clicked - current open state:', open); // Debug
    setOpen(true); // Force open
    setSelectedTask(null);
    console.log('New open state should be true'); // Verify
  };

  const handleEditClick = (task) => {
    setSelectedTask(task);
    setOpen(true);
  };

  const handleDeleteClick = async (task_id) => {
    if (window.confirm('Are you sure you want to delete this task?')) {
      try {
        const token = localStorage.getItem('token');
        await axios.delete(`http://localhost:5000/api/tasks/${task_id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        fetchTasks();
      } catch (error) {
        console.error('Error deleting task:', error);
      }
    }
  };

  const handleStatusUpdateClick = (task) => {
    console.log('Status update clicked for task:', task);
    setSelectedTaskForStatus(task);
    setStatusFormOpen(true);
    console.log('statusFormOpen should be true now');
  };
  
  const handleStatusUpdate = async (statusData) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.patch(
        `http://localhost:5000/api/tasks/${selectedTaskForStatus.task_id}/status`,
        { status: statusData.status }, // Ensure proper payload structure
        { 
          headers: { 
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          } 
        }
      );
      setStatusFormOpen(false);
      fetchTasks();
    } catch (error) {
      console.error('Error updating task status:', {
        error: error.response?.data || error.message,
        config: error.config
      });
    }
  };

  const handleClose = () => {
    setOpen(false);
    setSelectedTask(null);
  };

  const handleSave = async (taskData) => {
    try {
      const token = localStorage.getItem('token');
      if (selectedTask) {
        await axios.put(
          `http://localhost:5000/api/tasks/${selectedTask.task_id}`,
          taskData,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
      } else {
        await axios.post('http://localhost:5000/api/tasks', taskData, {
          headers: { Authorization: `Bearer ${token}` },
        });
      }
      handleClose();
      fetchTasks();
    } catch (error) {
      console.error('Error saving task:', error);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed':
        return 'success';
      case 'in_progress':
        return 'warning';
      case 'pending':
        return 'error';
      default:
        return 'default';
    }
  };

  //const canManageTasks = ['admin', 'farmer'].includes(role);
  console.log('Rendering TaskList. Dialog open state:', open);  // Debug 1
      console.log('Selected task:', selectedTask);  // Debug 2
  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Grid container spacing={3}>
        <Grid item xs={12}>
          <Paper sx={{ p: 2, display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
              <Typography component="h2" variant="h6" color="primary" gutterBottom>
                Tasks
              </Typography>
              {role === 'admin' && (
                <Button
                  variant="contained"
                  color="primary"
                  startIcon={<AddIcon />}
                  onClick={handleAddClick}
                >
                  Add Task
                </Button>
              )}
            </div>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Title</TableCell>
                    <TableCell>Description</TableCell>
                    <TableCell>Assigned To</TableCell>
                    <TableCell>Due Date</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {tasks.map((task) => (
                    <TableRow key={task.task_id}>
                      <TableCell>{task.title}</TableCell>
                      <TableCell>{task.description}</TableCell>
                      <TableCell>{task.assigned_to_name}</TableCell>
                      <TableCell>{new Date(task.due_date).toLocaleDateString('en-US', {
                      month: 'short',
                      day: '2-digit',
                      year: 'numeric'
                    })}</TableCell>
                      <TableCell>
                        <Chip
                          label={task.status}
                          color={getStatusColor(task.status)}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        {role === 'admin' && (
                          <>
                            <IconButton
                              color="primary"
                              onClick={() => handleEditClick(task)}
                            >
                              <EditIcon />
                            </IconButton>
                            <IconButton
                              color="error"
                              onClick={() => handleDeleteClick(task.task_id)}
                            >
                              <DeleteIcon />
                            </IconButton>
                          </>
                        )}
                        {(role === 'employee' || role === 'farmer') && (
                        <Button 
                          variant="outlined" 
                          size="small"
                          onClick={() => {
                            console.log('Updating task:', task); // Debug log
                            setSelectedTaskForStatus(task);  // Set the selected task
                            setStatusFormOpen(true);
                          }}
                        >
                          Update Status
                        </Button>
                      )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        </Grid>
      </Grid>
      <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
        <TaskForm
          task={selectedTask}
          onSave={handleSave}
          onCancel={handleClose}
        />
      </Dialog>
      <Dialog open={statusFormOpen} onClose={() => setStatusFormOpen(false)} maxWidth="xs" fullWidth>
        <TaskStatusForm
          task={selectedTaskForStatus}
          open={statusFormOpen}
          onClose={() => setStatusFormOpen(false)}
          onSave={handleStatusUpdate}
        />
      </Dialog>
    </Container>
  );
};

export default TaskList;