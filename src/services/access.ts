import { isSupabaseConfigured } from '@/config/env';
import { getSupabaseClient, PDF_BUCKET } from '@/services/supabase';

// Signed links let the reader open a private file. They are kept for the tab's life
// so going back to a book reuses the link and the browser's cached copy of the PDF.
const SIGNED_TTL_SECONDS = 60 * 60 * 6;
const REUSE_MARGIN_MS = 30 * 60 * 1000;
const SIGNED_CACHE_KEY = 'bookeep_signed_pdfs';

type SignedEntry = { url: string; expiresAt: number };

function readSignedCache(): Record<string, SignedEntry> {
  try {
    return JSON.parse(sessionStorage.getItem(SIGNED_CACHE_KEY) ?? '{}') as Record<string, SignedEntry>;
  } catch {
    return {};
  }
}

function writeSignedCache(cache: Record<string, SignedEntry>) {
  try {
    sessionStorage.setItem(SIGNED_CACHE_KEY, JSON.stringify(cache));
  } catch {
    // Private mode: a new link is made on every open.
  }
}

export function clearSignedPdfCache() {
  try {
    sessionStorage.removeItem(SIGNED_CACHE_KEY);
  } catch {
    // Nothing stored.
  }
}

/** True for admins and readers with an active subscription. The database decides. */
export async function fetchHasSubscription(): Promise<boolean> {
  // Mock catalog (no Supabase): everything is open so the app can be tried locally.
  if (!isSupabaseConfigured()) return true;
  const supabase = getSupabaseClient();
  if (!supabase) return false;
  const { data, error } = await supabase.rpc('has_active_subscription');
  if (error) throw error;
  return data === true;
}

function isDirectUrl(path: string) {
  return path.startsWith('http://') || path.startsWith('https://') || path.startsWith('/');
}

/**
 * A link to the full PDF. Storage hands it out only to subscribers and admins
 * (RLS on book-pdfs), so for anyone else this throws.
 */
export async function getFullPdfUrl(path: string, options: { download?: string } = {}): Promise<string> {
  if (isDirectUrl(path)) return path;
  const supabase = getSupabaseClient();
  if (!supabase) throw new Error('Supabase is not configured');

  const cacheKey = options.download ? `${path}#download` : path;
  const cache = readSignedCache();
  const cached = cache[cacheKey];
  if (cached && cached.expiresAt - REUSE_MARGIN_MS > Date.now()) return cached.url;

  const { data, error } = await supabase.storage
    .from(PDF_BUCKET)
    .createSignedUrl(path, SIGNED_TTL_SECONDS, options.download ? { download: options.download } : undefined);
  if (error || !data?.signedUrl) throw error ?? new Error('No signed URL');

  cache[cacheKey] = { url: data.signedUrl, expiresAt: Date.now() + SIGNED_TTL_SECONDS * 1000 };
  writeSignedCache(cache);
  return data.signedUrl;
}
