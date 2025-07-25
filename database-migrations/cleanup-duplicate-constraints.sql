-- Cleanup script to fix duplicate foreign key constraints and index names

-- Drop the duplicate foreign key constraint first
ALTER TABLE courses DROP FOREIGN KEY courses_ibfk_1;

-- Now drop the old index name
ALTER TABLE courses DROP INDEX idx_user_id;

-- Add the correct index name
ALTER TABLE courses ADD INDEX idx_owned_by (owned_by);

-- Verify the changes
DESCRIBE courses;

-- Show the final table structure
SHOW CREATE TABLE courses; 