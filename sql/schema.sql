-- ============================================================
-- SMART COMMUNITY ISSUE MANAGEMENT SYSTEM - DATABASE SCHEMA
-- Version 1.1 — Fixed fragile hardcoded-ID inserts
-- ============================================================

CREATE DATABASE IF NOT EXISTS scims_db
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE scims_db;

-- ============================================================
-- TABLE: roles
-- ============================================================
CREATE TABLE IF NOT EXISTS roles (
    id         BIGINT AUTO_INCREMENT PRIMARY KEY,
    name       VARCHAR(50)  NOT NULL UNIQUE,
    created_at TIMESTAMP    DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================
-- TABLE: users
-- ============================================================
CREATE TABLE IF NOT EXISTS users (
    id            BIGINT       AUTO_INCREMENT PRIMARY KEY,
    full_name     VARCHAR(100) NOT NULL,
    email         VARCHAR(150) NOT NULL UNIQUE,
    password      VARCHAR(255) NOT NULL,
    phone         VARCHAR(20),
    address       TEXT,
    profile_image VARCHAR(255),
    is_active     BOOLEAN      DEFAULT TRUE,
    role_id       BIGINT       NOT NULL,
    created_at    TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
    updated_at    TIMESTAMP    DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_users_role FOREIGN KEY (role_id) REFERENCES roles(id)
);

-- ============================================================
-- TABLE: categories
-- ============================================================
CREATE TABLE IF NOT EXISTS categories (
    id          BIGINT       AUTO_INCREMENT PRIMARY KEY,
    name        VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    is_active   BOOLEAN      DEFAULT TRUE,
    created_at  TIMESTAMP    DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================
-- TABLE: complaints
-- ============================================================
CREATE TABLE IF NOT EXISTS complaints (
    id           BIGINT AUTO_INCREMENT PRIMARY KEY,
    title        VARCHAR(200) NOT NULL,
    description  TEXT         NOT NULL,
    location     VARCHAR(255) NOT NULL,
    status       ENUM('PENDING','IN_PROGRESS','RESOLVED','REJECTED','CLOSED')
                              DEFAULT 'PENDING',
    priority     ENUM('LOW','MEDIUM','HIGH','URGENT')
                              DEFAULT 'MEDIUM',
    user_id      BIGINT       NOT NULL,
    category_id  BIGINT       NOT NULL,
    assigned_to  BIGINT,
    admin_remarks TEXT,
    created_at   TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
    updated_at   TIMESTAMP    DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    resolved_at  TIMESTAMP    NULL,
    CONSTRAINT fk_complaints_user     FOREIGN KEY (user_id)     REFERENCES users(id),
    CONSTRAINT fk_complaints_category FOREIGN KEY (category_id) REFERENCES categories(id),
    CONSTRAINT fk_complaints_assigned FOREIGN KEY (assigned_to) REFERENCES users(id)
);

-- ============================================================
-- TABLE: complaint_images
-- ============================================================
CREATE TABLE IF NOT EXISTS complaint_images (
    id            BIGINT AUTO_INCREMENT PRIMARY KEY,
    complaint_id  BIGINT        NOT NULL,
    image_path    VARCHAR(500)  NOT NULL,
    original_name VARCHAR(255),
    uploaded_at   TIMESTAMP     DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_images_complaint
        FOREIGN KEY (complaint_id) REFERENCES complaints(id) ON DELETE CASCADE
);

-- ============================================================
-- TABLE: status_history
-- ============================================================
CREATE TABLE IF NOT EXISTS status_history (
    id           BIGINT AUTO_INCREMENT PRIMARY KEY,
    complaint_id BIGINT       NOT NULL,
    old_status   VARCHAR(50),
    new_status   VARCHAR(50)  NOT NULL,
    changed_by   BIGINT       NOT NULL,
    remarks      TEXT,
    changed_at   TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_history_complaint
        FOREIGN KEY (complaint_id) REFERENCES complaints(id) ON DELETE CASCADE,
    CONSTRAINT fk_history_user
        FOREIGN KEY (changed_by)   REFERENCES users(id)
);

-- ============================================================
-- INDEXES
-- ============================================================
CREATE INDEX idx_complaints_user     ON complaints(user_id);
CREATE INDEX idx_complaints_status   ON complaints(status);
CREATE INDEX idx_complaints_category ON complaints(category_id);
CREATE INDEX idx_status_history_complaint ON status_history(complaint_id);

-- ============================================================
-- SEED DATA
-- ============================================================

-- Roles
INSERT INTO roles (name) VALUES ('ROLE_ADMIN'), ('ROLE_CITIZEN');

-- Categories
INSERT INTO categories (name, description, is_active) VALUES
('Road Damage',       'Potholes, cracks, broken road surfaces',               TRUE),
('Garbage',           'Uncollected garbage, overflowing bins',                TRUE),
('Water Leakage',     'Pipe bursts, water wastage, leaking mains',            TRUE),
('Streetlight',       'Non-functional or damaged street lights',              TRUE),
('Drainage',          'Blocked drains, flooding, sewage overflow',            TRUE),
('Public Safety',     'Hazardous conditions, safety concerns in public areas',TRUE),
('Illegal Dumping',   'Unauthorized waste disposal in public areas',          TRUE),
('Other',             'Issues not covered by existing categories',            TRUE);

-- Admin user  (password: Admin@123)
INSERT INTO users (full_name, email, password, phone, address, is_active, role_id)
VALUES (
  'System Admin',
  'admin@scims.com',
  '$2a$12$GBq.K7e6wMPRFUl0ekBOdOeMv7wePBlb8aTJ.qG2YD5T6rBPu7Hqy',
  '9000000001',
  'City Hall, Main Street',
  TRUE,
  (SELECT id FROM roles WHERE name = 'ROLE_ADMIN')
);

-- Citizen users  (password: Citizen@123)
INSERT INTO users (full_name, email, password, phone, address, is_active, role_id)
VALUES
(
  'John Citizen',
  'john@example.com',
  '$2a$12$w8r7ZyS5k0.YKvCMhEcHxOHG9mEXvT.LJ2fj./IEBhbFWm2JXXS36',
  '9000000002',
  '12 Park Avenue, Downtown',
  TRUE,
  (SELECT id FROM roles WHERE name = 'ROLE_CITIZEN')
),
(
  'Jane Doe',
  'jane@example.com',
  '$2a$12$w8r7ZyS5k0.YKvCMhEcHxOHG9mEXvT.LJ2fj./IEBhbFWm2JXXS36',
  '9000000003',
  '45 Oak Street, Uptown',
  TRUE,
  (SELECT id FROM roles WHERE name = 'ROLE_CITIZEN')
);

-- Sample complaints
-- FIX: Use subqueries instead of hardcoded IDs so inserts are order-independent
INSERT INTO complaints
    (title, description, location, status, priority, user_id, category_id, admin_remarks)
VALUES
(
  'Large pothole on Main St',
  'Dangerous pothole near the junction of Main St and 2nd Ave causing accidents.',
  'Main St & 2nd Ave Junction',
  'IN_PROGRESS', 'HIGH',
  (SELECT id FROM users      WHERE email = 'john@example.com'),
  (SELECT id FROM categories WHERE name  = 'Road Damage'),
  'Team dispatched for assessment'
),
(
  'Overflowing garbage bin near park',
  'The garbage bin near the park entrance has been overflowing for 3 days.',
  'Central Park Entrance',
  'PENDING', 'MEDIUM',
  (SELECT id FROM users      WHERE email = 'jane@example.com'),
  (SELECT id FROM categories WHERE name  = 'Garbage'),
  NULL
),
(
  'Street lights not working on Oak Street',
  'Two streetlights on Oak Street are non-functional, making the area dangerous at night.',
  'Oak Street, Block 4',
  'RESOLVED', 'MEDIUM',
  (SELECT id FROM users      WHERE email = 'john@example.com'),
  (SELECT id FROM categories WHERE name  = 'Streetlight'),
  'Bulbs replaced, issue resolved'
),
(
  'Water pipe burst near City School',
  'A main water pipe has burst near the school, wasting large amounts of water.',
  'Near City School, Elm Road',
  'PENDING', 'URGENT',
  (SELECT id FROM users      WHERE email = 'jane@example.com'),
  (SELECT id FROM categories WHERE name  = 'Water Leakage'),
  NULL
);

-- Status history
-- FIX: Use subqueries for all IDs so there are no hardcoded assumptions
INSERT INTO status_history
    (complaint_id, old_status, new_status, changed_by, remarks)
VALUES
(
  (SELECT id FROM complaints WHERE title = 'Large pothole on Main St'),
  'PENDING', 'IN_PROGRESS',
  (SELECT id FROM users WHERE email = 'admin@scims.com'),
  'Assigned to road repair team'
),
(
  (SELECT id FROM complaints WHERE title = 'Street lights not working on Oak Street'),
  'PENDING', 'IN_PROGRESS',
  (SELECT id FROM users WHERE email = 'admin@scims.com'),
  'Electrician assigned'
),
(
  (SELECT id FROM complaints WHERE title = 'Street lights not working on Oak Street'),
  'IN_PROGRESS', 'RESOLVED',
  (SELECT id FROM users WHERE email = 'admin@scims.com'),
  'Work completed successfully'
);

-- Update resolved_at for the resolved complaint
UPDATE complaints
SET resolved_at = NOW()
WHERE title = 'Street lights not working on Oak Street'
  AND status  = 'RESOLVED';
