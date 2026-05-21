import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://rixikhernphntvuwfzcy.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJpeGlraGVybnBobnR2dXdmemN5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzcyODU5OTksImV4cCI6MjA5Mjg2MTk5OX0.2YaQa-F33Jay9sQa99kqZMH6uH46nmwNHzr5kEop6Xo';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
