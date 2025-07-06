import React, { useState, useEffect } from 'react';
import {
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Grid,
  MenuItem,
} from '@mui/material';


const categories = [
  'Seeds',
  'Fertilizers',
  'Pesticides / Herbicides',
  'Tools / Equipments',
  'Machinery',
  'Livestock',
  'Irrigation',
  'Vegetables / Fruits ',
  'Dairy / Eggs',
  'Meat / Poultry',
  'Other'
];

const units = [
  'kg',
  'l',
  'units',
  'heads'
];

function determineUnit(category) {
  const unitMap = {
    'Seeds': 'kg',
    'Fertilizers': 'kg',
    'Pesticides / Herbicides': 'l',
    'Tools / Equipments': 'units',
    'Machinery': 'units',
    'Livestock': 'heads',
    'Irrigation': 'units',
    'Vegetables / Fruits ': 'units',
    'Dairy / Eggs': 'units',
    'Meat / Poultry': 'kg',
    'Other': 'units'
  };
  return unitMap[category] || 'units';
}


const InventoryForm = ({ item, onSave, onCancel }) => {
  const [formData, setFormData] = useState({
    name: '',
    category: '',
    quantity: '',
    unit: 'units',
    threshold: '10',
    description: '',
    price: '0.00'
  });
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (item) {
      setFormData({
        name: item.name || '',
        category: item.category || '',
        quantity: item.quantity?.toString() || '',
        unit: item.unit || determineUnit(item.category),
        threshold: item.threshold?.toString() || '10',
        description: item.description || '',
        price: item.price || 0
      });
    }
  }, [item]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    
    // Clear error when field is edited
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.name.trim()) newErrors.name = 'Name is required';
    if (!formData.category) newErrors.category = 'Category is required';
    
    // Quantity validation
    if (!formData.quantity || isNaN(formData.quantity)) {
      newErrors.quantity = 'Valid quantity is required';
    } else if (Number(formData.quantity) < 0) {
      newErrors.quantity = 'Quantity cannot be negative';
    }
    
    // Threshold validation
    if (!formData.threshold || isNaN(formData.threshold)) {
      newErrors.threshold = 'Valid threshold is required';
    } else if (Number(formData.threshold) < 0) {
      newErrors.threshold = 'Threshold cannot be negative';
    }
    
    // Price validation
    if (!formData.price || isNaN(formData.price)) {
      newErrors.price = 'Valid price is required';
    } else {
      const priceValue = parseFloat(formData.price);
      if (priceValue < 0) {
        newErrors.price = 'Price cannot be negative';
      } else if (priceValue === 0) {
        newErrors.price = 'Price must be greater than zero';
      } else if (!/^\d+(\.\d{1,2})?$/.test(formData.price)) {
        newErrors.price = 'Maximum 2 decimal places allowed';
      }
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    // Convert numbers and prepare payload
    const payload = {
      ...formData,
      quantity: Number(formData.quantity),
      threshold: Number(formData.threshold),
      price: parseFloat(formData.price).toFixed(2) 
    };
    
    onSave(payload);
  };

  return (
    <form onSubmit={handleSubmit}>
      <DialogTitle>
        {item ? 'Edit Inventory Item' : 'Add New Inventory Item'}
      </DialogTitle>
      <DialogContent>
        <Grid container spacing={2} sx={{ mt: 1 }}>
          <Grid item xs={12}>
            <TextField
              required
              fullWidth
              label="Item Name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              error={!!errors.name}
              helperText={errors.name}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              required
              fullWidth
              select
              label="Category"
              name="category"
              value={formData.category}
              onChange={handleChange}
              error={!!errors.category}
              helperText={errors.category}
            >
              {categories.map((category) => (
                <MenuItem key={category} value={category}>
                  {category}
                </MenuItem>
              ))}
            </TextField>
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              required
              fullWidth
              type="number"
              label="Price"
              name="price"
              value={formData.price}
              onChange={handleChange}
              inputProps={{ 
                min: 0.01,
                step: 0.01,
                pattern: "\\d+(\\.\\d{1,2})?" // Ensures up to 2 decimal places
              }}
              error={!!errors.price}
              helperText={errors.price}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              required
              fullWidth
              select
              label="Unit"
              name="unit"
              value={formData.unit}
              onChange={handleChange}
            >
              {units.map((unit) => (
                <MenuItem key={unit} value={unit}>
                  {unit}
                </MenuItem>
              ))}
            </TextField>
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              required
              fullWidth
              type="number"
              label="Quantity"
              name="quantity"
              value={formData.quantity}
              onChange={handleChange}
              inputProps={{ min: 0 }}
              error={!!errors.quantity}
              helperText={errors.quantity}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              required
              fullWidth
              type="number"
              label="Low Stock Threshold"
              name="threshold"
              value={formData.threshold}
              onChange={handleChange}
              inputProps={{ min: 0 }}
              error={!!errors.threshold}
              helperText={errors.threshold}
            />
          </Grid>
          <Grid item xs={12}>
            <TextField
              fullWidth
              multiline
              rows={3}
              label="Description"
              name="description"
              value={formData.description}
              onChange={handleChange}
            />
          </Grid>
        </Grid>
      </DialogContent>
      <DialogActions>
        <Button onClick={onCancel}>Cancel</Button>
        <Button type="submit" variant="contained" color="primary">
          {item ? 'Update' : 'Create'}
        </Button>
      </DialogActions>
    </form>
  );
};

export default InventoryForm;