import React, { useState, useEffect } from 'react';
import {
  Container,
  Grid,
  Paper,
  Typography,
  CircularProgress,
  Box
} from '@mui/material';
import {
  LocalShipping as OrderIcon,
  Inventory as ProductIcon,
  Assignment as TaskIcon,
  Warning as AlertIcon,
} from '@mui/icons-material';
import axios from 'axios';
import DashboardCard from './DashboardCard';
import ActivityFeed from './ActivityFeed';
import RecentOrders from './RecentOrders';

const FarmerDashboard = () => {
  const [stats, setStats] = useState({
    pendingOrders: 0,
    activeProducts: 0,
    pendingTasks: 0,
    lowStockItems: 0,
  });
  const [activities, setActivities] = useState([]);
  const [recentOrders, setRecentOrders] = useState([]);
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
  
      const [statsRes, activitiesRes,ordersRes] = await Promise.all([
        axios.get('http://localhost:5000/api/farmer/stats', { headers }),
        axios.get('http://localhost:5000/api/farmer/activities', { headers }),
        axios.get('http://localhost:5000/api/farmer/recent-orders', { headers }), // Add this line
      ]);
  
      setStats({
        pendingOrders: Number(statsRes.data.pendingOrders) || 0,
        activeProducts: Number(statsRes.data.activeProducts) || 0,
        pendingTasks: Number(statsRes.data.pendingTasks) || 0,
        lowStockItems: Number(statsRes.data.lowStockItems) || 0,
      });

      setActivities(activitiesRes.data);
      setRecentOrders(ordersRes.data.slice(0, 5)); // Get top 5 recent orders

    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      setError('Failed to load dashboard data');
    }finally {
      setLoading(false);
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
            title="Pending Orders"
            value={stats.pendingOrders}
            icon={OrderIcon}
            color="primary"
            link="/orders?status=pending"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <DashboardCard
            title="Active Products"
            value={stats.activeProducts}
            icon={ProductIcon}
            color="secondary"
            link="/products"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <DashboardCard
            title="Pending Tasks"
            value={stats.pendingTasks}
            icon={TaskIcon}
            color="warning"
            link="/tasks?status=pending"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <DashboardCard
            title="Low Stock Items"
            value={stats.lowStockItems}
            icon={AlertIcon}
            color="error"
            link="/inventory?filter=low-stock"
          />
        </Grid>

        {/* Recent Orders */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2, display: 'flex', flexDirection: 'column' }}>
            <Typography component="h2" variant="h6" color="primary" gutterBottom>
              Recent Orders
            </Typography>
            <RecentOrders orders={recentOrders} />
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

export default FarmerDashboard;