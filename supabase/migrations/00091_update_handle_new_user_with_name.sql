-- Update handle_new_user to also set name and full_name from OAuth metadata
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  user_count int;
  new_username text;
  user_email text;
  user_full_name text;
BEGIN
  -- Get email from various possible locations
  user_email := COALESCE(
    NEW.email,
    NEW.raw_user_meta_data->>'email',
    split_part(NEW.id::text, '-', 1)
  );

  -- Get full name from OAuth metadata
  user_full_name := COALESCE(
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'name'
  );

  SELECT COUNT(*) INTO user_count FROM profiles;

  -- Build a unique username from email or name
  new_username := COALESCE(
    NEW.raw_user_meta_data->>'user_name',
    split_part(user_email, '@', 1),
    'user_' || substr(NEW.id::text, 1, 8)
  );

  -- Remove special characters from username
  new_username := regexp_replace(new_username, '[^a-zA-Z0-9_]', '_', 'g');

  -- Make username unique if collision
  WHILE EXISTS (SELECT 1 FROM profiles WHERE username = new_username) LOOP
    new_username := new_username || '_' || substr(gen_random_uuid()::text, 1, 4);
  END LOOP;

  INSERT INTO public.profiles (id, email, username, full_name, name, role)
  VALUES (
    NEW.id,
    user_email,
    new_username,
    user_full_name,
    COALESCE(user_full_name, new_username),
    CASE WHEN user_count = 0 THEN 'admin'::public.user_role ELSE 'user'::public.user_role END
  )
  ON CONFLICT (id) DO NOTHING;

  RETURN NEW;
END;
$$;