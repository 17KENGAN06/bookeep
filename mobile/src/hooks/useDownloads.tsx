import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { downloadBook, downloadedUri, removeDownload } from '../services/offline';
import { preparePdfEngine } from '../services/pdfEngine';
import type { Book } from '../types/book';

type DownloadsContextValue = {
  localUri: (book: Book) => string | null;
  isBusy: (bookId: string) => boolean;
  download: (book: Book) => Promise<boolean>;
  remove: (book: Book) => void;
};

const DownloadsContext = createContext<DownloadsContextValue | null>(null);

export function DownloadsProvider({ children }: { children: ReactNode }) {
  const [version, setVersion] = useState(0);
  const [busy, setBusy] = useState<string[]>([]);

  useEffect(() => {
    void preparePdfEngine();
  }, []);

  const localUri = useCallback(
    (book: Book) => {
      void version;
      return downloadedUri(book);
    },
    [version],
  );

  const download = useCallback(async (book: Book) => {
    setBusy((current) => [...current, book.id]);
    try {
      await downloadBook(book);
      setVersion((value) => value + 1);
      return true;
    } catch {
      return false;
    } finally {
      setBusy((current) => current.filter((id) => id !== book.id));
    }
  }, []);

  const remove = useCallback((book: Book) => {
    removeDownload(book);
    setVersion((value) => value + 1);
  }, []);

  const value = useMemo(
    () => ({
      localUri,
      isBusy: (bookId: string) => busy.includes(bookId),
      download,
      remove,
    }),
    [busy, download, localUri, remove],
  );

  return <DownloadsContext.Provider value={value}>{children}</DownloadsContext.Provider>;
}

export function useDownloads() {
  const context = useContext(DownloadsContext);
  if (!context) throw new Error('useDownloads must be used within DownloadsProvider');
  return context;
}
