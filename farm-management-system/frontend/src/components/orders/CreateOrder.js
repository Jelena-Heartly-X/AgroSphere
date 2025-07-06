import React, { useState, useEffect } from 'react';
import {
  Container,
  Grid,
  Paper,
  Typography,
  TextField,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  MenuItem,
  CircularProgress,
  Box
} from '@mui/material';
import { Add as AddIcon, Remove as RemoveIcon } from '@mui/icons-material';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const CreateOrder = () => {
  const [products, setProducts] = useState([]);
  const [selectedProducts, setSelectedProducts] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const navigate = useNavigate();
  useEffect(() => {
    fetchProducts();
  }, []);

  useEffect(() => {
    calculateTotal();
  }, [selectedProducts]);

  const fetchProducts = async () => {
    try {
      const token = localStorage.getItem('token');
      const config = {
        headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      };
      const response = await axios.get('http://localhost:5000/api/products', config);
      setProducts(response.data);
    } catch (error) {
      console.error('Error fetching products:', error);
      setError('Failed to load products');
    }
  };

  const handleAddProduct = () => {
    setSelectedProducts([...selectedProducts, { product_id: '', quantity: 1 }]);
  };

  const handleRemoveProduct = (index) => {
    const newProducts = selectedProducts.filter((_, i) => i !== index);
    setSelectedProducts(newProducts);
  };

  const handleProductChange = (index, field, value) => {
    const newProducts = [...selectedProducts];
    
    if (field === 'quantity') {
      // Handle empty string case (when user clears the input)
      if (value === '') {
        newProducts[index][field] = '';
      } else {
        const numValue = parseInt(value, 10);
        newProducts[index][field] = isNaN(numValue) || numValue < 1 ? 1 : numValue;
      }
    } else {
      newProducts[index][field] = value;
    }

    if (field === 'product_id') {
      const product = products.find((p) => p.product_id === value);
      newProducts[index].price = product ? product.price : 0;
    }
    
    setSelectedProducts(newProducts);
  };

  const calculateTotal = () => {
    const sum = selectedProducts.reduce((acc, item) => {
      const product = products.find((p) => p.product_id === item.product_id);
      return acc + (product ? product.price * (item.quantity || 0) : 0);
    }, 0);
    setTotal(sum);
  };

// In CreateOrder.js - update handleSubmit
// In CreateOrder.js - final handleSubmit
const handleSubmit = async (e) => {
  e.preventDefault();
  setLoading(true);
  setError(null);

  try {
    const token = localStorage.getItem('token');
    if (!token) {
      throw new Error('No authentication token found');
    }

    const config = {
      headers: { 
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    };

    // 1. Verify customer profile exists and is complete
    let customerProfile;
    try {
      const res = await axios.get('http://localhost:5000/api/customers/me', config);
      customerProfile = res.data.customer;
      
      // Check if shipping address needs update
      // In the handleSubmit function:
      if (!customerProfile.shipping_address || 
        customerProfile.shipping_address.includes('Please update')) {
      setError('Please update your shipping address to place orders');
      setTimeout(() => navigate('/profile', { state: { fromOrder: true } }), 2000);
      return;
      }
    } catch (error) {
      console.error('Customer profile check failed:', error);
      if (error.redirect) {
        setError(error.message);
        setTimeout(() => navigate(error.redirect), 2000);
      } else {
        throw error;
      }
      return;
    }

    // 2. Prepare order data
    const orderData = {
      items: selectedProducts.map(item => ({
        product_id: item.product_id,
        quantity: item.quantity
      }))
      // Note: shipping_address will be pulled from customer profile in backend
    };

    // 3. Submit order
    const response = await axios.post(
      'http://localhost:5000/api/orders', 
      orderData, 
      config
    );

    setSuccess(true);
    setTimeout(() => {
      navigate('/orders');
    }, 1500);
  } catch (error) {
    console.error('Order creation error:', error);
    setError(error.response?.data?.error || error.message || 'Failed to create order');
  } finally {
    setLoading(false);
  }
};

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Grid container spacing={3}>
        <Grid item xs={12}>
          <Paper sx={{ p: 2 }}>
            <Typography component="h2" variant="h6" color="primary" gutterBottom>
              Create New Order
            </Typography>
            <form onSubmit={handleSubmit}>
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Product</TableCell>
                      <TableCell>Quantity</TableCell>
                      <TableCell>Price</TableCell>
                      <TableCell>Total</TableCell>
                      <TableCell>Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {selectedProducts.map((item, index) => {
                      const product = products.find(
                        (p) => p.product_id === item.product_id
                      );
                      return (
                        <TableRow key={index}>
                          <TableCell>
                            <TextField
                              select
                              fullWidth
                              value={item.product_id}
                              onChange={(e) =>
                                handleProductChange(
                                  index,
                                  'product_id',
                                  e.target.value
                                )
                              }
                              disabled={loading}
                            >
                              <MenuItem value="">Select a product</MenuItem>
                              {products.map((product) => (
                                <MenuItem key={product.product_id} value={product.product_id}>
                                  {product.name}
                                </MenuItem>
                              ))}
                            </TextField>
                          </TableCell>
                          <TableCell>
                            <TextField
                              type="number"
                              value={item.quantity}
                              onChange={(e) =>
                                handleProductChange(
                                  index,
                                  'quantity',
                                  e.target.value
                                )
                              }
                              inputProps={{ min: 1 }}
                              disabled={loading}
                            />
                          </TableCell>
                          <TableCell>
                            ${product ? product.price : '0.00'}
                          </TableCell>
                          <TableCell>
                            ${product ? (product.price * (item.quantity || 0)).toFixed(2) : '0.00'}
                          </TableCell>
                          <TableCell>
                            <IconButton
                              color="error"
                              onClick={() => handleRemoveProduct(index)}
                              disabled={loading}
                            >
                              <RemoveIcon />
                            </IconButton>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </TableContainer>

              <Button
                startIcon={<AddIcon />}
                onClick={handleAddProduct}
                sx={{ mt: 2 }}
                disabled={loading}
              >
                Add Product
              </Button>

              <Grid container justifyContent="flex-end" sx={{ mt: 2 }}>
                <Typography variant="h6">
                  Total: ${total.toFixed(2)}
                </Typography>
              </Grid>

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
                    <strong>Success!</strong> Order created successfully. Redirecting...
                  </Typography>
                </Box>
              )}

              {loading && (
                <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
                  <CircularProgress />
                </Box>
              )}

              <Grid container justifyContent="flex-end" sx={{ mt: 2 }}>
                <Button 
                  type="submit" 
                  variant="contained" 
                  color="primary"
                  disabled={loading || selectedProducts.length === 0}
                >
                  {loading ? 'Creating Order...' : 'Create Order'}
                </Button>
              </Grid>
            </form>
          </Paper>
        </Grid>
      </Grid>
    </Container>
  );
};

export default CreateOrder;