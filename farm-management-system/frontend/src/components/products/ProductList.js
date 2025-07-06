import React, { useState, useEffect } from 'react';
import {
  Container,
  Grid,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
  IconButton,
  Typography,
  Dialog,
  DialogTitle,
  DialogContent,
  //DialogActions,
} from '@mui/material';
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  Add as AddIcon,
} from '@mui/icons-material';
import axios from 'axios';
import ProductForm from './ProductForm';
import { useAuth } from '../auth/AuthContext';

const ProductList = () => {
  const [products, setProducts] = useState([]);
  const [open, setOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const { role } = useAuth(); // Get user role from your auth context

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('http://localhost:5000/api/products', {
        headers: { Authorization: `Bearer ${token}` },
      });
      setProducts(response.data);
      setIsLoading(false);
    } catch (error) {
      console.error('Error fetching products:', error);
      setIsLoading(false);
    }
  };

  const handleAddClick = () => {
    setSelectedProduct(null);
    setOpen(true);
  };

  const handleEditClick = (product) => {
    setSelectedProduct(product);
    setOpen(true);
  };

  const handleDeleteClick = async (product_id) => {
    if (window.confirm('Are you sure you want to delete this product?')) {
      try {
        const token = localStorage.getItem('token');
        await axios.delete(`http://localhost:5000/api/products/${product_id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        fetchProducts();
      } catch (error) {
        console.error('Error deleting product:', error);
      }
    }
  };

  const handleClose = () => {
    setOpen(false);
    setSelectedProduct(null);
  };

  // Update handleSave to include farmer_id and convert types
const handleSave = async (productData) => {
  try {
    // Convert to numbers and validate
    productData.price = parseFloat(productData.price);
    productData.stock_quantity = parseInt(productData.stock_quantity);
    
    if (isNaN(productData.price)) {
      alert("Please enter a valid price");
      return;
    }
    if (isNaN(productData.stock_quantity)) {
      alert("Please enter a valid stock quantity");
      return;
    }

    // Get current user (you'll need to implement this)
    const user = JSON.parse(localStorage.getItem('user'));
    productData.farmer_id = user?.userID || user?.farmer_id || 1; // Fallback to 1 if no user

    const token = localStorage.getItem('token');
    if (selectedProduct) {
      await axios.put(
        `http://localhost:5000/api/products/${selectedProduct.product_id}`,
        productData,
        { headers: { Authorization: `Bearer ${token}` } }
      );
    } else {
      await axios.post(
        'http://localhost:5000/api/products', 
        productData,
        { headers: { Authorization: `Bearer ${token}` } }
      );
    }
    handleClose();
    fetchProducts();
  } catch (error) {
    console.error('Error saving product:', error);
    alert(`Error: ${error.response?.data?.message || error.message}`);
  }
};

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Grid container spacing={3}>
        <Grid item xs={12}>
          <Paper sx={{ p: 2, display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
              <Typography component="h2" variant="h6" color="primary" gutterBottom>
                Products
              </Typography>
              {role !== 'customer' && (
                <Button
                  variant="contained"
                  color="primary"
                  startIcon={<AddIcon />}
                  onClick={handleAddClick}
                >
                  Add Product
                </Button>
              )}
            </div>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Name</TableCell>
                    <TableCell>Price</TableCell>
                    <TableCell>Stock Quantity</TableCell>
                    {role !== 'customer' && (
                      <TableCell>Actions</TableCell>
                    )}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {products.map((product) => (
                    <TableRow key={product.product_id}>
                      <TableCell>{product.name}</TableCell>
                      <TableCell>${product.price}</TableCell>
                      <TableCell>{product.stock_quantity}</TableCell>
                      {role !== 'customer' && (
                        <TableCell>
                          <IconButton
                            color="primary"
                            onClick={() => handleEditClick(product)}
                          >
                            <EditIcon />
                          </IconButton>
                          <IconButton
                            color="error"
                            onClick={() => handleDeleteClick(product.product_id)}
                          >
                            <DeleteIcon />
                          </IconButton>
                        </TableCell>
                      )}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        </Grid>
      </Grid>

      <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
        <DialogTitle>
          {selectedProduct ? 'Edit Product' : 'Add New Product'}
        </DialogTitle>
        <DialogContent>
          <ProductForm
            product={selectedProduct}
            onSave={handleSave}
            onCancel={handleClose}
          />
        </DialogContent>
      </Dialog>
    </Container>
  );
};

export default ProductList;