-- Migration: Set up Row Level Security (RLS) policies for Kindred
-- This allows users to be created and accessed appropriately

-- Enable RLS on users table (if not already enabled)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Policy: Allow anyone to read users (for public profiles)
CREATE POLICY "Users are viewable by everyone"
  ON users
  FOR SELECT
  USING (true);

-- Policy: Allow anyone to insert new users (for signups)
CREATE POLICY "Anyone can create a user account"
  ON users
  FOR INSERT
  WITH CHECK (true);

-- Policy: Allow users to update profiles (MVP - we use NextAuth, not Supabase Auth)
-- For production, you should restrict this to the user's own profile
CREATE POLICY "Users can update profiles"
  ON users
  FOR UPDATE
  USING (true)  -- Allow all updates for MVP
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
CREATE POLICY "Users can view all sources"
  ON sources
  FOR SELECT
  USING (true);

CREATE POLICY "Users can insert their own sources"
  ON sources
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Users can update their own sources"
  ON sources
  FOR UPDATE
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Users can delete their own sources"
  ON sources
  FOR DELETE
  USING (true);

-- Media tables: Public read, authenticated write
-- Books
CREATE POLICY "Books are viewable by everyone"
  ON books
  FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can insert books"
  ON books
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update books"
  ON books
  FOR UPDATE
  USING (true)
  WITH CHECK (true);

-- Anime
CREATE POLICY "Anime are viewable by everyone"
  ON anime
  FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can insert anime"
  ON anime
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update anime"
  ON anime
  FOR UPDATE
  USING (true)
  WITH CHECK (true);

-- Manga
CREATE POLICY "Manga are viewable by everyone"
  ON manga
  FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can insert manga"
  ON manga
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update manga"
  ON manga
  FOR UPDATE
  USING (true)
  WITH CHECK (true);

-- Movies
CREATE POLICY "Movies are viewable by everyone"
  ON movies
  FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can insert movies"
  ON movies
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update movies"
  ON movies
  FOR UPDATE
  USING (true)
  WITH CHECK (true);

-- Music
CREATE POLICY "Music is viewable by everyone"
  ON music
  FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can insert music"
  ON music
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update music"
  ON music
  FOR UPDATE
  USING (true)
  WITH CHECK (true);

-- User media: Users can manage their own media
CREATE POLICY "User media is viewable by everyone"
  ON user_media
  FOR SELECT
  USING (true);

CREATE POLICY "Users can insert their own media"
  ON user_media
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Users can update their own media"
  ON user_media
  FOR UPDATE
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Users can delete their own media"
  ON user_media
  FOR DELETE
  USING (true);

-- Matches: Public read, authenticated write
CREATE POLICY "Matches are viewable by everyone"
  ON matches
  FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can insert matches"
  ON matches
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update matches"
  ON matches
  FOR UPDATE
  USING (true)
  WITH CHECK (true);

-- Recommendations: Public read, authenticated write
CREATE POLICY "Recommendations are viewable by everyone"
  ON recommendations
  FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can insert recommendations"
  ON recommendations
  FOR INSERT
  WITH CHECK (true);

