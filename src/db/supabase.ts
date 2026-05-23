import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://ttkjtmybpkhecpfcxkip.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR0a2p0bXlicGtoZWNwZmN4a2lwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzkyNzkwODgsImV4cCI6MjA5NDg1NTA4OH0.OUfrFx6EGniNzp7MA3feopVdS5YawLz548y-LTELYSY';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
