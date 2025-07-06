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
  CircularProgress,
  Alert
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Warning as WarningIcon,
} from '@mui/icons-material';
import axios from 'axios';
import InventoryForm from './InventoryForm';

const InventoryList = () => {
  const [inventory, setInventory] = useState([]);
  const [open, setOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const role = localStorage.getItem('role');

  useEffect(() => {
    fetchInventory();
  }, []);

  const fetchInventory = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const token = localStorage.getItem('token');
      const response = await axios.get('http://localhost:5000/api/inventory', {
        headers: { Authorization: `Bearer ${token}` },
      });
      setInventory(response.data);
    } catch (error) {
      console.error('Error fetching inventory:', error);
      setError(error.response?.data?.message || 'Failed to load inventory');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddClick = () => {
    setSelectedItem(null);
    setOpen(true);
  };

  const handleEditClick = (item) => {
    setSelectedItem(item);
    setOpen(true);
  };

  const handleDeleteClick = async (itemId) => {
    if (window.confirm('Are you sure you want to delete this item?')) {
      try {
        const token = localStorage.getItem('token');
        await axios.delete(`http://localhost:5000/api/inventory/${itemId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        fetchInventory();
      } catch (error) {
        console.error('Error deleting inventory item:', error);
        alert(error.response?.data?.message || 'Failed to delete item');
      }
    }
  };

  const handleClose = () => {
    setOpen(false);
    setSelectedItem(null);
  };

  const handleSave = async (itemData) => {
    try {
      const token = localStorage.getItem('token');
      const payload = {
        ...itemData,
        quantity: Number(itemData.quantity),
        threshold: Number(itemData.threshold || 10)
      };

      if (selectedItem) {
        // For updates, include the product_id from the selected item
        await axios.put(
          `http://localhost:5000/api/inventory/${selectedItem.inventory_id}`,
          payload,
          { headers: { Authorization: `Bearer ${token}` } }
        );
      } else {
        // For new items
        await axios.post(
          'http://localhost:5000/api/inventory',
          payload,
          { headers: { Authorization: `Bearer ${token}` } }
        );
      }
      handleClose();
      fetchInventory();
    } catch (error) {
      console.error('Error saving inventory:', error);
      alert(error.response?.data?.message || 'Failed to save inventory item');
    }
  };

  const getStockStatus = (quantity, threshold) => {
    if (quantity <= 0) {
      return { label: 'Out of Stock', color: 'error' };
    } else if (quantity <= threshold) {
      return { label: 'Low Stock', color: 'warning' };
    }
    return { label: 'In Stock', color: 'success' };
  };

  const canManageInventory = ['admin', 'farmer'].includes(role);

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Grid container spacing={3}>
        <Grid item xs={12}>
          <Paper sx={{ p: 2, display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
              <Typography component="h2" variant="h6" color="primary" gutterBottom>
                Inventory Management
              </Typography>
              {canManageInventory && (
                <Button
                  variant="contained"
                  color="primary"
                  startIcon={<AddIcon />}
                  onClick={handleAddClick}
                  disabled={isLoading}
                >
                  Add Item
                </Button>
              )}
            </div>

            {error && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {error}
              </Alert>
            )}

            {isLoading ? (
              <CircularProgress sx={{ alignSelf: 'center', my: 4 }} />
            ) : (
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Name</TableCell>
                      <TableCell>Category</TableCell>
                      <TableCell>Quantity</TableCell>
                      <TableCell>Unit</TableCell>
                      <TableCell>Status</TableCell>
                      <TableCell>Last Updated</TableCell>
                      {canManageInventory && <TableCell>Actions</TableCell>}
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {inventory.map((item) => {
                      const status = getStockStatus(item.quantity, item.threshold);
                      return (
                        <TableRow key={item.inventory_id}>
                          <TableCell>{item.name}</TableCell>
                          <TableCell>{item.category}</TableCell>
                          <TableCell>{item.quantity}</TableCell>
                          <TableCell>{item.unit}</TableCell>
                          <TableCell>
                            <Chip
                              label={status.label}
                              color={status.color}
                              size="small"
                              icon={status.color === 'warning' ? <WarningIcon /> : undefined}
                            />
                          </TableCell>
                          <TableCell>
                            {new Date(item.last_updated).toLocaleString()}
                          </TableCell>
                          {canManageInventory && (
                            <TableCell>
                              <IconButton
                                color="primary"
                                onClick={() => handleEditClick(item)}
                              >
                                <EditIcon />
                              </IconButton>
                              <IconButton
                                color="error"
                                onClick={() => handleDeleteClick(item.inventory_id)}
                              >
                                <DeleteIcon />
                              </IconButton>
                            </TableCell>
                          )}
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </Paper>
        </Grid>
      </Grid>

      <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
        <InventoryForm
          item={selectedItem}
          onSave={handleSave}
          onCancel={handleClose}
        />
      </Dialog>
    </Container>
  );
};

export default InventoryList;