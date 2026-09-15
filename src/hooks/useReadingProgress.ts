import { useCallback, useEffect, useMemo, useState } from 'react';
import { PROGRESS_STORAGE_KEY } from '@/config/storage';
import { useAuth } from '@/hooks/useAuth';
import {
  fetchCloudProgress,
  mergeProgressMaps,
  upsertCloudProgress,
} from '@/services/library';
import type { ReadingProgress, ReadingProgressMap } from '@/types/progress';
import { clamp } from '@/utils/cn';

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

export function useAllReadingProgress() {
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

  const updateProgress = useCallback(
    (bookId: string, next: ReadingProgress) => {
      setMap((current) => {
        const updated = { ...current, [bookId]: next };
        writeProgressMap(updated);
        return updated;
      });
      if (user) {
        void upsertCloudProgress(bookId, next);
      }
    },
    [user],
  );

  return { map, updateProgress };
}

export function useReadingProgress(bookId?: string) {
  const { map, updateProgress } = useAllReadingProgress();

  const progress = bookId ? map[bookId] : undefined;

  const saveProgress = useCallback(
    (input: { currentPage: number; totalPages: number }) => {
      if (!bookId || input.totalPages <= 0) return;

      const currentPage = clamp(input.currentPage, 1, input.totalPages);
      const percentage = Number(((currentPage / input.totalPages) * 100).toFixed(1));

      updateProgress(bookId, {
        currentPage,
        totalPages: input.totalPages,
        percentage,
        lastReadAt: new Date().toISOString(),
      });
    },
    [bookId, updateProgress],
  );

  const latest = useMemo(() => {
    return Object.entries(map).sort((a, b) => {
      return b[1].lastReadAt.localeCompare(a[1].lastReadAt);
    })[0];
  }, [map]);

  return { progress, saveProgress, map, latest };
}
