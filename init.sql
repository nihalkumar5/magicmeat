-- MagicMeat Database Schema
-- Run this in your phpMyAdmin SQL tab

-- 1. Categories Table
CREATE TABLE IF NOT EXISTS categories (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(100),
    icon VARCHAR(100)
);

-- 2. Products Table
CREATE TABLE IF NOT EXISTS products (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(255),
    category VARCHAR(50),
    price DECIMAL(10, 2),
    mrp DECIMAL(10, 2),
    unit VARCHAR(50),
    emoji VARCHAR(10),
    image VARCHAR(255),
    stock INT DEFAULT 0,
    description TEXT,
    rating DECIMAL(3, 1) DEFAULT 4.7,
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 3. Orders Table
CREATE TABLE IF NOT EXISTS orders (
    id VARCHAR(50) PRIMARY KEY,
    customerName VARCHAR(255),
    phone VARCHAR(20),
    address TEXT,
    total DECIMAL(10, 2),
    items TEXT,
    status VARCHAR(50) DEFAULT 'placed',
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 4. Offers Table
CREATE TABLE IF NOT EXISTS offers (
    id INT AUTO_INCREMENT PRIMARY KEY,
    tag VARCHAR(50),
    title VARCHAR(100),
    subtext VARCHAR(255),
    code VARCHAR(50),
    color VARCHAR(20),
    emoji VARCHAR(10),
    image VARCHAR(255)
);

-- 5. Testimonials Table
CREATE TABLE IF NOT EXISTS testimonials (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100),
    text TEXT,
    rating INT DEFAULT 5
);

-- Initial Categories
INSERT IGNORE INTO categories (id, name, icon) VALUES 
('chicken', 'Chicken', '🍗'),
('mutton', 'Mutton', '🥩'),
('fish', 'Fish', '🐟'),
('eggs', 'Eggs', '🥚'),
('grocery', 'Grocery', '🥬'),
('veggies', 'Vegetables', '🥬'),
('dairy', 'Dairy', '🧈'),
('frozen', 'Frozen', '❄️');
