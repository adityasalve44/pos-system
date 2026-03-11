-- Restaurant POS – initial schema (v2)
CREATE TABLE restaurants (
  id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  name VARCHAR(255) NOT NULL,
  address TEXT,
  phone VARCHAR(20),
  gst_enabled TINYINT NOT NULL DEFAULT 1,
  gst_type VARCHAR(10) NOT NULL DEFAULT 'GST',
  gst_number VARCHAR(50),
  tax_rate DECIMAL(5,2) NOT NULL DEFAULT 5.00,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE users (
  id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  restaurant_id CHAR(36) NOT NULL,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(255) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  role VARCHAR(20) NOT NULL DEFAULT 'staff',
  is_active TINYINT NOT NULL DEFAULT 1,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_users_restaurant (restaurant_id)
);

CREATE TABLE categories (
  id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  restaurant_id CHAR(36) NOT NULL,
  name VARCHAR(100) NOT NULL,
  sort_order INT NOT NULL DEFAULT 0,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_cats_restaurant (restaurant_id)
);

CREATE TABLE products (
  id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  restaurant_id CHAR(36) NOT NULL,
  name VARCHAR(255) NOT NULL,
  category VARCHAR(100) NOT NULL,
  price DECIMAL(10,2) NOT NULL,
  is_available TINYINT NOT NULL DEFAULT 1,
  sort_order INT NOT NULL DEFAULT 0,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_products_restaurant (restaurant_id, is_available)
);

CREATE TABLE tables (
  id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  restaurant_id CHAR(36) NOT NULL,
  name VARCHAR(50) NOT NULL,
  capacity INT NOT NULL DEFAULT 4,
  status VARCHAR(20) NOT NULL DEFAULT 'available',
  is_deleted TINYINT NOT NULL DEFAULT 0,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_tables_restaurant (restaurant_id, status)
);

CREATE TABLE orders (
  id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  order_number INT NOT NULL DEFAULT 1,
  restaurant_id CHAR(36) NOT NULL,
  table_id CHAR(36),
  order_type VARCHAR(20) NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'open',
  customer_name VARCHAR(100),
  subtotal DECIMAL(10,2) NOT NULL DEFAULT 0,
  tax_amount DECIMAL(10,2) NOT NULL DEFAULT 0,
  total_amount DECIMAL(10,2) NOT NULL DEFAULT 0,
  notes TEXT,
  opened_by CHAR(36) NOT NULL,
  opened_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  billed_at DATETIME,
  closed_at DATETIME,
  INDEX idx_orders_restaurant_status (restaurant_id, status),
  INDEX idx_orders_table (table_id, status),
  INDEX idx_orders_date (restaurant_id, opened_at),
  INDEX idx_orders_number (restaurant_id, order_number)
);

CREATE TABLE order_items (
  id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  order_id CHAR(36) NOT NULL,
  product_id CHAR(36) NOT NULL,
  product_name VARCHAR(255) NOT NULL,
  unit_price DECIMAL(10,2) NOT NULL,
  quantity INT NOT NULL DEFAULT 1,
  line_total DECIMAL(10,2) NOT NULL,
  added_by CHAR(36) NOT NULL,
  added_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_order_items_order (order_id)
);

CREATE TABLE payments (
  id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  order_id CHAR(36) NOT NULL,
  restaurant_id CHAR(36) NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  payment_method VARCHAR(30) NOT NULL,
  reference_no VARCHAR(100),
  recorded_by CHAR(36) NOT NULL,
  recorded_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_payments_restaurant_date (restaurant_id, recorded_at)
);
