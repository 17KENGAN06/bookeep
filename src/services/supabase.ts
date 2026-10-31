import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { env, isSupabaseConfigured } from '@/config/env';

let client: SupabaseClient | null = null;

export function getSupabaseClient() {
  if (!isSupabaseConfigured()) return null;
  client ??= createClient(env.supabaseUrl, env.supabaseAnonKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
      flowType: 'pkce',
    },
  });
  return client;
}

export const COVER_BUCKET = 'book-covers';
export const PDF_BUCKET = 'book-pdfs';

const OBJECT_PATH = '/storage/v1/object/public/';
const RENDER_PATH = '/storage/v1/render/image/public/';

// Storage answers with WebP when the browser accepts it. Mock data has no resized copy.
export function getResizedImageUrl(url: string, width: number) {
  if (!url.includes(OBJECT_PATH)) return null;
  return `${url.replace(OBJECT_PATH, RENDER_PATH)}?width=${width}&quality=70&resize=contain`;
}

export function getPublicFileUrl(bucket: string, path: string | null | undefined) {
  if (!path) return null;
  if (path.startsWith('http://') || path.startsWith('https://') || path.startsWith('/')) {
    return path;
  }

  const supabase = getSupabaseClient();
  if (!supabase) return null;

  return supabase.storage.from(bucket).getPublicUrl(path).data.publicUrl;
}
