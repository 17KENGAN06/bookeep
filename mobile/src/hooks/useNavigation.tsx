import { createContext, useContext, useMemo, useState, type ReactNode } from 'react';
import type { Book } from '../types/book';

export type AppTab = 'home' | 'catalog' | 'library' | 'more';
export type InfoPage = 'about' | 'contact' | 'privacy';

type NavigationContextValue = {
  tab: AppTab;
  setTab: (tab: AppTab) => void;
  authOpen: boolean;
  openAuth: () => void;
  closeAuth: () => void;
  detailBook: Book | null;
  openBook: (book: Book) => void;
  openLinkedBook: (book: Book) => void;
  closeBook: () => void;
  readerBook: Book | null;
  openReader: (book: Book) => void;
  closeReader: () => void;
  infoPage: InfoPage | null;
  openInfo: (page: InfoPage) => void;
  closeInfo: () => void;
};

const NavigationContext = createContext<NavigationContextValue | null>(null);

export function NavigationProvider({ children }: { children: ReactNode }) {
  const [tab, setTabState] = useState<AppTab>('home');
  const [authOpen, setAuthOpen] = useState(false);
  const [detailBook, setDetailBook] = useState<Book | null>(null);
  const [readerBook, setReaderBook] = useState<Book | null>(null);
  const [infoPage, setInfoPage] = useState<InfoPage | null>(null);

  const value = useMemo(
    () => ({
      tab,
      setTab: (next: AppTab) => {
        setTabState(next);
        setDetailBook(null);
        setInfoPage(null);
      },
      authOpen,
      openAuth: () => setAuthOpen(true),
      closeAuth: () => setAuthOpen(false),
      detailBook,
      openBook: (book: Book) => {
        setAuthOpen(false);
        setDetailBook(book);
      },
      openLinkedBook: (book: Book) => {
        setAuthOpen(false);
        setReaderBook(null);
        setInfoPage(null);
        setTabState('catalog');
        setDetailBook(book);
      },
      closeBook: () => setDetailBook(null),
      readerBook,
      openReader: (book: Book) => {
        setAuthOpen(false);
        setReaderBook(book);
      },
      closeReader: () => setReaderBook(null),
      infoPage,
      openInfo: (page: InfoPage) => setInfoPage(page),
      closeInfo: () => setInfoPage(null),
    }),
    [authOpen, detailBook, infoPage, readerBook, tab],
  );

  return <NavigationContext.Provider value={value}>{children}</NavigationContext.Provider>;
}

export function useNavigation() {
  const context = useContext(NavigationContext);
  if (!context) throw new Error('useNavigation must be used within NavigationProvider');
  return context;
}
