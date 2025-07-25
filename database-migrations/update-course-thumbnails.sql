-- Update existing courses with sample thumbnail URLs
-- This script adds realistic thumbnail URLs to the existing courses

UPDATE courses 
SET thumbnail_url = 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=400&h=200&fit=crop&crop=center'
WHERE id = 1 AND title = 'Introduction to SvelteKit';

UPDATE courses 
SET thumbnail_url = 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=400&h=200&fit=crop&crop=center'
WHERE id = 2 AND title = 'Advanced SvelteKit Patterns';

UPDATE courses 
SET thumbnail_url = 'https://images.unsplash.com/photo-1551650975-87deedd944c3?w=400&h=200&fit=crop&crop=center'
WHERE id = 3 AND title = 'Building APIs with SvelteKit';

UPDATE courses 
SET thumbnail_url = 'https://images.unsplash.com/photo-1461749280684-dccba630e2f6?w=400&h=200&fit=crop&crop=center'
WHERE id = 4 AND title = 'Full-Stack Development with SvelteKit';

UPDATE courses 
SET thumbnail_url = 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=400&h=200&fit=crop&crop=center'
WHERE id = 5 AND title = 'SvelteKit Performance Optimization';

UPDATE courses 
SET thumbnail_url = 'https://images.unsplash.com/photo-1573164713714-d95e436ab8d6?w=400&h=200&fit=crop&crop=center'
WHERE id = 6 AND title = 'SvelteKit Testing Strategies';

-- Verify the updates
SELECT id, title, thumbnail_url FROM courses WHERE is_published = true; 