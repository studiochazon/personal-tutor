-- Migration script to add video columns to lessons table
-- Run this script to update your existing database

USE personal_tutor_ai;

-- Add video columns to lessons table
ALTER TABLE lessons 
ADD COLUMN video_url VARCHAR(500) NULL,
ADD COLUMN video_duration INT NULL,
ADD COLUMN video_title VARCHAR(255) NULL;

-- Verify the columns were added
DESCRIBE lessons; 