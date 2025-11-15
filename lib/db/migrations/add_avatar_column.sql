-- Migration: Add avatar column to users table if it doesn't exist
-- This migration ensures the avatar column exists in the users table

-- Check if column exists and add it if it doesn't
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'users' 
        AND column_name = 'avatar'
    ) THEN
        ALTER TABLE users ADD COLUMN avatar TEXT;
        RAISE NOTICE 'Added avatar column to users table';
    ELSE
        RAISE NOTICE 'avatar column already exists in users table';
    END IF;
END $$;




