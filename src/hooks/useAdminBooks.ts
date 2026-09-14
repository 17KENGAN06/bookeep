import { useCallback, useEffect, useState } from 'react';
import { fetchAllBooks } from '@/services/books';
import type { Book } from '@/types/book';

type LoadState = 'loading' | 'success' | 'error';

export function useAdminBooks() {
  const [books, setBooks] = useState<Book[]>([]);
  const [status, setStatus] = useState<LoadState>('loading');

  const load = useCallback(async () => {
    setStatus('loading');
    try {
      const next = await fetchAllBooks();
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
