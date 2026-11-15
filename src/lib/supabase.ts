import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

if (!supabaseUrl || !supabaseAnonKey) {
  // App will surface a friendly error in the UI; throw lazily only if used.
  console.warn('Supabase env vars are missing. Check your environment configuration.');
}

export const supabase = createClient(supabaseUrl ?? '', supabaseAnonKey ?? '', {
  auth: { persistSession: false },
});

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);
