-- Simple Database Reset Script for Development
-- 
-- This script drops all tables and recreates them from scratch.
-- WARNING: This will DELETE ALL DATA. Only use in development!
--
-- Usage in Supabase SQL Editor:
--   1. Copy this entire file
--   2. Paste into Supabase Dashboard > SQL Editor
--   3. Click "Run"
--
-- This is the easiest method - no scripts needed!

-- Drop all tables (CASCADE removes dependencies automatically)
DROP TABLE IF EXISTS recommendations CASCADE;
DROP TABLE IF EXISTS matches CASCADE;
DROP TABLE IF EXISTS user_media CASCADE;
DROP TABLE IF EXISTS music CASCADE;
DROP TABLE IF EXISTS movies CASCADE;
DROP TABLE IF EXISTS manga CASCADE;
DROP TABLE IF EXISTS anime CASCADE;
DROP TABLE IF EXISTS books CASCADE;
DROP TABLE IF EXISTS sources CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- Drop functions
DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE;

-- Now run the schema.sql file contents here, or just run schema.sql separately
-- After running this, go to Supabase SQL Editor and run:
--   1. lib/db/schema.sql
--   2. lib/db/migrations/setup_rls_policies.sql






