import { useCallback, useEffect, useState } from 'react';
import { fetchBookBySlug, fetchPublishedBooks, peekPublishedBooks } from '@/services/books';
import type { Book } from '@/types/book';

type LoadState = 'loading' | 'success' | 'error';

export function useBooks() {
  const cached = peekPublishedBooks();
  const [books, setBooks] = useState<Book[]>(cached ?? []);
  const [status, setStatus] = useState<LoadState>(cached ? 'success' : 'loading');

  const load = useCallback(async () => {
    if (!peekPublishedBooks()) setStatus('loading');
    try {
      const next = await fetchPublishedBooks();
      setBooks(next);
      setStatus('success');
    } catch {
      setStatus('error');
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  return { books, status, reload: load };
}

export function useBook(slug: string | undefined) {
  const cached = slug
    ? (peekPublishedBooks()?.find((book) => book.slug === slug) ?? null)
    : null;
  const [book, setBook] = useState<Book | null>(cached);
  const [status, setStatus] = useState<LoadState>(cached ? 'success' : 'loading');

  const load = useCallback(async () => {
    if (!slug) {
      setBook(null);
      setStatus('error');
      return;
    }

    const fromCache = peekPublishedBooks()?.find((item) => item.slug === slug) ?? null;
    if (fromCache) {
      setBook(fromCache);
      setStatus('success');
      return;
    }

    setStatus('loading');
    try {
      const next = await fetchBookBySlug(slug);
      setBook(next);
      setStatus(next ? 'success' : 'error');
    } catch {
      setBook(null);
      setStatus('error');
    }
  }, [slug]);

  useEffect(() => {
    void load();
  }, [load]);

  return { book, status, reload: load };
}
