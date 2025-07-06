import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/layout/Layout';
import Login from './components/auth/Login';
import Register from './components/auth/Register';
import AdminDashboard from './components/dashboard/AdminDashboard';
import FarmerDashboard from './components/dashboard/FarmerDashboard';
import EmployeeDashboard from './components/dashboard/EmployeeDashboard';
import CustomerDashboard from './components/dashboard/CustomerDashboard';
import ProductList from './components/products/ProductList';
import OrderList from './components/orders/OrderList';
import CreateOrder from './components/orders/CreateOrder';
import TaskList from './components/tasks/TaskList';
import InventoryList from './components/inventory/InventoryList';
import { AuthProvider } from './components/auth/AuthContext';
import UsersPage from './components/users/UsersPage';
import CustomerProfile from './components/customer/CustomerProfile';

const PrivateRoute = ({ children }) => {
  const token = localStorage.getItem('token');
  console.log('PrivateRoute check - Token exists:', !!token); // Debug 2
  return token ? children : <Navigate to="/login" />;
};

const DashboardRoute = () => {
  const role = localStorage.getItem('role');
  console.log('DashboardRoute - Current role:', role); // Debug 3
  
  switch (role) {
    case 'admin':
      return <AdminDashboard />;
    case 'farmer':
      return <FarmerDashboard />;
    case 'employee':
      return <EmployeeDashboard />;
    case 'customer':
      return <CustomerDashboard />;
    default:
      return <Navigate to="/login" />;
  }
};

const App = () => {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route
            path="/"
            element={
              <PrivateRoute>
                <Layout>
                  <DashboardRoute />
                </Layout>
              </PrivateRoute>
            }
          />
          <Route
            path="/dashboard"
            element={
              <PrivateRoute>
                <Layout>
                  <DashboardRoute />
                </Layout>
              </PrivateRoute>
            }
          />
          <Route
            path="/products"
            element={
              <PrivateRoute>
                <Layout>
                  <ProductList />
                </Layout>
              </PrivateRoute>
            }
          />
          <Route
            path="/users"
            element={
              <PrivateRoute>
                <Layout>
                  <UsersPage />
                </Layout>
              </PrivateRoute>
            }
          />
          <Route
            path="/orders"
            element={
              <PrivateRoute>
                <Layout>
                  <OrderList />
                </Layout>
              </PrivateRoute>
            }
          />
          <Route
            path="/orders/create"
            element={
              <PrivateRoute>
                <Layout>
                  <CreateOrder />
                </Layout>
              </PrivateRoute>
            }
          />
          <Route
            path="/tasks"
            element={
              <PrivateRoute>
                <Layout>
                  <TaskList />
                </Layout>
              </PrivateRoute>
            }
          />
          <Route
            path="/inventory"
            element={
              <PrivateRoute>
                <Layout>
                  <InventoryList />
                </Layout>
              </PrivateRoute>
            }
          />
          <Route path="/profile" element={<CustomerProfile />} />
          {/* Add more routes as needed */}
        </Routes>
      </Router>
    </AuthProvider>
  );
};

export default App;
