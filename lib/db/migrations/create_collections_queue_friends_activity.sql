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

-- Create queue_items table (recommendation queue)
CREATE TABLE IF NOT EXISTS queue_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  media_type TEXT NOT NULL CHECK (media_type IN ('book', 'anime', 'manga', 'movie', 'music')),
  media_id UUID NOT NULL,
  position INTEGER NOT NULL DEFAULT 0,
  priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high')),
  notes TEXT,
  added_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create friendships table
CREATE TABLE IF NOT EXISTS friendships (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  friend_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'blocked')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, friend_id)
);

-- Create activity_feed table
CREATE TABLE IF NOT EXISTS activity_feed (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  activity_type TEXT NOT NULL CHECK (activity_type IN ('rating', 'review', 'collection', 'friend', 'achievement')),
  content JSONB NOT NULL,
  is_public BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_collections_user_id ON collections(user_id);
CREATE INDEX IF NOT EXISTS idx_collections_is_public ON collections(is_public);
CREATE INDEX IF NOT EXISTS idx_collection_items_collection_id ON collection_items(collection_id);
CREATE INDEX IF NOT EXISTS idx_collection_items_media ON collection_items(media_type, media_id);
CREATE INDEX IF NOT EXISTS idx_queue_items_user_id ON queue_items(user_id);
CREATE INDEX IF NOT EXISTS idx_queue_items_position ON queue_items(user_id, position);
CREATE INDEX IF NOT EXISTS idx_friendships_user_id ON friendships(user_id);
CREATE INDEX IF NOT EXISTS idx_friendships_friend_id ON friendships(friend_id);
CREATE INDEX IF NOT EXISTS idx_friendships_status ON friendships(user_id, status);
CREATE INDEX IF NOT EXISTS idx_activity_feed_user_id ON activity_feed(user_id);
CREATE INDEX IF NOT EXISTS idx_activity_feed_created_at ON activity_feed(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_activity_feed_public ON activity_feed(is_public, created_at DESC);

-- Add RLS (Row Level Security) policies
ALTER TABLE collections ENABLE ROW LEVEL SECURITY;
ALTER TABLE collection_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE queue_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE friendships ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_feed ENABLE ROW LEVEL SECURITY;

-- Collections policies
CREATE POLICY "Users can view public collections"
  ON collections FOR SELECT
  USING (is_public = TRUE OR auth.uid() = user_id);

CREATE POLICY "Users can manage their own collections"
  ON collections FOR ALL
  USING (auth.uid() = user_id);

-- Collection items policies
CREATE POLICY "Users can view public collection items"
  ON collection_items FOR SELECT
  USING (
    collection_id IN (
      SELECT id FROM collections WHERE is_public = TRUE OR user_id = auth.uid()
    )
  );

CREATE POLICY "Users can manage items in their collections"
  ON collection_items FOR ALL
  USING (
    collection_id IN (
      SELECT id FROM collections WHERE user_id = auth.uid()
    )
  );

-- Queue items policies
CREATE POLICY "Users can view their own queue"
  ON queue_items FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own queue"
  ON queue_items FOR ALL
  USING (auth.uid() = user_id);

-- Friendships policies
CREATE POLICY "Users can view their friendships"
  ON friendships FOR SELECT
  USING (auth.uid() = user_id OR auth.uid() = friend_id);

CREATE POLICY "Users can manage their friendships"
  ON friendships FOR ALL
  USING (auth.uid() = user_id);

-- Activity feed policies
CREATE POLICY "Users can view public activity"
  ON activity_feed FOR SELECT
  USING (is_public = TRUE OR auth.uid() = user_id);

CREATE POLICY "Users can manage their own activity"
  ON activity_feed FOR ALL
  USING (auth.uid() = user_id);

-- Create triggers for updating timestamps
CREATE OR REPLACE FUNCTION update_collections_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_collections_timestamp
  BEFORE UPDATE ON collections
  FOR EACH ROW
  EXECUTE FUNCTION update_collections_updated_at();

CREATE TRIGGER update_friendships_timestamp
  BEFORE UPDATE ON friendships
  FOR EACH ROW
  EXECUTE FUNCTION update_collections_updated_at();

-- Create function to update collection item_count
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

CREATE TRIGGER update_collection_count_on_item_change
  AFTER INSERT OR DELETE ON collection_items
  FOR EACH ROW
  EXECUTE FUNCTION update_collection_item_count();
