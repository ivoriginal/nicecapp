-- Fix the foreign key constraint for saved_coffees.user_id to add ON DELETE CASCADE
-- This will allow users to be deleted by automatically removing their saved coffees

-- Drop the existing foreign key constraint
ALTER TABLE public.saved_coffees DROP CONSTRAINT IF EXISTS saved_coffees_user_id_fkey;

-- Add the constraint back with ON DELETE CASCADE
ALTER TABLE public.saved_coffees ADD CONSTRAINT saved_coffees_user_id_fkey
  FOREIGN KEY (user_id)
  REFERENCES public.profiles (id)
  ON DELETE CASCADE; 