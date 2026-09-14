import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { env, isSupabaseConfigured } from '@/config/env';

let client: SupabaseClient | null = null;

export function getSupabaseClient() {
  if (!isSupabaseConfigured()) return null;
  client ??= createClient(env.supabaseUrl, env.supabaseAnonKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: false,
    },
  });
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
