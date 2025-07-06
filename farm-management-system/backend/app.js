const express = require('express');
const cors = require('cors');
require('dotenv').config();

// Routes
const authRoutes = require('./src/routes/authRoutes'); // Added
const userRoutes = require('./src/routes/userRoutes');
const productRoutes = require('./src/routes/productRoutes');
const orderRoutes = require('./src/routes/orderRoutes');
const taskRoutes = require('./src/routes/taskRoutes');
const inventoryRoutes = require('./src/routes/inventoryRoutes');
const customerRoutes = require('./src/routes/customerRoutes');
const adminRoutes = require('./src/routes/adminRoutes');
const farmerRoutes = require('./src/routes/farmerRoutes');
const employeeRoutes = require('./src/routes/employeeRoutes');


const app = express();

// Middleware
app.use(cors());
app.use(express.json());
/*app.use((req, res, next) => {
    console.log('Incoming Request:', req.method, req.url);
    console.log('Headers:', req.headers);
    console.log('Body:', req.body);
    next();
  });*/

// Mount Routes
app.use('/api/auth', authRoutes); // Added
app.use('/api/users', userRoutes);
app.use('/api/products', productRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/inventory', inventoryRoutes);
app.use('/api/customers', customerRoutes);
app.use('/api/admin', adminRoutes); 
app.use('/api/farmer', farmerRoutes);
app.use('/api/employee', employeeRoutes);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

