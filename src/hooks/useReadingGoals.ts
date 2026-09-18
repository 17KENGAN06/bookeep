import { useCallback, useEffect, useMemo, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { deleteReadingGoal, fetchCompletedGoalDates, fetchMonthReading, upsertReadingGoal } from '@/services/reading';
import type { DayReadingState, ReadingGoal } from '@/types/reading';
import { addDaysISO, currentStreak, dateISO, daysInMonth, localDateISO, monthRange } from '@/utils/dates';

function dayState(
  date: string,
  pagesByDate: Record<string, number>,
  goals: ReadingGoal[],
): DayReadingState {
  const goal = goals.find((item) => item.date === date);
  const pagesRead = pagesByDate[date] ?? 0;
  return {
    date,
    pagesRead,
    targetPages: goal?.targetPages ?? null,
    completed: Boolean(goal && pagesRead >= goal.targetPages),
  };
}

export function useReadingGoals(year: number, month: number) {
  const { user } = useAuth();
  const today = localDateISO();
  const { start, end } = useMemo(() => monthRange(year, month), [month, year]);
  const [goals, setGoals] = useState<ReadingGoal[]>([]);
  const [pagesByDate, setPagesByDate] = useState<Record<string, number>>({});
  const [streak, setStreak] = useState(0);
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>(user ? 'loading' : 'ready');

  const load = useCallback(async (silent = false) => {
    if (!user) {
      setGoals([]);
      setPagesByDate({});
      setStreak(0);
      setStatus('ready');
      return;
    }
    if (!silent) setStatus('loading');
    try {
      const [{ goals: nextGoals, pagesByDate: nextPages }, completed] = await Promise.all([
        fetchMonthReading(start, end),
        fetchCompletedGoalDates(addDaysISO(today, -90), today),
      ]);
      setGoals(nextGoals);
      setPagesByDate(nextPages);
      setStreak(currentStreak(completed, today));
      setStatus('ready');
    } catch {
      setStatus('error');
    }
  }, [end, start, today, user]);

  useEffect(() => {
    void load();
  }, [load]);

  const days = useMemo(() => {
    const total = daysInMonth(year, month);
    return Array.from({ length: total }, (_, index) => dayState(dateISO(year, month, index + 1), pagesByDate, goals));
  }, [goals, month, pagesByDate, year]);

  const summary = useMemo(() => {
    const readingDays = days.filter((day) => day.pagesRead > 0).length;
    const pagesRead = days.reduce((sum, day) => sum + day.pagesRead, 0);
    const goalsSet = days.filter((day) => day.targetPages).length;
    const goalsCompleted = days.filter((day) => day.completed).length;
    return { readingDays, pagesRead, goalsSet, goalsCompleted, streak };
  }, [days, streak]);

  const saveGoal = useCallback(
    async (date: string, targetPages: number) => {
      await upsertReadingGoal(date, targetPages);
      await load(true);
    },
    [load],
  );

  const removeGoal = useCallback(
    async (date: string) => {
      await deleteReadingGoal(date);
      await load(true);
    },
    [load],
  );

  return { days, summary, status, reload: load, saveGoal, removeGoal, today };
}
