-- Fix all foreign key constraints that reference profiles(id) to enable user deletion
-- This will allow users to be deleted by automatically handling dependent records

-- 1. Fix saved_coffees.user_id constraint (add ON DELETE CASCADE)
-- When a user is deleted, remove all their saved coffees
ALTER TABLE public.saved_coffees DROP CONSTRAINT IF EXISTS saved_coffees_user_id_fkey;
ALTER TABLE public.saved_coffees ADD CONSTRAINT saved_coffees_user_id_fkey
  FOREIGN KEY (user_id)
  REFERENCES public.profiles (id)
  ON DELETE CASCADE;

-- 2. Fix recipes.author_id constraint (add ON DELETE CASCADE)
-- When a user is deleted, delete all recipes they created
ALTER TABLE public.recipes DROP CONSTRAINT IF EXISTS recipes_author_id_fkey;
ALTER TABLE public.recipes ADD CONSTRAINT recipes_author_id_fkey
  FOREIGN KEY (author_id)
  REFERENCES public.profiles (id)
  ON DELETE CASCADE;

-- 3. Fix coffee_events.user_id constraint if the table exists (add ON DELETE CASCADE)
-- When a user is deleted, remove all their coffee events/logs
DO $$
BEGIN
  -- Check if coffee_events table exists
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'coffee_events') THEN
    -- Drop existing constraint if it exists
    ALTER TABLE public.coffee_events DROP CONSTRAINT IF EXISTS coffee_events_user_id_fkey;
    
    -- Add new constraint with ON DELETE CASCADE
    ALTER TABLE public.coffee_events ADD CONSTRAINT coffee_events_user_id_fkey
      FOREIGN KEY (user_id)
      REFERENCES public.profiles (id)
      ON DELETE CASCADE;
      
    RAISE NOTICE 'Fixed coffee_events.user_id foreign key constraint';
  ELSE
    RAISE NOTICE 'coffee_events table does not exist, skipping';
  END IF;
END $$;

-- 4. Ensure coffees table does NOT have any foreign key to profiles
-- Coffees should remain in the database even when users are deleted
-- (This is just a check - coffees table should not reference profiles directly)

-- 5. Check for any other tables that might reference profiles
-- This query will help identify any other foreign key relationships we might have missed
DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN (
        SELECT
            tc.table_name,
            kcu.column_name,
            ccu.table_name AS foreign_table_name,
            ccu.column_name AS foreign_column_name,
            tc.constraint_name
        FROM
            information_schema.table_constraints AS tc
            JOIN information_schema.key_column_usage AS kcu
              ON tc.constraint_name = kcu.constraint_name
            JOIN information_schema.constraint_column_usage AS ccu
              ON ccu.constraint_name = tc.constraint_name
        WHERE
            tc.constraint_type = 'FOREIGN KEY'
            AND ccu.table_name = 'profiles'
            AND ccu.column_name = 'id'
            AND tc.table_name NOT IN ('saved_coffees', 'recipes', 'coffee_events')
    ) LOOP
        RAISE NOTICE 'Found additional foreign key: %.% -> %.%',
            r.table_name, r.column_name, r.foreign_table_name, r.foreign_column_name;
    END LOOP;
END $$; 