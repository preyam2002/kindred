-- Taste Profiles Schema
-- Stores computed taste characteristics for users across all media types
-- Enables Taste DNA Profile and Taste Match Swiper features

-- Taste Profiles Table
-- Stores aggregated taste data for a user
CREATE TABLE IF NOT EXISTS taste_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  -- Genre preferences (top genres across all media)
  top_genres JSONB, -- { "anime": ["Action", "Sci-Fi"], "books": ["Fantasy"], ... }

  -- Rating statistics
  avg_rating DECIMAL(3, 2), -- Overall average rating
  rating_distribution JSONB, -- Count of ratings at each level: { "1-2": 5, "3-4": 10, ... }

  -- Consumption patterns
  total_items_count INTEGER DEFAULT 0,
  media_type_distribution JSONB, -- { "anime": 100, "books": 50, "music": 200, ... }

  -- Temporal data
  items_added_last_30_days INTEGER DEFAULT 0,
  avg_rating_trend JSONB, -- Rating averages over time: [{ "month": "2025-01", "avg": 7.5 }, ...]

  -- Taste characteristics (for matching)
  genre_diversity_score DECIMAL(3, 2), -- 0-10: How diverse are their genres?
  rating_generosity_score DECIMAL(3, 2), -- 0-10: How generous with high ratings?
  activity_score DECIMAL(3, 2), -- 0-10: How active recently?

  -- Computed taste vector (for similarity matching)
  taste_vector JSONB, -- Normalized vector of preferences for fast matching

  -- Metadata
  last_computed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,

  UNIQUE(user_id)
);

-- Taste Matches Table
-- Stores computed compatibility scores between users
CREATE TABLE IF NOT EXISTS taste_matches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user1_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  user2_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  -- Overall compatibility
  compatibility_score DECIMAL(5, 2) NOT NULL, -- 0-100 (MashScore)

  -- Detailed breakdown
  genre_overlap_score DECIMAL(5, 2), -- How much genre overlap?
  rating_correlation DECIMAL(5, 2), -- How similarly do they rate?
  shared_items_count INTEGER DEFAULT 0,

  -- Per-media-type scores
  anime_compatibility DECIMAL(5, 2),
  manga_compatibility DECIMAL(5, 2),
  book_compatibility DECIMAL(5, 2),
  movie_compatibility DECIMAL(5, 2),
  music_compatibility DECIMAL(5, 2),

  -- Match status (for Taste Match Swiper)
  user1_status VARCHAR(20), -- 'pending', 'liked', 'passed', 'matched'
  user2_status VARCHAR(20), -- 'pending', 'liked', 'passed', 'matched'
  matched_at TIMESTAMP WITH TIME ZONE, -- When both liked

  -- Metadata
  last_computed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,

  -- Ensure we don't duplicate pairs (user1 < user2)
  CONSTRAINT unique_user_pair UNIQUE(user1_id, user2_id),
  CONSTRAINT user_pair_order CHECK (user1_id < user2_id)
);

-- Mood Tags Table
-- Predefined mood tags for mood-based discovery
CREATE TABLE IF NOT EXISTS mood_tags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(50) NOT NULL UNIQUE, -- e.g., "happy", "sad", "energetic", "relaxing"
  description TEXT,
  category VARCHAR(50), -- e.g., "emotion", "energy_level", "social_context"
  emoji VARCHAR(10), -- Visual representation
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Media Mood Associations Table
-- Links media items to mood tags (can be user-contributed or AI-generated)
CREATE TABLE IF NOT EXISTS media_moods (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  media_type VARCHAR(20) NOT NULL, -- 'book', 'anime', 'manga', 'movie', 'music'
  media_id UUID NOT NULL, -- References the specific media table
  mood_tag_id UUID NOT NULL REFERENCES mood_tags(id) ON DELETE CASCADE,

  -- Confidence/strength of association
  strength DECIMAL(3, 2) DEFAULT 1.0, -- 0-1: How strongly does this mood apply?

  -- Source of association
  source VARCHAR(20) DEFAULT 'user', -- 'user', 'ai', 'admin'
  contributed_by UUID REFERENCES users(id) ON DELETE SET NULL, -- If user-contributed

  -- Voting/validation
  upvotes INTEGER DEFAULT 0,
  downvotes INTEGER DEFAULT 0,

  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,

  UNIQUE(media_type, media_id, mood_tag_id)
);

-- User Mood Preferences Table
-- Tracks which moods a user tends to enjoy
CREATE TABLE IF NOT EXISTS user_mood_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  mood_tag_id UUID NOT NULL REFERENCES mood_tags(id) ON DELETE CASCADE,

  -- Computed from their library
  affinity_score DECIMAL(3, 2), -- 0-1: How much do they like this mood?
  sample_count INTEGER DEFAULT 0, -- How many items contribute to this score?

  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,

  UNIQUE(user_id, mood_tag_id)
);

-- Indexes for performance
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

-- Seed some default mood tags
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

-- Comments
COMMENT ON TABLE taste_profiles IS 'Computed taste characteristics for users, enabling Taste DNA and matching';
COMMENT ON TABLE taste_matches IS 'Compatibility scores between user pairs for Taste Match Swiper';
COMMENT ON TABLE mood_tags IS 'Predefined mood/vibe tags for mood-based discovery';
COMMENT ON TABLE media_moods IS 'Associations between media items and mood tags';
COMMENT ON TABLE user_mood_preferences IS 'User affinity for different moods based on their library';
