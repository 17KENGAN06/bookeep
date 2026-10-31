const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL ?? '';
const SUPABASE_ANON_KEY =
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ?? import.meta.env.VITE_SUPABASE_ANON_KEY ?? '';
const API_URL = import.meta.env.VITE_API_URL ?? '';

const CONFIG_CACHE_KEY = 'bookeep_runtime_config';

type RuntimeConfig = {
  supabaseUrl?: string;
  supabasePublishableKey?: string;
};

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

  const cached = readCachedConfig();
  if (cached) {
    applyConfig(cached);
    void fetchRuntimeConfig();
    return;
  }

  const config = await fetchRuntimeConfig();
  if (config) applyConfig(config);
}

// Later visits start from the cached copy; a refresh only takes effect on the next load.
async function fetchRuntimeConfig() {
  try {
    const response = await fetch(`${env.apiUrl}/api/config`, {
      signal: AbortSignal.timeout(5000),
    });
    if (!response.ok) return null;
    const config = (await response.json()) as RuntimeConfig;
    writeCachedConfig(config);
    return config;
  } catch (error) {
    console.warn('Could not load runtime config', error);
    return null;
  }
}

function applyConfig(config: RuntimeConfig) {
  env.supabaseUrl = (config.supabaseUrl ?? '').trim();
  env.supabaseAnonKey = (config.supabasePublishableKey ?? '').trim();
}

function readCachedConfig() {
  try {
    const config = JSON.parse(localStorage.getItem(CONFIG_CACHE_KEY) ?? 'null') as RuntimeConfig | null;
    return config?.supabaseUrl && config.supabasePublishableKey ? config : null;
  } catch {
    return null;
  }
}

function writeCachedConfig(config: RuntimeConfig) {
  if (!config.supabaseUrl || !config.supabasePublishableKey) return;
  try {
    localStorage.setItem(CONFIG_CACHE_KEY, JSON.stringify(config));
  } catch {
    // Private mode: the config is simply fetched on every visit.
  }
}
