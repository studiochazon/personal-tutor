-- Update users table for Google Identity Services authentication
-- Run this after the existing schema.sql

-- Add Google Identity Services fields to users table
ALTER TABLE users 
ADD COLUMN google_id VARCHAR(255) UNIQUE NULL,
ADD COLUMN avatar_url VARCHAR(500) NULL,
ADD COLUMN email_verified BOOLEAN DEFAULT FALSE,
ADD COLUMN given_name VARCHAR(100) NULL,
ADD COLUMN family_name VARCHAR(100) NULL,
ADD COLUMN last_login TIMESTAMP NULL,
ADD INDEX idx_google_id (google_id);

-- Make password_hash nullable for Google users
ALTER TABLE users MODIFY COLUMN password_hash VARCHAR(255) NULL;

-- Update existing users to mark email as verified (since they're in the system)
UPDATE users SET email_verified = TRUE WHERE email_verified = FALSE;

-- Create sessions table for JWT token management (optional, for token blacklisting)
CREATE TABLE IF NOT EXISTS user_sessions (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    token_id VARCHAR(255) UNIQUE NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user_id (user_id),
    INDEX idx_token_id (token_id),
    INDEX idx_expires_at (expires_at)
);

-- Add some sample Google users for testing (optional)
-- INSERT INTO users (email, name, google_id, email_verified, given_name, family_name) VALUES
-- ('test.user@gmail.com', 'Test User', '123456789012345678901', TRUE, 'Test', 'User'); 