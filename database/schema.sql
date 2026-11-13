-- Create and select the database
CREATE DATABASE IF NOT EXISTS logistics_hub;
USE logistics_hub;

-- Users Table (Authentication & Roles)
CREATE TABLE IF NOT EXISTS users (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    email VARCHAR(100) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    role ENUM('admin', 'dispatcher', 'technician') NOT NULL DEFAULT 'technician',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- Technicians Table (Field Personnel Status)
CREATE TABLE IF NOT EXISTS technicians (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    user_id INT UNSIGNED NOT NULL,
    status ENUM('available', 'dispatched', 'on_site', 'offline') NOT NULL DEFAULT 'offline',
    region VARCHAR(100) NOT NULL,
    INDEX idx_user (user_id),
    CONSTRAINT fk_tech_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- Tickets Table (Service Requests / Dispatch Queue)
CREATE TABLE IF NOT EXISTS tickets (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(150) NOT NULL,
    description TEXT NULL,
    priority ENUM('emergency', 'high', 'normal') NOT NULL DEFAULT 'normal',
    status ENUM('unassigned', 'dispatched', 'en_route', 'on_site', 'resolved', 'closed') NOT NULL DEFAULT 'unassigned',
    assigned_tech_id INT UNSIGNED NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_status (status),
    INDEX idx_priority (priority),
    INDEX idx_assigned_tech (assigned_tech_id),
    CONSTRAINT fk_ticket_tech FOREIGN KEY (assigned_tech_id) REFERENCES technicians(id) ON DELETE SET NULL
) ENGINE=InnoDB;

-- Ticket Logs Table (Activity Audit Trail)
CREATE TABLE IF NOT EXISTS ticket_logs (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    ticket_id INT UNSIGNED NOT NULL,
    user_id INT UNSIGNED NOT NULL,
    old_status VARCHAR(50) NULL,
    new_status VARCHAR(50) NOT NULL,
    notes TEXT NULL,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_ticket (ticket_id),
    INDEX idx_user_log (user_id),
    CONSTRAINT fk_log_ticket FOREIGN KEY (ticket_id) REFERENCES tickets(id) ON DELETE CASCADE,
    CONSTRAINT fk_log_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE RESTRICT
) ENGINE=InnoDB;