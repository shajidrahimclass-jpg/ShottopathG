-- ============================================================
-- FIX 1: Welcome notification uses 'success' but constraint
--         only allows: welcome, order, announcement, system,
--         low_stock, message  → profile creation always failed
-- ============================================================
CREATE OR REPLACE FUNCTION create_welcome_notification()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.notifications (user_id, title, message, type)
  VALUES (
    NEW.id,
    'Welcome to Shottopoth!',
    'Thank you for joining us. Start exploring our products and enjoy shopping!',
    'welcome'   -- was 'success' which violated the CHECK constraint
  );
  RETURN NEW;
END;
$$;

-- ============================================================
-- FIX 2: handle_new_user - make it safe even if email is null
--         and deduplicate (ON CONFLICT DO NOTHING)
-- ============================================================
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  user_count int;
  new_username text;
  user_email text;
BEGIN
  -- Get email from various possible locations
  user_email := COALESCE(
    NEW.email,
    NEW.raw_user_meta_data->>'email',
    NEW.raw_user_meta_data->>'user_name',
    split_part(NEW.id::text, '-', 1)
  );

  SELECT COUNT(*) INTO user_count FROM profiles;

  -- Build a unique username
  new_username := COALESCE(
    NEW.raw_user_meta_data->>'user_name',
    NEW.raw_user_meta_data->>'name',
    split_part(user_email, '@', 1),
    'user_' || substr(NEW.id::text, 1, 8)
  );

  -- Make username unique if collision
  WHILE EXISTS (SELECT 1 FROM profiles WHERE username = new_username) LOOP
    new_username := new_username || '_' || substr(gen_random_uuid()::text, 1, 4);
  END LOOP;

  INSERT INTO public.profiles (id, email, username, role)
  VALUES (
    NEW.id,
    user_email,
    new_username,
    CASE WHEN user_count = 0 THEN 'admin'::public.user_role ELSE 'user'::public.user_role END
  )
  ON CONFLICT (id) DO NOTHING;  -- safe for re-runs

  RETURN NEW;
END;
$$;

-- ============================================================
-- FIX 3: Add INSERT trigger for Google OAuth users
--         (OAuth users arrive with confirmed_at already set
--          on INSERT, so the UPDATE trigger never fires)
-- ============================================================
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  WHEN (NEW.confirmed_at IS NOT NULL)   -- pre-confirmed (OAuth)
  EXECUTE FUNCTION handle_new_user();

-- Keep the UPDATE trigger for email/password signups
-- (email confirmation sets confirmed_at via UPDATE)
DROP TRIGGER IF EXISTS on_auth_user_confirmed ON auth.users;
CREATE TRIGGER on_auth_user_confirmed
  AFTER UPDATE ON auth.users
  FOR EACH ROW
  WHEN (OLD.confirmed_at IS NULL AND NEW.confirmed_at IS NOT NULL)
  EXECUTE FUNCTION handle_new_user();