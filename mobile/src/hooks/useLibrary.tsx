import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { useAuth } from './AuthProvider';
import { fetchCloudProgress, fetchFavoriteIds, fetchPlannedIds, setFavorite, setPlanned, upsertCloudProgress } from '../services/library';
import { recordReadingAdvance } from '../services/reading';
import type { ReadingProgress, ReadingProgressMap } from '../types/progress';
import { localDateISO } from '../utils/dates';

type LibraryContextValue = {
  favoriteIds: string[];
  plannedIds: string[];
  progress: ReadingProgressMap;
  loading: boolean;
  isFavorite: (bookId: string) => boolean;
  isPlanned: (bookId: string) => boolean;
  toggleFavorite: (bookId: string) => Promise<boolean>;
  togglePlanned: (bookId: string) => Promise<boolean>;
  recordProgress: (bookId: string, input: { currentPage: number; totalPages: number }) => void;
  reload: () => Promise<void>;
};

const LibraryContext = createContext<LibraryContextValue | null>(null);

export function LibraryProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [favoriteIds, setFavoriteIds] = useState<string[]>([]);
  const [plannedIds, setPlannedIds] = useState<string[]>([]);
  const [progress, setProgress] = useState<ReadingProgressMap>({});
  const [loading, setLoading] = useState(Boolean(user));

  const reload = useCallback(async () => {
    if (!user) {
      setFavoriteIds([]);
      setPlannedIds([]);
      setProgress({});
      return;
    }
    try {
      const [favorites, planned, cloud] = await Promise.all([
        fetchFavoriteIds(),
        fetchPlannedIds(),
        fetchCloudProgress(),
      ]);
      setFavoriteIds(favorites);
      setPlannedIds(planned);
      setProgress(cloud);
    } catch {
      setFavoriteIds([]);
      setPlannedIds([]);
      setProgress({});
    }
  }, [user]);

  useEffect(() => {
    if (!user) {
      setFavoriteIds([]);
      setPlannedIds([]);
      setProgress({});
      setLoading(false);
      return;
    }

    let active = true;
    setLoading(true);
    void Promise.all([fetchFavoriteIds(), fetchPlannedIds(), fetchCloudProgress()])
      .then(([favorites, planned, cloud]) => {
        if (!active) return;
        setFavoriteIds(favorites);
        setPlannedIds(planned);
        setProgress(cloud);
      })
      .catch(() => {
        if (!active) return;
        setFavoriteIds([]);
        setPlannedIds([]);
        setProgress({});
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
      setFavoriteIds((current) => (liked ? [bookId, ...current.filter((id) => id !== bookId)] : current.filter((id) => id !== bookId)));
      try {
        await setFavorite(bookId, liked);
        return true;
      } catch {
        setFavoriteIds((current) => (liked ? current.filter((id) => id !== bookId) : [bookId, ...current]));
        return false;
      }
    },
    [favoriteIds, user],
  );

  const togglePlanned = useCallback(
    async (bookId: string) => {
      if (!user) return false;
      const planned = !plannedIds.includes(bookId);
      setPlannedIds((current) => (planned ? [bookId, ...current.filter((id) => id !== bookId)] : current.filter((id) => id !== bookId)));
      try {
        await setPlanned(bookId, planned);
        return true;
      } catch {
        setPlannedIds((current) => (planned ? current.filter((id) => id !== bookId) : [bookId, ...current]));
        return false;
      }
    },
    [plannedIds, user],
  );

  const recordProgress = useCallback((bookId: string, input: { currentPage: number; totalPages: number }) => {
    if (input.totalPages <= 0) return;
    const currentPage = Math.min(input.totalPages, Math.max(1, input.currentPage));
    setProgress((current) => {
      const previous = current[bookId];
      const next: ReadingProgress = {
        currentPage,
        totalPages: input.totalPages,
        percentage: Number(((currentPage / input.totalPages) * 100).toFixed(1)),
        lastReadAt: new Date().toISOString(),
        maxPageReached: Math.max(previous?.maxPageReached ?? 0, currentPage),
        completedAt:
          currentPage >= input.totalPages
            ? previous?.completedAt ?? new Date().toISOString()
            : previous?.completedAt ?? null,
      };
      if (user) {
        void recordReadingAdvance({
          bookId,
          currentPage,
          totalPages: input.totalPages,
          readDate: localDateISO(),
        }).catch(() => {
          void upsertCloudProgress(bookId, next);
        });
      }
      return { ...current, [bookId]: next };
    });
  }, [user]);

  const value = useMemo(
    () => ({
      favoriteIds,
      plannedIds,
      progress,
      loading,
      isFavorite: (bookId: string) => favoriteIds.includes(bookId),
      isPlanned: (bookId: string) => plannedIds.includes(bookId),
      toggleFavorite,
      togglePlanned,
      recordProgress,
      reload,
    }),
    [favoriteIds, loading, plannedIds, progress, recordProgress, reload, toggleFavorite, togglePlanned],
  );

  return <LibraryContext.Provider value={value}>{children}</LibraryContext.Provider>;
}

export function useLibrary() {
  const context = useContext(LibraryContext);
  if (!context) throw new Error('useLibrary must be used within LibraryProvider');
  return context;
}
