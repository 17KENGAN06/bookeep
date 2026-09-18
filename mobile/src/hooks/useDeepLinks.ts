import { useEffect } from 'react';
import * as Linking from 'expo-linking';
import { useTranslation } from 'react-i18next';
import { fetchPublishedBookBySlug } from '../services/books';
import { useToast } from './ToastProvider';
import { useNavigation } from './useNavigation';

export function bookSlugFromUrl(url: string): string | null {
  const parsed = Linking.parse(url);
  const parts = [parsed.hostname, ...(parsed.path ?? '').split('/')]
    .map((part) => part?.trim() ?? '')
    .filter((part) => part && part !== '--');

  if (parts.includes('auth')) return null;

  const booksAt = parts.indexOf('books');
  const bookSlug = booksAt >= 0 ? parts[booksAt + 1] : undefined;
  if (bookSlug && bookSlug !== 'new') return decodeURIComponent(bookSlug);

  const readAt = parts.indexOf('read');
  const readSlug = readAt >= 0 ? parts[readAt + 1] : undefined;
  if (readSlug) return decodeURIComponent(readSlug);

  return null;
}

export function DeepLinkHandler() {
  const { t } = useTranslation();
  const { notify } = useToast();
  const { openLinkedBook } = useNavigation();

  useEffect(() => {
    let active = true;

    async function openFromUrl(url: string | null) {
      if (!url) return;
      const slug = bookSlugFromUrl(url);
      if (!slug) return;
      try {
        const book = await fetchPublishedBookBySlug(slug);
        if (!active) return;
        if (!book) {
          notify(t('book.notFound'), 'error');
          return;
        }
        openLinkedBook(book);
      } catch {
        if (active) notify(t('books.errorHint'), 'error');
      }
    }

    const sub = Linking.addEventListener('url', ({ url }) => {
      void openFromUrl(url);
    });
    void Linking.getInitialURL().then((url) => {
      void openFromUrl(url);
    });

    return () => {
      active = false;
      sub.remove();
    };
  }, [notify, openLinkedBook, t]);

  return null;
}
