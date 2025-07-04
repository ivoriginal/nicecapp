-- Function to add location column if it doesn't exist
CREATE OR REPLACE FUNCTION add_location_column()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Check if the column exists
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'profiles'
    AND column_name = 'location'
  ) THEN
    -- Add the location column
    ALTER TABLE profiles ADD COLUMN location TEXT;
  END IF;
END;
$$;

-- Execute the function
SELECT add_location_column();

-- Update existing profiles to have empty location if null
UPDATE profiles
SET location = ''
WHERE location IS NULL; 