-- Migration: Create separate tables for different media types
-- This replaces the unified media_items table with type-specific tables

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

-- Update user_media to reference all media types via a polymorphic approach
-- We'll use a media_type and media_id approach instead of a single media_item_id

-- Drop the old foreign key constraint if it exists
ALTER TABLE user_media DROP CONSTRAINT IF EXISTS user_media_media_item_id_fkey;

-- Add new columns for polymorphic relationship
ALTER TABLE user_media 
  ADD COLUMN IF NOT EXISTS media_type VARCHAR(50) CHECK (media_type IN ('book', 'anime', 'manga', 'movie', 'music')),
  ADD COLUMN IF NOT EXISTS media_id UUID;

-- Create indexes for the new tables
CREATE INDEX IF NOT EXISTS idx_books_source ON books(source);
CREATE INDEX IF NOT EXISTS idx_anime_source ON anime(source);
CREATE INDEX IF NOT EXISTS idx_manga_source ON manga(source);
CREATE INDEX IF NOT EXISTS idx_movies_source ON movies(source);
CREATE INDEX IF NOT EXISTS idx_music_source ON music(source);

CREATE INDEX IF NOT EXISTS idx_user_media_media_type_id ON user_media(media_type, media_id);

-- Add triggers for updated_at
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

-- Migration: Copy existing data from media_items to new tables
-- This is a one-time migration that should be run after creating the tables

-- Migrate books
INSERT INTO books (source, source_item_id, title, genre, poster_url, created_at, updated_at)
SELECT source, source_item_id, title, genre, poster_url, created_at, updated_at
FROM media_items
WHERE type = 'book'
ON CONFLICT (source, source_item_id) DO NOTHING;

-- Migrate anime
INSERT INTO anime (source, source_item_id, title, genre, poster_url, created_at, updated_at)
SELECT source, source_item_id, title, genre, poster_url, created_at, updated_at
FROM media_items
WHERE type = 'anime'
ON CONFLICT (source, source_item_id) DO NOTHING;

-- Migrate manga
INSERT INTO manga (source, source_item_id, title, genre, poster_url, created_at, updated_at)
SELECT source, source_item_id, title, genre, poster_url, created_at, updated_at
FROM media_items
WHERE type = 'manga'
ON CONFLICT (source, source_item_id) DO NOTHING;

-- Migrate movies
INSERT INTO movies (source, source_item_id, title, genre, poster_url, created_at, updated_at)
SELECT source, source_item_id, title, genre, poster_url, created_at, updated_at
FROM media_items
WHERE type = 'movie'
ON CONFLICT (source, source_item_id) DO NOTHING;

-- Migrate music
INSERT INTO music (source, source_item_id, title, genre, poster_url, created_at, updated_at)
SELECT source, source_item_id, title, genre, poster_url, created_at, updated_at
FROM media_items
WHERE type = 'music'
ON CONFLICT (source, source_item_id) DO NOTHING;

-- Update user_media to use new polymorphic structure
-- First, update books
UPDATE user_media um
SET media_type = 'book', media_id = b.id
FROM books b
JOIN media_items mi ON mi.source = b.source AND mi.source_item_id = b.source_item_id
WHERE um.media_item_id = mi.id AND mi.type = 'book';

-- Update anime
UPDATE user_media um
SET media_type = 'anime', media_id = a.id
FROM anime a
JOIN media_items mi ON mi.source = a.source AND mi.source_item_id = a.source_item_id
WHERE um.media_item_id = mi.id AND mi.type = 'anime';

-- Update manga
UPDATE user_media um
SET media_type = 'manga', media_id = m.id
FROM manga m
JOIN media_items mi ON mi.source = m.source AND mi.source_item_id = m.source_item_id
WHERE um.media_item_id = mi.id AND mi.type = 'manga';

-- Update movies
UPDATE user_media um
SET media_type = 'movie', media_id = m.id
FROM movies m
JOIN media_items mi ON mi.source = m.source AND mi.source_item_id = m.source_item_id
WHERE um.media_item_id = mi.id AND mi.type = 'movie';

-- Update music
UPDATE user_media um
SET media_type = 'music', media_id = m.id
FROM music m
JOIN media_items mi ON mi.source = m.source AND mi.source_item_id = m.source_item_id
WHERE um.media_item_id = mi.id AND mi.type = 'music';

-- Update recommendations table to use polymorphic structure
ALTER TABLE recommendations
  ADD COLUMN IF NOT EXISTS media_type VARCHAR(50) CHECK (media_type IN ('book', 'anime', 'manga', 'movie', 'music')),
  ADD COLUMN IF NOT EXISTS media_id UUID;

-- Migrate recommendations
UPDATE recommendations r
SET media_type = 'book', media_id = b.id
FROM books b
JOIN media_items mi ON mi.source = b.source AND mi.source_item_id = b.source_item_id
WHERE r.recommended_item_id = mi.id AND mi.type = 'book';

UPDATE recommendations r
SET media_type = 'anime', media_id = a.id
FROM anime a
JOIN media_items mi ON mi.source = a.source AND mi.source_item_id = a.source_item_id
WHERE r.recommended_item_id = mi.id AND mi.type = 'anime';

UPDATE recommendations r
SET media_type = 'manga', media_id = m.id
FROM manga m
JOIN media_items mi ON mi.source = m.source AND mi.source_item_id = m.source_item_id
WHERE r.recommended_item_id = mi.id AND mi.type = 'manga';

UPDATE recommendations r
SET media_type = 'movie', media_id = m.id
FROM movies m
JOIN media_items mi ON mi.source = m.source AND mi.source_item_id = m.source_item_id
WHERE r.recommended_item_id = mi.id AND mi.type = 'movie';

UPDATE recommendations r
SET media_type = 'music', media_id = m.id
FROM music m
JOIN media_items mi ON mi.source = m.source AND mi.source_item_id = m.source_item_id
WHERE r.recommended_item_id = mi.id AND mi.type = 'music';

-- Create unique constraint on user_media for polymorphic relationship
ALTER TABLE user_media DROP CONSTRAINT IF EXISTS user_media_user_id_media_item_id_key;
CREATE UNIQUE INDEX IF NOT EXISTS user_media_user_type_id_unique ON user_media(user_id, media_type, media_id);




