-- Create notifications table for user notifications
CREATE TABLE IF NOT EXISTS notifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('match', 'challenge', 'comment', 'reply', 'streak', 'recommendation', 'system')),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  link TEXT,
  is_read BOOLEAN DEFAULT FALSE,
  actor_id UUID REFERENCES users(id) ON DELETE SET NULL,
  actor_username TEXT,
  actor_avatar TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index on user_id for faster queries
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);

-- Create index on is_read for filtering unread notifications
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON notifications(is_read);

-- Create index on created_at for sorting
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at DESC);

-- Create composite index for user's unread notifications
CREATE INDEX IF NOT EXISTS idx_notifications_user_unread ON notifications(user_id, is_read) WHERE is_read = FALSE;

-- Add RLS (Row Level Security) policies
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only see their own notifications
CREATE POLICY "Users can view own notifications"
  ON notifications
  FOR SELECT
  USING (auth.uid() = user_id);

-- Policy: Users can update their own notifications (mark as read)
CREATE POLICY "Users can update own notifications"
  ON notifications
  FOR UPDATE
  USING (auth.uid() = user_id);

-- Policy: Allow system to insert notifications (for backend triggers/functions)
CREATE POLICY "System can insert notifications"
  ON notifications
  FOR INSERT
  WITH CHECK (true);

-- Create a trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_notifications_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_notifications_timestamp
  BEFORE UPDATE ON notifications
  FOR EACH ROW
  EXECUTE FUNCTION update_notifications_updated_at();

-- Insert some sample notifications for testing (optional - remove in production)
-- Uncomment if you want sample data for development
/*
INSERT INTO notifications (user_id, type, title, message, link, is_read)
SELECT
  u.id,
  'system',
  'Welcome to Kindred!',
  'Start by connecting your integrations to discover your taste DNA.',
  '/settings',
  false
FROM users u
LIMIT 5;
*/
