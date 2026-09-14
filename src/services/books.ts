import { mockBooks } from '@/data/mockBooks';
import { isSupabaseConfigured } from '@/config/env';
import {
  COVER_BUCKET,
  getPublicFileUrl,
  getSupabaseClient,
  PDF_BUCKET,
} from '@/services/supabase';
import type { Book, BookLanguage, CefrLevel } from '@/types/book';
import { fileExtension, isCoverFile, isPdfFile } from '@/utils/files';
import { slugify } from '@/utils/slug';

export type BookDraft = {
  title_original: string;
  title_en: string | null;
  title_fi: string | null;
  title_uk: string | null;
  title_ru: string | null;
  description_en: string | null;
  description_fi: string | null;
  description_uk: string | null;
  description_ru: string | null;
  language: BookLanguage;
  level: CefrLevel;
  published: boolean;
  slug?: string;
};

let booksCache: Book[] | null = null;
let booksRequest: Promise<Book[]> | null = null;

function wait(ms: number) {
  return new Promise((resolve) => {
    window.setTimeout(resolve, ms);
  });
}

export function peekPublishedBooks(): Book[] | null {
  return booksCache;
}

export function invalidateBooksCache() {
  booksCache = null;
  booksRequest = null;
}

function mapBook(row: Book): Book {
  return {
    ...row,
    cover_path: getPublicFileUrl(COVER_BUCKET, row.cover_path),
    pdf_path: getPublicFileUrl(PDF_BUCKET, row.pdf_path),
  };
}

async function fetchPublishedFromSupabase(): Promise<Book[]> {
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

async function fetchPublishedFromMocks(): Promise<Book[]> {
  await wait(220);
  return mockBooks
    .filter((book) => book.published)
    .slice()
    .sort((a, b) => b.created_at.localeCompare(a.created_at));
}

export async function fetchPublishedBooks(): Promise<Book[]> {
  if (booksCache) return booksCache;
  if (booksRequest) return booksRequest;

  booksRequest = (async () => {
    booksCache = isSupabaseConfigured()
      ? await fetchPublishedFromSupabase()
      : await fetchPublishedFromMocks();
    return booksCache;
  })();

  try {
    return await booksRequest;
  } catch (error) {
    booksRequest = null;
    throw error;
  }
}

export async function fetchBookBySlug(slug: string): Promise<Book | null> {
  if (isSupabaseConfigured()) {
    const supabase = getSupabaseClient();
    if (!supabase) return null;

    const { data, error } = await supabase
      .from('books')
      .select('*')
      .eq('slug', slug)
      .eq('published', true)
      .maybeSingle();

    if (error) throw error;
    return data ? mapBook(data as Book) : null;
  }

  const books = await fetchPublishedBooks();
  return books.find((book) => book.slug === slug) ?? null;
}

export async function fetchAllBooks(): Promise<Book[]> {
  const supabase = getSupabaseClient();
  if (!supabase) throw new Error('Supabase is not configured');

  const { data, error } = await supabase
    .from('books')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw error;
  return ((data ?? []) as Book[]).map(mapBook);
}

export async function fetchBookById(id: string): Promise<Book | null> {
  const supabase = getSupabaseClient();
  if (!supabase) throw new Error('Supabase is not configured');

  const { data, error } = await supabase.from('books').select('*').eq('id', id).maybeSingle();
  if (error) throw error;
  return data ? mapBook(data as Book) : null;
}

async function uniqueSlug(base: string, excludeId?: string) {
  const supabase = getSupabaseClient();
  if (!supabase) return slugify(base);

  const root = slugify(base);
  let candidate = root;
  let attempt = 2;

  while (true) {
    const query = supabase.from('books').select('id').eq('slug', candidate).maybeSingle();
    const { data, error } = await query;
    if (error) throw error;
    if (!data || (excludeId && (data as { id: string }).id === excludeId)) return candidate;
    candidate = `${root}-${attempt}`;
    attempt += 1;
  }
}

async function uploadObject(bucket: string, path: string, file: File) {
  const supabase = getSupabaseClient();
  if (!supabase) throw new Error('Supabase is not configured');

  const { error } = await supabase.storage.from(bucket).upload(path, file, {
    cacheControl: '3600',
    upsert: false,
  });

  if (error) throw error;
  return path;
}

export async function uploadCover(bookId: string, file: File) {
  if (!isCoverFile(file)) throw new Error('Invalid cover file');
  const path = `${bookId}/${crypto.randomUUID()}.${fileExtension(file, 'jpg')}`;
  return uploadObject(COVER_BUCKET, path, file);
}

export async function uploadPdf(bookId: string, file: File) {
  if (!isPdfFile(file)) throw new Error('Invalid PDF file');
  const path = `${bookId}/${crypto.randomUUID()}.pdf`;
  return uploadObject(PDF_BUCKET, path, file);
}

async function removeStoragePath(bucket: string, path: string | null) {
  if (!path || path.startsWith('http://') || path.startsWith('https://') || path.startsWith('/')) {
    return;
  }
  const supabase = getSupabaseClient();
  if (!supabase) return;
  await supabase.storage.from(bucket).remove([path]);
}

export async function createBook(input: {
  draft: BookDraft;
  cover: File;
  pdf: File;
}) {
  const supabase = getSupabaseClient();
  if (!supabase) throw new Error('Supabase is not configured');

  const id = crypto.randomUUID();
  const slug = await uniqueSlug(input.draft.slug || input.draft.title_original);
  const coverPath = await uploadCover(id, input.cover);
  const pdfPath = await uploadPdf(id, input.pdf);

  const { data, error } = await supabase
    .from('books')
    .insert({
      id,
      ...input.draft,
      slug,
      cover_path: coverPath,
      pdf_path: pdfPath,
    })
    .select('*')
    .single();

  if (error) {
    await removeStoragePath(COVER_BUCKET, coverPath);
    await removeStoragePath(PDF_BUCKET, pdfPath);
    throw error;
  }

  invalidateBooksCache();
  return mapBook(data as Book);
}

export async function updateBook(
  id: string,
  input: {
    draft: BookDraft;
    cover?: File | null;
    pdf?: File | null;
    currentCoverPath?: string | null;
    currentPdfPath?: string | null;
  },
) {
  const supabase = getSupabaseClient();
  if (!supabase) throw new Error('Supabase is not configured');

  const slug = await uniqueSlug(input.draft.slug || input.draft.title_original, id);
  let coverPath: string | undefined;
  let pdfPath: string | undefined;

  if (input.cover) coverPath = await uploadCover(id, input.cover);
  if (input.pdf) pdfPath = await uploadPdf(id, input.pdf);

  const { data, error } = await supabase
    .from('books')
    .update({
      ...input.draft,
      slug,
      ...(coverPath ? { cover_path: coverPath } : {}),
      ...(pdfPath ? { pdf_path: pdfPath } : {}),
    })
    .eq('id', id)
    .select('*')
    .single();

  if (error) {
    if (coverPath) await removeStoragePath(COVER_BUCKET, coverPath);
    if (pdfPath) await removeStoragePath(PDF_BUCKET, pdfPath);
    throw error;
  }

  if (coverPath) await removeStoragePath(COVER_BUCKET, storagePathFromPublicUrl(input.currentCoverPath ?? null, COVER_BUCKET));
  if (pdfPath) await removeStoragePath(PDF_BUCKET, storagePathFromPublicUrl(input.currentPdfPath ?? null, PDF_BUCKET));

  invalidateBooksCache();
  return mapBook(data as Book);
}

export async function deleteBook(book: Book) {
  const supabase = getSupabaseClient();
  if (!supabase) throw new Error('Supabase is not configured');

  const { error } = await supabase.from('books').delete().eq('id', book.id);
  if (error) throw error;

  const coverPath = storagePathFromPublicUrl(book.cover_path, COVER_BUCKET);
  const pdfPath = storagePathFromPublicUrl(book.pdf_path, PDF_BUCKET);
  await removeStoragePath(COVER_BUCKET, coverPath);
  await removeStoragePath(PDF_BUCKET, pdfPath);
  invalidateBooksCache();
}

function storagePathFromPublicUrl(value: string | null, bucket: string) {
  if (!value) return null;
  if (!value.startsWith('http://') && !value.startsWith('https://')) return value;
  const marker = `/object/public/${bucket}/`;
  const index = value.indexOf(marker);
  if (index === -1) return null;
  return decodeURIComponent(value.slice(index + marker.length));
}
