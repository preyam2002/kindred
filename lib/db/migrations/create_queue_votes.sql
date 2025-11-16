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
