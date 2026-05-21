-- Create review_helpful_votes table
CREATE TABLE IF NOT EXISTS review_helpful_votes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  review_id uuid NOT NULL REFERENCES reviews(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  is_helpful boolean NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(review_id, user_id)
);

-- Add helpful counts to reviews table
ALTER TABLE reviews 
ADD COLUMN IF NOT EXISTS helpful_count integer NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS not_helpful_count integer NOT NULL DEFAULT 0;

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_review_helpful_votes_review_id ON review_helpful_votes(review_id);
CREATE INDEX IF NOT EXISTS idx_review_helpful_votes_user_id ON review_helpful_votes(user_id);
CREATE INDEX IF NOT EXISTS idx_reviews_helpful_count ON reviews(helpful_count DESC);

-- Function to update review helpful counts
CREATE OR REPLACE FUNCTION update_review_helpful_counts()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    IF NEW.is_helpful THEN
      UPDATE reviews SET helpful_count = helpful_count + 1 WHERE id = NEW.review_id;
    ELSE
      UPDATE reviews SET not_helpful_count = not_helpful_count + 1 WHERE id = NEW.review_id;
    END IF;
  ELSIF TG_OP = 'UPDATE' THEN
    IF OLD.is_helpful AND NOT NEW.is_helpful THEN
      UPDATE reviews SET helpful_count = helpful_count - 1, not_helpful_count = not_helpful_count + 1 WHERE id = NEW.review_id;
    ELSIF NOT OLD.is_helpful AND NEW.is_helpful THEN
      UPDATE reviews SET helpful_count = helpful_count + 1, not_helpful_count = not_helpful_count - 1 WHERE id = NEW.review_id;
    END IF;
  ELSIF TG_OP = 'DELETE' THEN
    IF OLD.is_helpful THEN
      UPDATE reviews SET helpful_count = helpful_count - 1 WHERE id = OLD.review_id;
    ELSE
      UPDATE reviews SET not_helpful_count = not_helpful_count - 1 WHERE id = OLD.review_id;
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for automatic count updates
DROP TRIGGER IF EXISTS trigger_update_review_helpful_counts ON review_helpful_votes;
CREATE TRIGGER trigger_update_review_helpful_counts
AFTER INSERT OR UPDATE OR DELETE ON review_helpful_votes
FOR EACH ROW EXECUTE FUNCTION update_review_helpful_counts();

-- Trigger for updated_at
CREATE OR REPLACE FUNCTION update_review_helpful_votes_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_review_helpful_votes_updated_at ON review_helpful_votes;
CREATE TRIGGER trigger_review_helpful_votes_updated_at
BEFORE UPDATE ON review_helpful_votes
FOR EACH ROW EXECUTE FUNCTION update_review_helpful_votes_updated_at();

-- RLS Policies
ALTER TABLE review_helpful_votes ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone can view votes
CREATE POLICY "Anyone can view review helpful votes"
ON review_helpful_votes FOR SELECT
TO public
USING (true);

-- Policy: Authenticated users can insert their own votes
CREATE POLICY "Authenticated users can insert their own votes"
ON review_helpful_votes FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Policy: Users can update their own votes within 24 hours
CREATE POLICY "Users can update their own votes within 24 hours"
ON review_helpful_votes FOR UPDATE
TO authenticated
USING (auth.uid() = user_id AND created_at > now() - interval '24 hours')
WITH CHECK (auth.uid() = user_id);

-- Policy: Users can delete their own votes
CREATE POLICY "Users can delete their own votes"
ON review_helpful_votes FOR DELETE
TO authenticated
USING (auth.uid() = user_id);