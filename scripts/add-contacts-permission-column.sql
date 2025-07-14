-- Function to add contacts_permission column if it doesn't exist
CREATE OR REPLACE FUNCTION add_contacts_permission_column()
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
    AND column_name = 'contacts_permission'
  ) THEN
    -- Add the contacts_permission column
    ALTER TABLE profiles ADD COLUMN contacts_permission BOOLEAN DEFAULT FALSE;
  END IF;
END;
$$;

-- Execute the function
SELECT add_contacts_permission_column();

-- Update existing profiles to have contacts_permission as false if null
UPDATE profiles
SET contacts_permission = FALSE
WHERE contacts_permission IS NULL; 