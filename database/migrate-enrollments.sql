-- Migration: Add enrollments table
-- Run this script to add the enrollments table to existing databases

-- Create enrollments table
CREATE TABLE IF NOT EXISTS enrollments (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    course_id INT NOT NULL,
    enrolled_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    status ENUM('active', 'completed', 'paused', 'dropped') DEFAULT 'active',
    completed_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE,
    UNIQUE KEY unique_user_course (user_id, course_id),
    INDEX idx_user_id (user_id),
    INDEX idx_course_id (course_id),
    INDEX idx_status (status)
);

-- Add some sample enrollments for testing
INSERT IGNORE INTO enrollments (user_id, course_id, status) VALUES
(1, 1, 'active'),
(1, 2, 'completed'),
(2, 1, 'active'),
(2, 3, 'paused');

-- Update the course_progress_view to include enrollment information
DROP VIEW IF EXISTS course_progress_view;
CREATE VIEW course_progress_view AS
SELECT 
    c.id as course_id,
    c.title as course_title,
    l.id as lesson_id,
    l.title as lesson_title,
    l.order_index,
    u.id as user_id,
    u.name as user_name,
    e.status as enrollment_status,
    e.enrolled_at,
    p.completed,
    p.completed_at,
    p.time_spent
FROM courses c
JOIN lessons l ON c.id = l.course_id
LEFT JOIN enrollments e ON c.id = e.course_id
LEFT JOIN progress p ON l.id = p.lesson_id
LEFT JOIN users u ON p.user_id = u.id
WHERE c.is_published = TRUE
ORDER BY c.id, l.order_index;

-- Create a new view for enrollment statistics
CREATE VIEW enrollment_stats_view AS
SELECT 
    c.id as course_id,
    c.title as course_title,
    COUNT(e.id) as total_enrollments,
    SUM(CASE WHEN e.status = 'active' THEN 1 ELSE 0 END) as active_enrollments,
    SUM(CASE WHEN e.status = 'completed' THEN 1 ELSE 0 END) as completed_enrollments,
    SUM(CASE WHEN e.status = 'paused' THEN 1 ELSE 0 END) as paused_enrollments,
    SUM(CASE WHEN e.status = 'dropped' THEN 1 ELSE 0 END) as dropped_enrollments
FROM courses c
LEFT JOIN enrollments e ON c.id = e.course_id
WHERE c.is_published = TRUE
GROUP BY c.id, c.title
ORDER BY total_enrollments DESC; 