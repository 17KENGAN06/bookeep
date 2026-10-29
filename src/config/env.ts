const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL ?? '';
const SUPABASE_ANON_KEY =
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ?? import.meta.env.VITE_SUPABASE_ANON_KEY ?? '';
const API_URL = import.meta.env.VITE_API_URL ?? '';

export const env = {
  supabaseUrl: SUPABASE_URL.trim(),
  supabaseAnonKey: SUPABASE_ANON_KEY.trim(),
  apiUrl: API_URL.trim().replace(/\/$/, ''),
};

export function isSupabaseConfigured() {
  const { supabaseUrl, supabaseAnonKey } = env;
  if (!supabaseUrl || !supabaseAnonKey) return false;
  if (supabaseUrl.includes('your-project')) return false;
  if (supabaseAnonKey === 'your-anon-key') return false;
  return true;
}

// Hostinger builds without Supabase vars, so the public config comes from the Railway API.
export async function loadRuntimeConfig() {
  if (isSupabaseConfigured() || !env.apiUrl) return;

  try {
    const response = await fetch(`${env.apiUrl}/api/config`, {
      signal: AbortSignal.timeout(5000),
    });
    if (!response.ok) return;
    const config = (await response.json()) as {
      supabaseUrl?: string;
      supabasePublishableKey?: string;
    };
    env.supabaseUrl = (config.supabaseUrl ?? '').trim();
    env.supabaseAnonKey = (config.supabasePublishableKey ?? '').trim();
  } catch (error) {
    console.warn('Could not load runtime config', error);
  }
}
