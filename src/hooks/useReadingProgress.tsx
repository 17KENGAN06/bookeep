import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { PROGRESS_STORAGE_KEY, progressStorageKey } from '@/config/storage';
import { useAuth } from '@/hooks/useAuth';
import {
  fetchCloudProgress,
  mergeProgressMaps,
  upsertCloudProgress,
} from '@/services/library';
import { recordReadingAdvance } from '@/services/reading';
import type { ReadingProgress, ReadingProgressMap } from '@/types/progress';
import { clamp } from '@/utils/cn';
import { localDateISO } from '@/utils/dates';

type ProgressContextValue = {
  map: ReadingProgressMap;
  updateProgress: (bookId: string, next: ReadingProgress) => void;
};

const ReadingProgressContext = createContext<ProgressContextValue | null>(null);

function readMap(key: string): ReadingProgressMap {
  if (typeof window === 'undefined') return {};

  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as ReadingProgressMap;
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return {};
  }
}

function writeMap(key: string, map: ReadingProgressMap) {
  try {
    window.localStorage.setItem(key, JSON.stringify(map));
  } catch {
    // storage full or blocked: the cloud copy is the source of truth anyway
  }
}

function removeKey(key: string) {
  try {
    window.localStorage.removeItem(key);
  } catch {
    // ignore
  }
}

/**
 * Progress belongs to the signed-in account. The Supabase table is the source of truth;
 * localStorage only keeps a per-account cache so pages show progress before the network answers.
 * Signed out, nobody's progress is shown.
 */
export function ReadingProgressProvider({ children }: { children: ReactNode }) {
  const { user, isLoading } = useAuth();
  const userId = user?.id ?? null;
  const [state, setState] = useState<{ userId: string | null; map: ReadingProgressMap }>(() => ({
    userId,
    map: userId ? readMap(progressStorageKey(userId)) : {},
  }));
  const lastUserRef = useRef<string | null>(null);

  // Another tab of the same account saved progress.
  useEffect(() => {
    if (!userId) return;
    const key = progressStorageKey(userId);
    const onStorage = (event: StorageEvent) => {
      if (event.key === key) setState({ userId, map: readMap(key) });
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, [userId]);

  useEffect(() => {
    if (isLoading) return;

    if (!userId) {
      // Signed out: drop the previous account's cache from this device and show nothing.
      if (lastUserRef.current) removeKey(progressStorageKey(lastUserRef.current));
      lastUserRef.current = null;
      setState({ userId: null, map: {} });
      return;
    }

    lastUserRef.current = userId;
    const key = progressStorageKey(userId);
    setState({ userId, map: readMap(key) });

    let active = true;
    void (async () => {
      try {
        const cloud = await fetchCloudProgress();
        // Progress saved before it was tied to accounts goes to the first account
        // that signs in on this device, then the shared copy is removed.
        const legacy = readMap(PROGRESS_STORAGE_KEY);
        const local = { ...legacy, ...readMap(key) };
        const merged = await mergeProgressMaps(local, cloud);
        removeKey(PROGRESS_STORAGE_KEY);
        if (!active) return;
        writeMap(key, merged);
        setState({ userId, map: merged });
      } catch {
        // offline: keep the cached copy
      }
    })();

    return () => {
      active = false;
    };
  }, [isLoading, userId]);

  const updateProgress = useCallback(
    (bookId: string, next: ReadingProgress) => {
      if (!userId) return;
      setState((current) => {
        const base = current.userId === userId ? current.map : {};
        const updated = { ...base, [bookId]: next };
        writeMap(progressStorageKey(userId), updated);
        return { userId, map: updated };
      });
    },
    [userId],
  );

  // Never show one account's map to another (or to a guest) while the effect above catches up.
  const map = state.userId === userId && userId ? state.map : EMPTY;
  const value = useMemo(() => ({ map, updateProgress }), [map, updateProgress]);

  return <ReadingProgressContext.Provider value={value}>{children}</ReadingProgressContext.Provider>;
}

const EMPTY: ReadingProgressMap = {};

export function useAllReadingProgress() {
  const context = useContext(ReadingProgressContext);
  if (!context) {
    throw new Error('useAllReadingProgress must be used within ReadingProgressProvider');
  }
  return context;
}

export function useReadingProgress(bookId?: string) {
  const { user } = useAuth();
  const { map, updateProgress } = useAllReadingProgress();

  const progress = bookId ? map[bookId] : undefined;

  const saveProgress = useCallback(
    (input: { currentPage: number; totalPages: number }) => {
      if (!bookId || !user || input.totalPages <= 0) return;

      const currentPage = clamp(input.currentPage, 1, input.totalPages);
      const percentage = Number(((currentPage / input.totalPages) * 100).toFixed(1));
      const previous = map[bookId];
      const maxPageReached = Math.max(previous?.maxPageReached ?? 0, currentPage);
      const next: ReadingProgress = {
        currentPage,
        totalPages: input.totalPages,
        percentage,
        lastReadAt: new Date().toISOString(),
        maxPageReached,
        completedAt:
          currentPage >= input.totalPages
            ? previous?.completedAt ?? new Date().toISOString()
            : previous?.completedAt ?? null,
      };

      updateProgress(bookId, next);

      void recordReadingAdvance({
        bookId,
        currentPage,
        totalPages: input.totalPages,
        readDate: localDateISO(),
      }).catch(() => {
        void upsertCloudProgress(bookId, next);
      });
    },
    [bookId, map, updateProgress, user],
  );

  const latest = useMemo(() => {
    return Object.entries(map).sort((a, b) => {
      return b[1].lastReadAt.localeCompare(a[1].lastReadAt);
    })[0];
  }, [map]);

  return { progress, saveProgress, map, latest };
}
