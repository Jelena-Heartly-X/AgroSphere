import React, { useState, useEffect } from 'react';
import {
  Container,
  Grid,
  Paper,
  Typography,
  List,
  ListItem,
  ListItemText,
  Chip,
  CircularProgress,
  Box
} from '@mui/material';
import {
  Assignment as TaskIcon,
  Inventory as InventoryIcon,
  //LocalShipping as DeliveryIcon,
  CheckCircle as CompletedIcon,
} from '@mui/icons-material';
import axios from 'axios';
import DashboardCard from './DashboardCard';
import ActivityFeed from './ActivityFeed';

const EmployeeDashboard = () => {
  const [stats, setStats] = useState({
    assignedTasks: 0,
    completedTasks: 0,
    //pendingDeliveries: 0,
    handledOrders: 0,
  });
  const [activities, setActivities] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);
      const token = localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };

      const [statsRes, activitiesRes, tasksRes] = await Promise.all([
        axios.get('http://localhost:5000/api/employee/stats', { headers }),
        axios.get('http://localhost:5000/api/employee/activities', { headers }),
        axios.get('http://localhost:5000/api/employee/tasks', { headers }),
      ]);

      setStats({
        assignedTasks: Number(statsRes.data.assignedTasks) || 0,
        completedTasks: Number(statsRes.data.completedTasks) || 0,
        handledOrders: Number(statsRes.data.handledOrders) || 0,
      });

      setActivities(activitiesRes.data);
      setTasks(tasksRes.data);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      setError('Failed to load dashboard data');
    }
    finally {
      setLoading(false);
    }
  };

  const getTaskStatusColor = (status) => {
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

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4, display: 'flex', justifyContent: 'center' }}>
        <CircularProgress />
      </Container>
    );
  }

  if (error) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Box sx={{ color: 'error.main' }}>{error}</Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Grid container spacing={3}>
        {/* Stats Cards */}
        <Grid item xs={12} sm={6} md={3}>
          <DashboardCard
            title="Assigned Tasks"
            value={stats.assignedTasks}
            icon={TaskIcon}
            color="primary"
            link="/tasks"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <DashboardCard
            title="Completed Tasks"
            value={stats.completedTasks}
            icon={CompletedIcon}
            color="success"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <DashboardCard
            title="Handled Orders"
            value={stats.handledOrders}
            icon={InventoryIcon}
            color="info"
            link="/orders"
          />
        </Grid>

        {/* Tasks List */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2, display: 'flex', flexDirection: 'column' }}>
            <Typography component="h2" variant="h6" color="primary" gutterBottom>
              Current Tasks
            </Typography>
            <List>
              {tasks.length > 0 ? (
                tasks.map((task) => (
                  <ListItem key={task.id} divider>
                    <ListItemText
                      primary={task.title}
                      secondary={
                        <>
                          <Typography component="span" variant="body2" color="textSecondary">
                            Due: {new Date(task.due_date).toLocaleDateString()}
                          </Typography>
                          <br />
                          {task.description}
                        </>
                      }
                    />
                    <Chip
                      label={task.status}
                      color={getTaskStatusColor(task.status)}
                      size="small"
                    />
                  </ListItem>
                ))
              ) : (
                <Typography variant="body2" color="textSecondary">
                  No tasks assigned
                </Typography>
              )}
            </List>
          </Paper>
        </Grid>

        {/* Activity Feed */}
        <Grid item xs={12} md={6}>
          <ActivityFeed activities={activities} />
        </Grid>
      </Grid>
    </Container>
  );
};

export default EmployeeDashboard;