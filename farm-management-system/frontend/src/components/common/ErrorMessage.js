import React from 'react';
import { Alert, Box } from '@mui/material';

const ErrorMessage = ({ message }) => {
  return (
    <Box sx={{ mt: 2, mb: 2 }}>
      <Alert severity="error">{message}</Alert>
    </Box>
  );
};

export default ErrorMessage;