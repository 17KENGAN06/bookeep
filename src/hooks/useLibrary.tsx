import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { fetchFavoriteIds, fetchPlannedIds, setFavorite, setPlanned } from '@/services/library';

type LibraryContextValue = {
  favoriteIds: string[];
  plannedIds: string[];
  loading: boolean;
  isFavorite: (bookId: string) => boolean;
  isPlanned: (bookId: string) => boolean;
  toggleFavorite: (bookId: string) => Promise<boolean>;
  togglePlanned: (bookId: string) => Promise<boolean>;
};

const LibraryContext = createContext<LibraryContextValue | null>(null);

export function LibraryProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [favoriteIds, setFavoriteIds] = useState<string[]>([]);
  const [plannedIds, setPlannedIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(Boolean(user));

  useEffect(() => {
    if (!user) {
      setFavoriteIds([]);
      setPlannedIds([]);
      setLoading(false);
      return;
    }

    let active = true;
    setLoading(true);
    void Promise.all([fetchFavoriteIds(), fetchPlannedIds()])
      .then(([favorites, planned]) => {
        if (!active) return;
        setFavoriteIds(favorites);
        setPlannedIds(planned);
      })
      .catch(() => {
        if (!active) return;
        setFavoriteIds([]);
        setPlannedIds([]);
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [user]);

  const toggleFavorite = useCallback(
    async (bookId: string) => {
      if (!user) return false;
      const liked = !favoriteIds.includes(bookId);
      setFavoriteIds((current) => (liked ? [...current, bookId] : current.filter((id) => id !== bookId)));
      try {
        await setFavorite(bookId, liked);
        return true;
      } catch {
        setFavoriteIds((current) => (liked ? current.filter((id) => id !== bookId) : [...current, bookId]));
        return false;
      }
    },
    [favoriteIds, user],
  );

  const togglePlanned = useCallback(
    async (bookId: string) => {
      if (!user) return false;
      const planned = !plannedIds.includes(bookId);
      setPlannedIds((current) => (planned ? [...current, bookId] : current.filter((id) => id !== bookId)));
      try {
        await setPlanned(bookId, planned);
        return true;
      } catch {
        setPlannedIds((current) => (planned ? current.filter((id) => id !== bookId) : [...current, bookId]));
        return false;
      }
    },
    [plannedIds, user],
  );

  const value = useMemo(
    () => ({
      favoriteIds,
      plannedIds,
      loading,
      isFavorite: (bookId: string) => favoriteIds.includes(bookId),
      isPlanned: (bookId: string) => plannedIds.includes(bookId),
      toggleFavorite,
      togglePlanned,
    }),
    [favoriteIds, loading, plannedIds, toggleFavorite, togglePlanned],
  );

  return <LibraryContext.Provider value={value}>{children}</LibraryContext.Provider>;
}

export function useLibrary() {
  const context = useContext(LibraryContext);
  if (!context) {
    throw new Error('useLibrary must be used within LibraryProvider');
  }
  return context;
}
