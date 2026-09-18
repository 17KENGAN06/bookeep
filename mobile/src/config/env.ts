const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL ?? '';
const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? '';

export const env = {
  supabaseUrl: SUPABASE_URL.trim(),
  supabaseAnonKey: SUPABASE_ANON_KEY.trim(),
};

export function isSupabaseConfigured() {
  const { supabaseUrl, supabaseAnonKey } = env;
  if (!supabaseUrl || !supabaseAnonKey) return false;
  if (supabaseUrl.includes('your-project')) return false;
  if (supabaseAnonKey === 'your-anon-or-publishable-key') return false;
  return true;
}
