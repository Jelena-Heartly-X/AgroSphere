create DATABASE farm_management;
-- ==================== TABLES ====================
use farm_management;

show databases;
-- Users table
CREATE TABLE IF NOT EXISTS users (
    user_id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    full_name VARCHAR(100) NOT NULL,
    role ENUM('admin', 'farmer', 'customer') DEFAULT 'customer',
    phone VARCHAR(20),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

ALTER TABLE users 
MODIFY COLUMN role ENUM('admin', 'farmer', 'employee', 'customer') NOT NULL;

-- Products table
CREATE TABLE IF NOT EXISTS products (
    product_id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    category VARCHAR(50),
    price DECIMAL(10,2) NOT NULL,
    stock_quantity INT NOT NULL DEFAULT 0,
    farmer_id INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (farmer_id) REFERENCES users(user_id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- Inventory table
CREATE TABLE IF NOT EXISTS inventory (
    inventory_id INT AUTO_INCREMENT PRIMARY KEY,
    product_id INT NOT NULL,
    quantity INT NOT NULL DEFAULT 0,
    location VARCHAR(100),
    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (product_id) REFERENCES products(product_id) ON DELETE CASCADE
) ENGINE=InnoDB;

ALTER TABLE inventory ADD COLUMN threshold INT DEFAULT 10;

-- Tasks table
CREATE TABLE IF NOT EXISTS tasks (
    task_id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(100) NOT NULL,
    description TEXT,
    due_date DATE NOT NULL,
    status ENUM('pending', 'in_progress', 'completed') DEFAULT 'pending',
    assigned_to INT NOT NULL,
    created_by INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (assigned_to) REFERENCES users(user_id) ON DELETE CASCADE,
    FOREIGN KEY (created_by) REFERENCES users(user_id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- Orders table
CREATE TABLE IF NOT EXISTS orders (
    order_id INT AUTO_INCREMENT PRIMARY KEY,
    customer_id INT NOT NULL,
    total_amount DECIMAL(10,2) NOT NULL,
    status ENUM('pending', 'processing', 'shipped', 'delivered') DEFAULT 'pending',
    payment_status ENUM('pending', 'paid', 'refunded') DEFAULT 'pending',
    delivery_address TEXT,
    order_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (customer_id) REFERENCES users(user_id) ON DELETE CASCADE
) ENGINE=InnoDB;

ALTER TABLE orders ADD COLUMN created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;

-- Order items table
CREATE TABLE IF NOT EXISTS order_items (
    order_item_id INT AUTO_INCREMENT PRIMARY KEY,
    order_id INT NOT NULL,
    product_id INT NOT NULL,
    quantity INT NOT NULL,
    price_at_purchase DECIMAL(10,2) NOT NULL,
    FOREIGN KEY (order_id) REFERENCES orders(order_id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES products(product_id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- Activity Log Table
CREATE TABLE IF NOT EXISTS activity_log (
    log_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT,
    activity_type VARCHAR(50) NOT NULL,
    description TEXT NOT NULL,
    ip_address VARCHAR(45),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
);

-- ================= STORED PROCEDURES =================

DELIMITER //


-- Register User Procedure
CREATE PROCEDURE sp_register_user(
    IN p_username VARCHAR(50),
    IN p_email VARCHAR(100),
    IN p_password VARCHAR(255),
    IN p_full_name VARCHAR(100),
    IN p_role ENUM('admin', 'farmer', 'customer')
)
BEGIN
    INSERT INTO users (username, email, password, full_name, role) VALUES (p_username, p_email, p_password, p_full_name, p_role);
    
    SELECT LAST_INSERT_ID() AS user_id;
END //

-- Get User Profile
CREATE PROCEDURE sp_get_user_profile(IN p_user_id INT)
BEGIN
    SELECT user_id, username, email, full_name, role, phone
    FROM users
    WHERE user_id = p_user_id;
END //

-- Add Product Procedure
CREATE PROCEDURE sp_add_product(
    IN p_name VARCHAR(100),
    IN p_description TEXT,
    IN p_category VARCHAR(50),
    IN p_price DECIMAL(10,2),
    IN p_stock_quantity INT,
    IN p_farmer_id INT
)
BEGIN
    INSERT INTO products (name, description, category, price, stock_quantity, farmer_id)
    VALUES (p_name, p_description, p_category, p_price, p_stock_quantity, p_farmer_id);
    
    -- Insert into inventory
    INSERT INTO inventory (product_id, quantity)
    VALUES (LAST_INSERT_ID(), p_stock_quantity);
    
    SELECT LAST_INSERT_ID() AS product_id;
END //

-- Create Order Procedure
CREATE PROCEDURE sp_create_order(
    IN p_customer_id INT,
    IN p_product_id INT,
    IN p_quantity INT
)
BEGIN
    DECLARE v_price DECIMAL(10,2);
    DECLARE v_total DECIMAL(10,2);
    DECLARE v_order_id INT;

    -- Get product price
    SELECT price INTO v_price 
    FROM products 
    WHERE product_id = p_product_id
    LIMIT 1;

    SET v_total = v_price * p_quantity;

    -- Prevent negative stock
    IF (SELECT stock_quantity FROM products WHERE product_id = p_product_id) >= p_quantity THEN
        -- Create order
        INSERT INTO orders (customer_id, total_amount)
        VALUES (p_customer_id, v_total);

        SET v_order_id = LAST_INSERT_ID();

        -- Add order item
        INSERT INTO order_items (order_id, product_id, quantity, price_at_purchase)
        VALUES (v_order_id, p_product_id, p_quantity, v_price);

        -- Update inventory and product stock
        UPDATE inventory SET quantity = quantity - p_quantity WHERE product_id = p_product_id;
        UPDATE products SET stock_quantity = stock_quantity - p_quantity WHERE product_id = p_product_id;

        SELECT v_order_id AS order_id;
    ELSE
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Not enough stock';
    END IF;
END //

-- Create Task Procedure
CREATE PROCEDURE sp_create_task(
    IN p_title VARCHAR(100),
    IN p_description TEXT,
    IN p_due_date DATE,
    IN p_assigned_to INT,
    IN p_created_by INT
)
BEGIN
    INSERT INTO tasks (title, description, due_date, assigned_to, created_by)
    VALUES (p_title, p_description, p_due_date, p_assigned_to, p_created_by);
    
    SELECT LAST_INSERT_ID() AS task_id;
END //

-- Update Task Status Procedure
CREATE PROCEDURE sp_update_task_status(
    IN p_task_id INT,
    IN p_status ENUM('pending', 'in_progress', 'completed')
)
BEGIN
    UPDATE tasks 
    SET status = p_status
    WHERE task_id = p_task_id;
END //

DELIMITER ;



-- =============== SAMPLE DATA ===============

-- Insert admin user
INSERT INTO users (username, email, password, full_name, role)
VALUES ('admin', 'admin@farm.com', '$2a$12$examplehash', 'Farm Admin', 'admin');

INSERT INTO users (username, email, password, full_name, role)
VALUES ('user1', 'user1@farm.com', 'user1234', 'user_user1', 'customer');


-- Insert sample farmer
INSERT INTO users (username, email, password, full_name, role)
VALUES ('farmer1', 'farmer1@farm.com', '$2a$12$examplehash', 'John Farmer', 'farmer');

-- Insert sample products
CALL sp_add_product('Organic Tomatoes', 'Fresh organic tomatoes', 'Vegetables', 2.99, 100, 2);
CALL sp_add_product('Free-range Eggs', 'Organic free-range eggs', 'Dairy', 4.99, 50, 2);

-- Insert sample task
CALL sp_create_task('Harvest Tomatoes', 'Harvest ripe tomatoes from field 3', '2023-12-15', 2, 1);

-- Insert sample order
CALL sp_create_order(3, 1, 5);  -- Customer buys 5 tomatoes

select * from users;

update users set password='$2a$12$fFuWIW3jbynMyEHniQkQj.QaGQXfaK55Gr9lIVjPmPD06SGhklai.' where username='admin';
use farm_management;

ALTER TABLE orders
ADD COLUMN payment_status ENUM('pending', 'paid', 'refunded') DEFAULT 'pending',
ADD COLUMN delivery_address TEXT;

-- Create activity log table
CREATE TABLE activity_log (
  log_id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT,
  activity_type VARCHAR(50) NOT NULL,
  description TEXT NOT NULL,
  ip_address VARCHAR(45),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(user_id)
);

CREATE TABLE customers (
    customer_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    shipping_address TEXT,
    billing_address TEXT,
    phone_number VARCHAR(20),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
);

-- First, make sure your customers table has all current customers
INSERT INTO customers (user_id, shipping_address, phone_number)
SELECT 
    user_id, 
    '' AS shipping_address,  -- or pull from user profile if available
    phone  -- if exists in users table
FROM users 
WHERE role = 'customer'  -- or whatever identifies customers
AND NOT EXISTS (
    SELECT 1 FROM customers WHERE customers.user_id = users.user_id
);

-- First, add a temporary column to store the original user_id
ALTER TABLE orders ADD COLUMN old_customer_id INT NOT NULL AFTER customer_id;

-- Copy the current customer_id values to the temporary column
UPDATE orders SET old_customer_id = customer_id;

-- Now change customer_id to reference customers table
ALTER TABLE orders 
MODIFY COLUMN customer_id INT NULL,  -- Make nullable temporarily
DROP FOREIGN KEY orders_ibfk_1;  -- Drop the old FK (name may vary)

-- Update the customer_id to point to customers.customer_id
UPDATE orders o
JOIN customers c ON o.old_customer_id = c.user_id
SET o.customer_id = c.customer_id;

-- Now make customer_id non-nullable and add proper FK
ALTER TABLE orders
MODIFY COLUMN customer_id INT NOT NULL,
ADD CONSTRAINT fk_order_customer 
FOREIGN KEY (customer_id) REFERENCES customers(customer_id) ON DELETE RESTRICT;

-- Optionally remove the temporary column
ALTER TABLE orders DROP COLUMN old_customer_id;

ALTER TABLE customers 
ADD COLUMN full_name VARCHAR(100) NOT NULL AFTER user_id;

-- Assuming users table has the name information
UPDATE customers c
JOIN users u ON c.user_id = u.user_id
SET c.full_name = u.full_name; -- or u.name depending on your users table

select * from users;
select * from orders;
select * from customers;
select * from products;
select * from inventory;
select * from tasks;


insert into customers (customer_id,user_id,full_name) values (3,5,'customer1');

describe users;
describe order_items;
describe orders;
describe products;
describe tasks;
describe inventory;
describe customers;

show tables;

SELECT user_id, username, full_name, role 
FROM users 
WHERE role = 'employee';

insert into tasks(task_id,title,description,due_date,status,assigned_to,created_by) values (2,'task 2','description of task 2','2024-11-14','pending',2,1);

SELECT * FROM users WHERE user_id = 5;
SELECT * FROM customers WHERE user_id = 5;

UPDATE customers SET shipping_address = 'Default Shipping Address' 
WHERE shipping_address IS null or shipping_address = '';

ALTER TABLE customers MODIFY shipping_address VARCHAR(255) NOT NULL DEFAULT 'Please update your address';

-- Check existing orders and their customer references
SELECT o.order_id, o.customer_id, u.user_id, c.customer_id
FROM orders o
LEFT JOIN users u ON o.customer_id = u.user_id
LEFT JOIN customers c ON c.user_id = u.user_id;

-- Backup your orders table
CREATE TABLE orders_backup AS SELECT * FROM orders;

-- Add temporary column for correct customer_id
ALTER TABLE orders ADD COLUMN correct_customer_id INT;

-- Update with proper customer_ids
UPDATE orders o
JOIN customers c ON o.customer_id = c.user_id
SET o.correct_customer_id = c.customer_id;

-- Verify the updates
SELECT * FROM orders WHERE correct_customer_id IS NULL;

-- Remove the incorrect foreign key constraint
ALTER TABLE orders DROP FOREIGN KEY orders_ibfk_1;  -- Use SHOW CREATE TABLE orders to find constraint name

show create table orders;
-- Rename columns to avoid confusion
ALTER TABLE orders 
CHANGE COLUMN customer_id wrong_customer_id INT,
CHANGE COLUMN correct_customer_id customer_id INT;

-- Add the correct foreign key
ALTER TABLE orders 
ADD CONSTRAINT fk_orders_customers 
FOREIGN KEY (customer_id) REFERENCES customers(customer_id) ON DELETE CASCADE;

-- Remove the temporary column
ALTER TABLE orders DROP COLUMN wrong_customer_id;

-- Verify the new structure
SHOW CREATE TABLE orders;

DELETE FROM orders WHERE total_amount=14.95;
select * from orders;
select * from order_items;
select * from inventory;
select * from products;
select * from tasks;
select * from users;
select * from customers;

describe products;
describe inventory;
describe tasks;
describe orders;
describe users;
describe order_items;
describe tasks;

use farm_management;
alter table inventory add units varchar(100);
alter table inventory add description varchar(100);
alter table inventory rename column units to unit;
alter table inventory add price decimal(10,2) not NULL;

insert into inventory (inventory_id,product_id,quantity,threshold,unit,description,price) values 
(2,3,30,10,'units','pot org',3),
(4,4,30,10,'units','fresh carrot',4),
(5,5,20,10,'units','fresh apples',3),
(6,12,30,12,'units','prod - desc',40);

insert into tasks (task_id,title,description,due_date,status,assigned_to,created_by) values
(2,'collect goods','at 4pm','2024-08-14','pending',6,1);

SELECT user_id, COALESCE(full_name, username) AS name, email, phone FROM users WHERE role = 'employee';
SELECT user_id FROM users 
WHERE (LOWER(full_name) = LOWER('employee1') OR LOWER(username) = LOWER('employee1')) 
AND role = 'employee' LIMIT 1;


show tables;

--------------------------------------------- TRIGGERS

DELIMITER //
CREATE TRIGGER after_order_item_insert
AFTER INSERT ON order_items
FOR EACH ROW
BEGIN
  UPDATE inventory 
  SET quantity = quantity - NEW.quantity
  WHERE product_id = NEW.product_id;
END //
DELIMITER ;

DELIMITER //
CREATE TRIGGER before_order_item_insert
BEFORE INSERT ON order_items
FOR EACH ROW
BEGIN
  DECLARE current_stock INT;
  SELECT quantity INTO current_stock FROM inventory 
  WHERE product_id = NEW.product_id;
  
  IF current_stock < NEW.quantity THEN
    SIGNAL SQLSTATE '45000'
    SET MESSAGE_TEXT = 'Insufficient stock for this product.';
  END IF;
END //
DELIMITER ;

DELIMITER //
CREATE TRIGGER before_user_role_update
BEFORE UPDATE ON users
FOR EACH ROW
BEGIN
  IF NEW.role NOT IN ('admin', 'employee', 'farmer', 'customer') THEN
    SIGNAL SQLSTATE '45000'
    SET MESSAGE_TEXT = 'Invalid role specified.';
  END IF;
END //
DELIMITER ;

use farm_management;


desc inventory;

