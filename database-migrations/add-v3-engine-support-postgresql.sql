-- Migration: Add v3 Engine Support (PostgreSQL Version)
-- Add tables and columns needed for the Course Creation Engine v3

-- Add new columns to existing courses table for v3 compatibility
ALTER TABLE courses 
ADD COLUMN status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft', 'published')),
ADD COLUMN published_at TIMESTAMP;

CREATE INDEX idx_courses_status ON courses(status);

-- Update existing courses to use the new status column
UPDATE courses SET status = 'published' WHERE is_published = TRUE;
UPDATE courses SET status = 'draft' WHERE is_published = FALSE;

-- Add new columns to lessons table for v3 compatibility
ALTER TABLE lessons 
ADD COLUMN duration INTEGER DEFAULT 0, -- Duration in minutes
ADD COLUMN lesson_order INTEGER DEFAULT 0; -- Use this instead of order_index

CREATE INDEX idx_lessons_order ON lessons(lesson_order);

-- Update existing lessons to use the new column names
UPDATE lessons SET duration = COALESCE(estimated_duration, 15);
UPDATE lessons SET lesson_order = order_index;

-- Create course_metadata table for v3 engine metadata
CREATE TABLE course_metadata (
    id SERIAL PRIMARY KEY,
    course_id INTEGER NOT NULL,
    audience VARCHAR(20) NOT NULL CHECK (audience IN ('beginner', 'intermediate', 'advanced')),
    depth VARCHAR(20) NOT NULL CHECK (depth IN ('overview', 'comprehensive', 'deep-dive')),
    creation_method VARCHAR(50) NOT NULL DEFAULT 'manual',
    engine_version VARCHAR(20),
    
    -- Course metrics
    total_duration INTEGER DEFAULT 0, -- Total course duration in minutes
    video_coverage DECIMAL(5,2) DEFAULT 0.00, -- 0.00 to 1.00
    quality_score DECIMAL(5,2) DEFAULT 0.00, -- 0.00 to 1.00
    
    -- V3 engine specific fields
    keyword_strategy VARCHAR(50),
    refinement_strategy VARCHAR(50),
    user_prompt TEXT,
    generation_timestamp TIMESTAMP,
    
    -- Video integration metrics
    total_videos_found INTEGER DEFAULT 0,
    videos_integrated INTEGER DEFAULT 0,
    average_video_quality DECIMAL(5,2) DEFAULT 0.00,
    
    -- Processing information
    processing_steps JSONB,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE
);

CREATE INDEX idx_course_metadata_course_id ON course_metadata(course_id);
CREATE INDEX idx_course_metadata_creation_method ON course_metadata(creation_method);
CREATE INDEX idx_course_metadata_audience ON course_metadata(audience);
CREATE INDEX idx_course_metadata_depth ON course_metadata(depth);
CREATE INDEX idx_course_metadata_engine_version ON course_metadata(engine_version);

-- Create lesson_videos table for video integration data
CREATE TABLE lesson_videos (
    id SERIAL PRIMARY KEY,
    lesson_id INTEGER NOT NULL,
    
    -- Video information
    video_url VARCHAR(500) NOT NULL,
    video_title VARCHAR(255),
    video_duration INTEGER DEFAULT 0, -- Duration in seconds
    confidence_score DECIMAL(5,2) DEFAULT 0.00, -- 0.00 to 1.00
    
    -- Integration configuration
    video_timing VARCHAR(20) DEFAULT 'middle' CHECK (video_timing IN ('start', 'middle', 'end', 'throughout', 'none')),
    video_role VARCHAR(20) DEFAULT 'supplementary' CHECK (video_role IN ('primary', 'supplementary', 'example', 'none')),
    integration_notes TEXT,
    
    -- Quality metrics
    quality_score DECIMAL(5,2) DEFAULT 0.00,
    accessibility_score DECIMAL(5,2) DEFAULT 0.00,
    was_replaced BOOLEAN DEFAULT FALSE,
    replacement_reason TEXT,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (lesson_id) REFERENCES lessons(id) ON DELETE CASCADE
);

CREATE INDEX idx_lesson_videos_lesson_id ON lesson_videos(lesson_id);
CREATE INDEX idx_lesson_videos_timing ON lesson_videos(video_timing);
CREATE INDEX idx_lesson_videos_role ON lesson_videos(video_role);
CREATE INDEX idx_lesson_videos_quality ON lesson_videos(quality_score);
CREATE INDEX idx_lesson_videos_replaced ON lesson_videos(was_replaced);

-- Create keyword_clouds table for storing generated keyword clouds (optional caching)
CREATE TABLE keyword_clouds (
    id SERIAL PRIMARY KEY,
    course_id INTEGER,
    
    -- Keyword categories
    primary_keywords JSONB,
    secondary_keywords JSONB,
    long_tail_keywords JSONB,
    video_search_terms JSONB,
    excluded_terms JSONB,
    
    -- Metadata
    strategy VARCHAR(50),
    total_keywords INTEGER DEFAULT 0,
    generation_context JSONB,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE
);

CREATE INDEX idx_keyword_clouds_course_id ON keyword_clouds(course_id);
CREATE INDEX idx_keyword_clouds_strategy ON keyword_clouds(strategy);

-- Create video_search_results table for caching video search results (optional)
CREATE TABLE video_search_results (
    id SERIAL PRIMARY KEY,
    keyword_cloud_id INTEGER,
    lesson_index INTEGER,
    
    -- Search results
    videos_found JSONB,
    search_strategy VARCHAR(50),
    total_videos_found INTEGER DEFAULT 0,
    keyword_coverage JSONB,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (keyword_cloud_id) REFERENCES keyword_clouds(id) ON DELETE CASCADE
);

CREATE INDEX idx_video_search_results_keyword_cloud_id ON video_search_results(keyword_cloud_id);
CREATE INDEX idx_video_search_results_lesson_index ON video_search_results(lesson_index);

-- Create v3_engine_logs table for tracking v3 engine executions
CREATE TABLE v3_engine_logs (
    id SERIAL PRIMARY KEY,
    user_id INTEGER,
    course_id INTEGER,
    
    -- Execution details
    user_prompt TEXT,
    execution_status VARCHAR(20) NOT NULL CHECK (execution_status IN ('completed', 'partial', 'failed')),
    total_execution_time_ms INTEGER DEFAULT 0,
    steps_completed INTEGER DEFAULT 0,
    steps_failed INTEGER DEFAULT 0,
    
    -- Configuration used
    audience VARCHAR(20) CHECK (audience IN ('beginner', 'intermediate', 'advanced')),
    depth VARCHAR(20) CHECK (depth IN ('overview', 'comprehensive', 'deep-dive')),
    keyword_strategy VARCHAR(50),
    search_strategy VARCHAR(50),
    refinement_strategy VARCHAR(50),
    
    -- Results
    final_course_data JSONB,
    step_results JSONB,
    error_details TEXT,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
    FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE SET NULL
);

CREATE INDEX idx_v3_engine_logs_user_id ON v3_engine_logs(user_id);
CREATE INDEX idx_v3_engine_logs_course_id ON v3_engine_logs(course_id);
CREATE INDEX idx_v3_engine_logs_execution_status ON v3_engine_logs(execution_status);
CREATE INDEX idx_v3_engine_logs_created_at ON v3_engine_logs(created_at);

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
GROUP BY c.id, cm.id, u.id, c.title, c.description, c.thumbnail_url, c.status, c.owned_by, c.created_at,
         cm.audience, cm.depth, cm.creation_method, cm.engine_version, cm.total_duration, 
         cm.video_coverage, cm.quality_score, cm.videos_integrated, u.name, u.email;

-- Function for v3 course creation logging (PostgreSQL version)
CREATE OR REPLACE FUNCTION log_v3_course_creation(
    p_user_id INTEGER,
    p_course_id INTEGER,
    p_user_prompt TEXT,
    p_execution_status VARCHAR(20),
    p_total_execution_time_ms INTEGER,
    p_steps_completed INTEGER,
    p_steps_failed INTEGER,
    p_audience VARCHAR(20),
    p_depth VARCHAR(20),
    p_keyword_strategy VARCHAR(50),
    p_search_strategy VARCHAR(50),
    p_refinement_strategy VARCHAR(50),
    p_final_course_data JSONB,
    p_step_results JSONB,
    p_error_details TEXT
) RETURNS INTEGER AS $$
DECLARE
    log_id INTEGER;
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
    ) RETURNING id INTO log_id;
    
    RETURN log_id;
END;
$$ LANGUAGE plpgsql;

-- Insert sample metadata for existing courses to make them compatible with v3 views
INSERT INTO course_metadata (
    course_id, audience, depth, creation_method, total_duration
) 
SELECT 
    id, 
    CASE difficulty 
        WHEN 'beginner' THEN 'beginner'
        WHEN 'intermediate' THEN 'intermediate' 
        WHEN 'advanced' THEN 'advanced'
        ELSE 'beginner'
    END, 
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

-- Create additional indexes for performance optimization
CREATE INDEX idx_courses_status_owner ON courses(status, owned_by);
CREATE INDEX idx_lessons_course_order ON lessons(course_id, lesson_order);
CREATE INDEX idx_course_metadata_creation ON course_metadata(creation_method, engine_version);
CREATE INDEX idx_lesson_videos_quality ON lesson_videos(lesson_id, quality_score);

-- Add comments for documentation
COMMENT ON TABLE course_metadata IS 'Metadata for courses created with v3 engine including strategy and quality metrics';
COMMENT ON TABLE lesson_videos IS 'Video integration data for lessons with quality and accessibility scores';
COMMENT ON TABLE keyword_clouds IS 'Generated keyword clouds for course creation (optional caching)';
COMMENT ON TABLE v3_engine_logs IS 'Execution logs for v3 course creation engine runs';