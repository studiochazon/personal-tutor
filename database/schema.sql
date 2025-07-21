-- Personal Tutor AI MVP Database Schema
-- Generated from schema.json - keep in sync!

-- Create database (uncomment if needed)
-- CREATE DATABASE IF NOT EXISTS personal_tutor_ai;
-- USE personal_tutor_ai;

-- Users table
CREATE TABLE users (
    id INT PRIMARY KEY AUTO_INCREMENT,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    name VARCHAR(100) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_email (email)
);

-- Courses table
CREATE TABLE courses (
    id INT PRIMARY KEY AUTO_INCREMENT,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    thumbnail_url VARCHAR(500),
    difficulty ENUM('beginner', 'intermediate', 'advanced') DEFAULT 'beginner',
    estimated_duration INT,
    user_id INT NOT NULL,
    is_published BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user_id (user_id),
    INDEX idx_is_published (is_published),
    INDEX idx_difficulty (difficulty),
    INDEX idx_title (title)
);

-- Lessons table
CREATE TABLE lessons (
    id INT PRIMARY KEY AUTO_INCREMENT,
    course_id INT NOT NULL,
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    video_url VARCHAR(500),
    video_duration INT,
    video_title VARCHAR(255),
    order_index INT NOT NULL,
    estimated_duration INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE,
    INDEX idx_course_id (course_id),
    INDEX idx_order_index (order_index),
    UNIQUE KEY unique_course_order (course_id, order_index)
);

-- Progress table
CREATE TABLE progress (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    lesson_id INT NOT NULL,
    completed BOOLEAN DEFAULT FALSE,
    completed_at TIMESTAMP NULL,
    time_spent INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (lesson_id) REFERENCES lessons(id) ON DELETE CASCADE,
    UNIQUE KEY unique_user_lesson (user_id, lesson_id),
    INDEX idx_user_id (user_id),
    INDEX idx_lesson_id (lesson_id),
    INDEX idx_completed (completed)
);

-- Sample data for testing
INSERT INTO users (email, password_hash, name) VALUES
('admin@example.com', '$2b$10$example.hash.here', 'Admin User'),
('teacher@example.com', '$2b$10$example.hash.here', 'Teacher User'),
('instructor@example.com', '$2b$10$example.hash.here', 'Course Instructor');

INSERT INTO courses (title, description, difficulty, estimated_duration, user_id, is_published) VALUES
('Introduction to SvelteKit', 'Learn the basics of SvelteKit framework and build your first application. Perfect for beginners who want to create modern web applications.', 'beginner', 120, 1, TRUE),
('Advanced SvelteKit Patterns', 'Master advanced patterns and best practices for building scalable applications with SvelteKit.', 'intermediate', 180, 1, TRUE),
('Building APIs with SvelteKit', 'Create robust APIs using SvelteKit server-side capabilities and database integration.', 'intermediate', 150, 2, TRUE),
('Full-Stack Development with SvelteKit', 'Complete guide to building full-stack applications with SvelteKit, including authentication and deployment.', 'advanced', 240, 2, TRUE),
('SvelteKit Performance Optimization', 'Learn techniques to optimize your SvelteKit applications for speed and efficiency.', 'advanced', 90, 3, TRUE),
('SvelteKit Testing Strategies', 'Comprehensive testing strategies for SvelteKit applications including unit, integration, and E2E tests.', 'intermediate', 120, 3, TRUE);

INSERT INTO lessons (course_id, title, content, order_index, estimated_duration) VALUES
-- Course 1: Introduction to SvelteKit
(1, 'Getting Started with SvelteKit', '# Getting Started with SvelteKit\n\nWelcome to your first lesson! This lesson covers the basics of setting up a SvelteKit project.\n\n## What you will learn:\n- Installing SvelteKit\n- Creating your first page\n- Understanding the file structure\n\n## Code Example:\n```bash\nnpm create svelte@latest my-app\ncd my-app\nnpm install\nnpm run dev\n```\n\n## Key Concepts:\n- File-based routing\n- Component structure\n- Development server', 1, 15),
(1, 'Routing Basics', '# SvelteKit Routing\n\nLearn how routing works in SvelteKit and how to create different pages.\n\n## File-based Routing\nSvelteKit uses file-based routing where each file in the `routes` directory becomes a route.\n\n## Examples:\n- `routes/index.svelte` → `/`\n- `routes/about.svelte` → `/about`\n- `routes/blog/[id].svelte` → `/blog/123`\n\n## Dynamic Routes:\nDynamic routes allow you to create pages with parameters that can change.', 2, 20),
(1, 'Components and Props', '# Svelte Components\n\nComponents are the building blocks of Svelte applications.\n\n## Creating a Component\n```svelte\n<script>\n  export let name = "World";\n</script>\n\n<h1>Hello {name}!</h1>\n\n<style>\n  h1 {\n    color: blue;\n  }\n</style>\n```\n\n## Props and Events:\nLearn how to pass data between components and handle user interactions.', 3, 25),

-- Course 2: Advanced SvelteKit Patterns
(2, 'Advanced State Management', '# Advanced State Management\n\nLearn about stores and advanced state patterns in SvelteKit.\n\n## Svelte Stores\nStores allow you to share state between components.\n\n```javascript\nimport { writable } from \'svelte/store\';\n\nconst count = writable(0);\n```\n\n## Store Types:\n- Writable stores\n- Readable stores\n- Derived stores\n- Custom stores', 1, 30),
(2, 'Server-side Rendering', '# Server-side Rendering\n\nUnderstanding SSR and how to optimize your SvelteKit app.\n\n## Benefits of SSR:\n- Better SEO\n- Faster initial page load\n- Better accessibility\n\n## Implementation:\nLearn how to configure SSR for different deployment environments.', 2, 35),
(2, 'Form Handling and Validation', '# Form Handling and Validation\n\nMaster form handling in SvelteKit with proper validation.\n\n## Form Actions:\n```svelte\n<script>\n  export let form;\n</script>\n\n<form method="POST">\n  <input name="email" type="email" required>\n  <button type="submit">Submit</button>\n</form>\n```', 3, 25),

-- Course 3: Building APIs with SvelteKit
(3, 'API Routes Fundamentals', '# API Routes Fundamentals\n\nLearn how to create API endpoints in SvelteKit.\n\n## Creating API Routes:\n- `+server.js` files\n- HTTP methods (GET, POST, PUT, DELETE)\n- Request/response handling\n\n## Example:\n```javascript\n// routes/api/users/+server.js\nexport async function GET() {\n  return new Response(JSON.stringify({ users: [] }));\n}\n```', 1, 20),
(3, 'Database Integration', '# Database Integration\n\nConnect your SvelteKit API to a database.\n\n## Database Options:\n- MySQL/PostgreSQL\n- SQLite\n- MongoDB\n\n## Best Practices:\n- Connection pooling\n- Query optimization\n- Error handling', 2, 30),
(3, 'Authentication and Authorization', '# Authentication and Authorization\n\nImplement secure authentication in your SvelteKit APIs.\n\n## JWT Tokens:\n- Token generation\n- Token validation\n- Secure storage\n\n## Session Management:\nLearn about different session strategies.', 3, 25),

-- Course 4: Full-Stack Development
(4, 'Project Structure and Architecture', '# Project Structure and Architecture\n\nDesign scalable full-stack applications with SvelteKit.\n\n## Best Practices:\n- Folder organization\n- Code splitting\n- Performance optimization\n\n## Architecture Patterns:\n- MVC pattern\n- Repository pattern\n- Service layer pattern', 1, 30),
(4, 'Deployment Strategies', '# Deployment Strategies\n\nDeploy your SvelteKit applications to production.\n\n## Platform Options:\n- Vercel\n- Netlify\n- Railway\n- Self-hosted\n\n## Environment Configuration:\nLearn about environment variables and configuration management.', 2, 25),

-- Course 5: Performance Optimization
(5, 'Code Splitting and Lazy Loading', '# Code Splitting and Lazy Loading\n\nOptimize your SvelteKit app with code splitting.\n\n## Techniques:\n- Dynamic imports\n- Route-based splitting\n- Component lazy loading\n\n## Performance Metrics:\nLearn how to measure and improve performance.', 1, 20),
(5, 'Caching Strategies', '# Caching Strategies\n\nImplement effective caching for better performance.\n\n## Cache Types:\n- Browser caching\n- CDN caching\n- Application caching\n\n## Cache Invalidation:\nStrategies for keeping cache fresh.', 2, 25),

-- Course 6: Testing Strategies
(6, 'Unit Testing with Vitest', '# Unit Testing with Vitest\n\nWrite effective unit tests for your SvelteKit components.\n\n## Testing Setup:\n```bash\nnpm install -D vitest @testing-library/svelte\n```\n\n## Component Testing:\nLearn how to test Svelte components in isolation.', 1, 25),
(6, 'Integration Testing', '# Integration Testing\n\nTest the integration between different parts of your application.\n\n## API Testing:\n- Endpoint testing\n- Database integration tests\n- Authentication tests\n\n## Tools:\n- Playwright\n- Cypress\n- Supertest', 2, 30);

-- Create views for common queries
CREATE VIEW course_progress_view AS
SELECT 
    c.id as course_id,
    c.title as course_title,
    l.id as lesson_id,
    l.title as lesson_title,
    l.order_index,
    u.id as user_id,
    u.name as user_name,
    p.completed,
    p.completed_at,
    p.time_spent
FROM courses c
JOIN lessons l ON c.id = l.course_id
LEFT JOIN progress p ON l.id = p.lesson_id
LEFT JOIN users u ON p.user_id = u.id
WHERE c.is_published = TRUE
ORDER BY c.id, l.order_index;

-- Create stored procedures for common operations
DELIMITER //

CREATE PROCEDURE GetUserProgress(IN user_id_param INT)
BEGIN
    SELECT 
        c.id as course_id,
        c.title as course_title,
        COUNT(l.id) as total_lessons,
        COUNT(p.id) as completed_lessons,
        ROUND((COUNT(p.id) / COUNT(l.id)) * 100, 2) as completion_percentage
    FROM courses c
    JOIN lessons l ON c.id = l.course_id
    LEFT JOIN progress p ON l.id = p.lesson_id AND p.user_id = user_id_param AND p.completed = TRUE
    WHERE c.is_published = TRUE
    GROUP BY c.id, c.title
    ORDER BY c.title;
END //

CREATE PROCEDURE MarkLessonComplete(IN user_id_param INT, IN lesson_id_param INT)
BEGIN
    INSERT INTO progress (user_id, lesson_id, completed, completed_at)
    VALUES (user_id_param, lesson_id_param, TRUE, NOW())
    ON DUPLICATE KEY UPDATE 
        completed = TRUE,
        completed_at = NOW(),
        updated_at = NOW();
END //

DELIMITER ; 