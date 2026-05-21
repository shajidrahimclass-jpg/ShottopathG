-- Function to create welcome notification
CREATE OR REPLACE FUNCTION create_welcome_notification()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO notifications (user_id, type, title, message, read)
  VALUES (
    NEW.id,
    'welcome',
    'Welcome to Shottopoth!',
    'Thank you for joining Shottopoth! We''re excited to have you here. Start exploring our amazing products and enjoy great deals.',
    false
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to run after profile insert
DROP TRIGGER IF EXISTS on_profile_created ON profiles;
CREATE TRIGGER on_profile_created
  AFTER INSERT ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION create_welcome_notification();