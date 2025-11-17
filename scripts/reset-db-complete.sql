-- Complete Database Reset Script
-- 
-- This script completely resets the database by:
-- 1. Dropping all tables, functions, triggers, and policies
-- 2. Recreating everything from schema.sql and all migrations
-- 
-- WARNING: This will DELETE ALL DATA. Only use in development!
--
-- Usage in Supabase SQL Editor:
--   1. Copy this entire file
--   2. Paste into Supabase Dashboard > SQL Editor
--   3. Click "Run"
--
-- This ensures all schemas are correct and up-to-date.

-- ============================================================================
-- STEP 1: DROP ALL TABLES (in reverse dependency order)
-- ============================================================================

-- Drop tables with foreign key dependencies first
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
DROP TABLE IF EXISTS collection_items CASCADE; -- from collections migration
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
-- STEP 2: DROP ALL FUNCTIONS
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

-- ============================================================================
-- STEP 3: DROP ALL POLICIES (if any remain)
-- ============================================================================

-- Policies are automatically dropped when tables are dropped, but we'll be explicit
DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN (SELECT schemaname, tablename FROM pg_tables WHERE schemaname = 'public') LOOP
        EXECUTE 'DROP POLICY IF EXISTS "Users are viewable by everyone" ON ' || quote_ident(r.tablename);
        EXECUTE 'DROP POLICY IF EXISTS "Anyone can create a user account" ON ' || quote_ident(r.tablename);
        EXECUTE 'DROP POLICY IF EXISTS "Users can update profiles" ON ' || quote_ident(r.tablename);
    END LOOP;
END $$;

-- ============================================================================
-- STEP 4: RECREATE BASE SCHEMA (from schema.sql)
-- ============================================================================

-- Users table
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  username VARCHAR(50) UNIQUE NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  avatar TEXT,
  bio TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Sources table (external platform integrations)
CREATE TABLE sources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  source_name VARCHAR(50) NOT NULL CHECK (source_name IN ('goodreads', 'myanimelist', 'letterboxd', 'spotify')),
  source_user_id VARCHAR(255) NOT NULL,
  access_token TEXT,
  refresh_token TEXT,
  expires_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, source_name)
);

-- Books table
CREATE TABLE books (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source VARCHAR(50) NOT NULL CHECK (source IN ('goodreads')),
  source_item_id VARCHAR(255) NOT NULL,
  title VARCHAR(500) NOT NULL,
  author VARCHAR(500),
  isbn VARCHAR(20),
  genre TEXT[],
  poster_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(source, source_item_id)
);

-- Anime table
CREATE TABLE anime (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source VARCHAR(50) NOT NULL CHECK (source IN ('myanimelist')),
  source_item_id VARCHAR(255) NOT NULL,
  title VARCHAR(500) NOT NULL,
  genre TEXT[],
  poster_url TEXT,
  num_episodes INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(source, source_item_id)
);

-- Manga table
CREATE TABLE manga (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source VARCHAR(50) NOT NULL CHECK (source IN ('myanimelist')),
  source_item_id VARCHAR(255) NOT NULL,
  title VARCHAR(500) NOT NULL,
  genre TEXT[],
  poster_url TEXT,
  num_chapters INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(source, source_item_id)
);

-- Movies table
CREATE TABLE movies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source VARCHAR(50) NOT NULL CHECK (source IN ('letterboxd')),
  source_item_id VARCHAR(255) NOT NULL,
  title VARCHAR(500) NOT NULL,
  year INTEGER,
  genre TEXT[],
  poster_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(source, source_item_id)
);

-- Music table (songs/tracks)
CREATE TABLE music (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source VARCHAR(50) NOT NULL CHECK (source IN ('spotify')),
  source_item_id VARCHAR(255) NOT NULL,
  title VARCHAR(500) NOT NULL,
  artist VARCHAR(500),
  album VARCHAR(500),
  genre TEXT[],
  poster_url TEXT,
  duration_ms INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(source, source_item_id)
);

-- User media (junction table: user's interactions with media)
CREATE TABLE user_media (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  media_type VARCHAR(50) NOT NULL CHECK (media_type IN ('book', 'anime', 'manga', 'movie', 'music')),
  media_id UUID NOT NULL,
  rating INTEGER CHECK (rating >= 1 AND rating <= 10),
  timestamp TIMESTAMP WITH TIME ZONE NOT NULL,
  tags TEXT[],
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, media_type, media_id)
);

-- Matches table (similarity scores between users)
CREATE TABLE matches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user1_id UUID REFERENCES users(id) ON DELETE CASCADE,
  user2_id UUID REFERENCES users(id) ON DELETE CASCADE,
  similarity_score INTEGER NOT NULL CHECK (similarity_score >= 0 AND similarity_score <= 100),
  shared_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user1_id, user2_id),
  CHECK (user1_id != user2_id)
);

-- Recommendations table
CREATE TABLE recommendations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  media_type VARCHAR(50) NOT NULL CHECK (media_type IN ('book', 'anime', 'manga', 'movie', 'music')),
  media_id UUID NOT NULL,
  reason TEXT NOT NULL,
  score DECIMAL(5,2),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Conversations table (chat sessions)
CREATE TABLE conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  title VARCHAR(255) NOT NULL DEFAULT 'New Chat',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Messages table (chat messages within a conversation)
CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE NOT NULL,
  role VARCHAR(20) NOT NULL CHECK (role IN ('user', 'assistant')),
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Waitlist table
CREATE TABLE waitlist (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(255),
  referral_code VARCHAR(50) UNIQUE NOT NULL,
  referred_by VARCHAR(50),
  position INTEGER NOT NULL,
  referral_count INTEGER DEFAULT 0,
  status VARCHAR(50) NOT NULL CHECK (status IN ('pending', 'approved', 'rejected', 'converted')) DEFAULT 'pending',
  invited_at TIMESTAMP WITH TIME ZONE,
  converted_at TIMESTAMP WITH TIME ZONE,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Waitlist settings table
CREATE TABLE waitlist_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  setting_key VARCHAR(100) UNIQUE NOT NULL,
  setting_value JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Viral tracking tables
CREATE TABLE shares (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  share_type VARCHAR(50) NOT NULL CHECK (share_type IN ('match', 'profile', 'wrapped', 'challenge')),
  platform VARCHAR(50) NOT NULL CHECK (platform IN ('twitter', 'facebook', 'linkedin', 'instagram', 'copy_link', 'other')),
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE referrals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  referral_code VARCHAR(50) UNIQUE NOT NULL,
  referred_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  clicked_at TIMESTAMP WITH TIME ZONE,
  converted_at TIMESTAMP WITH TIME ZONE,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE share_clicks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  share_id UUID REFERENCES shares(id) ON DELETE CASCADE,
  referral_code VARCHAR(50),
  ip_address VARCHAR(50),
  user_agent TEXT,
  clicked_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE viral_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  date DATE NOT NULL UNIQUE,
  total_shares INTEGER DEFAULT 0,
  total_clicks INTEGER DEFAULT 0,
  total_conversions INTEGER DEFAULT 0,
  k_factor DECIMAL(5,2),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- STEP 5: CREATE INDEXES
-- ============================================================================

CREATE INDEX idx_sources_user_id ON sources(user_id);
CREATE INDEX idx_user_media_user_id ON user_media(user_id);
CREATE INDEX idx_user_media_media_type_id ON user_media(media_type, media_id);
CREATE INDEX idx_matches_user1_id ON matches(user1_id);
CREATE INDEX idx_matches_user2_id ON matches(user2_id);
CREATE INDEX idx_books_source ON books(source);
CREATE INDEX idx_anime_source ON anime(source);
CREATE INDEX idx_manga_source ON manga(source);
CREATE INDEX idx_movies_source ON movies(source);
CREATE INDEX idx_music_source ON music(source);
CREATE INDEX idx_conversations_user_id ON conversations(user_id);
CREATE INDEX idx_conversations_updated_at ON conversations(updated_at DESC);
CREATE INDEX idx_messages_conversation_id ON messages(conversation_id);
CREATE INDEX idx_messages_created_at ON messages(conversation_id, created_at);
CREATE INDEX idx_waitlist_email ON waitlist(email);
CREATE INDEX idx_waitlist_referral_code ON waitlist(referral_code);
CREATE INDEX idx_waitlist_referred_by ON waitlist(referred_by);
CREATE INDEX idx_waitlist_position ON waitlist(position);
CREATE INDEX idx_waitlist_status ON waitlist(status);
CREATE INDEX idx_waitlist_created_at ON waitlist(created_at DESC);
CREATE INDEX idx_shares_user_id ON shares(user_id);
CREATE INDEX idx_shares_created_at ON shares(created_at DESC);
CREATE INDEX idx_shares_type ON shares(share_type);
CREATE INDEX idx_referrals_referrer_id ON referrals(referrer_id);
CREATE INDEX idx_referrals_code ON referrals(referral_code);
CREATE INDEX idx_referrals_referred_user ON referrals(referred_user_id);
CREATE INDEX idx_share_clicks_share_id ON share_clicks(share_id);
CREATE INDEX idx_viral_metrics_date ON viral_metrics(date DESC);

-- ============================================================================
-- STEP 6: CREATE FUNCTIONS
-- ============================================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Waitlist functions
CREATE OR REPLACE FUNCTION generate_waitlist_referral_code(email_param VARCHAR)
RETURNS VARCHAR(50) AS $$
DECLARE
  code VARCHAR(50);
  attempts INTEGER := 0;
  max_attempts INTEGER := 10;
BEGIN
  LOOP
    code := upper(substring(md5(random()::text || email_param) from 1 for 6));
    IF NOT EXISTS (SELECT 1 FROM waitlist WHERE referral_code = code) THEN
      RETURN code;
    END IF;
    attempts := attempts + 1;
    IF attempts >= max_attempts THEN
      RAISE EXCEPTION 'Failed to generate unique waitlist referral code after % attempts', max_attempts;
    END IF;
  END LOOP;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION update_waitlist_referral_counts()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.referred_by IS NOT NULL THEN
    UPDATE waitlist
    SET referral_count = referral_count + 1
    WHERE referral_code = NEW.referred_by;
    UPDATE waitlist
    SET position = (
      SELECT COUNT(*) + 1
      FROM waitlist w2
      WHERE w2.referral_count > waitlist.referral_count
        OR (w2.referral_count = waitlist.referral_count AND w2.created_at < waitlist.created_at)
    )
    WHERE referral_code = NEW.referred_by;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION recalculate_waitlist_positions()
RETURNS void AS $$
BEGIN
  UPDATE waitlist
  SET position = ranked.new_position
  FROM (
    SELECT
      id,
      ROW_NUMBER() OVER (
        ORDER BY
          referral_count DESC,
          created_at ASC
      ) as new_position
    FROM waitlist
    WHERE status = 'pending'
  ) ranked
  WHERE waitlist.id = ranked.id;
END;
$$ LANGUAGE plpgsql;

-- Referral code function
CREATE OR REPLACE FUNCTION generate_referral_code(user_id_param UUID)
RETURNS VARCHAR(50) AS $$
DECLARE
  code VARCHAR(50);
  attempts INTEGER := 0;
  max_attempts INTEGER := 10;
BEGIN
  LOOP
    code := upper(substring(md5(random()::text || user_id_param::text) from 1 for 8));
    IF NOT EXISTS (SELECT 1 FROM referrals WHERE referral_code = code) THEN
      RETURN code;
    END IF;
    attempts := attempts + 1;
    IF attempts >= max_attempts THEN
      RAISE EXCEPTION 'Failed to generate unique referral code after % attempts', max_attempts;
    END IF;
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Conversation update function
CREATE OR REPLACE FUNCTION update_conversation_on_message()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE conversations
  SET updated_at = NOW()
  WHERE id = NEW.conversation_id;
  RETURN NEW;
END;
$$ language 'plpgsql';

-- ============================================================================
-- STEP 7: CREATE TRIGGERS
-- ============================================================================

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_sources_updated_at BEFORE UPDATE ON sources
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_books_updated_at BEFORE UPDATE ON books
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_anime_updated_at BEFORE UPDATE ON anime
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_manga_updated_at BEFORE UPDATE ON manga
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_movies_updated_at BEFORE UPDATE ON movies
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_music_updated_at BEFORE UPDATE ON music
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_media_updated_at BEFORE UPDATE ON user_media
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_matches_updated_at BEFORE UPDATE ON matches
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_conversations_updated_at BEFORE UPDATE ON conversations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_waitlist_updated_at BEFORE UPDATE ON waitlist
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_waitlist_settings_updated_at BEFORE UPDATE ON waitlist_settings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_viral_metrics_updated_at BEFORE UPDATE ON viral_metrics
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_conversation_timestamp AFTER INSERT ON messages
    FOR EACH ROW EXECUTE FUNCTION update_conversation_on_message();

CREATE TRIGGER update_referral_counts AFTER INSERT ON waitlist
    FOR EACH ROW EXECUTE FUNCTION update_waitlist_referral_counts();

-- ============================================================================
-- STEP 8: SEED DEFAULT DATA
-- ============================================================================

INSERT INTO waitlist_settings (setting_key, setting_value)
VALUES
  ('batch_invite_size', '50'::jsonb),
  ('auto_invite_enabled', 'false'::jsonb),
  ('invite_day', '"friday"'::jsonb)
ON CONFLICT (setting_key) DO NOTHING;

-- ============================================================================
-- STEP 9: APPLY MIGRATIONS (in order)
-- ============================================================================

-- Migration: Add user_media tracking fields
ALTER TABLE user_media
  ADD COLUMN IF NOT EXISTS status VARCHAR(50) CHECK (status IN ('completed', 'watching', 'reading', 'listening', 'plan_to_watch', 'plan_to_read', 'plan_to_listen', 'on_hold', 'dropped')),
  ADD COLUMN IF NOT EXISTS progress INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS progress_total INTEGER,
  ADD COLUMN IF NOT EXISTS times_consumed INTEGER DEFAULT 1,
  ADD COLUMN IF NOT EXISTS start_date TIMESTAMP WITH TIME ZONE,
  ADD COLUMN IF NOT EXISTS finish_date TIMESTAMP WITH TIME ZONE,
  ADD COLUMN IF NOT EXISTS is_favorite BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS notes TEXT,
  ADD COLUMN IF NOT EXISTS source_rating VARCHAR(50);

CREATE INDEX IF NOT EXISTS idx_user_media_status ON user_media(user_id, status);
CREATE INDEX IF NOT EXISTS idx_user_media_favorites ON user_media(user_id, is_favorite) WHERE is_favorite = TRUE;
CREATE INDEX IF NOT EXISTS idx_user_media_progress ON user_media(user_id, progress);

-- Migration: Create taste profiles
CREATE TABLE IF NOT EXISTS taste_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  top_genres JSONB,
  avg_rating DECIMAL(3, 2),
  rating_distribution JSONB,
  total_items_count INTEGER DEFAULT 0,
  media_type_distribution JSONB,
  items_added_last_30_days INTEGER DEFAULT 0,
  avg_rating_trend JSONB,
  genre_diversity_score DECIMAL(3, 2),
  rating_generosity_score DECIMAL(3, 2),
  activity_score DECIMAL(3, 2),
  taste_vector JSONB,
  last_computed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id)
);

CREATE TABLE IF NOT EXISTS taste_matches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user1_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  user2_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  compatibility_score DECIMAL(5, 2) NOT NULL,
  genre_overlap_score DECIMAL(5, 2),
  rating_correlation DECIMAL(5, 2),
  shared_items_count INTEGER DEFAULT 0,
  anime_compatibility DECIMAL(5, 2),
  manga_compatibility DECIMAL(5, 2),
  book_compatibility DECIMAL(5, 2),
  movie_compatibility DECIMAL(5, 2),
  music_compatibility DECIMAL(5, 2),
  user1_status VARCHAR(20),
  user2_status VARCHAR(20),
  matched_at TIMESTAMP WITH TIME ZONE,
  last_computed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT unique_user_pair UNIQUE(user1_id, user2_id),
  CONSTRAINT user_pair_order CHECK (user1_id < user2_id)
);

CREATE TABLE IF NOT EXISTS mood_tags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(50) NOT NULL UNIQUE,
  description TEXT,
  category VARCHAR(50),
  emoji VARCHAR(10),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS media_moods (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  media_type VARCHAR(20) NOT NULL,
  media_id UUID NOT NULL,
  mood_tag_id UUID NOT NULL REFERENCES mood_tags(id) ON DELETE CASCADE,
  strength DECIMAL(3, 2) DEFAULT 1.0,
  source VARCHAR(20) DEFAULT 'user',
  contributed_by UUID REFERENCES users(id) ON DELETE SET NULL,
  upvotes INTEGER DEFAULT 0,
  downvotes INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(media_type, media_id, mood_tag_id)
);

CREATE TABLE IF NOT EXISTS user_mood_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  mood_tag_id UUID NOT NULL REFERENCES mood_tags(id) ON DELETE CASCADE,
  affinity_score DECIMAL(3, 2),
  sample_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, mood_tag_id)
);

CREATE INDEX IF NOT EXISTS idx_taste_profiles_user_id ON taste_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_taste_profiles_last_computed ON taste_profiles(last_computed_at);
CREATE INDEX IF NOT EXISTS idx_taste_matches_user1 ON taste_matches(user1_id);
CREATE INDEX IF NOT EXISTS idx_taste_matches_user2 ON taste_matches(user2_id);
CREATE INDEX IF NOT EXISTS idx_taste_matches_compatibility ON taste_matches(compatibility_score DESC);
CREATE INDEX IF NOT EXISTS idx_taste_matches_matched ON taste_matches(matched_at) WHERE matched_at IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_media_moods_media ON media_moods(media_type, media_id);
CREATE INDEX IF NOT EXISTS idx_media_moods_mood_tag ON media_moods(mood_tag_id);
CREATE INDEX IF NOT EXISTS idx_media_moods_strength ON media_moods(strength DESC);
CREATE INDEX IF NOT EXISTS idx_user_mood_preferences_user ON user_mood_preferences(user_id);
CREATE INDEX IF NOT EXISTS idx_user_mood_preferences_affinity ON user_mood_preferences(affinity_score DESC);

INSERT INTO mood_tags (name, description, category, emoji) VALUES
  ('happy', 'Uplifting and joyful content', 'emotion', '😊'),
  ('sad', 'Melancholic and emotional content', 'emotion', '😢'),
  ('energetic', 'High-energy and exciting content', 'energy_level', '⚡'),
  ('relaxing', 'Calm and soothing content', 'energy_level', '😌'),
  ('thought-provoking', 'Deep and philosophical content', 'intellectual', '🤔'),
  ('escapist', 'Immersive fantasy and adventure', 'purpose', '🌟'),
  ('inspiring', 'Motivational and uplifting', 'emotion', '💪'),
  ('nostalgic', 'Reminiscent and sentimental', 'emotion', '🕰️'),
  ('thrilling', 'Suspenseful and intense', 'energy_level', '🎢'),
  ('cozy', 'Comfortable and warm content', 'atmosphere', '☕'),
  ('dark', 'Mature and serious themes', 'tone', '🌑'),
  ('lighthearted', 'Fun and easy-going', 'tone', '🎈'),
  ('romantic', 'Love and relationships', 'theme', '💕'),
  ('adventurous', 'Exploration and discovery', 'theme', '🗺️'),
  ('mysterious', 'Intrigue and puzzles', 'theme', '🔍')
ON CONFLICT (name) DO NOTHING;

-- Migration: Collections, Queue, Friends, Activity
CREATE TABLE IF NOT EXISTS collections (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  is_public BOOLEAN DEFAULT TRUE,
  is_collaborative BOOLEAN DEFAULT FALSE,
  item_count INTEGER DEFAULT 0,
  follower_count INTEGER DEFAULT 0,
  cover_image TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS collection_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  collection_id UUID NOT NULL REFERENCES collections(id) ON DELETE CASCADE,
  media_type TEXT NOT NULL CHECK (media_type IN ('book', 'anime', 'manga', 'movie', 'music')),
  media_id UUID NOT NULL,
  added_by_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  position INTEGER NOT NULL DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS queue_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  media_type TEXT NOT NULL CHECK (media_type IN ('book', 'anime', 'manga', 'movie', 'music')),
  media_id UUID NOT NULL,
  position INTEGER NOT NULL DEFAULT 0,
  priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high')),
  notes TEXT,
  added_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS friendships (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  friend_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'blocked')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, friend_id)
);

CREATE TABLE IF NOT EXISTS activity_feed (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  activity_type TEXT NOT NULL CHECK (activity_type IN ('rating', 'review', 'collection', 'friend', 'achievement')),
  content JSONB NOT NULL,
  is_public BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_collections_user_id ON collections(user_id);
CREATE INDEX IF NOT EXISTS idx_collections_is_public ON collections(is_public);
CREATE INDEX IF NOT EXISTS idx_collection_items_collection_id ON collection_items(collection_id);
CREATE INDEX IF NOT EXISTS idx_collection_items_media ON collection_items(media_type, media_id);
CREATE INDEX IF NOT EXISTS idx_queue_items_user_id ON queue_items(user_id);
CREATE INDEX IF NOT EXISTS idx_queue_items_position ON queue_items(user_id, position);
CREATE INDEX IF NOT EXISTS idx_friendships_user_id ON friendships(user_id);
CREATE INDEX IF NOT EXISTS idx_friendships_friend_id ON friendships(friend_id);
CREATE INDEX IF NOT EXISTS idx_friendships_status ON friendships(user_id, status);
CREATE INDEX IF NOT EXISTS idx_activity_feed_user_id ON activity_feed(user_id);
CREATE INDEX IF NOT EXISTS idx_activity_feed_created_at ON activity_feed(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_activity_feed_public ON activity_feed(is_public, created_at DESC);

CREATE OR REPLACE FUNCTION update_collections_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_collections_timestamp
  BEFORE UPDATE ON collections
  FOR EACH ROW
  EXECUTE FUNCTION update_collections_updated_at();

CREATE TRIGGER update_friendships_timestamp
  BEFORE UPDATE ON friendships
  FOR EACH ROW
  EXECUTE FUNCTION update_collections_updated_at();

CREATE OR REPLACE FUNCTION update_collection_item_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    UPDATE collections
    SET item_count = item_count - 1
    WHERE id = OLD.collection_id;
    RETURN OLD;
  ELSE
    UPDATE collections
    SET item_count = item_count + 1
    WHERE id = NEW.collection_id;
    RETURN NEW;
  END IF;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_collection_count_on_item_change
  AFTER INSERT OR DELETE ON collection_items
  FOR EACH ROW
  EXECUTE FUNCTION update_collection_item_count();

-- Migration: Notifications
CREATE TABLE IF NOT EXISTS notifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('match', 'challenge', 'comment', 'reply', 'streak', 'recommendation', 'system')),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  link TEXT,
  is_read BOOLEAN DEFAULT FALSE,
  actor_id UUID REFERENCES users(id) ON DELETE SET NULL,
  actor_username TEXT,
  actor_avatar TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_user_unread ON notifications(user_id, is_read) WHERE is_read = FALSE;

CREATE OR REPLACE FUNCTION update_notifications_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_notifications_timestamp
  BEFORE UPDATE ON notifications
  FOR EACH ROW
  EXECUTE FUNCTION update_notifications_updated_at();

-- Migration: Watch Together
CREATE TABLE IF NOT EXISTS watch_together_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  media_type VARCHAR(20) NOT NULL,
  media_id UUID NOT NULL,
  created_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  status VARCHAR(20) DEFAULT 'active',
  current_progress INTEGER DEFAULT 0,
  total_progress INTEGER,
  is_public BOOLEAN DEFAULT FALSE,
  requires_approval BOOLEAN DEFAULT TRUE,
  scheduled_for TIMESTAMP WITH TIME ZONE,
  recurrence VARCHAR(50),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  completed_at TIMESTAMP WITH TIME ZONE
);

CREATE TABLE IF NOT EXISTS watch_together_participants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES watch_together_sessions(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  status VARCHAR(20) DEFAULT 'active',
  role VARCHAR(20) DEFAULT 'member',
  personal_progress INTEGER DEFAULT 0,
  is_caught_up BOOLEAN DEFAULT TRUE,
  sessions_attended INTEGER DEFAULT 0,
  last_active_at TIMESTAMP WITH TIME ZONE,
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  left_at TIMESTAMP WITH TIME ZONE,
  UNIQUE(session_id, user_id)
);

CREATE TABLE IF NOT EXISTS watch_together_progress_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES watch_together_sessions(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  old_progress INTEGER NOT NULL,
  new_progress INTEGER NOT NULL,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS group_consensus_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  created_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  media_types VARCHAR(20)[],
  genres VARCHAR(100)[],
  min_rating DECIMAL(3, 2),
  max_duration_minutes INTEGER,
  voting_method VARCHAR(20) DEFAULT 'weighted',
  max_options INTEGER DEFAULT 10,
  is_public BOOLEAN DEFAULT FALSE,
  status VARCHAR(20) DEFAULT 'collecting',
  decided_media_type VARCHAR(20),
  decided_media_id UUID,
  decided_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  expires_at TIMESTAMP WITH TIME ZONE
);

CREATE TABLE IF NOT EXISTS group_consensus_participants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES group_consensus_sessions(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  has_voted BOOLEAN DEFAULT FALSE,
  voted_at TIMESTAMP WITH TIME ZONE,
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(session_id, user_id)
);

CREATE TABLE IF NOT EXISTS group_consensus_candidates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES group_consensus_sessions(id) ON DELETE CASCADE,
  media_type VARCHAR(20) NOT NULL,
  media_id UUID NOT NULL,
  suggested_by UUID REFERENCES users(id) ON DELETE SET NULL,
  total_votes INTEGER DEFAULT 0,
  weighted_score DECIMAL(5, 2) DEFAULT 0,
  average_predicted_rating DECIMAL(3, 2),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(session_id, media_type, media_id)
);

CREATE TABLE IF NOT EXISTS group_consensus_votes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES group_consensus_sessions(id) ON DELETE CASCADE,
  candidate_id UUID NOT NULL REFERENCES group_consensus_candidates(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  vote_type VARCHAR(20) NOT NULL,
  rank INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(session_id, candidate_id, user_id)
);

CREATE TABLE IF NOT EXISTS cross_media_collections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  cover_image_url TEXT,
  is_public BOOLEAN DEFAULT FALSE,
  is_collaborative BOOLEAN DEFAULT FALSE,
  item_count INTEGER DEFAULT 0,
  follower_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS collection_followers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  collection_id UUID NOT NULL REFERENCES cross_media_collections(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(collection_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_watch_together_sessions_creator ON watch_together_sessions(created_by);
CREATE INDEX IF NOT EXISTS idx_watch_together_sessions_status ON watch_together_sessions(status);
CREATE INDEX IF NOT EXISTS idx_watch_together_sessions_media ON watch_together_sessions(media_type, media_id);
CREATE INDEX IF NOT EXISTS idx_watch_together_participants_session ON watch_together_participants(session_id);
CREATE INDEX IF NOT EXISTS idx_watch_together_participants_user ON watch_together_participants(user_id);
CREATE INDEX IF NOT EXISTS idx_watch_together_participants_status ON watch_together_participants(status);
CREATE INDEX IF NOT EXISTS idx_watch_together_progress_session ON watch_together_progress_log(session_id);
CREATE INDEX IF NOT EXISTS idx_watch_together_progress_user ON watch_together_progress_log(user_id);
CREATE INDEX IF NOT EXISTS idx_group_consensus_sessions_creator ON group_consensus_sessions(created_by);
CREATE INDEX IF NOT EXISTS idx_group_consensus_sessions_status ON group_consensus_sessions(status);
CREATE INDEX IF NOT EXISTS idx_group_consensus_participants_session ON group_consensus_participants(session_id);
CREATE INDEX IF NOT EXISTS idx_group_consensus_participants_user ON group_consensus_participants(user_id);
CREATE INDEX IF NOT EXISTS idx_group_consensus_candidates_session ON group_consensus_candidates(session_id);
CREATE INDEX IF NOT EXISTS idx_group_consensus_candidates_score ON group_consensus_candidates(weighted_score DESC);
CREATE INDEX IF NOT EXISTS idx_group_consensus_votes_session ON group_consensus_votes(session_id);
CREATE INDEX IF NOT EXISTS idx_group_consensus_votes_candidate ON group_consensus_votes(candidate_id);
CREATE INDEX IF NOT EXISTS idx_group_consensus_votes_user ON group_consensus_votes(user_id);
CREATE INDEX IF NOT EXISTS idx_collections_user ON cross_media_collections(user_id);
CREATE INDEX IF NOT EXISTS idx_collections_public ON cross_media_collections(is_public) WHERE is_public = TRUE;
CREATE INDEX IF NOT EXISTS idx_collection_followers_collection ON collection_followers(collection_id);
CREATE INDEX IF NOT EXISTS idx_collection_followers_user ON collection_followers(user_id);

-- Migration: Taste Challenges
CREATE TABLE IF NOT EXISTS taste_challenges (
  id TEXT PRIMARY KEY,
  user_email TEXT NOT NULL,
  username TEXT NOT NULL,
  items JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() + INTERVAL '30 days'
);

CREATE INDEX IF NOT EXISTS idx_taste_challenges_user_email ON taste_challenges(user_email);
CREATE INDEX IF NOT EXISTS idx_taste_challenges_created_at ON taste_challenges(created_at);

-- Migration: Challenges & Streaks
CREATE TABLE IF NOT EXISTS user_streaks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_email TEXT NOT NULL UNIQUE,
  current_streak INTEGER DEFAULT 0,
  longest_streak INTEGER DEFAULT 0,
  last_activity_date TIMESTAMP WITH TIME ZONE,
  total_points INTEGER DEFAULT 0,
  level INTEGER DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS user_challenge_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_email TEXT NOT NULL,
  challenge_id TEXT NOT NULL,
  completed BOOLEAN DEFAULT FALSE,
  progress INTEGER DEFAULT 0,
  points_earned INTEGER DEFAULT 0,
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_date DATE DEFAULT CURRENT_DATE
);

CREATE INDEX IF NOT EXISTS idx_user_streaks_email ON user_streaks(user_email);
CREATE INDEX IF NOT EXISTS idx_user_challenge_progress_email ON user_challenge_progress(user_email);
CREATE INDEX IF NOT EXISTS idx_user_challenge_progress_challenge ON user_challenge_progress(challenge_id);
CREATE INDEX IF NOT EXISTS idx_user_challenge_progress_created ON user_challenge_progress(created_at);
-- Unique constraint: one challenge per user per day
CREATE UNIQUE INDEX IF NOT EXISTS idx_user_challenge_progress_unique ON user_challenge_progress(user_email, challenge_id, created_date);

-- Migration: Blind Match
CREATE TABLE IF NOT EXISTS blind_match_swipes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_email TEXT NOT NULL,
  target_user_email TEXT NOT NULL,
  liked BOOLEAN NOT NULL,
  swiped_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_email, target_user_email)
);

CREATE TABLE IF NOT EXISTS blind_matches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user1_email TEXT NOT NULL,
  user2_email TEXT NOT NULL,
  compatibility_score INTEGER NOT NULL,
  shared_genres TEXT[],
  chat_unlocked BOOLEAN DEFAULT FALSE,
  profile_revealed BOOLEAN DEFAULT FALSE,
  messages_exchanged INTEGER DEFAULT 0,
  matched_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_interaction_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user1_email, user2_email)
);

CREATE INDEX IF NOT EXISTS idx_blind_match_swipes_user ON blind_match_swipes(user_email);
CREATE INDEX IF NOT EXISTS idx_blind_match_swipes_target ON blind_match_swipes(target_user_email);
CREATE INDEX IF NOT EXISTS idx_blind_matches_user1 ON blind_matches(user1_email);
CREATE INDEX IF NOT EXISTS idx_blind_matches_user2 ON blind_matches(user2_email);
CREATE INDEX IF NOT EXISTS idx_blind_matches_matched_at ON blind_matches(matched_at);

-- Migration: Media Comments
CREATE TABLE IF NOT EXISTS media_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  media_id TEXT NOT NULL,
  media_type TEXT NOT NULL CHECK (media_type IN ('anime', 'manga', 'book', 'movie', 'music')),
  content TEXT NOT NULL,
  rating INTEGER CHECK (rating >= 1 AND rating <= 10),
  is_spoiler BOOLEAN DEFAULT FALSE,
  likes_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, media_id)
);

CREATE TABLE IF NOT EXISTS comment_likes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  comment_id UUID NOT NULL REFERENCES media_comments(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(comment_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_media_comments_media ON media_comments(media_id, media_type);
CREATE INDEX IF NOT EXISTS idx_media_comments_user ON media_comments(user_id);
CREATE INDEX IF NOT EXISTS idx_media_comments_created ON media_comments(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_comment_likes_comment ON comment_likes(comment_id);
CREATE INDEX IF NOT EXISTS idx_comment_likes_user ON comment_likes(user_id);

-- Migration: Queue Votes
CREATE TABLE IF NOT EXISTS queue_votes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  queue_item_id UUID NOT NULL REFERENCES queue_items(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(queue_item_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_queue_votes_queue_item ON queue_votes(queue_item_id);
CREATE INDEX IF NOT EXISTS idx_queue_votes_user ON queue_votes(user_id);

CREATE OR REPLACE FUNCTION get_queue_vote_count(queue_item_uuid UUID)
RETURNS INTEGER AS $$
  SELECT COUNT(*)::INTEGER
  FROM queue_votes
  WHERE queue_item_id = queue_item_uuid;
$$ LANGUAGE SQL STABLE;

-- ============================================================================
-- STEP 10: SETUP RLS POLICIES
-- ============================================================================

-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE sources ENABLE ROW LEVEL SECURITY;
ALTER TABLE books ENABLE ROW LEVEL SECURITY;
ALTER TABLE anime ENABLE ROW LEVEL SECURITY;
ALTER TABLE manga ENABLE ROW LEVEL SECURITY;
ALTER TABLE movies ENABLE ROW LEVEL SECURITY;
ALTER TABLE music ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_media ENABLE ROW LEVEL SECURITY;
ALTER TABLE matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE recommendations ENABLE ROW LEVEL SECURITY;
ALTER TABLE collections ENABLE ROW LEVEL SECURITY;
ALTER TABLE collection_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE queue_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE friendships ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_feed ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE taste_challenges ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_streaks ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_challenge_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE blind_match_swipes ENABLE ROW LEVEL SECURITY;
ALTER TABLE blind_matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE media_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE comment_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE queue_votes ENABLE ROW LEVEL SECURITY;

-- Users policies
CREATE POLICY "Users are viewable by everyone"
  ON users FOR SELECT USING (true);

CREATE POLICY "Anyone can create a user account"
  ON users FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can update profiles"
  ON users FOR UPDATE USING (true) WITH CHECK (true);

-- Sources policies
CREATE POLICY "Users can view all sources"
  ON sources FOR SELECT USING (true);

CREATE POLICY "Users can insert their own sources"
  ON sources FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can update their own sources"
  ON sources FOR UPDATE USING (true) WITH CHECK (true);

CREATE POLICY "Users can delete their own sources"
  ON sources FOR DELETE USING (true);

-- Media tables policies (Books, Anime, Manga, Movies, Music)
CREATE POLICY "Books are viewable by everyone" ON books FOR SELECT USING (true);
CREATE POLICY "Authenticated users can insert books" ON books FOR INSERT WITH CHECK (true);
CREATE POLICY "Authenticated users can update books" ON books FOR UPDATE USING (true) WITH CHECK (true);

CREATE POLICY "Anime are viewable by everyone" ON anime FOR SELECT USING (true);
CREATE POLICY "Authenticated users can insert anime" ON anime FOR INSERT WITH CHECK (true);
CREATE POLICY "Authenticated users can update anime" ON anime FOR UPDATE USING (true) WITH CHECK (true);

CREATE POLICY "Manga are viewable by everyone" ON manga FOR SELECT USING (true);
CREATE POLICY "Authenticated users can insert manga" ON manga FOR INSERT WITH CHECK (true);
CREATE POLICY "Authenticated users can update manga" ON manga FOR UPDATE USING (true) WITH CHECK (true);

CREATE POLICY "Movies are viewable by everyone" ON movies FOR SELECT USING (true);
CREATE POLICY "Authenticated users can insert movies" ON movies FOR INSERT WITH CHECK (true);
CREATE POLICY "Authenticated users can update movies" ON movies FOR UPDATE USING (true) WITH CHECK (true);

CREATE POLICY "Music is viewable by everyone" ON music FOR SELECT USING (true);
CREATE POLICY "Authenticated users can insert music" ON music FOR INSERT WITH CHECK (true);
CREATE POLICY "Authenticated users can update music" ON music FOR UPDATE USING (true) WITH CHECK (true);

-- User media policies
CREATE POLICY "User media is viewable by everyone" ON user_media FOR SELECT USING (true);
CREATE POLICY "Users can insert their own media" ON user_media FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can update their own media" ON user_media FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "Users can delete their own media" ON user_media FOR DELETE USING (true);

-- Matches policies
CREATE POLICY "Matches are viewable by everyone" ON matches FOR SELECT USING (true);
CREATE POLICY "Authenticated users can insert matches" ON matches FOR INSERT WITH CHECK (true);
CREATE POLICY "Authenticated users can update matches" ON matches FOR UPDATE USING (true) WITH CHECK (true);

-- Recommendations policies
CREATE POLICY "Recommendations are viewable by everyone" ON recommendations FOR SELECT USING (true);
CREATE POLICY "Authenticated users can insert recommendations" ON recommendations FOR INSERT WITH CHECK (true);

-- Collections policies
CREATE POLICY "Users can view public collections"
  ON collections FOR SELECT
  USING (is_public = TRUE OR auth.uid() = user_id);

CREATE POLICY "Users can manage their own collections"
  ON collections FOR ALL
  USING (auth.uid() = user_id);

-- Collection items policies
CREATE POLICY "Users can view public collection items"
  ON collection_items FOR SELECT
  USING (
    collection_id IN (
      SELECT id FROM collections WHERE is_public = TRUE OR user_id = auth.uid()
    )
  );

CREATE POLICY "Users can manage items in their collections"
  ON collection_items FOR ALL
  USING (
    collection_id IN (
      SELECT id FROM collections WHERE user_id = auth.uid()
    )
  );

-- Queue items policies
CREATE POLICY "Users can view their own queue"
  ON queue_items FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own queue"
  ON queue_items FOR ALL
  USING (auth.uid() = user_id);

-- Friendships policies
CREATE POLICY "Users can view their friendships"
  ON friendships FOR SELECT
  USING (auth.uid() = user_id OR auth.uid() = friend_id);

CREATE POLICY "Users can manage their friendships"
  ON friendships FOR ALL
  USING (auth.uid() = user_id);

-- Activity feed policies
CREATE POLICY "Users can view public activity"
  ON activity_feed FOR SELECT
  USING (is_public = TRUE OR auth.uid() = user_id);

CREATE POLICY "Users can manage their own activity"
  ON activity_feed FOR ALL
  USING (auth.uid() = user_id);

-- Notifications policies
CREATE POLICY "Users can view own notifications"
  ON notifications FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own notifications"
  ON notifications FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "System can insert notifications"
  ON notifications FOR INSERT
  WITH CHECK (true);

-- Taste challenges policies
CREATE POLICY "Anyone can read taste challenges"
  ON taste_challenges FOR SELECT
  USING (true);

CREATE POLICY "Users can create their own challenges"
  ON taste_challenges FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Users can delete their own challenges"
  ON taste_challenges FOR DELETE
  USING (auth.email() = user_email);

-- User streaks policies
CREATE POLICY "Users can view their own streaks"
  ON user_streaks FOR SELECT
  USING (true);

CREATE POLICY "Users can update their own streaks"
  ON user_streaks FOR ALL
  USING (true);

-- User challenge progress policies
CREATE POLICY "Users can view their own challenge progress"
  ON user_challenge_progress FOR SELECT
  USING (true);

CREATE POLICY "Users can update their own challenge progress"
  ON user_challenge_progress FOR ALL
  USING (true);

-- Blind match swipes policies
CREATE POLICY "Users can view their own swipes"
  ON blind_match_swipes FOR SELECT
  USING (true);

CREATE POLICY "Users can create swipes"
  ON blind_match_swipes FOR INSERT
  WITH CHECK (true);

-- Blind matches policies
CREATE POLICY "Users can view their matches"
  ON blind_matches FOR SELECT
  USING (true);

CREATE POLICY "System can create matches"
  ON blind_matches FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Users can update their matches"
  ON blind_matches FOR UPDATE
  USING (true);

-- Media comments policies
CREATE POLICY "Users can view all comments"
  ON media_comments FOR SELECT
  USING (true);

CREATE POLICY "Users can create their own comments"
  ON media_comments FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own comments"
  ON media_comments FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own comments"
  ON media_comments FOR DELETE
  USING (auth.uid() = user_id);

-- Comment likes policies
CREATE POLICY "Users can view all likes"
  ON comment_likes FOR SELECT
  USING (true);

CREATE POLICY "Users can create their own likes"
  ON comment_likes FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own likes"
  ON comment_likes FOR DELETE
  USING (auth.uid() = user_id);

-- Queue votes policies
CREATE POLICY "Users can view votes on their queue items"
  ON queue_votes FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM queue_items
      WHERE queue_items.id = queue_votes.queue_item_id
      AND queue_items.user_id = auth.uid()
    )
  );

CREATE POLICY "Friends can vote on queue items"
  ON queue_votes FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM queue_items qi
      JOIN friendships f ON (
        (f.user_id = qi.user_id AND f.friend_id = auth.uid())
        OR (f.friend_id = qi.user_id AND f.user_id = auth.uid())
      )
      WHERE qi.id = queue_item_id
      AND f.status = 'accepted'
    )
  );

CREATE POLICY "Users can delete their own votes"
  ON queue_votes FOR DELETE
  USING (user_id = auth.uid());

-- ============================================================================
-- COMPLETE!
-- ============================================================================

-- Verify tables were created
DO $$
DECLARE
    table_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO table_count
    FROM information_schema.tables
    WHERE table_schema = 'public'
    AND table_type = 'BASE TABLE';
    
    RAISE NOTICE 'Database reset complete! Created % tables.', table_count;
END $$;

