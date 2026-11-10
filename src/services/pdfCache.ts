import { getFullPdfUrl } from '@/services/access';

// Full books are kept on the device so opening one again needs no network.
// Every upload gets a new storage path, so the path alone names one version of a file.
const CACHE_NAME = 'bookeep-pdfs-v1';
const MAX_BOOKS = 4;

const inflight = new Map<string, Promise<Blob | null>>();
// Bumped on sign-out: a download still running then must not land in the cache.
let generation = 0;

function cacheKey(path: string) {
  return `https://pdf-cache.bookeep.local/${encodeURIComponent(path)}`;
}

async function openCache(): Promise<Cache | null> {
  try {
    if (typeof caches === 'undefined') return null;
    return await caches.open(CACHE_NAME);
  } catch {
    // Private mode or storage blocked.
    return null;
  }
}

async function prune(cache: Cache) {
  const keys = await cache.keys();
  // Keys come back in the order they were stored: the oldest go first.
  for (const request of keys.slice(0, Math.max(0, keys.length - MAX_BOOKS))) {
    await cache.delete(request);
  }
}

/** The cached file, or a fresh download that is then stored. Null when there is no cache. */
async function loadBlob(path: string): Promise<Blob | null> {
  const cache = await openCache();
  if (!cache) return null;
  const key = cacheKey(path);

  try {
    const hit = await cache.match(key);
    if (hit) return await hit.blob();
  } catch {
    return null;
  }

  const startedAt = generation;
  const response = await fetch(await getFullPdfUrl(path));
  if (!response.ok) throw new Error(`PDF download failed: ${response.status}`);
  const blob = await response.blob();

  if (startedAt === generation) {
    try {
      await cache.put(key, new Response(blob, { headers: { 'Content-Type': 'application/pdf' } }));
      await prune(cache);
    } catch {
      // Quota full: the file still opens, it is just not kept.
    }
  }
  return blob;
}

function loadOnce(path: string) {
  let request = inflight.get(path);
  if (!request) {
    request = loadBlob(path).finally(() => inflight.delete(path));
    inflight.set(path, request);
  }
  return request;
}

/**
 * A URL the reader can open: a blob: URL of the cached file (revoke it when done),
 * or the signed link itself when the browser has no Cache Storage.
 * Throws for readers without access, like getFullPdfUrl.
 */
export async function openFullPdf(path: string): Promise<string> {
  const blob = await loadOnce(path);
  if (!blob) return getFullPdfUrl(path);
  return URL.createObjectURL(blob);
}

/** Downloads the book into the cache ahead of time. */
export function warmFullPdf(path: string) {
  void loadOnce(path).catch(() => {});
}

export function clearPdfCache() {
  generation += 1;
  inflight.clear();
  try {
    if (typeof caches !== 'undefined') void caches.delete(CACHE_NAME).catch(() => {});
  } catch {
    // Nothing stored.
  }
}
