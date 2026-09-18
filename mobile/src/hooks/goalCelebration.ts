import { useCallback, useEffect, useState } from 'react';

type GoalCompletedDetail = {
  pages: number;
  target: number;
};

type Handler = (detail: GoalCompletedDetail) => void;

const listeners = new Set<Handler>();

export function emitGoalCompleted(pages: number, target: number) {
  const detail = { pages, target };
  for (const handler of listeners) handler(detail);
}

export function useGoalCompletedListener() {
  const [detail, setDetail] = useState<GoalCompletedDetail | null>(null);

  useEffect(() => {
    const handler: Handler = (next) => setDetail(next);
    listeners.add(handler);
    return () => {
      listeners.delete(handler);
    };
  }, []);

  const dismiss = useCallback(() => setDetail(null), []);

  return { detail, dismiss };
}
