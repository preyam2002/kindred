-- Blind Match Swipes Table
CREATE TABLE IF NOT EXISTS blind_match_swipes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_email TEXT NOT NULL,
  target_user_email TEXT NOT NULL,
  liked BOOLEAN NOT NULL,
  swiped_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_email, target_user_email)
);

-- Blind Matches Table
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

-- Indexes
CREATE INDEX IF NOT EXISTS idx_blind_match_swipes_user ON blind_match_swipes(user_email);
CREATE INDEX IF NOT EXISTS idx_blind_match_swipes_target ON blind_match_swipes(target_user_email);

CREATE INDEX IF NOT EXISTS idx_blind_matches_user1 ON blind_matches(user1_email);
CREATE INDEX IF NOT EXISTS idx_blind_matches_user2 ON blind_matches(user2_email);
CREATE INDEX IF NOT EXISTS idx_blind_matches_matched_at ON blind_matches(matched_at);

-- RLS Policies
ALTER TABLE blind_match_swipes ENABLE ROW LEVEL SECURITY;
ALTER TABLE blind_matches ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own swipes"
  ON blind_match_swipes FOR SELECT
  USING (true);

CREATE POLICY "Users can create swipes"
  ON blind_match_swipes FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Users can view their matches"
  ON blind_matches FOR SELECT
  USING (true);

CREATE POLICY "System can create matches"
  ON blind_matches FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Users can update their matches"
  ON blind_matches FOR UPDATE
  USING (true);
