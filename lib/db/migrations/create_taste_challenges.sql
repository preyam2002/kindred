-- Create taste_challenges table for taste compatibility game
CREATE TABLE IF NOT EXISTS taste_challenges (
  id TEXT PRIMARY KEY,
  user_email TEXT NOT NULL,
  username TEXT NOT NULL,
  items JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() + INTERVAL '30 days'
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_taste_challenges_user_email ON taste_challenges(user_email);
CREATE INDEX IF NOT EXISTS idx_taste_challenges_created_at ON taste_challenges(created_at);

-- Add RLS policies
ALTER TABLE taste_challenges ENABLE ROW LEVEL SECURITY;

-- Anyone can read challenges (they're meant to be shared)
CREATE POLICY "Anyone can read taste challenges"
  ON taste_challenges FOR SELECT
  USING (true);

-- Users can create their own challenges
CREATE POLICY "Users can create their own challenges"
  ON taste_challenges FOR INSERT
  WITH CHECK (true);

-- Users can delete their own challenges
CREATE POLICY "Users can delete their own challenges"
  ON taste_challenges FOR DELETE
  USING (auth.email() = user_email);
