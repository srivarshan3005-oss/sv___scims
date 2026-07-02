-- ============================================================
-- SCIMS SEED DATA
-- Uses INSERT IGNORE so re-running is safe (idempotent).
-- Passwords are BCrypt-hashed at strength 12.
-- ============================================================

USE scims_db;

-- ============================================================
-- Roles
-- ============================================================
INSERT IGNORE INTO roles (name) VALUES ('ROLE_ADMIN'), ('ROLE_SUB_ADMIN'), ('ROLE_CITIZEN');

-- ============================================================
-- Departments
-- Broader grouping than categories — one department owns several
-- categories. Database-driven: add more departments any time without
-- touching code.
-- ============================================================
INSERT IGNORE INTO departments (name, description, is_active) VALUES
('Roads Department',         'Road surfaces, potholes, road-related infrastructure', TRUE),
('Water Department',         'Water supply, leakage, pipe bursts',                    TRUE),
('Electricity Department',   'Streetlights and public electrical infrastructure',     TRUE),
('Sanitation Department',    'Garbage collection, illegal dumping, drainage',         TRUE),
('Public Safety Department', 'General public safety and miscellaneous issues',        TRUE);

-- ============================================================
-- Categories
-- ============================================================
INSERT IGNORE INTO categories (name, description, is_active, department_id) VALUES
('Road Damage',       'Potholes, cracks, broken road surfaces',                TRUE, (SELECT id FROM departments WHERE name = 'Roads Department')),
('Garbage',           'Uncollected garbage, overflowing bins',                 TRUE, (SELECT id FROM departments WHERE name = 'Sanitation Department')),
('Water Leakage',     'Pipe bursts, water wastage, leaking mains',             TRUE, (SELECT id FROM departments WHERE name = 'Water Department')),
('Streetlight',       'Non-functional or damaged street lights',               TRUE, (SELECT id FROM departments WHERE name = 'Electricity Department')),
('Drainage',          'Blocked drains, flooding, sewage overflow',             TRUE, (SELECT id FROM departments WHERE name = 'Sanitation Department')),
('Public Safety',     'Hazardous conditions, safety concerns in public areas', TRUE, (SELECT id FROM departments WHERE name = 'Public Safety Department')),
('Illegal Dumping',   'Unauthorized waste disposal in public areas',           TRUE, (SELECT id FROM departments WHERE name = 'Sanitation Department')),
('Other',             'Issues not covered by existing categories',             TRUE, (SELECT id FROM departments WHERE name = 'Public Safety Department'));

-- ============================================================
-- Super Admin user  (password: Admin@123) — exactly one.
-- ============================================================
INSERT IGNORE INTO users (full_name, email, password, phone, address, is_active, role_id)
VALUES (
  'System Admin',
  'admin@scims.com',
  '$2a$12$GBq.K7e6wMPRFUl0ekBOdOeMv7wePBlb8aTJ.qG2YD5T6rBPu7Hqy',
  '9000000001',
  'City Hall, Main Street',
  TRUE,
  (SELECT id FROM roles WHERE name = 'ROLE_ADMIN')
);

-- ============================================================
-- Sample Sub Admin users (password for all: Citizen@123 — reuses the
-- existing demo citizen hash so we don't need a fresh BCrypt hash here).
-- One per starter department; add more (5+ per department) via the
-- Admin > Sub Admins UI.
-- ============================================================
INSERT IGNORE INTO users (full_name, email, password, phone, address, is_active, role_id, department_id)
VALUES
(
  'Road Admin 1', 'road.admin1@scims.com',
  '$2a$12$w8r7ZyS5k0.YKvCMhEcHxOHG9mEXvT.LJ2fj./IEBhbFWm2JXXS36',
  '9000001001', 'Roads Department Office', TRUE,
  (SELECT id FROM roles WHERE name = 'ROLE_SUB_ADMIN'),
  (SELECT id FROM departments WHERE name = 'Roads Department')
),
(
  'Water Admin 1', 'water.admin1@scims.com',
  '$2a$12$w8r7ZyS5k0.YKvCMhEcHxOHG9mEXvT.LJ2fj./IEBhbFWm2JXXS36',
  '9000001002', 'Water Department Office', TRUE,
  (SELECT id FROM roles WHERE name = 'ROLE_SUB_ADMIN'),
  (SELECT id FROM departments WHERE name = 'Water Department')
),
(
  'Electricity Admin 1', 'electricity.admin1@scims.com',
  '$2a$12$w8r7ZyS5k0.YKvCMhEcHxOHG9mEXvT.LJ2fj./IEBhbFWm2JXXS36',
  '9000001003', 'Electricity Department Office', TRUE,
  (SELECT id FROM roles WHERE name = 'ROLE_SUB_ADMIN'),
  (SELECT id FROM departments WHERE name = 'Electricity Department')
),
(
  'Sanitation Admin 1', 'sanitation.admin1@scims.com',
  '$2a$12$w8r7ZyS5k0.YKvCMhEcHxOHG9mEXvT.LJ2fj./IEBhbFWm2JXXS36',
  '9000001004', 'Sanitation Department Office', TRUE,
  (SELECT id FROM roles WHERE name = 'ROLE_SUB_ADMIN'),
  (SELECT id FROM departments WHERE name = 'Sanitation Department')
);

-- ============================================================
-- Citizen users  (password: Citizen@123)
-- ============================================================
INSERT IGNORE INTO users (full_name, email, password, phone, address, is_active, role_id)
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

-- ============================================================
-- Sample complaints
-- Uses subqueries so inserts are order-independent and IDs are
-- not hardcoded.
-- ============================================================
INSERT IGNORE INTO complaints
    (title, description, location, status, priority, user_id, category_id, department_id, admin_remarks)
VALUES
(
  'Large pothole on Main St',
  'Dangerous pothole near the junction of Main St and 2nd Ave causing accidents.',
  'Main St & 2nd Ave Junction',
  'IN_PROGRESS', 'HIGH',
  (SELECT id FROM users      WHERE email = 'john@example.com'),
  (SELECT id FROM categories WHERE name  = 'Road Damage'),
  (SELECT id FROM departments WHERE name = 'Roads Department'),
  'Team dispatched for assessment'
),
(
  'Overflowing garbage bin near park',
  'The garbage bin near the park entrance has been overflowing for 3 days.',
  'Central Park Entrance',
  'PENDING', 'MEDIUM',
  (SELECT id FROM users      WHERE email = 'jane@example.com'),
  (SELECT id FROM categories WHERE name  = 'Garbage'),
  (SELECT id FROM departments WHERE name = 'Sanitation Department'),
  NULL
),
(
  'Street lights not working on Oak Street',
  'Two streetlights on Oak Street are non-functional, making the area dangerous at night.',
  'Oak Street, Block 4',
  'RESOLVED', 'MEDIUM',
  (SELECT id FROM users      WHERE email = 'john@example.com'),
  (SELECT id FROM categories WHERE name  = 'Streetlight'),
  (SELECT id FROM departments WHERE name = 'Electricity Department'),
  'Bulbs replaced, issue resolved'
),
(
  'Water pipe burst near City School',
  'A main water pipe has burst near the school, wasting large amounts of water.',
  'Near City School, Elm Road',
  'PENDING', 'URGENT',
  (SELECT id FROM users      WHERE email = 'jane@example.com'),
  (SELECT id FROM categories WHERE name  = 'Water Leakage'),
  (SELECT id FROM departments WHERE name = 'Water Department'),
  NULL
);

-- ============================================================
-- Status history entries
-- Each complaint gets an initial PENDING entry (simulating what
-- ComplaintServiceImpl.createComplaint() would create), plus
-- subsequent transitions for the seeded complaints.
-- INSERT IGNORE prevents duplicate inserts on re-run.
-- ============================================================

-- Initial PENDING submissions (citizen-submitted)
INSERT IGNORE INTO status_history
    (complaint_id, old_status, new_status, changed_by, remarks)
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

-- Admin transitions
INSERT IGNORE INTO status_history
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

-- Set resolved_at for the resolved complaint
UPDATE complaints
SET resolved_at = NOW()
WHERE title  = 'Street lights not working on Oak Street'
  AND status = 'RESOLVED'
  AND resolved_at IS NULL;
