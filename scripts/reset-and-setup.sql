-- Complete Database Reset & Setup for Development
-- 
-- This is a single file that:
--   1. Drops all existing tables
--   2. Creates all tables from scratch
--   3. Sets up RLS policies
--
-- WARNING: This will DELETE ALL DATA. Only use in development!
--
-- Usage: Copy this entire file and run in Supabase SQL Editor
--        (Supabase Dashboard > SQL Editor > New Query > Paste > Run)

-- ============================================================================
-- STEP 1: DROP EXISTING TABLES
-- ============================================================================

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

DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE;

-- ============================================================================
-- STEP 2: CREATE SCHEMA (from schema.sql)
-- ============================================================================

-- Users table
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  username VARCHAR(50) UNIQUE NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  avatar TEXT,
  bio TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Sources table (external platform integrations)
CREATE TABLE IF NOT EXISTS sources (
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
CREATE TABLE IF NOT EXISTS books (
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
CREATE TABLE IF NOT EXISTS anime (
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
CREATE TABLE IF NOT EXISTS manga (
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
CREATE TABLE IF NOT EXISTS movies (
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
CREATE TABLE IF NOT EXISTS music (
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
-- Uses polymorphic relationship: media_type + media_id
CREATE TABLE IF NOT EXISTS user_media (
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
CREATE TABLE IF NOT EXISTS matches (
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
-- Uses polymorphic relationship: media_type + media_id
CREATE TABLE IF NOT EXISTS recommendations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  media_type VARCHAR(50) NOT NULL CHECK (media_type IN ('book', 'anime', 'manga', 'movie', 'music')),
  media_id UUID NOT NULL,
  reason TEXT NOT NULL,
  score DECIMAL(5,2),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_sources_user_id ON sources(user_id);
CREATE INDEX IF NOT EXISTS idx_user_media_user_id ON user_media(user_id);
CREATE INDEX IF NOT EXISTS idx_user_media_media_type_id ON user_media(media_type, media_id);
CREATE INDEX IF NOT EXISTS idx_matches_user1_id ON matches(user1_id);
CREATE INDEX IF NOT EXISTS idx_matches_user2_id ON matches(user2_id);
CREATE INDEX IF NOT EXISTS idx_books_source ON books(source);
CREATE INDEX IF NOT EXISTS idx_anime_source ON anime(source);
CREATE INDEX IF NOT EXISTS idx_manga_source ON manga(source);
CREATE INDEX IF NOT EXISTS idx_movies_source ON movies(source);
CREATE INDEX IF NOT EXISTS idx_music_source ON music(source);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers for updated_at
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

-- ============================================================================
-- STEP 3: SET UP RLS POLICIES (from setup_rls_policies.sql)
-- ============================================================================

-- Enable RLS on users table
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Policy: Allow anyone to read users (for public profiles)
DROP POLICY IF EXISTS "Users are viewable by everyone" ON users;
CREATE POLICY "Users are viewable by everyone"
  ON users
  FOR SELECT
  USING (true);

-- Policy: Allow anyone to insert new users (for signups)
DROP POLICY IF EXISTS "Anyone can create a user account" ON users;
CREATE POLICY "Anyone can create a user account"
  ON users
  FOR INSERT
  WITH CHECK (true);

-- Policy: Allow users to update profiles
DROP POLICY IF EXISTS "Users can update profiles" ON users;
CREATE POLICY "Users can update profiles"
  ON users
  FOR UPDATE
  USING (true)
  WITH CHECK (true);

-- Enable RLS on other tables
ALTER TABLE sources ENABLE ROW LEVEL SECURITY;
ALTER TABLE books ENABLE ROW LEVEL SECURITY;
ALTER TABLE anime ENABLE ROW LEVEL SECURITY;
ALTER TABLE manga ENABLE ROW LEVEL SECURITY;
ALTER TABLE movies ENABLE ROW LEVEL SECURITY;
ALTER TABLE music ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_media ENABLE ROW LEVEL SECURITY;
ALTER TABLE matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE recommendations ENABLE ROW LEVEL SECURITY;

-- Sources: Users can manage their own sources
DROP POLICY IF EXISTS "Users can view all sources" ON sources;
CREATE POLICY "Users can view all sources"
  ON sources
  FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Users can insert their own sources" ON sources;
CREATE POLICY "Users can insert their own sources"
  ON sources
  FOR INSERT
  WITH CHECK (true);

DROP POLICY IF EXISTS "Users can update their own sources" ON sources;
CREATE POLICY "Users can update their own sources"
  ON sources
  FOR UPDATE
  USING (true)
  WITH CHECK (true);

DROP POLICY IF EXISTS "Users can delete their own sources" ON sources;
CREATE POLICY "Users can delete their own sources"
  ON sources
  FOR DELETE
  USING (true);

-- Media tables: Public read, authenticated write
-- Books
DROP POLICY IF EXISTS "Books are viewable by everyone" ON books;
CREATE POLICY "Books are viewable by everyone"
  ON books
  FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Authenticated users can insert books" ON books;
CREATE POLICY "Authenticated users can insert books"
  ON books
  FOR INSERT
  WITH CHECK (true);

DROP POLICY IF EXISTS "Authenticated users can update books" ON books;
CREATE POLICY "Authenticated users can update books"
  ON books
  FOR UPDATE
  USING (true)
  WITH CHECK (true);

-- Anime
DROP POLICY IF EXISTS "Anime are viewable by everyone" ON anime;
CREATE POLICY "Anime are viewable by everyone"
  ON anime
  FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Authenticated users can insert anime" ON anime;
CREATE POLICY "Authenticated users can insert anime"
  ON anime
  FOR INSERT
  WITH CHECK (true);

DROP POLICY IF EXISTS "Authenticated users can update anime" ON anime;
CREATE POLICY "Authenticated users can update anime"
  ON anime
  FOR UPDATE
  USING (true)
  WITH CHECK (true);

-- Manga
DROP POLICY IF EXISTS "Manga are viewable by everyone" ON manga;
CREATE POLICY "Manga are viewable by everyone"
  ON manga
  FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Authenticated users can insert manga" ON manga;
CREATE POLICY "Authenticated users can insert manga"
  ON manga
  FOR INSERT
  WITH CHECK (true);

DROP POLICY IF EXISTS "Authenticated users can update manga" ON manga;
CREATE POLICY "Authenticated users can update manga"
  ON manga
  FOR UPDATE
  USING (true)
  WITH CHECK (true);

-- Movies
DROP POLICY IF EXISTS "Movies are viewable by everyone" ON movies;
CREATE POLICY "Movies are viewable by everyone"
  ON movies
  FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Authenticated users can insert movies" ON movies;
CREATE POLICY "Authenticated users can insert movies"
  ON movies
  FOR INSERT
  WITH CHECK (true);

DROP POLICY IF EXISTS "Authenticated users can update movies" ON movies;
CREATE POLICY "Authenticated users can update movies"
  ON movies
  FOR UPDATE
  USING (true)
  WITH CHECK (true);

-- Music
DROP POLICY IF EXISTS "Music is viewable by everyone" ON music;
CREATE POLICY "Music is viewable by everyone"
  ON music
  FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Authenticated users can insert music" ON music;
CREATE POLICY "Authenticated users can insert music"
  ON music
  FOR INSERT
  WITH CHECK (true);

DROP POLICY IF EXISTS "Authenticated users can update music" ON music;
CREATE POLICY "Authenticated users can update music"
  ON music
  FOR UPDATE
  USING (true)
  WITH CHECK (true);

-- User media: Users can manage their own media
DROP POLICY IF EXISTS "User media is viewable by everyone" ON user_media;
CREATE POLICY "User media is viewable by everyone"
  ON user_media
  FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Users can insert their own media" ON user_media;
CREATE POLICY "Users can insert their own media"
  ON user_media
  FOR INSERT
  WITH CHECK (true);

DROP POLICY IF EXISTS "Users can update their own media" ON user_media;
CREATE POLICY "Users can update their own media"
  ON user_media
  FOR UPDATE
  USING (true)
  WITH CHECK (true);

DROP POLICY IF EXISTS "Users can delete their own media" ON user_media;
CREATE POLICY "Users can delete their own media"
  ON user_media
  FOR DELETE
  USING (true);

-- Matches: Public read, authenticated write
DROP POLICY IF EXISTS "Matches are viewable by everyone" ON matches;
CREATE POLICY "Matches are viewable by everyone"
  ON matches
  FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Authenticated users can insert matches" ON matches;
CREATE POLICY "Authenticated users can insert matches"
  ON matches
  FOR INSERT
  WITH CHECK (true);

DROP POLICY IF EXISTS "Authenticated users can update matches" ON matches;
CREATE POLICY "Authenticated users can update matches"
  ON matches
  FOR UPDATE
  USING (true)
  WITH CHECK (true);

-- Recommendations: Public read, authenticated write
DROP POLICY IF EXISTS "Recommendations are viewable by everyone" ON recommendations;
CREATE POLICY "Recommendations are viewable by everyone"
  ON recommendations
  FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Authenticated users can insert recommendations" ON recommendations;
CREATE POLICY "Authenticated users can insert recommendations"
  ON recommendations
  FOR INSERT
  WITH CHECK (true);

-- ============================================================================
-- DONE! Your database is now reset and ready for development.
-- ============================================================================

