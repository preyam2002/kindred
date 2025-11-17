-- Drop All Database Objects
-- 
-- This script drops ALL tables, functions, triggers, policies, and indexes
-- to ensure a completely clean slate before running the reset script.
-- 
-- WARNING: This will DELETE ALL DATA and SCHEMA OBJECTS!

-- ============================================================================
-- STEP 1: DROP ALL POLICIES FIRST (to avoid dependency issues)
-- ============================================================================

DO $$
DECLARE
    r RECORD;
BEGIN
    -- Drop all policies
    FOR r IN (
        SELECT schemaname, tablename, policyname
        FROM pg_policies
        WHERE schemaname = 'public'
    ) LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON %I.%I CASCADE', 
            r.policyname, r.schemaname, r.tablename);
    END LOOP;
END $$;

-- ============================================================================
-- STEP 2: DROP ALL TRIGGERS
-- ============================================================================

DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN (
        SELECT trigger_schema, trigger_name, event_object_table
        FROM information_schema.triggers
        WHERE trigger_schema = 'public'
    ) LOOP
        EXECUTE format('DROP TRIGGER IF EXISTS %I ON %I.%I CASCADE',
            r.trigger_name, r.trigger_schema, r.event_object_table);
    END LOOP;
END $$;

-- ============================================================================
-- STEP 3: DROP ALL TABLES (CASCADE will handle dependencies)
-- ============================================================================

DROP TABLE IF EXISTS queue_votes CASCADE;
DROP TABLE IF EXISTS comment_likes CASCADE;
DROP TABLE IF EXISTS media_comments CASCADE;
DROP TABLE IF EXISTS blind_matches CASCADE;
DROP TABLE IF EXISTS blind_match_swipes CASCADE;
DROP TABLE IF EXISTS user_challenge_progress CASCADE;
DROP TABLE IF EXISTS user_streaks CASCADE;
DROP TABLE IF EXISTS taste_challenges CASCADE;
DROP TABLE IF EXISTS group_consensus_votes CASCADE;
DROP TABLE IF EXISTS group_consensus_candidates CASCADE;
DROP TABLE IF EXISTS group_consensus_participants CASCADE;
DROP TABLE IF EXISTS group_consensus_sessions CASCADE;
DROP TABLE IF EXISTS watch_together_progress_log CASCADE;
DROP TABLE IF EXISTS watch_together_participants CASCADE;
DROP TABLE IF EXISTS watch_together_sessions CASCADE;
DROP TABLE IF EXISTS collection_followers CASCADE;
DROP TABLE IF EXISTS collection_items CASCADE;
DROP TABLE IF EXISTS cross_media_collections CASCADE;
DROP TABLE IF EXISTS notifications CASCADE;
DROP TABLE IF EXISTS activity_feed CASCADE;
DROP TABLE IF EXISTS friendships CASCADE;
DROP TABLE IF EXISTS queue_items CASCADE;
DROP TABLE IF EXISTS collections CASCADE;
DROP TABLE IF EXISTS user_mood_preferences CASCADE;
DROP TABLE IF EXISTS media_moods CASCADE;
DROP TABLE IF EXISTS mood_tags CASCADE;
DROP TABLE IF EXISTS taste_matches CASCADE;
DROP TABLE IF EXISTS taste_profiles CASCADE;
DROP TABLE IF EXISTS share_clicks CASCADE;
DROP TABLE IF EXISTS viral_metrics CASCADE;
DROP TABLE IF EXISTS referrals CASCADE;
DROP TABLE IF EXISTS shares CASCADE;
DROP TABLE IF EXISTS waitlist_settings CASCADE;
DROP TABLE IF EXISTS waitlist CASCADE;
DROP TABLE IF EXISTS messages CASCADE;
DROP TABLE IF EXISTS conversations CASCADE;
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

-- ============================================================================
-- STEP 4: DROP ALL FUNCTIONS
-- ============================================================================

DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE;
DROP FUNCTION IF EXISTS update_conversation_on_message() CASCADE;
DROP FUNCTION IF EXISTS generate_waitlist_referral_code(VARCHAR) CASCADE;
DROP FUNCTION IF EXISTS update_waitlist_referral_counts() CASCADE;
DROP FUNCTION IF EXISTS recalculate_waitlist_positions() CASCADE;
DROP FUNCTION IF EXISTS generate_referral_code(UUID) CASCADE;
DROP FUNCTION IF EXISTS update_collections_updated_at() CASCADE;
DROP FUNCTION IF EXISTS update_collection_item_count() CASCADE;
DROP FUNCTION IF EXISTS update_notifications_updated_at() CASCADE;
DROP FUNCTION IF EXISTS get_queue_vote_count(UUID) CASCADE;

-- Drop any remaining functions
DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN (
        SELECT n.nspname as schema_name, p.proname as function_name, pg_get_function_identity_arguments(p.oid) as args
        FROM pg_proc p
        JOIN pg_namespace n ON p.pronamespace = n.oid
        WHERE n.nspname = 'public'
        AND p.prokind = 'f'  -- Only functions, not procedures
    ) LOOP
        BEGIN
            EXECUTE format('DROP FUNCTION IF EXISTS %I.%I(%s) CASCADE',
                r.schema_name, r.function_name, r.args);
        EXCEPTION WHEN OTHERS THEN
            -- Continue if function doesn't exist or has dependencies
            NULL;
        END;
    END LOOP;
END $$;

-- ============================================================================
-- STEP 5: DROP ALL SEQUENCES (if any remain)
-- ============================================================================

DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN (
        SELECT sequence_schema, sequence_name
        FROM information_schema.sequences
        WHERE sequence_schema = 'public'
    ) LOOP
        EXECUTE format('DROP SEQUENCE IF EXISTS %I.%I CASCADE',
            r.sequence_schema, r.sequence_name);
    END LOOP;
END $$;

-- ============================================================================
-- STEP 6: DROP ALL TYPES (if any custom types exist)
-- ============================================================================

DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN (
        SELECT n.nspname as schema_name, t.typname as type_name
        FROM pg_type t
        JOIN pg_namespace n ON t.typnamespace = n.oid
        WHERE n.nspname = 'public'
        AND t.typtype = 'c'  -- Composite types
    ) LOOP
        EXECUTE format('DROP TYPE IF EXISTS %I.%I CASCADE',
            r.schema_name, r.type_name);
    END LOOP;
END $$;

-- ============================================================================
-- COMPLETE! Database is now completely clean.
-- ============================================================================

DO $$
BEGIN
    RAISE NOTICE 'All database objects dropped successfully!';
    RAISE NOTICE 'You can now run the reset-db-complete.sql script to recreate everything.';
END $$;

