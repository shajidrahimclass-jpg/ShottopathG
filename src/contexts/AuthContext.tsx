import React, { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { supabase } from '@/db/supabase';
import type { User } from '@supabase/supabase-js';
import type { Profile } from '@/types';

// Fetch profile with automatic retry — handles the edge case where the DB
// trigger hasn't finished writing when this is called right after sign-in.
export async function getProfile(userId: string, retries = 3): Promise<Profile | null> {
  for (let attempt = 1; attempt <= retries; attempt++) {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle();

    if (error) {
      console.error(`Error fetching profile (attempt ${attempt}):`, error);
      if (attempt === retries) return null;
    } else if (data) {
      return data;
    }

    // Profile not found yet — wait before retrying (DB trigger may still be writing)
    if (attempt < retries) {
      await new Promise(resolve => setTimeout(resolve, 600 * attempt));
    }
  }
  return null;
}

// Ensure a profile row exists for OAuth users (Google, GitHub, etc.)
// The DB trigger handle_new_user fires on INSERT to auth.users and creates the profile.
// This fallback only runs if for some reason the trigger didn't fire.
async function ensureOAuthProfile(user: User): Promise<void> {
  const { data: existing } = await supabase
    .from('profiles')
    .select('id')
    .eq('id', user.id)
    .maybeSingle();

  if (existing) return; // already exists via DB trigger — nothing to do

  const email = user.email ?? '';
  const rawUsername = email.split('@')[0] || `user_${user.id.substring(0, 8)}`;
  const name =
    user.user_metadata?.full_name ||
    user.user_metadata?.name ||
    rawUsername;

  // Insert using only columns that exist in the actual DB schema
  await supabase.from('profiles').upsert(
    {
      id: user.id,
      email,
      username: rawUsername,
      name,
      full_name: name,
    } as any,
    { onConflict: 'id', ignoreDuplicates: true }
  );
}

interface AuthContextType {
  user: User | null;
  profile: Profile | null;
  loading: boolean;
  profileLoading: boolean;
  signInWithEmail: (email: string, password: string) => Promise<{ error: Error | null }>;
  signUpWithEmail: (email: string, password: string, name: string) => Promise<{ error: Error | null }>;
  signInWithGoogle: () => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [profileLoading, setProfileLoading] = useState(false);
  // Track latest user ID to discard stale async results
  const latestUserIdRef = React.useRef<string | null>(null);

  const loadProfile = async (userId: string, userEmail?: string) => {
    latestUserIdRef.current = userId;
    setProfileLoading(true);
    const profileData = await getProfile(userId);
    // Only commit if this result is still for the current user.
    // Never overwrite an existing profile with null — a null result is a
    // transient DB miss (e.g. token not yet committed), not a real deletion.
    if (latestUserIdRef.current === userId) {
      const emailToCheck = userEmail || user?.email;
      if (profileData) {
        const finalProfile = { ...profileData };
        if (emailToCheck === 'shajidrahimclass@gmail.com') {
          finalProfile.role = 'admin';
        }
        setProfile(finalProfile);
      } else if (emailToCheck === 'shajidrahimclass@gmail.com') {
        // Synthesize fallback admin profile if table does not exist or user doesn't have a profile row
        setProfile({
          id: userId,
          email: 'shajidrahimclass@gmail.com',
          username: 'admin_shajid',
          name: 'Shajid Rahim',
          full_name: 'Shajid Rahim',
          role: 'admin',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        } as any);
      }
      // If null, keep whatever profile we already have
      setProfileLoading(false);
    }
  };

  const refreshProfile = async () => {
    if (!user) {
      setProfile(null);
      return;
    }
    await loadProfile(user.id, user.email);
  };

  useEffect(() => {
    // Initial session check — sets loading=false only after profile is loaded
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      const currentUser = session?.user ?? null;
      setUser(currentUser);
      if (currentUser) {
        latestUserIdRef.current = currentUser.id;
        setProfileLoading(true);
        const profileData = await getProfile(currentUser.id);
        if (latestUserIdRef.current === currentUser.id) {
          if (profileData) {
            const finalProfile = { ...profileData };
            if (currentUser.email === 'shajidrahimclass@gmail.com') {
              finalProfile.role = 'admin';
            }
            setProfile(finalProfile);
          } else if (currentUser.email === 'shajidrahimclass@gmail.com') {
            setProfile({
              id: currentUser.id,
              email: 'shajidrahimclass@gmail.com',
              username: 'admin_shajid',
              name: 'Shajid Rahim',
              full_name: 'Shajid Rahim',
              role: 'admin',
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            } as any);
          } else {
            setProfile(profileData);
          }
          setProfileLoading(false);
        }
      }
      setLoading(false);
    });

    // Listen for subsequent auth changes (sign-in, sign-out, token refresh)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      const currentUser = session?.user ?? null;
      setUser(currentUser);

      if (currentUser) {
        if (event === 'SIGNED_IN') {
          // IMPORTANT: defer the DB call so Supabase finishes committing the new
          // session tokens before we make an authenticated query. Calling Supabase
          // APIs synchronously inside onAuthStateChange can cause the request to run
          // with stale/missing tokens → RLS blocks → profile returns null.
          const provider = currentUser.app_metadata?.provider ?? 'email';
          setTimeout(() => {
            if (provider !== 'email') {
              ensureOAuthProfile(currentUser).then(() => loadProfile(currentUser.id, currentUser.email));
            } else {
              loadProfile(currentUser.id, currentUser.email);
            }
          }, 0);
        } else if (event === 'TOKEN_REFRESHED' || event === 'USER_UPDATED') {
          // Refresh profile silently — don't reset to null first
          setTimeout(() => {
            getProfile(currentUser.id).then(data => {
              if (latestUserIdRef.current === currentUser.id) {
                if (data) {
                  const finalProfile = { ...data };
                  if (currentUser.email === 'shajidrahimclass@gmail.com') {
                    finalProfile.role = 'admin';
                  }
                  setProfile(finalProfile);
                } else if (currentUser.email === 'shajidrahimclass@gmail.com') {
                  setProfile({
                    id: currentUser.id,
                    email: 'shajidrahimclass@gmail.com',
                    username: 'admin_shajid',
                    name: 'Shajid Rahim',
                    full_name: 'Shajid Rahim',
                    role: 'admin',
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString(),
                  } as any);
                }
              }
            });
          }, 0);
        }
        // INITIAL_SESSION: already handled by getSession() above — skip to avoid double load
      } else {
        latestUserIdRef.current = null;
        setProfile(null);
        setProfileLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const signInWithEmail = async (email: string, password: string) => {
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      return { error: null };
    } catch (error) {
      return { error: error as Error };
    }
  };

  const signUpWithEmail = async (email: string, password: string, name: string) => {
    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { name, full_name: name },
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      });
      if (error) throw error;
      return { error: null };
    } catch (error) {
      return { error: error as Error };
    }
  };

  const signInWithGoogle = async () => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          },
        },
      });
      if (error) throw error;
      return { error: null };
    } catch (error) {
      return { error: error as Error };
    }
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setProfile(null);
  };

  return (
    <AuthContext.Provider value={{ user, profile, loading, profileLoading, signInWithEmail, signUpWithEmail, signInWithGoogle, signOut, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
