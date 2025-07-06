import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Grid,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
} from '@mui/material';

const OrderDetails = ({ open, order, onClose, onUpdateStatus }) => {
  const role = localStorage.getItem('role');
  const canUpdateStatus = ['admin', 'employee'].includes(role);

  const handleStatusChange = (event) => {
    onUpdateStatus(order.order_id, event.target.value);
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        <Typography variant="h6">
          Order Details - #{order.order_id}
        </Typography>
      </DialogTitle>
      <DialogContent>
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Typography variant="subtitle1" gutterBottom>
              Customer Information
            </Typography>
            <Typography>Name: {order.customer_name || 'Not available'}</Typography>
            <Typography>Email: {order.customer_email || 'Not available'}</Typography>
            <Typography>Phone: {order.customer_phone || 'Not available'}</Typography>
          </Grid>
          <Grid item xs={12} md={6}>
            <Typography variant="subtitle1" gutterBottom>
              Order Information
            </Typography>
            <Typography>
              Date: {new Date(order.created_at).toLocaleDateString()}
            </Typography>
            <Typography>Status: {order.status}</Typography>
            <Typography>Total Amount: ${order.total_amount}</Typography>
          </Grid>
          <Grid item xs={12}>
            <Typography variant="subtitle1" gutterBottom>
              Order Items
            </Typography>
            <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Product</TableCell>
                  <TableCell align="right">Quantity</TableCell>
                  <TableCell align="right">Price</TableCell>
                  <TableCell align="right">Total</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {order.items?.length > 0 ? (
                  order.items.map((item) => (
                    <TableRow key={`${item.product_id}-${item.quantity}`}>
                      <TableCell>{item.product_name}</TableCell>
                      <TableCell align="right">{item.quantity}</TableCell>
                      <TableCell align="right">${item.price_at_purchase}</TableCell>
                      <TableCell align="right">
                        ${(item.quantity * item.price_at_purchase).toFixed(2)}
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={4} align="center">
                      No items found
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
          </Grid>
          {canUpdateStatus && (
            <Grid item xs={12}>
            <FormControl fullWidth>
              <InputLabel>Update Status</InputLabel>
              <Select
                value={order.status}
                label="Update Status"
                onChange={handleStatusChange}
                disabled={!canUpdateStatus}
              >
                <MenuItem value="pending">Pending</MenuItem>
                <MenuItem value="processing">Processing</MenuItem>
                <MenuItem value="shipped">Shipped</MenuItem>
                <MenuItem value="delivered">Delivered</MenuItem>
                <MenuItem value="cancelled">Cancelled</MenuItem>
              </Select>
            </FormControl>
            </Grid>
          )}
        </Grid>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Close</Button>
      </DialogActions>
    </Dialog>
  );
};

export default OrderDetails;