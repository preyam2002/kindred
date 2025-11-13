-- Add waitlist table for managing early access signups

-- Waitlist entries
CREATE TABLE IF NOT EXISTS waitlist (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(255),
  referral_code VARCHAR(50) UNIQUE NOT NULL,
  referred_by VARCHAR(50), -- Referral code of person who invited them
  position INTEGER NOT NULL, -- Position in queue (lower = higher priority)
  referral_count INTEGER DEFAULT 0, -- Number of people they've referred
  status VARCHAR(50) NOT NULL CHECK (status IN ('pending', 'approved', 'rejected', 'converted')) DEFAULT 'pending',
  invited_at TIMESTAMP WITH TIME ZONE, -- When they were sent an invite
  converted_at TIMESTAMP WITH TIME ZONE, -- When they signed up
  metadata JSONB, -- Additional info (source, interests, etc.)
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Waitlist settings (for batch invites, etc.)
CREATE TABLE IF NOT EXISTS waitlist_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  setting_key VARCHAR(100) UNIQUE NOT NULL,
  setting_value JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_waitlist_email ON waitlist(email);
CREATE INDEX IF NOT EXISTS idx_waitlist_referral_code ON waitlist(referral_code);
CREATE INDEX IF NOT EXISTS idx_waitlist_referred_by ON waitlist(referred_by);
CREATE INDEX IF NOT EXISTS idx_waitlist_position ON waitlist(position);
CREATE INDEX IF NOT EXISTS idx_waitlist_status ON waitlist(status);
CREATE INDEX IF NOT EXISTS idx_waitlist_created_at ON waitlist(created_at DESC);

-- Trigger for updated_at
CREATE TRIGGER update_waitlist_updated_at BEFORE UPDATE ON waitlist
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_waitlist_settings_updated_at BEFORE UPDATE ON waitlist_settings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to generate unique waitlist referral code
CREATE OR REPLACE FUNCTION generate_waitlist_referral_code(email_param VARCHAR)
RETURNS VARCHAR(50) AS $$
DECLARE
  code VARCHAR(50);
  attempts INTEGER := 0;
  max_attempts INTEGER := 10;
BEGIN
  LOOP
    -- Generate 6-character code from email hash
    code := upper(substring(md5(random()::text || email_param) from 1 for 6));

    -- Check if code already exists
    IF NOT EXISTS (SELECT 1 FROM waitlist WHERE referral_code = code) THEN
      RETURN code;
    END IF;

    attempts := attempts + 1;
    IF attempts >= max_attempts THEN
      RAISE EXCEPTION 'Failed to generate unique waitlist referral code after % attempts', max_attempts;
    END IF;
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Function to update referral counts and positions
CREATE OR REPLACE FUNCTION update_waitlist_referral_counts()
RETURNS TRIGGER AS $$
BEGIN
  -- If someone was referred, increment the referrer's count
  IF NEW.referred_by IS NOT NULL THEN
    UPDATE waitlist
    SET referral_count = referral_count + 1
    WHERE referral_code = NEW.referred_by;

    -- Recalculate position for referrer (move them up)
    -- People with more referrals get higher priority
    UPDATE waitlist
    SET position = (
      SELECT COUNT(*) + 1
      FROM waitlist w2
      WHERE w2.referral_count > waitlist.referral_count
        OR (w2.referral_count = waitlist.referral_count AND w2.created_at < waitlist.created_at)
    )
    WHERE referral_code = NEW.referred_by;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_referral_counts AFTER INSERT ON waitlist
    FOR EACH ROW EXECUTE FUNCTION update_waitlist_referral_counts();

-- Function to recalculate all positions (call this periodically or after bulk changes)
CREATE OR REPLACE FUNCTION recalculate_waitlist_positions()
RETURNS void AS $$
BEGIN
  -- Update positions based on referral count (desc) then created_at (asc)
  UPDATE waitlist
  SET position = ranked.new_position
  FROM (
    SELECT
      id,
      ROW_NUMBER() OVER (
        ORDER BY
          referral_count DESC,
          created_at ASC
      ) as new_position
    FROM waitlist
    WHERE status = 'pending'
  ) ranked
  WHERE waitlist.id = ranked.id;
END;
$$ LANGUAGE plpgsql;

-- Insert default settings
INSERT INTO waitlist_settings (setting_key, setting_value)
VALUES
  ('batch_invite_size', '50'::jsonb),
  ('auto_invite_enabled', 'false'::jsonb),
  ('invite_day', '"friday"'::jsonb)
ON CONFLICT (setting_key) DO NOTHING;
