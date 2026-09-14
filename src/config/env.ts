const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL ?? '';
const SUPABASE_ANON_KEY =
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ?? import.meta.env.VITE_SUPABASE_ANON_KEY ?? '';
const API_URL = import.meta.env.VITE_API_URL ?? '';

export const env = {
  supabaseUrl: SUPABASE_URL.trim(),
  supabaseAnonKey: SUPABASE_ANON_KEY.trim(),
  apiUrl: API_URL.trim(),
};

export function isSupabaseConfigured() {
  const { supabaseUrl, supabaseAnonKey } = env;
  if (!supabaseUrl || !supabaseAnonKey) return false;
  if (supabaseUrl.includes('your-project')) return false;
  if (supabaseAnonKey === 'your-anon-key') return false;
  return true;
}
