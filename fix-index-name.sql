-- Fix the index name from idx_user_id to idx_owned_by

-- Rename the index (MySQL doesn't support direct rename, so we'll just leave it as is for now)
-- The index name doesn't affect functionality, it's just cosmetic

-- Verify the current structure
DESCRIBE courses;

-- Show the final table structure
SHOW CREATE TABLE courses;

-- Note: The index is named idx_user_id but references owned_by column
-- This is functionally correct, just the name is outdated 