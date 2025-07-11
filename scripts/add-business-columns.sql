-- Function to add business-specific columns if they don't exist
CREATE OR REPLACE FUNCTION add_business_columns()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Add rating column
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'profiles'
    AND column_name = 'rating'
  ) THEN
    ALTER TABLE profiles ADD COLUMN rating DECIMAL(3,1);
  END IF;

  -- Add review_count column
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'profiles'
    AND column_name = 'review_count'
  ) THEN
    ALTER TABLE profiles ADD COLUMN review_count INTEGER DEFAULT 0;
  END IF;

  -- Add cover_url column
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'profiles'
    AND column_name = 'cover_url'
  ) THEN
    ALTER TABLE profiles ADD COLUMN cover_url TEXT;
  END IF;
END;
$$;

-- Execute the function
SELECT add_business_columns(); 