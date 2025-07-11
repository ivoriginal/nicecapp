-- Function to add account_type column if it doesn't exist
CREATE OR REPLACE FUNCTION add_account_type_column()
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
    AND column_name = 'account_type'
  ) THEN
    -- Add the account_type column
    ALTER TABLE profiles ADD COLUMN account_type TEXT DEFAULT 'user';
  END IF;
END;
$$;

-- Execute the function
SELECT add_account_type_column();

-- Update existing profiles to have 'user' as default account_type if null
UPDATE profiles
SET account_type = 'user'
WHERE account_type IS NULL; 