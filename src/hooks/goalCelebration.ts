import { useCallback, useEffect, useState } from 'react';

type GoalCompletedDetail = {
  pages: number;
  target: number;
};

const EVENT = 'bookeep:goal-completed';

export function emitGoalCompleted(pages: number, target: number) {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new CustomEvent<GoalCompletedDetail>(EVENT, { detail: { pages, target } }));
}

export function useGoalCompletedListener() {
  const [detail, setDetail] = useState<GoalCompletedDetail | null>(null);

  useEffect(() => {
    const onGoal = (event: Event) => {
      const custom = event as CustomEvent<GoalCompletedDetail>;
      if (!custom.detail) return;
      setDetail(custom.detail);
    };
    window.addEventListener(EVENT, onGoal);
    return () => window.removeEventListener(EVENT, onGoal);
  }, []);

  const dismiss = useCallback(() => setDetail(null), []);

  return { detail, dismiss };
}
