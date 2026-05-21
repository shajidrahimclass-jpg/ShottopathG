-- Backfill profiles for any auth.users row that has no matching profile
INSERT INTO public.profiles (id, email, username, name, full_name, role)
SELECT
  au.id,
  au.email,
  COALESCE(
    NULLIF(TRIM(au.raw_user_meta_data->>'preferred_username'), ''),
    NULLIF(TRIM(SPLIT_PART(au.email, '@', 1)), ''),
    'user_' || SUBSTRING(au.id::TEXT, 1, 8)
  ) AS username,
  COALESCE(
    NULLIF(TRIM(au.raw_user_meta_data->>'full_name'), ''),
    NULLIF(TRIM(au.raw_user_meta_data->>'name'), ''),
    NULLIF(TRIM(SPLIT_PART(au.email, '@', 1)), ''),
    'user_' || SUBSTRING(au.id::TEXT, 1, 8)
  ) AS name,
  COALESCE(
    NULLIF(TRIM(au.raw_user_meta_data->>'full_name'), ''),
    NULLIF(TRIM(au.raw_user_meta_data->>'name'), ''),
    NULLIF(TRIM(SPLIT_PART(au.email, '@', 1)), ''),
    'user_' || SUBSTRING(au.id::TEXT, 1, 8)
  ) AS full_name,
  CASE
    WHEN au.email = '[owner-email]' THEN 'admin'::public.user_role
    WHEN au.email = '[admin-email]'       THEN 'admin'::public.user_role
    ELSE 'user'::public.user_role
  END AS role
FROM auth.users au
WHERE NOT EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = au.id)
ON CONFLICT (id) DO NOTHING;