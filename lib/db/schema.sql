-- Database schema for kindred MVP

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

-- Conversations table (chat sessions)
CREATE TABLE IF NOT EXISTS conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  title VARCHAR(255) NOT NULL DEFAULT 'New Chat',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Messages table (chat messages within a conversation)
CREATE TABLE IF NOT EXISTS messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE NOT NULL,
  role VARCHAR(20) NOT NULL CHECK (role IN ('user', 'assistant')),
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Waitlist table
CREATE TABLE IF NOT EXISTS waitlist (
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
CREATE TABLE IF NOT EXISTS waitlist_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  setting_key VARCHAR(100) UNIQUE NOT NULL,
  setting_value JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Viral tracking tables
CREATE TABLE IF NOT EXISTS shares (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  share_type VARCHAR(50) NOT NULL CHECK (share_type IN ('match', 'profile', 'wrapped', 'challenge')),
  platform VARCHAR(50) NOT NULL CHECK (platform IN ('twitter', 'facebook', 'linkedin', 'instagram', 'copy_link', 'other')),
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS referrals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  referral_code VARCHAR(50) UNIQUE NOT NULL,
  referred_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  clicked_at TIMESTAMP WITH TIME ZONE,
  converted_at TIMESTAMP WITH TIME ZONE,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS share_clicks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  share_id UUID REFERENCES shares(id) ON DELETE CASCADE,
  referral_code VARCHAR(50),
  ip_address VARCHAR(50),
  user_agent TEXT,
  clicked_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS viral_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  date DATE NOT NULL UNIQUE,
  total_shares INTEGER DEFAULT 0,
  total_clicks INTEGER DEFAULT 0,
  total_conversions INTEGER DEFAULT 0,
  k_factor DECIMAL(5,2),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
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
CREATE INDEX IF NOT EXISTS idx_conversations_user_id ON conversations(user_id);
CREATE INDEX IF NOT EXISTS idx_conversations_updated_at ON conversations(updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_messages_conversation_id ON messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(conversation_id, created_at);
CREATE INDEX IF NOT EXISTS idx_waitlist_email ON waitlist(email);
CREATE INDEX IF NOT EXISTS idx_waitlist_referral_code ON waitlist(referral_code);
CREATE INDEX IF NOT EXISTS idx_waitlist_referred_by ON waitlist(referred_by);
CREATE INDEX IF NOT EXISTS idx_waitlist_position ON waitlist(position);
CREATE INDEX IF NOT EXISTS idx_waitlist_status ON waitlist(status);
CREATE INDEX IF NOT EXISTS idx_waitlist_created_at ON waitlist(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_shares_user_id ON shares(user_id);
CREATE INDEX IF NOT EXISTS idx_shares_created_at ON shares(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_shares_type ON shares(share_type);
CREATE INDEX IF NOT EXISTS idx_referrals_referrer_id ON referrals(referrer_id);
CREATE INDEX IF NOT EXISTS idx_referrals_code ON referrals(referral_code);
CREATE INDEX IF NOT EXISTS idx_referrals_referred_user ON referrals(referred_user_id);
CREATE INDEX IF NOT EXISTS idx_share_clicks_share_id ON share_clicks(share_id);
CREATE INDEX IF NOT EXISTS idx_viral_metrics_date ON viral_metrics(date DESC);

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

CREATE TRIGGER update_conversations_updated_at BEFORE UPDATE ON conversations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_waitlist_updated_at BEFORE UPDATE ON waitlist
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_waitlist_settings_updated_at BEFORE UPDATE ON waitlist_settings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_viral_metrics_updated_at BEFORE UPDATE ON viral_metrics
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Functions specific to waitlist and viral features
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

CREATE OR REPLACE FUNCTION update_conversation_on_message()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE conversations
  SET updated_at = NOW()
  WHERE id = NEW.conversation_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Additional triggers
CREATE TRIGGER update_conversation_timestamp AFTER INSERT ON messages
    FOR EACH ROW EXECUTE FUNCTION update_conversation_on_message();

CREATE TRIGGER update_referral_counts AFTER INSERT ON waitlist
    FOR EACH ROW EXECUTE FUNCTION update_waitlist_referral_counts();

-- Seed default waitlist settings
INSERT INTO waitlist_settings (setting_key, setting_value)
VALUES
  ('batch_invite_size', '50'::jsonb),
  ('auto_invite_enabled', 'false'::jsonb),
  ('invite_day', '"friday"'::jsonb)
ON CONFLICT (setting_key) DO NOTHING;

