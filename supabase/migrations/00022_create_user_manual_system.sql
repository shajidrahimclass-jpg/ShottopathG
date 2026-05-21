
-- Create user_manual table
CREATE TABLE user_manual (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create user_manual_acceptances table to track who has read the manual
CREATE TABLE user_manual_acceptances (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  user_manual_id UUID NOT NULL REFERENCES user_manual(id) ON DELETE CASCADE,
  accepted_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, user_manual_id)
);

-- Create indexes for better performance
CREATE INDEX idx_user_manual_acceptances_user_id ON user_manual_acceptances(user_id);
CREATE INDEX idx_user_manual_acceptances_manual_id ON user_manual_acceptances(user_manual_id);

-- Enable RLS
ALTER TABLE user_manual ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_manual_acceptances ENABLE ROW LEVEL SECURITY;

-- Policies for user_manual (everyone can read active manuals)
CREATE POLICY "Anyone can view active user manuals"
  ON user_manual FOR SELECT
  USING (is_active = true);

CREATE POLICY "Admins can manage user manuals"
  ON user_manual FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Policies for user_manual_acceptances
CREATE POLICY "Users can view their own acceptances"
  ON user_manual_acceptances FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can create their own acceptances"
  ON user_manual_acceptances FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Admins can view all acceptances"
  ON user_manual_acceptances FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Insert default user manual (optional)
INSERT INTO user_manual (title, content, is_active)
VALUES (
  'User Manual',
  'Welcome to Shottopoth! This is your user manual. Admin can edit this content from the Settings page.',
  false
);
