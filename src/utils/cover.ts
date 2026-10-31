import { getResizedImageUrl } from '@/services/supabase';
import type { Book } from '@/types/book';

/** Resized copy of a book's cover (falls back to the original file). */
export function coverUrl(book: Book, width = 800) {
  const url = book.cover_path ?? book.thumbnail_path;
  if (!url) return null;
  return getResizedImageUrl(url, width) ?? url;
}
