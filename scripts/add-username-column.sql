-- Function to add username column if it doesn't exist
CREATE OR REPLACE FUNCTION add_username_column()
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
    AND column_name = 'username'
  ) THEN
    -- Add the username column
    ALTER TABLE profiles ADD COLUMN username TEXT UNIQUE;
  END IF;
END;
$$; 