import React, { useState, useEffect } from 'react';
import {
  Container,
  Paper,
  Typography,
  TextField,
  Button,
  Grid,
  CircularProgress,
  Box
} from '@mui/material';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const CustomerProfile = () => {
  const [profile, setProfile] = useState({
    full_name: '',
    phone_number: '',
    shipping_address: '',
    billing_address: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('http://localhost:5000/api/customers/me', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.data.customer) {
        setProfile({
          full_name: response.data.customer.full_name || '',
          phone_number: response.data.customer.phone_number || '',
          shipping_address: response.data.customer.shipping_address || '',
          billing_address: response.data.customer.billing_address || ''
        });
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setProfile(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(false);
    
    try {
      const token = localStorage.getItem('token');
      const response = await axios.put(
        'http://localhost:5000/api/customers', 
        profile,
        {
          headers: { 
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      setSuccess(true);
      setTimeout(() => navigate('/'), 1500);
    } catch (error) {
      console.error('Profile update error:', error);
      setError(error.response?.data?.error || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container maxWidth="md" sx={{ mt: 4 }}>
      <Paper sx={{ p: 4 }}>
        <Typography variant="h5" gutterBottom>
          Customer Profile
        </Typography>
        
        <form onSubmit={handleSubmit}>
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Full Name"
                name="full_name"
                value={profile.full_name}
                onChange={handleChange}
                required
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Phone Number"
                name="phone_number"
                value={profile.phone_number}
                onChange={handleChange}
                required
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Shipping Address"
                name="shipping_address"
                value={profile.shipping_address || ''}
                onChange={handleChange}
                multiline
                rows={3}
                required
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Billing Address"
                name="billing_address"
                value={profile.billing_address || ''}
                onChange={handleChange}
                multiline
                rows={3}
              />
            </Grid>
            <Grid item xs={12}>
              <Button
                type="submit"
                variant="contained"
                color="primary"
                disabled={loading}
              >
                {loading ? <CircularProgress size={24} /> : 'Save Profile'}
              </Button>
            </Grid>
          </Grid>
        </form>

        {error && (
          <Box sx={{ 
            backgroundColor: '#ffebee', 
            p: 2, 
            borderRadius: 1,
            mt: 2
          }}>
            <Typography color="error">
              <strong>Error:</strong> {error}
            </Typography>
          </Box>
        )}

        {success && (
          <Box sx={{ 
            backgroundColor: '#e8f5e9', 
            p: 2, 
            borderRadius: 1,
            mt: 2
          }}>
            <Typography color="success.main">
              <strong>Success!</strong> Profile updated successfully. Redirecting...
            </Typography>
          </Box>
        )}
      </Paper>
    </Container>
  );
};

export default CustomerProfile;