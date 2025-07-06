import React, { useState, useEffect } from 'react';
import {
  Container,
  Grid,
  Paper,
  Typography,
} from '@mui/material';
import {
  People as PeopleIcon,
  ShoppingCart as OrderIcon,
  Inventory as ProductIcon,
  AttachMoney as RevenueIcon,
} from '@mui/icons-material';
import axios from 'axios';
import DashboardCard from './DashboardCard';
import ActivityFeed from './ActivityFeed';
import { Chart } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend
);

const AdminDashboard = () => {
  const [stats, setStats] = useState({
    totalUsers: 0, // number of users shud be displayed instead of ''
    totalOrders: 0,
    totalProducts: 0,
    totalRevenue: 0,
  });
  const [activities, setActivities] = useState([]);
  const [salesData, setSalesData] = useState({
    labels: [],
    datasets: [],
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };
  
      const [statsRes, activitiesRes, salesRes] = await Promise.all([
        axios.get('http://localhost:5000/api/admin/stats', { headers }),
        axios.get('http://localhost:5000/api/admin/activities', { headers }),
        axios.get('http://localhost:5000/api/admin/sales', { headers }),
      ]);
  
      setStats({
        totalUsers: statsRes.data.totalUsers || 0,
        totalOrders: statsRes.data.totalOrders || 0,
        totalProducts: statsRes.data.totalProducts || 0,
        totalRevenue: statsRes.data.totalRevenue || 0,
      });
  
      setActivities(activitiesRes.data);
      
      setSalesData({
        labels: salesRes.data.map(item => new Date(item.date).toLocaleDateString()),
        datasets: [{
          label: 'Daily Sales',
          data: salesRes.data.map(item => item.amount),
          backgroundColor: 'rgba(75, 192, 192, 0.2)',
          borderColor: 'rgba(75, 192, 192, 1)',
          borderWidth: 1,
        }],
      });
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      // You might want to set some error state here
    } finally {
      setLoading(false);
    }
  };

  const formatRevenue = (value) => {
    const numValue = Number(value);
    return isNaN(numValue) ? '0.00' : numValue.toFixed(2);
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Grid container spacing={3}>
        {/* Stats Cards */}
        <Grid item xs={12} sm={6} md={3}>
          <DashboardCard
            title="Total Users"
            value={stats.totalUsers}
            icon={PeopleIcon}
            color="primary"
            link="/users"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <DashboardCard
            title="Total Orders"
            value={stats.totalOrders}
            icon={OrderIcon}
            color="secondary"
            link="/orders"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <DashboardCard
            title="Products"
            value={stats.totalProducts}
            icon={ProductIcon}
            color="warning"
            link="/products"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <DashboardCard
            title="Revenue"
            value={formatRevenue(stats.totalRevenue)}  // Use the format function
            icon={RevenueIcon}
            color="success"
          />
        </Grid>

        {/* Sales Chart */}
        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 2, display: 'flex', flexDirection: 'column', height: 400 }}>
            <Typography component="h2" variant="h6" color="primary" gutterBottom>
              Sales Overview
            </Typography>
            <Chart type="line" data={salesData} />
          </Paper>
        </Grid>

        {/* Activity Feed */}
        <Grid item xs={12} md={4}>
          <ActivityFeed activities={activities} />
        </Grid>
      </Grid>
    </Container>
  );
};

export default AdminDashboard;