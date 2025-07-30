-- Migration: Add v3 Engine Support
-- Add tables and columns needed for the Course Creation Engine v3

-- Add new columns to existing courses table for v3 compatibility
ALTER TABLE courses 
ADD COLUMN status ENUM('draft', 'published') DEFAULT 'draft',
ADD COLUMN published_at TIMESTAMP NULL,
ADD INDEX idx_status (status);

-- Update existing courses to use the new status column
UPDATE courses SET status = 'published' WHERE is_published = TRUE;
UPDATE courses SET status = 'draft' WHERE is_published = FALSE;

-- Add new columns to lessons table for v3 compatibility
ALTER TABLE lessons 
ADD COLUMN duration INT DEFAULT 0, -- Duration in minutes
ADD COLUMN lesson_order INT DEFAULT 0, -- Use this instead of order_index
ADD INDEX idx_lesson_order (lesson_order);

-- Update existing lessons to use the new column names
UPDATE lessons SET duration = COALESCE(estimated_duration, 15);
UPDATE lessons SET lesson_order = order_index;

-- Create course_metadata table for v3 engine metadata
CREATE TABLE course_metadata (
    id INT PRIMARY KEY AUTO_INCREMENT,
    course_id INT NOT NULL,
    audience ENUM('beginner', 'intermediate', 'advanced') NOT NULL,
    depth ENUM('overview', 'comprehensive', 'deep-dive') NOT NULL,
    creation_method VARCHAR(50) NOT NULL DEFAULT 'manual',
    engine_version VARCHAR(20),
    
    -- Course metrics
    total_duration INT DEFAULT 0, -- Total course duration in minutes
    video_coverage DECIMAL(3,2) DEFAULT 0.00, -- 0.00 to 1.00
    quality_score DECIMAL(3,2) DEFAULT 0.00, -- 0.00 to 1.00
    
    -- V3 engine specific fields
    keyword_strategy VARCHAR(50),
    refinement_strategy VARCHAR(50),
    user_prompt TEXT,
    generation_timestamp TIMESTAMP,
    
    -- Video integration metrics
    total_videos_found INT DEFAULT 0,
    videos_integrated INT DEFAULT 0,
    average_video_quality DECIMAL(3,2) DEFAULT 0.00,
    
    -- Processing information
    processing_steps JSON,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE,
    INDEX idx_course_id (course_id),
    INDEX idx_creation_method (creation_method),
    INDEX idx_audience (audience),
    INDEX idx_depth (depth),
    INDEX idx_engine_version (engine_version)
);

-- Create lesson_videos table for video integration data
CREATE TABLE lesson_videos (
    id INT PRIMARY KEY AUTO_INCREMENT,
    lesson_id INT NOT NULL,
    
    -- Video information
    video_url VARCHAR(500) NOT NULL,
    video_title VARCHAR(255),
    video_duration INT DEFAULT 0, -- Duration in seconds
    confidence_score DECIMAL(3,2) DEFAULT 0.00, -- 0.00 to 1.00
    
    -- Integration configuration
    video_timing ENUM('start', 'middle', 'end', 'throughout', 'none') DEFAULT 'middle',
    video_role ENUM('primary', 'supplementary', 'example', 'none') DEFAULT 'supplementary',
    integration_notes TEXT,
    
    -- Quality metrics
    quality_score DECIMAL(3,2) DEFAULT 0.00,
    accessibility_score DECIMAL(3,2) DEFAULT 0.00,
    was_replaced BOOLEAN DEFAULT FALSE,
    replacement_reason TEXT,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (lesson_id) REFERENCES lessons(id) ON DELETE CASCADE,
    INDEX idx_lesson_id (lesson_id),
    INDEX idx_video_timing (video_timing),
    INDEX idx_video_role (video_role),
    INDEX idx_quality_score (quality_score),
    INDEX idx_was_replaced (was_replaced)
);

-- Create keyword_clouds table for storing generated keyword clouds (optional caching)
CREATE TABLE keyword_clouds (
    id INT PRIMARY KEY AUTO_INCREMENT,
    course_id INT,
    
    -- Keyword categories
    primary_keywords JSON,
    secondary_keywords JSON,
    long_tail_keywords JSON,
    video_search_terms JSON,
    excluded_terms JSON,
    
    -- Metadata
    strategy VARCHAR(50),
    total_keywords INT DEFAULT 0,
    generation_context JSON,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE,
    INDEX idx_course_id (course_id),
    INDEX idx_strategy (strategy)
);

-- Create video_search_results table for caching video search results (optional)
CREATE TABLE video_search_results (
    id INT PRIMARY KEY AUTO_INCREMENT,
    keyword_cloud_id INT,
    lesson_index INT,
    
    -- Search results
    videos_found JSON,
    search_strategy VARCHAR(50),
    total_videos_found INT DEFAULT 0,
    keyword_coverage JSON,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (keyword_cloud_id) REFERENCES keyword_clouds(id) ON DELETE CASCADE,
    INDEX idx_keyword_cloud_id (keyword_cloud_id),
    INDEX idx_lesson_index (lesson_index)
);

-- Create v3_engine_logs table for tracking v3 engine executions
CREATE TABLE v3_engine_logs (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT,
    course_id INT,
    
    -- Execution details
    user_prompt TEXT,
    execution_status ENUM('completed', 'partial', 'failed') NOT NULL,
    total_execution_time_ms INT DEFAULT 0,
    steps_completed INT DEFAULT 0,
    steps_failed INT DEFAULT 0,
    
    -- Configuration used
    audience ENUM('beginner', 'intermediate', 'advanced'),
    depth ENUM('overview', 'comprehensive', 'deep-dive'),
    keyword_strategy VARCHAR(50),
    search_strategy VARCHAR(50),
    refinement_strategy VARCHAR(50),
    
    -- Results
    final_course_data JSON,
    step_results JSON,
    error_details TEXT,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
    FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE SET NULL,
    INDEX idx_user_id (user_id),
    INDEX idx_course_id (course_id),
    INDEX idx_execution_status (execution_status),
    INDEX idx_created_at (created_at)
);

-- Create view for v3 course overview
CREATE VIEW v3_course_overview AS
SELECT 
    c.id as course_id,
    c.title,
    c.description,
    c.thumbnail_url,
    c.status,
    c.owned_by,
    c.created_at,
    
    -- Metadata
    cm.audience,
    cm.depth,
    cm.creation_method,
    cm.engine_version,
    cm.total_duration,
    cm.video_coverage,
    cm.quality_score,
    cm.videos_integrated,
    
    -- Lesson count
    COUNT(l.id) as lesson_count,
    
    -- Video integration summary
    COUNT(lv.id) as videos_count,
    AVG(lv.quality_score) as avg_video_quality,
    
    -- Owner information
    u.name as owner_name,
    u.email as owner_email
    
FROM courses c
LEFT JOIN course_metadata cm ON c.id = cm.course_id
LEFT JOIN lessons l ON c.id = l.course_id
LEFT JOIN lesson_videos lv ON l.id = lv.lesson_id
LEFT JOIN users u ON c.owned_by = u.id
GROUP BY c.id, cm.id, u.id;

-- Create stored procedure for v3 course creation logging
DELIMITER //

CREATE PROCEDURE LogV3CourseCreation(
    IN p_user_id INT,
    IN p_course_id INT,
    IN p_user_prompt TEXT,
    IN p_execution_status VARCHAR(20),
    IN p_total_execution_time_ms INT,
    IN p_steps_completed INT,
    IN p_steps_failed INT,
    IN p_audience VARCHAR(20),
    IN p_depth VARCHAR(20),
    IN p_keyword_strategy VARCHAR(50),
    IN p_search_strategy VARCHAR(50),
    IN p_refinement_strategy VARCHAR(50),
    IN p_final_course_data JSON,
    IN p_step_results JSON,
    IN p_error_details TEXT
)
BEGIN
    INSERT INTO v3_engine_logs (
        user_id, course_id, user_prompt, execution_status,
        total_execution_time_ms, steps_completed, steps_failed,
        audience, depth, keyword_strategy, search_strategy, refinement_strategy,
        final_course_data, step_results, error_details
    ) VALUES (
        p_user_id, p_course_id, p_user_prompt, p_execution_status,
        p_total_execution_time_ms, p_steps_completed, p_steps_failed,
        p_audience, p_depth, p_keyword_strategy, p_search_strategy, p_refinement_strategy,
        p_final_course_data, p_step_results, p_error_details
    );
END //

DELIMITER ;

-- Insert sample metadata for existing courses to make them compatible with v3 views
INSERT INTO course_metadata (
    course_id, audience, depth, creation_method, total_duration
) 
SELECT 
    id, 
    difficulty, 
    'comprehensive', 
    'legacy',
    COALESCE(estimated_duration, 60)
FROM courses 
WHERE id NOT IN (SELECT course_id FROM course_metadata);

-- Add default video integration for existing lessons that have videos
INSERT INTO lesson_videos (
    lesson_id, video_url, video_title, video_duration, video_timing, video_role
)
SELECT 
    id,
    video_url,
    COALESCE(video_title, 'Legacy Video'),
    COALESCE(video_duration, 600),
    'middle',
    'supplementary'
FROM lessons 
WHERE video_url IS NOT NULL 
AND id NOT IN (SELECT lesson_id FROM lesson_videos);

-- Create indexes for performance optimization
CREATE INDEX idx_courses_status_owner ON courses(status, owned_by);
CREATE INDEX idx_lessons_course_order ON lessons(course_id, lesson_order);
CREATE INDEX idx_course_metadata_creation ON course_metadata(creation_method, engine_version);
CREATE INDEX idx_lesson_videos_quality ON lesson_videos(lesson_id, quality_score);

-- Add comments for documentation
ALTER TABLE course_metadata COMMENT = 'Metadata for courses created with v3 engine including strategy and quality metrics';
ALTER TABLE lesson_videos COMMENT = 'Video integration data for lessons with quality and accessibility scores';
ALTER TABLE keyword_clouds COMMENT = 'Generated keyword clouds for course creation (optional caching)';
ALTER TABLE v3_engine_logs COMMENT = 'Execution logs for v3 course creation engine runs';