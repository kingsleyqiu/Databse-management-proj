-- Create admin user with user_id = 0
-- This script should be run after the database is created

USE ev_charging;

-- Delete admin user if it already exists (check both user_id = 0 and email)
DELETE FROM Users WHERE user_id = 0 OR email = 'admin@example.com';

-- Save current sql_mode
SET @old_sql_mode = @@sql_mode;

-- Set sql_mode to allow inserting 0 into AUTO_INCREMENT columns
-- Preserve existing sql_mode and add NO_AUTO_VALUE_ON_ZERO
SET sql_mode = CONCAT(@old_sql_mode, ',NO_AUTO_VALUE_ON_ZERO');

-- Insert admin user with explicit user_id = 0
INSERT INTO Users (user_id, fname, lname, email, phone, password, role, car_id) 
VALUES (0, 'Admin', 'User', 'admin@example.com', '416-555-0000', 'admin123', 'admin', NULL);

-- Restore original sql_mode
SET sql_mode = @old_sql_mode;

-- Set AUTO_INCREMENT to ensure it continues from 1 (or highest existing value + 1)
SET @max_id = (SELECT COALESCE(MAX(user_id), 0) FROM Users WHERE user_id > 0);
SET @sql = CONCAT('ALTER TABLE Users AUTO_INCREMENT = ', @max_id + 1);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

