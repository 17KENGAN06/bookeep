import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { AppState } from 'react-native';
import { env, isSupabaseConfigured } from '../config/env';

let client: SupabaseClient | null = null;
let appStateBound = false;

function bindAppState(supabase: SupabaseClient) {
  if (appStateBound) return;
  appStateBound = true;
  AppState.addEventListener('change', (state) => {
    if (state === 'active') supabase.auth.startAutoRefresh();
    else supabase.auth.stopAutoRefresh();
  });
}

export function getSupabaseClient() {
  if (!isSupabaseConfigured()) return null;
  client ??= createClient(env.supabaseUrl, env.supabaseAnonKey, {
    auth: {
      storage: AsyncStorage,
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: false,
      flowType: 'pkce',
    },
  });
  bindAppState(client);
  return client;
}

export const COVER_BUCKET = 'book-covers';
export const PDF_BUCKET = 'book-pdfs';

export function getPublicFileUrl(bucket: string, path: string | null | undefined) {
  if (!path) return null;
  if (path.startsWith('http://') || path.startsWith('https://') || path.startsWith('/')) {
    return path;
  }

  const supabase = getSupabaseClient();
  if (!supabase) return null;

  return supabase.storage.from(bucket).getPublicUrl(path).data.publicUrl;
}
