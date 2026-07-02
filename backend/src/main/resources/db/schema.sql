-- ============================================================
-- SCIMS DATABASE SCHEMA
-- All statements use IF NOT EXISTS so they are idempotent.
-- Run this file once against a fresh MySQL instance:
--   mysql -u root -p < sql/schema.sql
-- Or set spring.sql.init.mode=always on first startup.
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
-- TABLE: departments
-- ============================================================
CREATE TABLE IF NOT EXISTS departments (
    id          BIGINT       AUTO_INCREMENT PRIMARY KEY,
    name        VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    is_active   BOOLEAN      DEFAULT TRUE,
    created_at  TIMESTAMP    DEFAULT CURRENT_TIMESTAMP
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
    -- Only set for ROLE_SUB_ADMIN users; which department they belong to.
    department_id BIGINT,
    created_at    TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
    updated_at    TIMESTAMP    DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_users_role       FOREIGN KEY (role_id)       REFERENCES roles(id),
    CONSTRAINT fk_users_department FOREIGN KEY (department_id) REFERENCES departments(id)
);

-- ============================================================
-- TABLE: categories
-- ============================================================
CREATE TABLE IF NOT EXISTS categories (
    id            BIGINT       AUTO_INCREMENT PRIMARY KEY,
    name          VARCHAR(100) NOT NULL UNIQUE,
    description   TEXT,
    is_active     BOOLEAN      DEFAULT TRUE,
    -- Which department this category is routed to.
    department_id BIGINT,
    created_at    TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_categories_department FOREIGN KEY (department_id) REFERENCES departments(id)
);

-- ============================================================
-- TABLE: complaints
-- ============================================================
CREATE TABLE IF NOT EXISTS complaints (
    id            BIGINT AUTO_INCREMENT PRIMARY KEY,
    title         VARCHAR(200) NOT NULL,
    description   TEXT         NOT NULL,
    location      VARCHAR(255) NOT NULL,
    -- GPS coordinates from browser Geolocation API (null when permission denied)
    latitude      DOUBLE,
    longitude     DOUBLE,
    gps_accuracy  DOUBLE COMMENT 'Accuracy radius in metres (95th percentile)',
    status        ENUM('PENDING','IN_PROGRESS','RESOLVED','REJECTED','CLOSED')
                               DEFAULT 'PENDING',
    priority      ENUM('LOW','MEDIUM','HIGH','URGENT')
                               DEFAULT 'MEDIUM',
    user_id       BIGINT       NOT NULL,
    category_id   BIGINT       NOT NULL,
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
CREATE INDEX IF NOT EXISTS idx_complaints_user     ON complaints(user_id);
CREATE INDEX IF NOT EXISTS idx_complaints_status   ON complaints(status);
CREATE INDEX IF NOT EXISTS idx_complaints_category ON complaints(category_id);
CREATE INDEX IF NOT EXISTS idx_complaints_department ON complaints(department_id);
CREATE INDEX IF NOT EXISTS idx_categories_department ON categories(department_id);
CREATE INDEX IF NOT EXISTS idx_users_department       ON users(department_id);
CREATE INDEX IF NOT EXISTS idx_status_history_complaint ON status_history(complaint_id);
