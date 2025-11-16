-- Migration: Add user-specific tracking fields to user_media table
-- This adds status tracking, progress tracking, favorites, notes, and more

-- Add new columns for enhanced tracking
ALTER TABLE user_media
  ADD COLUMN IF NOT EXISTS status VARCHAR(50) CHECK (status IN ('completed', 'watching', 'reading', 'listening', 'plan_to_watch', 'plan_to_read', 'plan_to_listen', 'on_hold', 'dropped')),
  ADD COLUMN IF NOT EXISTS progress INTEGER DEFAULT 0, -- Episodes watched, chapters read, etc.
  ADD COLUMN IF NOT EXISTS progress_total INTEGER, -- Total episodes, chapters, etc.
  ADD COLUMN IF NOT EXISTS times_consumed INTEGER DEFAULT 1, -- For rewatches/rereads
  ADD COLUMN IF NOT EXISTS start_date TIMESTAMP WITH TIME ZONE, -- When user started
  ADD COLUMN IF NOT EXISTS finish_date TIMESTAMP WITH TIME ZONE, -- When user finished
  ADD COLUMN IF NOT EXISTS is_favorite BOOLEAN DEFAULT FALSE, -- Favorite flag
  ADD COLUMN IF NOT EXISTS notes TEXT, -- Personal notes
  ADD COLUMN IF NOT EXISTS source_rating VARCHAR(50); -- Original rating from source (e.g., "5 stars" from Goodreads)

-- Add index for status filtering
CREATE INDEX IF NOT EXISTS idx_user_media_status ON user_media(user_id, status);

-- Add index for favorites
CREATE INDEX IF NOT EXISTS idx_user_media_favorites ON user_media(user_id, is_favorite) WHERE is_favorite = TRUE;

-- Add index for progress tracking
CREATE INDEX IF NOT EXISTS idx_user_media_progress ON user_media(user_id, progress);

-- Comments for documentation
COMMENT ON COLUMN user_media.status IS 'User''s consumption status for this media item';
COMMENT ON COLUMN user_media.progress IS 'Current progress (episodes watched, chapters read, etc.)';
COMMENT ON COLUMN user_media.progress_total IS 'Total progress available (total episodes, chapters, etc.)';
COMMENT ON COLUMN user_media.times_consumed IS 'Number of times user has consumed this media (rewatches/rereads)';
COMMENT ON COLUMN user_media.start_date IS 'Date when user started consuming this media';
COMMENT ON COLUMN user_media.finish_date IS 'Date when user finished consuming this media';
COMMENT ON COLUMN user_media.is_favorite IS 'Whether this is marked as a favorite';
COMMENT ON COLUMN user_media.notes IS 'Personal notes about this media';
COMMENT ON COLUMN user_media.source_rating IS 'Original rating format from the source platform';
