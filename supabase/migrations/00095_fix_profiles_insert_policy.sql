-- Allow authenticated users to insert their own profile row
-- (needed as a fallback if the DB trigger handle_new_user doesn't fire in time)
CREATE POLICY "Users can insert their own profile"
ON public.profiles
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = id);