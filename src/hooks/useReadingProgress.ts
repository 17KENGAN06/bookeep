import { useCallback, useEffect, useMemo, useState } from 'react';
import { PROGRESS_STORAGE_KEY } from '@/config/storage';
import type { ReadingProgress, ReadingProgressMap } from '@/types/progress';
import { clamp } from '@/utils/cn';

const demoProgress: ReadingProgressMap = {
  '11111111-1111-4111-8111-000000000001': {
    currentPage: 3,
    totalPages: 10,
    percentage: 30,
    lastReadAt: '2026-09-12T18:40:00.000Z',
  },
  '11111111-1111-4111-8111-000000000004': {
    currentPage: 2,
    totalPages: 10,
    percentage: 20,
    lastReadAt: '2026-09-11T21:12:00.000Z',
  },
};

function readProgressMap(): ReadingProgressMap {
  if (typeof window === 'undefined') return {};

  try {
    const raw = window.localStorage.getItem(PROGRESS_STORAGE_KEY);
    if (!raw) {
      window.localStorage.setItem(PROGRESS_STORAGE_KEY, JSON.stringify(demoProgress));
      return demoProgress;
    }

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

  const updateProgress = useCallback((bookId: string, next: ReadingProgress) => {
    setMap((current) => {
      const updated = { ...current, [bookId]: next };
      writeProgressMap(updated);
      return updated;
    });
  }, []);

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
