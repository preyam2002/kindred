-- ==============================================================
-- KINDRED - NEW FEATURE MIGRATIONS
-- ==============================================================
-- This file contains all migrations for the new social features:
-- 1. Notifications System
-- 2. Collections, Queue, Friends, Activity Feed
-- 3. Social Voting for Queue
--
-- Run this in your Supabase SQL Editor:
-- 1. Go to your Supabase project
-- 2. Navigate to SQL Editor
-- 3. Create a new query
-- 4. Paste this entire file
-- 5. Click "Run"
-- ==============================================================

-- ==============================================================
-- MIGRATION 1: NOTIFICATIONS SYSTEM
-- ==============================================================

-- Create notifications table
CREATE TABLE IF NOT EXISTS notifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('match', 'challenge', 'comment', 'reply', 'streak', 'recommendation', 'system')),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  link TEXT,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  -- Optional metadata for rich notifications
  actor_id UUID REFERENCES users(id) ON DELETE SET NULL,
  actor_username TEXT,
  actor_avatar TEXT
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_user_unread ON notifications(user_id, is_read) WHERE is_read = FALSE;

-- RLS Policies
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own notifications"
  ON notifications FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own notifications"
  ON notifications FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own notifications"
  ON notifications FOR DELETE
  USING (auth.uid() = user_id);

CREATE POLICY "System can insert notifications"
  ON notifications FOR INSERT
  WITH CHECK (true);

-- ==============================================================
-- MIGRATION 2: COLLECTIONS, QUEUE, FRIENDS, ACTIVITY FEED
-- ==============================================================

-- Create collections table
CREATE TABLE IF NOT EXISTS collections (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  is_public BOOLEAN DEFAULT TRUE,
  is_collaborative BOOLEAN DEFAULT FALSE,
  item_count INTEGER DEFAULT 0,
  follower_count INTEGER DEFAULT 0,
  cover_image TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_collections_user_id ON collections(user_id);
CREATE INDEX IF NOT EXISTS idx_collections_is_public ON collections(is_public);
CREATE INDEX IF NOT EXISTS idx_collections_created_at ON collections(created_at DESC);

-- Create collection_items table
CREATE TABLE IF NOT EXISTS collection_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  collection_id UUID NOT NULL REFERENCES collections(id) ON DELETE CASCADE,
  media_type TEXT NOT NULL CHECK (media_type IN ('book', 'anime', 'manga', 'movie', 'music')),
  media_id UUID NOT NULL,
  added_by_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  position INTEGER NOT NULL DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_collection_items_collection_id ON collection_items(collection_id);
CREATE INDEX IF NOT EXISTS idx_collection_items_media ON collection_items(media_type, media_id);
CREATE INDEX IF NOT EXISTS idx_collection_items_position ON collection_items(collection_id, position);

-- Create queue_items table
CREATE TABLE IF NOT EXISTS queue_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  media_type TEXT NOT NULL CHECK (media_type IN ('book', 'anime', 'manga', 'movie', 'music')),
  media_id UUID NOT NULL,
  position INTEGER NOT NULL DEFAULT 0,
  priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high')),
  added_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  notes TEXT,
  UNIQUE(user_id, media_type, media_id)
);

CREATE INDEX IF NOT EXISTS idx_queue_items_user_id ON queue_items(user_id);
CREATE INDEX IF NOT EXISTS idx_queue_items_position ON queue_items(user_id, position);
CREATE INDEX IF NOT EXISTS idx_queue_items_priority ON queue_items(user_id, priority);

-- Create friendships table
CREATE TABLE IF NOT EXISTS friendships (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  friend_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'blocked')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  -- Prevent duplicate friendships and self-friending
  UNIQUE(user_id, friend_id),
  CHECK (user_id != friend_id)
);

CREATE INDEX IF NOT EXISTS idx_friendships_user_id ON friendships(user_id);
CREATE INDEX IF NOT EXISTS idx_friendships_friend_id ON friendships(friend_id);
CREATE INDEX IF NOT EXISTS idx_friendships_status ON friendships(status);

-- Create activity_feed table
CREATE TABLE IF NOT EXISTS activity_feed (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  activity_type TEXT NOT NULL CHECK (activity_type IN ('rating', 'review', 'collection', 'friend', 'achievement')),
  content TEXT NOT NULL, -- JSON stringified data
  is_public BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_activity_feed_user_id ON activity_feed(user_id);
CREATE INDEX IF NOT EXISTS idx_activity_feed_created_at ON activity_feed(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_activity_feed_type ON activity_feed(activity_type);

-- RLS Policies for Collections
ALTER TABLE collections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view public collections"
  ON collections FOR SELECT
  USING (is_public = TRUE OR auth.uid() = user_id);

CREATE POLICY "Users can insert their own collections"
  ON collections FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own collections"
  ON collections FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own collections"
  ON collections FOR DELETE
  USING (auth.uid() = user_id);

-- RLS Policies for Collection Items
ALTER TABLE collection_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view items in public collections"
  ON collection_items FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM collections
      WHERE collections.id = collection_items.collection_id
      AND (collections.is_public = TRUE OR collections.user_id = auth.uid())
    )
  );

CREATE POLICY "Users can add items to their collections"
  ON collection_items FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM collections
      WHERE collections.id = collection_id
      AND collections.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update items in their collections"
  ON collection_items FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM collections
      WHERE collections.id = collection_id
      AND collections.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete items from their collections"
  ON collection_items FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM collections
      WHERE collections.id = collection_id
      AND collections.user_id = auth.uid()
    )
  );

-- RLS Policies for Queue Items
ALTER TABLE queue_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own queue"
  ON queue_items FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert into their own queue"
  ON queue_items FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own queue"
  ON queue_items FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete from their own queue"
  ON queue_items FOR DELETE
  USING (auth.uid() = user_id);

-- RLS Policies for Friendships
ALTER TABLE friendships ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their friendships"
  ON friendships FOR SELECT
  USING (auth.uid() = user_id OR auth.uid() = friend_id);

CREATE POLICY "Users can create friend requests"
  ON friendships FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update friendships they're part of"
  ON friendships FOR UPDATE
  USING (auth.uid() = user_id OR auth.uid() = friend_id);

CREATE POLICY "Users can delete friendships they're part of"
  ON friendships FOR DELETE
  USING (auth.uid() = user_id OR auth.uid() = friend_id);

-- RLS Policies for Activity Feed
ALTER TABLE activity_feed ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view public activity"
  ON activity_feed FOR SELECT
  USING (is_public = TRUE OR auth.uid() = user_id);

CREATE POLICY "Users can insert their own activity"
  ON activity_feed FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own activity"
  ON activity_feed FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own activity"
  ON activity_feed FOR DELETE
  USING (auth.uid() = user_id);

-- Triggers and Functions

-- Function to update collection item_count
CREATE OR REPLACE FUNCTION update_collection_item_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    UPDATE collections
    SET item_count = item_count - 1
    WHERE id = OLD.collection_id;
    RETURN OLD;
  ELSE
    UPDATE collections
    SET item_count = item_count + 1
    WHERE id = NEW.collection_id;
    RETURN NEW;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Trigger for collection item count
DROP TRIGGER IF EXISTS update_collection_count_on_item_change ON collection_items;
CREATE TRIGGER update_collection_count_on_item_change
  AFTER INSERT OR DELETE ON collection_items
  FOR EACH ROW
  EXECUTE FUNCTION update_collection_item_count();

-- ==============================================================
-- MIGRATION 3: SOCIAL VOTING FOR QUEUE
-- ==============================================================

-- Create queue_votes table for social voting on queue items
CREATE TABLE IF NOT EXISTS queue_votes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  queue_item_id UUID NOT NULL REFERENCES queue_items(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  -- Prevent duplicate votes from same user on same item
  UNIQUE(queue_item_id, user_id)
);

-- Index for faster lookups
CREATE INDEX IF NOT EXISTS idx_queue_votes_queue_item ON queue_votes(queue_item_id);
CREATE INDEX IF NOT EXISTS idx_queue_votes_user ON queue_votes(user_id);

-- RLS Policies
ALTER TABLE queue_votes ENABLE ROW LEVEL SECURITY;

-- Users can view votes on their own queue items
CREATE POLICY "Users can view votes on their queue items"
  ON queue_votes FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM queue_items
      WHERE queue_items.id = queue_votes.queue_item_id
      AND queue_items.user_id = auth.uid()
    )
  );

-- Friends can vote on user's queue items
CREATE POLICY "Friends can vote on queue items"
  ON queue_votes FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM queue_items qi
      JOIN friendships f ON (
        (f.user_id = qi.user_id AND f.friend_id = auth.uid())
        OR (f.friend_id = qi.user_id AND f.user_id = auth.uid())
      )
      WHERE qi.id = queue_item_id
      AND f.status = 'accepted'
    )
  );

-- Users can delete their own votes
CREATE POLICY "Users can delete their own votes"
  ON queue_votes FOR DELETE
  USING (user_id = auth.uid());

-- Function to get vote count for queue items
CREATE OR REPLACE FUNCTION get_queue_vote_count(queue_item_uuid UUID)
RETURNS INTEGER AS $$
  SELECT COUNT(*)::INTEGER
  FROM queue_votes
  WHERE queue_item_id = queue_item_uuid;
$$ LANGUAGE SQL STABLE;

-- ==============================================================
-- MIGRATION COMPLETE
-- ==============================================================
-- All tables and policies have been created!
-- Check the output above for any errors.
-- ==============================================================
