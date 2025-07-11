-- Add cover_url column to profiles table
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS cover_url TEXT;

-- Add rating and review_count columns for business accounts
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS rating DECIMAL(2,1) DEFAULT NULL;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS review_count INTEGER DEFAULT 0; 