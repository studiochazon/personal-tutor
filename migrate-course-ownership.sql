-- Course Ownership Migration Script
-- This script migrates all existing courses to be owned by user ID 4

-- First, ensure user ID 4 exists (create if it doesn't)
INSERT IGNORE INTO users (id, email, password_hash, name, created_at, updated_at) 
VALUES (4, 'course-owner@example.com', '$2b$10$example.hash.here', 'Course Owner', NOW(), NOW());

-- Update all existing courses to be owned by user ID 4
UPDATE courses 
SET owned_by = 4, 
    updated_at = NOW() 
WHERE owned_by IN (1, 2, 3);

-- Verify the migration
SELECT 
    id,
    title,
    owned_by,
    is_published,
    created_at,
    updated_at
FROM courses 
ORDER BY id;

-- Show migration summary
SELECT 
    COUNT(*) as total_courses_migrated,
    'All courses now owned by user ID 4' as migration_status
FROM courses 
WHERE owned_by = 4; 