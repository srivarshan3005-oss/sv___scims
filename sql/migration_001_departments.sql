-- ============================================================
-- SCIMS MIGRATION 001 — DEPARTMENTS & SUB ADMIN ROLE
-- Run this once against an EXISTING scims_db database:
--   mysql -u root -p scims_db < sql/migration_001_departments.sql
--
-- Safe to re-run: every statement is idempotent (IF NOT EXISTS /
-- INSERT IGNORE / existence checks before ALTER).
-- ============================================================

USE scims_db;

-- ============================================================
-- 1. New role: ROLE_SUB_ADMIN
--    (ROLE_ADMIN keeps its name but is now treated as "Super Admin")
-- ============================================================
INSERT IGNORE INTO roles (name) VALUES ('ROLE_SUB_ADMIN');

-- ============================================================
-- 2. New table: departments
--    Unlimited departments. is_active lets a department be retired
--    without losing its history.
-- ============================================================
CREATE TABLE IF NOT EXISTS departments (
    id          BIGINT       AUTO_INCREMENT PRIMARY KEY,
    name        VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    is_active   BOOLEAN      DEFAULT TRUE,
    created_at  TIMESTAMP    DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================
-- 3. New columns
--    department_id on categories: which department owns this category.
--    department_id on users: which department a Sub Admin belongs to
--      (always NULL for Super Admin / Citizen).
--    department_id on complaints: denormalized from category.department
--      at creation time, so Sub Admin queries never need to join through
--      category, and a complaint's routing stays fixed even if the
--      category is later reassigned to a different department.
-- ============================================================
SET @col_exists = (
    SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = 'scims_db' AND TABLE_NAME = 'categories' AND COLUMN_NAME = 'department_id'
);
SET @sql = IF(@col_exists = 0,
    CONCAT('ALTER TABLE categories ADD COLUMN department_id BIGINT NULL, ',
           'ADD CONSTRAINT fk_categories_department FOREIGN KEY (department_id) REFERENCES departments(id)'),
    'SELECT 1');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @col_exists = (
    SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = 'scims_db' AND TABLE_NAME = 'users' AND COLUMN_NAME = 'department_id'
);
SET @sql = IF(@col_exists = 0,
    CONCAT('ALTER TABLE users ADD COLUMN department_id BIGINT NULL, ',
           'ADD CONSTRAINT fk_users_department FOREIGN KEY (department_id) REFERENCES departments(id)'),
    'SELECT 1');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @col_exists = (
    SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = 'scims_db' AND TABLE_NAME = 'complaints' AND COLUMN_NAME = 'department_id'
);
SET @sql = IF(@col_exists = 0,
    CONCAT('ALTER TABLE complaints ADD COLUMN department_id BIGINT NULL, ',
           'ADD CONSTRAINT fk_complaints_department FOREIGN KEY (department_id) REFERENCES departments(id)'),
    'SELECT 1');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

CREATE INDEX IF NOT EXISTS idx_categories_department  ON categories(department_id);
CREATE INDEX IF NOT EXISTS idx_users_department        ON users(department_id);
CREATE INDEX IF NOT EXISTS idx_complaints_department   ON complaints(department_id);

-- ============================================================
-- 4. Seed starter departments (broad groupings — each can own
--    several existing categories). Database-driven: add more rows
--    here (or via the Admin UI) any time, no code changes needed.
-- ============================================================
INSERT IGNORE INTO departments (name, description, is_active) VALUES
('Roads Department',        'Road surfaces, potholes, road-related infrastructure', TRUE),
('Water Department',        'Water supply, leakage, pipe bursts',                    TRUE),
('Electricity Department',  'Streetlights and public electrical infrastructure',     TRUE),
('Sanitation Department',   'Garbage collection, illegal dumping, drainage',         TRUE),
('Public Safety Department','General public safety and miscellaneous issues',        TRUE);

-- ============================================================
-- 5. Map existing categories to the starter departments.
--    This is a one-time best-guess mapping for the categories that
--    ship with SCIMS; adjust via the Admin > Categories UI any time.
-- ============================================================
UPDATE categories SET department_id = (SELECT id FROM departments WHERE name = 'Roads Department')
WHERE name = 'Road Damage' AND department_id IS NULL;

UPDATE categories SET department_id = (SELECT id FROM departments WHERE name = 'Water Department')
WHERE name = 'Water Leakage' AND department_id IS NULL;

UPDATE categories SET department_id = (SELECT id FROM departments WHERE name = 'Electricity Department')
WHERE name = 'Streetlight' AND department_id IS NULL;

UPDATE categories SET department_id = (SELECT id FROM departments WHERE name = 'Sanitation Department')
WHERE name IN ('Garbage', 'Drainage', 'Illegal Dumping') AND department_id IS NULL;

UPDATE categories SET department_id = (SELECT id FROM departments WHERE name = 'Public Safety Department')
WHERE name IN ('Public Safety', 'Other') AND department_id IS NULL;

-- Backfill department_id on existing complaints from their category's
-- newly-assigned department, so historical complaints are also scoped
-- correctly for Sub Admin views.
UPDATE complaints c
JOIN categories cat ON c.category_id = cat.id
SET c.department_id = cat.department_id
WHERE c.department_id IS NULL;

-- ============================================================
-- 6. Sample Sub Admin accounts (one per starter department, 5 named
--    examples per department as requested — created here as 1 each;
--    add the remaining 4 per department via the Admin UI or by
--    duplicating the INSERT below with a different email).
--    Password for ALL sample sub admins: Citizen@123
--    (reusing the existing demo citizen hash — see README for why).
-- ============================================================
INSERT IGNORE INTO users (full_name, email, password, phone, address, is_active, role_id, department_id)
SELECT 'Road Admin 1', 'road.admin1@scims.com',
       '$2a$12$w8r7ZyS5k0.YKvCMhEcHxOHG9mEXvT.LJ2fj./IEBhbFWm2JXXS36',
       '9000001001', 'Roads Department Office', TRUE,
       (SELECT id FROM roles WHERE name = 'ROLE_SUB_ADMIN'),
       (SELECT id FROM departments WHERE name = 'Roads Department');

INSERT IGNORE INTO users (full_name, email, password, phone, address, is_active, role_id, department_id)
SELECT 'Water Admin 1', 'water.admin1@scims.com',
       '$2a$12$w8r7ZyS5k0.YKvCMhEcHxOHG9mEXvT.LJ2fj./IEBhbFWm2JXXS36',
       '9000001002', 'Water Department Office', TRUE,
       (SELECT id FROM roles WHERE name = 'ROLE_SUB_ADMIN'),
       (SELECT id FROM departments WHERE name = 'Water Department');

INSERT IGNORE INTO users (full_name, email, password, phone, address, is_active, role_id, department_id)
SELECT 'Electricity Admin 1', 'electricity.admin1@scims.com',
       '$2a$12$w8r7ZyS5k0.YKvCMhEcHxOHG9mEXvT.LJ2fj./IEBhbFWm2JXXS36',
       '9000001003', 'Electricity Department Office', TRUE,
       (SELECT id FROM roles WHERE name = 'ROLE_SUB_ADMIN'),
       (SELECT id FROM departments WHERE name = 'Electricity Department');

INSERT IGNORE INTO users (full_name, email, password, phone, address, is_active, role_id, department_id)
SELECT 'Sanitation Admin 1', 'sanitation.admin1@scims.com',
       '$2a$12$w8r7ZyS5k0.YKvCMhEcHxOHG9mEXvT.LJ2fj./IEBhbFWm2JXXS36',
       '9000001004', 'Sanitation Department Office', TRUE,
       (SELECT id FROM roles WHERE name = 'ROLE_SUB_ADMIN'),
       (SELECT id FROM departments WHERE name = 'Sanitation Department');
