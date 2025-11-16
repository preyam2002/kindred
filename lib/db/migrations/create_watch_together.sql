-- Watch Together & Group Features Schema
-- Enables collaborative consumption tracking and group consensus features

-- Watch Together Sessions Table
-- Tracks shared viewing/reading sessions between users
CREATE TABLE IF NOT EXISTS watch_together_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL, -- e.g., "Me & Sarah's Anime Watch"
  description TEXT,

  -- Media being consumed together
  media_type VARCHAR(20) NOT NULL, -- 'book', 'anime', 'manga', 'movie', 'music'
  media_id UUID NOT NULL, -- References the specific media table

  -- Session creator
  created_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  -- Session status
  status VARCHAR(20) DEFAULT 'active', -- 'active', 'completed', 'paused', 'abandoned'

  -- Progress tracking
  current_progress INTEGER DEFAULT 0, -- Current episode/chapter/etc.
  total_progress INTEGER, -- Total episodes/chapters/etc.

  -- Session settings
  is_public BOOLEAN DEFAULT FALSE, -- Can others discover and join?
  requires_approval BOOLEAN DEFAULT TRUE, -- Must creator approve new members?

  -- Scheduling (optional)
  scheduled_for TIMESTAMP WITH TIME ZONE, -- When is next session?
  recurrence VARCHAR(50), -- 'weekly', 'biweekly', 'monthly', null

  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  completed_at TIMESTAMP WITH TIME ZONE
);

-- Watch Together Participants Table
-- Users participating in a watch together session
CREATE TABLE IF NOT EXISTS watch_together_participants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES watch_together_sessions(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  -- Participant status
  status VARCHAR(20) DEFAULT 'active', -- 'pending', 'active', 'left'
  role VARCHAR(20) DEFAULT 'member', -- 'creator', 'moderator', 'member'

  -- Individual progress (may differ from group)
  personal_progress INTEGER DEFAULT 0,
  is_caught_up BOOLEAN DEFAULT TRUE, -- Are they at the group progress?

  -- Participation stats
  sessions_attended INTEGER DEFAULT 0,
  last_active_at TIMESTAMP WITH TIME ZONE,

  -- Metadata
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  left_at TIMESTAMP WITH TIME ZONE,

  UNIQUE(session_id, user_id)
);

-- Watch Together Progress Updates Table
-- Log of progress updates within a session
CREATE TABLE IF NOT EXISTS watch_together_progress_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES watch_together_sessions(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  -- Update details
  old_progress INTEGER NOT NULL,
  new_progress INTEGER NOT NULL,
  notes TEXT, -- Optional notes: "Watched episodes 5-7 together!"

  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Group Consensus Sessions Table
-- For "what should we watch/read together?" decision making
CREATE TABLE IF NOT EXISTS group_consensus_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL, -- e.g., "Friday Movie Night"
  description TEXT,

  -- Group creator
  created_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  -- Filter criteria
  media_types VARCHAR(20)[], -- Which types to consider? ['anime', 'movie']
  genres VARCHAR(100)[], -- Optional genre filters
  min_rating DECIMAL(3, 2), -- Minimum average rating
  max_duration_minutes INTEGER, -- For time-constrained sessions

  -- Session settings
  voting_method VARCHAR(20) DEFAULT 'weighted', -- 'simple', 'weighted', 'ranked'
  max_options INTEGER DEFAULT 10, -- How many options to show?
  is_public BOOLEAN DEFAULT FALSE,

  -- Session status
  status VARCHAR(20) DEFAULT 'collecting', -- 'collecting', 'voting', 'decided', 'completed'
  decided_media_type VARCHAR(20), -- What was chosen?
  decided_media_id UUID, -- What was chosen?
  decided_at TIMESTAMP WITH TIME ZONE,

  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  expires_at TIMESTAMP WITH TIME ZONE -- Auto-close after this time
);

-- Group Consensus Participants Table
-- Users participating in the consensus decision
CREATE TABLE IF NOT EXISTS group_consensus_participants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES group_consensus_sessions(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  -- Participation
  has_voted BOOLEAN DEFAULT FALSE,
  voted_at TIMESTAMP WITH TIME ZONE,

  -- Metadata
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,

  UNIQUE(session_id, user_id)
);

-- Group Consensus Candidates Table
-- Media options being considered
CREATE TABLE IF NOT EXISTS group_consensus_candidates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES group_consensus_sessions(id) ON DELETE CASCADE,

  -- Media being considered
  media_type VARCHAR(20) NOT NULL,
  media_id UUID NOT NULL,

  -- Who suggested it?
  suggested_by UUID REFERENCES users(id) ON DELETE SET NULL,

  -- Voting scores
  total_votes INTEGER DEFAULT 0,
  weighted_score DECIMAL(5, 2) DEFAULT 0, -- Based on taste compatibility
  average_predicted_rating DECIMAL(3, 2), -- Predicted rating for group

  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,

  UNIQUE(session_id, media_type, media_id)
);

-- Group Consensus Votes Table
-- Individual votes on candidates
CREATE TABLE IF NOT EXISTS group_consensus_votes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES group_consensus_sessions(id) ON DELETE CASCADE,
  candidate_id UUID NOT NULL REFERENCES group_consensus_candidates(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  -- Vote type
  vote_type VARCHAR(20) NOT NULL, -- 'upvote', 'downvote', 'veto'
  rank INTEGER, -- For ranked-choice voting

  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,

  UNIQUE(session_id, candidate_id, user_id)
);

-- Cross-Media Collections Table
-- User-created lists spanning all media types
CREATE TABLE IF NOT EXISTS cross_media_collections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  -- Collection details
  name VARCHAR(255) NOT NULL, -- e.g., "Cyberpunk Everything"
  description TEXT,
  cover_image_url TEXT,

  -- Settings
  is_public BOOLEAN DEFAULT FALSE,
  is_collaborative BOOLEAN DEFAULT FALSE, -- Can others contribute?

  -- Stats
  item_count INTEGER DEFAULT 0,
  follower_count INTEGER DEFAULT 0,

  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Collection Items Table
-- Items within a collection
CREATE TABLE IF NOT EXISTS collection_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  collection_id UUID NOT NULL REFERENCES cross_media_collections(id) ON DELETE CASCADE,

  -- Media item
  media_type VARCHAR(20) NOT NULL,
  media_id UUID NOT NULL,

  -- Ordering and notes
  sort_order INTEGER,
  notes TEXT, -- Why is this in the collection?

  -- Who added it?
  added_by UUID REFERENCES users(id) ON DELETE SET NULL,

  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,

  UNIQUE(collection_id, media_type, media_id)
);

-- Collection Followers Table
-- Users following a collection
CREATE TABLE IF NOT EXISTS collection_followers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  collection_id UUID NOT NULL REFERENCES cross_media_collections(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,

  UNIQUE(collection_id, user_id)
);

-- Indexes for performance
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

CREATE INDEX IF NOT EXISTS idx_collection_items_collection ON collection_items(collection_id);
CREATE INDEX IF NOT EXISTS idx_collection_items_media ON collection_items(media_type, media_id);
CREATE INDEX IF NOT EXISTS idx_collection_items_sort ON collection_items(collection_id, sort_order);

CREATE INDEX IF NOT EXISTS idx_collection_followers_collection ON collection_followers(collection_id);
CREATE INDEX IF NOT EXISTS idx_collection_followers_user ON collection_followers(user_id);

-- Comments
COMMENT ON TABLE watch_together_sessions IS 'Collaborative watching/reading sessions between users';
COMMENT ON TABLE watch_together_participants IS 'Users participating in watch together sessions';
COMMENT ON TABLE group_consensus_sessions IS 'Group decision-making for what to consume together';
COMMENT ON TABLE group_consensus_candidates IS 'Media options being voted on in consensus sessions';
COMMENT ON TABLE cross_media_collections IS 'User-created lists spanning all media types';
COMMENT ON TABLE collection_items IS 'Items within cross-media collections';
