# AgroSphere: Farm Management System

A full-stack web application built with **React** (frontend), **Node.js** (backend), and **MySQL** (database managed via DBeaver). This system provides separate role-based dashboards for **Admin**, **Farmer**, **Customer**, and **Employee**, making farm operations streamlined, organized, and efficient.

---

## Features

### Authentication
- Sign-up and Login functionality for all users
- Role-based redirection to individual dashboards

---

### Role-Based Dashboards

#### Admin Dashboard
- View and manage all products, inventory, orders, tasks
- View sales overview and revenue charts
- Add/remove users and assign roles

#### Farmer Dashboard
- Add products and manage inventory
- View customer orders related to their products

#### Customer Dashboard
- Browse products
- Place orders
- View order history and details

#### Employee Dashboard
- View assigned orders
- View and update task status

---

## ⚙️ Tech Stack
 ----------------------------------------
| Layer         | Technology             |
|---------------|------------------------|
| Frontend      | React.js               |
| Backend       | Node.js, Express.js    |
| Database      | MySQL (via DBeaver)    |
| Authentication| Custom Role-Based Auth |
 ----------------------------------------

---

## Setup Instructions

### Prerequisites

- Node.js installed
- MySQL installed and configured
- DBeaver (for DB GUI management)
- Visual Studio Code

---

### Backend Setup

```bash
cd backend
npm install
node index.js
```

### Frontend Setup

```bash
cd frontend
npm install
npm start
```

### Database Setup

Import your MySQL schema and tables using DBeaver
Ensure stored procedures for operations like insert/update/select are defined
Example tables: users, products, inventory, orders, tasks

