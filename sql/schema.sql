-- ============================================================
-- SCIMS DATABASE SETUP — COMBINED SCHEMA + SEED DATA
-- Run this file against a fresh MySQL instance:
--   mysql -u root -p < sql/schema.sql
-- ============================================================

CREATE DATABASE IF NOT EXISTS scims_db
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE scims_db;

-- ============================================================
-- TABLES
-- ============================================================

CREATE TABLE IF NOT EXISTS roles (
    id         BIGINT AUTO_INCREMENT PRIMARY KEY,
    name       VARCHAR(50)  NOT NULL UNIQUE,
    created_at TIMESTAMP    DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS departments (
    id          BIGINT       AUTO_INCREMENT PRIMARY KEY,
    name        VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    is_active   BOOLEAN      DEFAULT TRUE,
    created_at  TIMESTAMP    DEFAULT CURRENT_TIMESTAMP
);

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
    -- Only set for ROLE_SUB_ADMIN users; which department they belong to.
    department_id BIGINT,
    created_at    TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
    updated_at    TIMESTAMP    DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_users_role       FOREIGN KEY (role_id)       REFERENCES roles(id),
    CONSTRAINT fk_users_department FOREIGN KEY (department_id) REFERENCES departments(id)
);

CREATE TABLE IF NOT EXISTS categories (
    id            BIGINT       AUTO_INCREMENT PRIMARY KEY,
    name          VARCHAR(100) NOT NULL UNIQUE,
    description   TEXT,
    is_active     BOOLEAN      DEFAULT TRUE,
    -- Which department this category is routed to. A department can own
    -- many categories.
    department_id BIGINT,
    created_at    TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_categories_department FOREIGN KEY (department_id) REFERENCES departments(id)
);

CREATE TABLE IF NOT EXISTS complaints (
    id            BIGINT AUTO_INCREMENT PRIMARY KEY,
    title         VARCHAR(200) NOT NULL,
    description   TEXT         NOT NULL,
    location      VARCHAR(255) NOT NULL,
    latitude      DOUBLE,
    longitude     DOUBLE,
    gps_accuracy  DOUBLE COMMENT 'Accuracy radius in metres from browser Geolocation API',
    status        ENUM('PENDING','IN_PROGRESS','RESOLVED','REJECTED','CLOSED')
                               DEFAULT 'PENDING',
    priority      ENUM('LOW','MEDIUM','HIGH','URGENT')
                               DEFAULT 'MEDIUM',
    user_id       BIGINT       NOT NULL,
    category_id   BIGINT       NOT NULL,
    -- Denormalized from category.department_id at creation time so it
    -- stays fixed even if the category later moves to another department.
    department_id BIGINT,
    assigned_to   BIGINT,
    admin_remarks TEXT,
    created_at    TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
    updated_at    TIMESTAMP    DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    resolved_at   TIMESTAMP    NULL,
    CONSTRAINT fk_complaints_user       FOREIGN KEY (user_id)       REFERENCES users(id),
    CONSTRAINT fk_complaints_category   FOREIGN KEY (category_id)   REFERENCES categories(id),
    CONSTRAINT fk_complaints_department FOREIGN KEY (department_id) REFERENCES departments(id),
    CONSTRAINT fk_complaints_assigned   FOREIGN KEY (assigned_to)   REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS complaint_images (
    id            BIGINT AUTO_INCREMENT PRIMARY KEY,
    complaint_id  BIGINT        NOT NULL,
    image_path    VARCHAR(500)  NOT NULL,
    original_name VARCHAR(255),
    uploaded_at   TIMESTAMP     DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_images_complaint
        FOREIGN KEY (complaint_id) REFERENCES complaints(id) ON DELETE CASCADE
);

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
CREATE INDEX IF NOT EXISTS idx_complaints_user          ON complaints(user_id);
CREATE INDEX IF NOT EXISTS idx_complaints_status        ON complaints(status);
CREATE INDEX IF NOT EXISTS idx_complaints_category      ON complaints(category_id);
CREATE INDEX IF NOT EXISTS idx_complaints_department    ON complaints(department_id);
CREATE INDEX IF NOT EXISTS idx_categories_department    ON categories(department_id);
CREATE INDEX IF NOT EXISTS idx_users_department          ON users(department_id);
CREATE INDEX IF NOT EXISTS idx_status_history_complaint ON status_history(complaint_id);

-- ============================================================
-- SEED DATA
-- ============================================================

-- ROLE_ADMIN = Super Admin (one, created below).
-- ROLE_SUB_ADMIN = department-scoped admin (unlimited per department).
-- ROLE_CITIZEN = unlimited citizen accounts.
INSERT IGNORE INTO roles (name) VALUES ('ROLE_ADMIN'), ('ROLE_SUB_ADMIN'), ('ROLE_CITIZEN');

-- Departments are a broader grouping than categories — one department
-- can own several categories (e.g. Sanitation Department owns Garbage,
-- Drainage, and Illegal Dumping). Add more departments any time via the
-- Admin UI or another INSERT here; no code changes required.
INSERT IGNORE INTO departments (name, description, is_active) VALUES
('Roads Department',         'Road surfaces, potholes, road-related infrastructure', TRUE),
('Water Department',         'Water supply, leakage, pipe bursts',                    TRUE),
('Electricity Department',   'Streetlights and public electrical infrastructure',     TRUE),
('Sanitation Department',    'Garbage collection, illegal dumping, drainage',         TRUE),
('Public Safety Department', 'General public safety and miscellaneous issues',        TRUE);

INSERT IGNORE INTO categories (name, description, is_active, department_id) VALUES
('Road Damage',     'Potholes, cracks, broken road surfaces',                TRUE, (SELECT id FROM departments WHERE name = 'Roads Department')),
('Garbage',         'Uncollected garbage, overflowing bins',                 TRUE, (SELECT id FROM departments WHERE name = 'Sanitation Department')),
('Water Leakage',   'Pipe bursts, water wastage, leaking mains',             TRUE, (SELECT id FROM departments WHERE name = 'Water Department')),
('Streetlight',     'Non-functional or damaged street lights',               TRUE, (SELECT id FROM departments WHERE name = 'Electricity Department')),
('Drainage',        'Blocked drains, flooding, sewage overflow',             TRUE, (SELECT id FROM departments WHERE name = 'Sanitation Department')),
('Public Safety',   'Hazardous conditions, safety concerns in public areas', TRUE, (SELECT id FROM departments WHERE name = 'Public Safety Department')),
('Illegal Dumping', 'Unauthorized waste disposal in public areas',           TRUE, (SELECT id FROM departments WHERE name = 'Sanitation Department')),
('Other',           'Issues not covered by existing categories',             TRUE, (SELECT id FROM departments WHERE name = 'Public Safety Department'));

-- Super Admin  (password: Admin@123) — there is exactly one.
INSERT IGNORE INTO users (full_name, email, password, phone, address, is_active, role_id)
VALUES (
  'System Admin', 'admin@scims.com',
  '$2a$12$GBq.K7e6wMPRFUl0ekBOdOeMv7wePBlb8aTJ.qG2YD5T6rBPu7Hqy',
  '9000000001', 'City Hall, Main Street', TRUE,
  (SELECT id FROM roles WHERE name = 'ROLE_ADMIN')
);

-- Sample Sub Admins, one per starter department (password for all: Citizen@123 —
-- reuses the existing demo citizen hash below; see README for why). Add more
-- Sub Admins per department (5+, as needed) via the Admin > Sub Admins UI or
-- by copying one of these INSERTs with a different email.
INSERT IGNORE INTO users (full_name, email, password, phone, address, is_active, role_id, department_id)
VALUES
('Road Admin 1', 'road.admin1@scims.com',
  '$2a$12$w8r7ZyS5k0.YKvCMhEcHxOHG9mEXvT.LJ2fj./IEBhbFWm2JXXS36',
  '9000001001', 'Roads Department Office', TRUE,
  (SELECT id FROM roles WHERE name = 'ROLE_SUB_ADMIN'),
  (SELECT id FROM departments WHERE name = 'Roads Department')),
('Water Admin 1', 'water.admin1@scims.com',
  '$2a$12$w8r7ZyS5k0.YKvCMhEcHxOHG9mEXvT.LJ2fj./IEBhbFWm2JXXS36',
  '9000001002', 'Water Department Office', TRUE,
  (SELECT id FROM roles WHERE name = 'ROLE_SUB_ADMIN'),
  (SELECT id FROM departments WHERE name = 'Water Department')),
('Electricity Admin 1', 'electricity.admin1@scims.com',
  '$2a$12$w8r7ZyS5k0.YKvCMhEcHxOHG9mEXvT.LJ2fj./IEBhbFWm2JXXS36',
  '9000001003', 'Electricity Department Office', TRUE,
  (SELECT id FROM roles WHERE name = 'ROLE_SUB_ADMIN'),
  (SELECT id FROM departments WHERE name = 'Electricity Department')),
('Sanitation Admin 1', 'sanitation.admin1@scims.com',
  '$2a$12$w8r7ZyS5k0.YKvCMhEcHxOHG9mEXvT.LJ2fj./IEBhbFWm2JXXS36',
  '9000001004', 'Sanitation Department Office', TRUE,
  (SELECT id FROM roles WHERE name = 'ROLE_SUB_ADMIN'),
  (SELECT id FROM departments WHERE name = 'Sanitation Department'));

-- Citizen users  (password: Citizen@123)
INSERT IGNORE INTO users (full_name, email, password, phone, address, is_active, role_id)
VALUES
(
  'John Citizen', 'john@example.com',
  '$2a$12$w8r7ZyS5k0.YKvCMhEcHxOHG9mEXvT.LJ2fj./IEBhbFWm2JXXS36',
  '9000000002', '12 Park Avenue, Downtown', TRUE,
  (SELECT id FROM roles WHERE name = 'ROLE_CITIZEN')
),
(
  'Jane Doe', 'jane@example.com',
  '$2a$12$w8r7ZyS5k0.YKvCMhEcHxOHG9mEXvT.LJ2fj./IEBhbFWm2JXXS36',
  '9000000003', '45 Oak Street, Uptown', TRUE,
  (SELECT id FROM roles WHERE name = 'ROLE_CITIZEN')
);

INSERT IGNORE INTO complaints
    (title, description, location, status, priority, user_id, category_id, department_id, admin_remarks)
VALUES
(
  'Large pothole on Main St',
  'Dangerous pothole near the junction of Main St and 2nd Ave causing accidents.',
  'Main St & 2nd Ave Junction', 'IN_PROGRESS', 'HIGH',
  (SELECT id FROM users WHERE email = 'john@example.com'),
  (SELECT id FROM categories WHERE name = 'Road Damage'),
  (SELECT id FROM departments WHERE name = 'Roads Department'),
  'Team dispatched for assessment'
),
(
  'Overflowing garbage bin near park',
  'The garbage bin near the park entrance has been overflowing for 3 days.',
  'Central Park Entrance', 'PENDING', 'MEDIUM',
  (SELECT id FROM users WHERE email = 'jane@example.com'),
  (SELECT id FROM categories WHERE name = 'Garbage'),
  (SELECT id FROM departments WHERE name = 'Sanitation Department'),
  NULL
),
(
  'Street lights not working on Oak Street',
  'Two streetlights on Oak Street are non-functional, making the area dangerous at night.',
  'Oak Street, Block 4', 'RESOLVED', 'MEDIUM',
  (SELECT id FROM users WHERE email = 'john@example.com'),
  (SELECT id FROM categories WHERE name = 'Streetlight'),
  (SELECT id FROM departments WHERE name = 'Electricity Department'),
  'Bulbs replaced, issue resolved'
),
(
  'Water pipe burst near City School',
  'A main water pipe has burst near the school, wasting large amounts of water.',
  'Near City School, Elm Road', 'PENDING', 'URGENT',
  (SELECT id FROM users WHERE email = 'jane@example.com'),
  (SELECT id FROM categories WHERE name = 'Water Leakage'),
  (SELECT id FROM departments WHERE name = 'Water Department'),
  NULL
);

-- Initial PENDING status history entries (simulate citizen submissions)
INSERT IGNORE INTO status_history (complaint_id, old_status, new_status, changed_by, remarks)
VALUES
(
  (SELECT id FROM complaints WHERE title = 'Large pothole on Main St'),
  NULL, 'PENDING',
  (SELECT id FROM users WHERE email = 'john@example.com'),
  'Complaint submitted by citizen'
),
(
  (SELECT id FROM complaints WHERE title = 'Overflowing garbage bin near park'),
  NULL, 'PENDING',
  (SELECT id FROM users WHERE email = 'jane@example.com'),
  'Complaint submitted by citizen'
),
(
  (SELECT id FROM complaints WHERE title = 'Street lights not working on Oak Street'),
  NULL, 'PENDING',
  (SELECT id FROM users WHERE email = 'john@example.com'),
  'Complaint submitted by citizen'
),
(
  (SELECT id FROM complaints WHERE title = 'Water pipe burst near City School'),
  NULL, 'PENDING',
  (SELECT id FROM users WHERE email = 'jane@example.com'),
  'Complaint submitted by citizen'
);

-- Admin status transitions
INSERT IGNORE INTO status_history (complaint_id, old_status, new_status, changed_by, remarks)
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

-- Set resolved_at for the resolved complaint
UPDATE complaints
SET resolved_at = NOW()
WHERE title  = 'Street lights not working on Oak Street'
  AND status = 'RESOLVED'
  AND resolved_at IS NULL;
