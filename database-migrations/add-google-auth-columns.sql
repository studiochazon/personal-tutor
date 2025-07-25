-- Add Google OAuth authentication columns to users table
-- This migration adds the missing columns that the authentication code expects

ALTER TABLE users 
ADD COLUMN google_id VARCHAR(255) UNIQUE NULL,
ADD COLUMN avatar_url VARCHAR(500) NULL,
ADD COLUMN email_verified BOOLEAN DEFAULT FALSE,
ADD COLUMN given_name VARCHAR(100) NULL,
ADD COLUMN family_name VARCHAR(100) NULL,
ADD COLUMN last_login TIMESTAMP NULL;

-- Add index for google_id lookups
CREATE INDEX idx_google_id ON users(google_id);

-- Add index for email_verified lookups
CREATE INDEX idx_email_verified ON users(email_verified); 