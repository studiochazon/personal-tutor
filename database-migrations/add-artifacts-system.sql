-- Database Migration: Add Artifacts System
-- This migration adds support for multiple artifacts per lesson
-- Migrates existing video_url data from lessons table to new artifacts system
-- Run this migration AFTER backing up your database

-- ================================================
-- STEP 1: Create artifacts table
-- ================================================

CREATE TABLE IF NOT EXISTS artifacts (
    id INT PRIMARY KEY AUTO_INCREMENT,
    type ENUM('video', 'text', 'exercise', 'quiz', 'reading_list', 'summary', 'checklist', 'infographic') NOT NULL,
    title VARCHAR(255) NOT NULL,
    content LONGTEXT, -- Can store large text, HTML, or JSON data
    content_url VARCHAR(500), -- For external resources like videos, files, etc.
    metadata JSON, -- Store artifact metadata as JSON
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_type (type),
    INDEX idx_title (title),
    INDEX idx_created_at (created_at)
);

-- ================================================
-- STEP 2: Create lesson_artifacts junction table
-- ================================================

CREATE TABLE IF NOT EXISTS lesson_artifacts (
    id INT PRIMARY KEY AUTO_INCREMENT,
    lesson_id INT NOT NULL,
    artifact_id INT NOT NULL,
    priority_role ENUM('primary', 'supplementary') NOT NULL DEFAULT 'supplementary',
    display_order INT NOT NULL DEFAULT 1,
    priority_score DECIMAL(3,2) DEFAULT 0.50, -- 0.00 to 1.00
    selection_reason TEXT,
    integration_notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (lesson_id) REFERENCES lessons(id) ON DELETE CASCADE,
    FOREIGN KEY (artifact_id) REFERENCES artifacts(id) ON DELETE CASCADE,
    UNIQUE KEY unique_lesson_artifact (lesson_id, artifact_id),
    INDEX idx_lesson_id (lesson_id),
    INDEX idx_artifact_id (artifact_id),
    INDEX idx_priority_role (priority_role),
    INDEX idx_display_order (display_order)
);

-- ================================================
-- STEP 3: Create course metadata table (for v3 engine)
-- ================================================

CREATE TABLE IF NOT EXISTS course_metadata (
    id INT PRIMARY KEY AUTO_INCREMENT,
    course_id INT NOT NULL,
    audience ENUM('beginner', 'intermediate', 'advanced'),
    depth ENUM('overview', 'comprehensive', 'deep-dive'),
    creation_method VARCHAR(50), -- 'v3_engine', 'manual', etc.
    engine_version VARCHAR(20),
    total_duration INT, -- in minutes
    video_coverage DECIMAL(3,2), -- 0.00 to 1.00
    quality_score DECIMAL(3,2), -- 0.00 to 1.00
    keyword_strategy VARCHAR(50),
    refinement_strategy VARCHAR(50),
    user_prompt TEXT,
    generation_timestamp TIMESTAMP NULL,
    total_videos_found INT DEFAULT 0,
    videos_integrated INT DEFAULT 0,
    average_video_quality DECIMAL(3,2),
    processing_steps JSON,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE,
    UNIQUE KEY unique_course_metadata (course_id),
    INDEX idx_creation_method (creation_method),
    INDEX idx_audience (audience),
    INDEX idx_generation_timestamp (generation_timestamp)
);

-- ================================================
-- STEP 4: Add new columns to lessons table
-- ================================================

-- Add lesson_order column to replace order_index for clarity
ALTER TABLE lessons 
ADD COLUMN lesson_order INT AFTER order_index,
ADD COLUMN lesson_topic VARCHAR(255) AFTER title;

-- Copy order_index to lesson_order for all existing lessons
UPDATE lessons SET lesson_order = order_index WHERE lesson_order IS NULL;

-- Add index for lesson_order
ALTER TABLE lessons ADD INDEX idx_lesson_order (lesson_order);

-- ================================================
-- STEP 5: Migrate existing video data to artifacts
-- ================================================

-- Create a procedure to migrate video data
DELIMITER //

CREATE PROCEDURE MigrateVideoDataToArtifacts()
BEGIN
    DECLARE done INT DEFAULT FALSE;
    DECLARE lesson_id_var INT;
    DECLARE video_url_var VARCHAR(500);
    DECLARE video_title_var VARCHAR(255);
    DECLARE video_duration_var INT;
    DECLARE artifact_id_var INT;
    
    -- Cursor to iterate through lessons with video data
    DECLARE lesson_cursor CURSOR FOR 
        SELECT id, video_url, video_title, video_duration 
        FROM lessons 
        WHERE video_url IS NOT NULL AND video_url != '';
    
    DECLARE CONTINUE HANDLER FOR NOT FOUND SET done = TRUE;
    
    -- Open cursor and iterate
    OPEN lesson_cursor;
    read_loop: LOOP
        FETCH lesson_cursor INTO lesson_id_var, video_url_var, video_title_var, video_duration_var;
        
        IF done THEN
            LEAVE read_loop;
        END IF;
        
        -- Create artifact for the video
        INSERT INTO artifacts (
            type, 
            title, 
            content_url, 
            metadata
        ) VALUES (
            'video',
            COALESCE(video_title_var, 'Video Lesson'),
            video_url_var,
            JSON_OBJECT(
                'estimated_time', COALESCE(video_duration_var, 600) / 60, -- Convert seconds to minutes
                'difficulty', 'medium',
                'learning_objective', 'Video-based learning content',
                'video_duration', COALESCE(video_duration_var, 600),
                'platform', CASE 
                    WHEN video_url_var LIKE '%youtube%' THEN 'youtube'
                    WHEN video_url_var LIKE '%vimeo%' THEN 'vimeo'
                    ELSE 'other'
                END,
                'migrated_from_lesson', TRUE,
                'migration_timestamp', NOW()
            )
        );
        
        -- Get the ID of the created artifact
        SET artifact_id_var = LAST_INSERT_ID();
        
        -- Link artifact to lesson as primary
        INSERT INTO lesson_artifacts (
            lesson_id, 
            artifact_id, 
            priority_role, 
            display_order, 
            priority_score,
            selection_reason,
            integration_notes
        ) VALUES (
            lesson_id_var,
            artifact_id_var,
            'primary',
            1,
            0.80, -- Assume migrated videos are good quality
            'Migrated from original lesson video data',
            CONCAT('Original video URL: ', video_url_var)
        );
        
    END LOOP;
    
    CLOSE lesson_cursor;
END //

DELIMITER ;

-- Execute the migration procedure
CALL MigrateVideoDataToArtifacts();

-- ================================================
-- STEP 6: Update lessons table structure
-- ================================================

-- Create backup columns for video data (in case rollback is needed)
ALTER TABLE lessons 
ADD COLUMN video_url_backup VARCHAR(500),
ADD COLUMN video_title_backup VARCHAR(255),
ADD COLUMN video_duration_backup INT;

-- Copy existing video data to backup columns
UPDATE lessons SET 
    video_url_backup = video_url,
    video_title_backup = video_title,
    video_duration_backup = video_duration;

-- ================================================
-- STEP 7: Add helpful views for artifacts
-- ================================================

-- View to easily see lesson artifacts
CREATE OR REPLACE VIEW lesson_artifacts_view AS
SELECT 
    l.id as lesson_id,
    l.title as lesson_title,
    l.course_id,
    c.title as course_title,
    a.id as artifact_id,
    a.type as artifact_type,
    a.title as artifact_title,
    la.priority_role,
    la.display_order,
    la.priority_score,
    a.content_url,
    a.metadata,
    a.created_at as artifact_created_at
FROM lessons l
LEFT JOIN lesson_artifacts la ON l.id = la.lesson_id
LEFT JOIN artifacts a ON la.artifact_id = a.id
LEFT JOIN courses c ON l.course_id = c.id
ORDER BY l.course_id, l.lesson_order, la.display_order;

-- View for course statistics with artifacts
CREATE OR REPLACE VIEW course_artifact_stats AS
SELECT 
    c.id as course_id,
    c.title as course_title,
    COUNT(DISTINCT l.id) as total_lessons,
    COUNT(DISTINCT a.id) as total_artifacts,
    COUNT(DISTINCT CASE WHEN la.priority_role = 'primary' THEN a.id END) as primary_artifacts,
    COUNT(DISTINCT CASE WHEN la.priority_role = 'supplementary' THEN a.id END) as supplementary_artifacts,
    COUNT(DISTINCT CASE WHEN a.type = 'video' THEN a.id END) as video_artifacts,
    COUNT(DISTINCT CASE WHEN a.type = 'text' THEN a.id END) as text_artifacts,
    COUNT(DISTINCT CASE WHEN a.type = 'exercise' THEN a.id END) as exercise_artifacts,
    ROUND(AVG(la.priority_score), 2) as average_priority_score
FROM courses c
LEFT JOIN lessons l ON c.id = l.course_id
LEFT JOIN lesson_artifacts la ON l.id = la.lesson_id
LEFT JOIN artifacts a ON la.artifact_id = a.id
WHERE c.is_published = TRUE
GROUP BY c.id, c.title
ORDER BY c.title;

-- ================================================
-- STEP 8: Add stored procedures for artifact management
-- ================================================

DELIMITER //

-- Procedure to add artifact to lesson
CREATE PROCEDURE AddArtifactToLesson(
    IN p_lesson_id INT,
    IN p_artifact_type VARCHAR(50),
    IN p_title VARCHAR(255),
    IN p_content LONGTEXT,
    IN p_content_url VARCHAR(500),
    IN p_metadata JSON,
    IN p_priority_role VARCHAR(20),
    IN p_display_order INT
)
BEGIN
    DECLARE artifact_id_var INT;
    
    -- Insert artifact
    INSERT INTO artifacts (type, title, content, content_url, metadata)
    VALUES (p_artifact_type, p_title, p_content, p_content_url, p_metadata);
    
    SET artifact_id_var = LAST_INSERT_ID();
    
    -- Link to lesson
    INSERT INTO lesson_artifacts (lesson_id, artifact_id, priority_role, display_order)
    VALUES (p_lesson_id, artifact_id_var, p_priority_role, p_display_order);
    
    SELECT artifact_id_var as artifact_id;
END //

-- Procedure to get lesson artifacts
CREATE PROCEDURE GetLessonArtifacts(IN p_lesson_id INT)
BEGIN
    SELECT 
        a.*,
        la.priority_role,
        la.display_order,
        la.priority_score,
        la.selection_reason
    FROM artifacts a
    JOIN lesson_artifacts la ON a.id = la.artifact_id
    WHERE la.lesson_id = p_lesson_id
    ORDER BY la.display_order;
END //

-- Procedure to set primary artifact
CREATE PROCEDURE SetPrimaryArtifact(
    IN p_lesson_id INT,
    IN p_artifact_id INT
)
BEGIN
    -- Update all artifacts for this lesson to supplementary
    UPDATE lesson_artifacts 
    SET priority_role = 'supplementary'
    WHERE lesson_id = p_lesson_id;
    
    -- Set the specified artifact as primary
    UPDATE lesson_artifacts 
    SET priority_role = 'primary', display_order = 1
    WHERE lesson_id = p_lesson_id AND artifact_id = p_artifact_id;
    
    -- Reorder supplementary artifacts
    SET @row_number = 1;
    UPDATE lesson_artifacts la
    JOIN (
        SELECT artifact_id, 
               (@row_number := @row_number + 1) as new_order
        FROM lesson_artifacts 
        WHERE lesson_id = p_lesson_id AND priority_role = 'supplementary'
        ORDER BY display_order
    ) ordered ON la.artifact_id = ordered.artifact_id
    SET la.display_order = ordered.new_order + 1
    WHERE la.lesson_id = p_lesson_id AND la.priority_role = 'supplementary';
END //

DELIMITER ;

-- ================================================
-- STEP 9: Clean up and finalize
-- ================================================

-- Drop the migration procedure (no longer needed)
DROP PROCEDURE IF EXISTS MigrateVideoDataToArtifacts;

-- Add constraints to ensure data integrity
ALTER TABLE lesson_artifacts 
ADD CONSTRAINT chk_priority_score 
CHECK (priority_score >= 0.00 AND priority_score <= 1.00);

ALTER TABLE course_metadata 
ADD CONSTRAINT chk_video_coverage 
CHECK (video_coverage >= 0.00 AND video_coverage <= 1.00),
ADD CONSTRAINT chk_quality_score 
CHECK (quality_score >= 0.00 AND quality_score <= 1.00);

-- Update courses table to add status column if it doesn't exist
ALTER TABLE courses 
ADD COLUMN status ENUM('draft', 'published', 'archived') DEFAULT 'draft' AFTER is_published,
ADD COLUMN published_at TIMESTAMP NULL AFTER updated_at;

-- Migrate is_published to status
UPDATE courses SET status = 'published' WHERE is_published = TRUE;
UPDATE courses SET status = 'draft' WHERE is_published = FALSE;

-- ================================================
-- STEP 10: Create indexes for performance
-- ================================================

-- Performance indexes
CREATE INDEX idx_artifacts_type_created ON artifacts(type, created_at);
CREATE INDEX idx_lesson_artifacts_role_order ON lesson_artifacts(priority_role, display_order);
CREATE INDEX idx_course_metadata_engine_version ON course_metadata(engine_version, creation_method);

-- ================================================
-- VERIFICATION QUERIES
-- ================================================

-- Check migration results
SELECT 'Migration Verification Results' as status;

SELECT 
    'Total artifacts created' as metric,
    COUNT(*) as value
FROM artifacts;

SELECT 
    'Lessons with artifacts' as metric,
    COUNT(DISTINCT lesson_id) as value
FROM lesson_artifacts;

SELECT 
    'Artifacts by type' as metric,
    type,
    COUNT(*) as count
FROM artifacts
GROUP BY type;

SELECT 
    'Primary vs Supplementary' as metric,
    priority_role,
    COUNT(*) as count
FROM lesson_artifacts
GROUP BY priority_role;

-- Verify video migration
SELECT 
    'Video migration check' as metric,
    COUNT(*) as lessons_with_video_backup,
    (SELECT COUNT(*) FROM artifacts WHERE type = 'video') as video_artifacts_created
FROM lessons 
WHERE video_url_backup IS NOT NULL;

COMMIT;

-- ================================================
-- ROLLBACK PROCEDURE (if needed)
-- ================================================

DELIMITER //

CREATE PROCEDURE RollbackArtifactsMigration()
BEGIN
    DECLARE confirmation VARCHAR(100) DEFAULT '';
    
    -- Safety check - requires manual confirmation
    SELECT 'WARNING: This will delete all artifacts data and restore video columns!' as warning_message;
    SELECT 'To proceed, you must manually modify this procedure and remove the safety check.' as instruction;
    
    -- Uncomment these lines ONLY if you really want to rollback
    /*
    -- Restore video data from backup columns
    UPDATE lessons SET 
        video_url = video_url_backup,
        video_title = video_title_backup,
        video_duration = video_duration_backup
    WHERE video_url_backup IS NOT NULL;
    
    -- Drop artifacts tables
    DROP VIEW IF EXISTS lesson_artifacts_view;
    DROP VIEW IF EXISTS course_artifact_stats;
    DROP TABLE IF EXISTS lesson_artifacts;
    DROP TABLE IF EXISTS artifacts;
    DROP TABLE IF EXISTS course_metadata;
    
    -- Remove added columns
    ALTER TABLE lessons 
    DROP COLUMN lesson_order,
    DROP COLUMN lesson_topic,
    DROP COLUMN video_url_backup,
    DROP COLUMN video_title_backup,
    DROP COLUMN video_duration_backup;
    
    ALTER TABLE courses 
    DROP COLUMN status,
    DROP COLUMN published_at;
    */
    
END //

DELIMITER ;

-- ================================================
-- FINAL MESSAGE
-- ================================================

SELECT 'Artifacts system migration completed successfully!' as message;
SELECT 'Use the verification queries above to check the results.' as instruction;
SELECT 'The RollbackArtifactsMigration procedure is available if needed.' as rollback_info;