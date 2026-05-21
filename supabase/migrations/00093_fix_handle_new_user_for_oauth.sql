
-- Fix handle_new_user to work for both email/password AND OAuth (Google)
-- OAuth users may have name in user_metadata
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  _username TEXT;
  _name TEXT;
BEGIN
  -- Build a safe username from email or metadata
  _username := COALESCE(
    NULLIF(TRIM(NEW.raw_user_meta_data->>'preferred_username'), ''),
    NULLIF(TRIM(SPLIT_PART(NEW.email, '@', 1)), ''),
    'user_' || SUBSTRING(NEW.id::TEXT, 1, 8)
  );
  -- Ensure username is unique by appending suffix if needed
  IF EXISTS (SELECT 1 FROM public.profiles WHERE username = _username) THEN
    _username := _username || '_' || SUBSTRING(NEW.id::TEXT, 1, 4);
  END IF;

  _name := COALESCE(
    NULLIF(TRIM(NEW.raw_user_meta_data->>'full_name'), ''),
    NULLIF(TRIM(NEW.raw_user_meta_data->>'name'), ''),
    _username
  );

  INSERT INTO public.profiles (id, email, username, name, full_name, phone, role)
  VALUES (
    NEW.id,
    NEW.email,
    _username,
    _name,
    _name,
    NEW.phone,
    'user'::public.user_role
  )
  ON CONFLICT (id) DO NOTHING;

  RETURN NEW;
END;
$$;
