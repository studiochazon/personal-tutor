-- Fix password_hash column to allow NULL values for Google OAuth users
-- Google OAuth users don't have passwords, so password_hash should be nullable

ALTER TABLE users MODIFY COLUMN password_hash VARCHAR(255) NULL; 