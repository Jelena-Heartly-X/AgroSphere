import React from 'react';
import { createRoot } from 'react-dom/client'; // Updated import
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import App from './App';
import theme from './theme';
import { AuthProvider } from './components/auth/AuthContext';

// Step 1: Select the root DOM element
const container = document.getElementById('root');

// Step 2: Create a root with the container
const root = createRoot(container);

// Step 3: Render your app using the new root API
root.render(
  <React.StrictMode>
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AuthProvider>
        <App />
      </AuthProvider>
    </ThemeProvider>
  </React.StrictMode>
);