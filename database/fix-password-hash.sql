-- Fix password_hash field to allow NULL values for Google users
ALTER TABLE users MODIFY COLUMN password_hash VARCHAR(255) NULL; 