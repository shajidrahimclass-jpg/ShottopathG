-- Create review_responses table for admin and customer responses to reviews
CREATE TABLE IF NOT EXISTS review_responses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  review_id uuid NOT NULL REFERENCES reviews(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content text NOT NULL,
  is_admin boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_review_responses_review_id ON review_responses(review_id);
CREATE INDEX IF NOT EXISTS idx_review_responses_user_id ON review_responses(user_id);
CREATE INDEX IF NOT EXISTS idx_review_responses_created_at ON review_responses(created_at DESC);

-- Enable RLS
ALTER TABLE review_responses ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone can view responses
CREATE POLICY "Anyone can view review responses"
  ON review_responses
  FOR SELECT
  TO public
  USING (true);

-- Policy: Authenticated users can insert their own responses
CREATE POLICY "Users can insert their own responses"
  ON review_responses
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Policy: Users can update their own responses
CREATE POLICY "Users can update their own responses"
  ON review_responses
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Policy: Users can delete their own responses
CREATE POLICY "Users can delete their own responses"
  ON review_responses
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_review_responses_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_review_responses_updated_at_trigger
  BEFORE UPDATE ON review_responses
  FOR EACH ROW
  EXECUTE FUNCTION update_review_responses_updated_at();