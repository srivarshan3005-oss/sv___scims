-- ============================================================
-- SCIMS MIGRATION 002 — GPS Location Fields on Complaints
-- Run this once against an EXISTING scims_db database:
--   mysql -u root -p scims_db < sql/migration_002_gps_fields.sql
--
-- Safe to re-run: ALTER COLUMN is wrapped in an existence check
-- so it is a no-op if the columns are already present.
-- ============================================================

USE scims_db;

-- Add latitude column if it doesn't already exist
SET @col_exists = (
    SELECT COUNT(*) FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = 'scims_db'
      AND TABLE_NAME   = 'complaints'
      AND COLUMN_NAME  = 'latitude'
);

SET @sql_lat = IF(@col_exists = 0,
    'ALTER TABLE complaints ADD COLUMN latitude DOUBLE NULL AFTER location',
    'SELECT ''latitude column already exists''');
PREPARE stmt FROM @sql_lat;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Add longitude column if it doesn't already exist
SET @col_exists = (
    SELECT COUNT(*) FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = 'scims_db'
      AND TABLE_NAME   = 'complaints'
      AND COLUMN_NAME  = 'longitude'
);

SET @sql_lng = IF(@col_exists = 0,
    'ALTER TABLE complaints ADD COLUMN longitude DOUBLE NULL AFTER latitude',
    'SELECT ''longitude column already exists''');
PREPARE stmt FROM @sql_lng;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Add gps_accuracy column if it doesn't already exist
SET @col_exists = (
    SELECT COUNT(*) FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = 'scims_db'
      AND TABLE_NAME   = 'complaints'
      AND COLUMN_NAME  = 'gps_accuracy'
);

SET @sql_acc = IF(@col_exists = 0,
    'ALTER TABLE complaints ADD COLUMN gps_accuracy DOUBLE NULL COMMENT ''Accuracy radius in metres (95th percentile) from browser Geolocation API'' AFTER longitude',
    'SELECT ''gps_accuracy column already exists''');
PREPARE stmt FROM @sql_acc;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Add index to support future geo-spatial bounding-box queries
-- (complaint map loads all complaints anyway today, but this will help when
--  the map switches to viewport-based loading)
CREATE INDEX IF NOT EXISTS idx_complaints_gps ON complaints(latitude, longitude);
