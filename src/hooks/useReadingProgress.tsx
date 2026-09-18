import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { PROGRESS_STORAGE_KEY } from '@/config/storage';
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

function readProgressMap(): ReadingProgressMap {
  if (typeof window === 'undefined') return {};

  try {
    const raw = window.localStorage.getItem(PROGRESS_STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as ReadingProgressMap;
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return {};
  }
}

function writeProgressMap(map: ReadingProgressMap) {
  window.localStorage.setItem(PROGRESS_STORAGE_KEY, JSON.stringify(map));
}

export function ReadingProgressProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [map, setMap] = useState<ReadingProgressMap>(() => readProgressMap());

  useEffect(() => {
    const onStorage = (event: StorageEvent) => {
      if (event.key === PROGRESS_STORAGE_KEY) {
        setMap(readProgressMap());
      }
    };

    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  useEffect(() => {
    if (!user) {
      setMap(readProgressMap());
      return;
    }

    let active = true;
    void (async () => {
      try {
        const cloud = await fetchCloudProgress();
        const merged = await mergeProgressMaps(readProgressMap(), cloud);
        if (!active) return;
        writeProgressMap(merged);
        setMap(merged);
      } catch {
        if (active) setMap(readProgressMap());
      }
    })();

    return () => {
      active = false;
    };
  }, [user]);

  const updateProgress = useCallback((bookId: string, next: ReadingProgress) => {
    setMap((current) => {
      const updated = { ...current, [bookId]: next };
      writeProgressMap(updated);
      return updated;
    });
  }, []);

  const value = useMemo(() => ({ map, updateProgress }), [map, updateProgress]);

  return <ReadingProgressContext.Provider value={value}>{children}</ReadingProgressContext.Provider>;
}

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
      if (!bookId || input.totalPages <= 0) return;

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
