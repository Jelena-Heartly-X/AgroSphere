import React, { useState, useEffect } from 'react';
import { ShoppingCart, Favorite, History, LocalShipping } from '@mui/icons-material';
import {
  Container,
  Grid,
  Paper,
  Typography,
  Button,
  List,
  ListItemButton,
  ListItemText,
  Chip,
  Box,
  CircularProgress
} from '@mui/material';
import {
  ShoppingCart as OrderIcon,
  //Favorite as WishlistIcon,
  //History as HistoryIcon,
  //LocalShipping as DeliveryIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import DashboardCard from './DashboardCard';

const CustomerDashboard = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    totalOrders: 0,
    //wishlistItems: 0,
    pendingDeliveries: 0,
    totalSpent: 0,
  });
  const [recentOrders, setRecentOrders] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
  setLoading(true);
  try {
    const token = localStorage.getItem('token');
    const headers = { 
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json'
    };

    // Make sure this matches your backend route
    const [statsRes, ordersRes] = await Promise.all([
      axios.get('http://localhost:5000/api/customers/stats', { headers }),
      axios.get('http://localhost:5000/api/orders/recent-orders/customer', { headers }),
    ]);
    
    setStats({
      totalOrders: Number(statsRes.data.totalOrders) || 0,
      //wishlistItems: Number(statsRes.data.wishlistItems) || 0,
      pendingDeliveries: Number(statsRes.data.pendingDeliveries) || 0,
      totalSpent: Number(statsRes.data.totalSpent) || 0,
    });

    setRecentOrders(ordersRes.data || []);
  } catch (error) {
    console.error('Error fetching recent orders:', error);
  } finally {
    setLoading(false);
  }
};

  const getOrderStatusColor = (status) => {
    switch (status) {
      case 'completed':
        return 'success';
      case 'processing':
        return 'warning';
      case 'cancelled':
        return 'error';
      default:
        return 'info';
    }
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Grid container spacing={3}>
        {/* Stats Cards */}
        <Grid item xs={12} sm={6} md={3}>
          <DashboardCard
            title="Total Orders"
            value={stats.totalOrders}
            icon={OrderIcon}
            color="primary"
            link="/orders"
          />
        </Grid>
        {/*<Grid item xs={12} sm={6} md={3}>
          <DashboardCard
            title="Wishlist Items"
            value={stats.wishlistItems}
            icon={WishlistIcon}
            color="secondary"
            link="/wishlist"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <DashboardCard
            title="Pending Deliveries"
            value={stats.pendingDeliveries}
            icon={DeliveryIcon}
            color="warning"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <DashboardCard
            title="Total Spent"
            value={`$${stats.totalSpent.toFixed(2)}`}
            icon={HistoryIcon}
            color="success"
          />
        </Grid>*/}

        {/* Quick Actions */}
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Typography component="h2" variant="h6" color="primary" gutterBottom>
              Quick Actions
            </Typography>
            <Button
              variant="contained"
              color="primary"
              startIcon={<ShoppingCart />}
              onClick={() => navigate('/orders/create')}
            >
              Place New Order
            </Button>
            <Button
              variant="outlined"
              color="primary"
              startIcon={<Favorite />}
              onClick={() => navigate('/products')}
            >
              Browse Products
            </Button>
          </Paper>
        </Grid>

        {/* Recent Orders */}
        <Grid item xs={12} md={8}>
        <Paper sx={{ p: 2 }}>
            <Typography component="h2" variant="h6" color="primary" gutterBottom>
              Recent Orders
            </Typography>
            {loading ? (
              <Box display="flex" justifyContent="center" py={4}>
                <CircularProgress />
              </Box>
            ) : recentOrders.length > 0 ? (
              <>
                <List>
                  {recentOrders.map((order) => (
                    // In CustomerDashboard.js, update the ListItemButton rendering:
                    <ListItemButton 
                      key={order.order_id}
                      divider
                      onClick={() => navigate(`/orders/${order.order_id}`)}
                    >
                      <ListItemText
                        primary={`Order #${order.order_id}`}
                        secondary={
                          <>
                            <Typography component="span" variant="body2" color="textSecondary">
                              {new Date(order.created_at || order.order_date).toLocaleDateString('en-US', {
                                year: 'numeric',
                                month: 'short',
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </Typography>
                            <br />
                            {order.item_count || 0} item{order.item_count !== 1 ? 's' : ''} • ${(Number(order.total_amount) || 0).toFixed(2)}
                          </>
                        }
                      />
                      <Chip
                        label={order.status}
                        color={getOrderStatusColor(order.status)}
                        size="small"
                      />
                    </ListItemButton>
                  ))}
                </List>
                <Button
                  sx={{ mt: 2 }}
                  variant="text"
                  onClick={() => navigate('/orders')}
                >
                  View All Orders
                </Button>
              </>
            ) : (
              <Box textAlign="center" py={4}>
                <ShoppingCart sx={{ fontSize: 48, color: 'text.disabled', mb: 2 }} />
                <Typography variant="body1" color="textSecondary">
                  No recent orders found
                </Typography>
                {!loading && (
                  <Button
                    variant="outlined"
                    sx={{ mt: 2 }}
                    onClick={() => navigate('/orders/create')}
                  >
                    Place Your First Order
                  </Button>
                )}
              </Box>
            )}
          </Paper>
        </Grid>
      </Grid>
    </Container>
  );
};

export default CustomerDashboard;