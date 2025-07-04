-- Function to add gear column if it doesn't exist
CREATE OR REPLACE FUNCTION add_gear_column()
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
    AND column_name = 'gear'
  ) THEN
    -- Add the gear column as a text array
    ALTER TABLE profiles ADD COLUMN gear TEXT[];
  END IF;
END;
$$;

-- Execute the function
SELECT add_gear_column();

-- Update existing profiles to have empty gear array if null
UPDATE profiles
SET gear = '{}'::TEXT[]
WHERE gear IS NULL; 