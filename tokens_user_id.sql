-- Run this in the Supabase SQL Editor to add the missing user_id column to the tokens table
-- This allows linking tokens to the authenticated user

DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='tokens' AND column_name='user_id') THEN
        ALTER TABLE tokens ADD COLUMN user_id UUID REFERENCES auth.users(id);
    END IF;
END $$;

-- Also ensure RLS policies allow the user to see their own tokens if user_id is present
-- (Optional but recommended if you have RLS enabled)
-- CREATE POLICY "Users can view their own tokens" ON tokens FOR SELECT USING (auth.uid() = user_id);

-- Refresh schema cache
NOTIFY pgrst, 'reload schema';
