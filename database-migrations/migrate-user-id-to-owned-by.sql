-- Migration script to rename user_id to owned_by in courses table
-- This script should be run on existing databases to update the column name

-- First, find the foreign key constraint name
-- SHOW CREATE TABLE courses;

-- Drop the existing foreign key constraint (replace 'constraint_name' with actual name)
-- ALTER TABLE courses DROP FOREIGN KEY courses_ibfk_1;

-- Rename the column from user_id to owned_by
ALTER TABLE courses CHANGE COLUMN user_id owned_by INT NOT NULL;

-- Add the new foreign key constraint
ALTER TABLE courses ADD CONSTRAINT fk_courses_owned_by 
FOREIGN KEY (owned_by) REFERENCES users(id) ON DELETE CASCADE;

-- Update the index name (drop and recreate)
ALTER TABLE courses DROP INDEX idx_user_id;
ALTER TABLE courses ADD INDEX idx_owned_by (owned_by);

-- Verify the changes
DESCRIBE courses;

-- Show sample data to confirm the migration worked
SELECT 
    id,
    title,
    owned_by,
    is_published,
    created_at
FROM courses 
LIMIT 5; 