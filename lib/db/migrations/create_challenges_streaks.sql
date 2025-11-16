-- User Streaks Table
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

-- User Challenge Progress Table
CREATE TABLE IF NOT EXISTS user_challenge_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_email TEXT NOT NULL,
  challenge_id TEXT NOT NULL,
  completed BOOLEAN DEFAULT FALSE,
  progress INTEGER DEFAULT 0,
  points_earned INTEGER DEFAULT 0,
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_email, challenge_id, created_at::date)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_user_streaks_email ON user_streaks(user_email);
CREATE INDEX IF NOT EXISTS idx_user_challenge_progress_email ON user_challenge_progress(user_email);
CREATE INDEX IF NOT EXISTS idx_user_challenge_progress_challenge ON user_challenge_progress(challenge_id);
CREATE INDEX IF NOT EXISTS idx_user_challenge_progress_created ON user_challenge_progress(created_at);

-- RLS Policies
ALTER TABLE user_streaks ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_challenge_progress ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own streaks"
  ON user_streaks FOR SELECT
  USING (true);

CREATE POLICY "Users can update their own streaks"
  ON user_streaks FOR ALL
  USING (true);

CREATE POLICY "Users can view their own challenge progress"
  ON user_challenge_progress FOR SELECT
  USING (true);

CREATE POLICY "Users can update their own challenge progress"
  ON user_challenge_progress FOR ALL
  USING (true);
