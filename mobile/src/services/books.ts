import type { Book } from '../types/book';
import { COVER_BUCKET, getPublicFileUrl, getSupabaseClient, PDF_BUCKET } from './supabase';

function mapBook(row: Book): Book {
  return {
    ...row,
    cover_path: getPublicFileUrl(COVER_BUCKET, row.cover_path),
    thumbnail_path: getPublicFileUrl(COVER_BUCKET, row.thumbnail_path),
    pdf_path: getPublicFileUrl(PDF_BUCKET, row.pdf_path),
    complete: row.complete ?? true,
  };
}

export async function fetchPublishedBooks(): Promise<Book[]> {
  const supabase = getSupabaseClient();
  if (!supabase) throw new Error('Supabase is not configured');

  const { data, error } = await supabase
    .from('books')
    .select('*')
    .eq('published', true)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return ((data ?? []) as Book[]).map(mapBook);
}

export async function fetchPublishedBookBySlug(slug: string): Promise<Book | null> {
  const supabase = getSupabaseClient();
  if (!supabase) throw new Error('Supabase is not configured');

  const { data, error } = await supabase
    .from('books')
    .select('*')
    .eq('published', true)
    .eq('slug', slug)
    .maybeSingle();

  if (error) throw error;
  return data ? mapBook(data as Book) : null;
}
