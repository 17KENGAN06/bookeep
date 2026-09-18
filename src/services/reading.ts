import type { ReadingAdvanceResult, ReadingGoal } from '@/types/reading';
import { getSupabaseClient } from '@/services/supabase';
import { emitGoalCompleted } from '@/hooks/goalCelebration';

type AdvanceRow = {
  newPages?: number;
  dailyTotal?: number;
  target?: number | null;
  justCompleted?: boolean;
};

export async function recordReadingAdvance(input: {
  bookId: string;
  currentPage: number;
  totalPages: number;
  readDate: string;
}): Promise<ReadingAdvanceResult | null> {
  const supabase = getSupabaseClient();
  if (!supabase) return null;

  const { data, error } = await supabase.rpc('record_reading_advance', {
    p_book_id: input.bookId,
    p_current_page: input.currentPage,
    p_total_pages: input.totalPages,
    p_read_date: input.readDate,
  });

  if (error) throw error;

  const raw = (Array.isArray(data) ? data[0] : data) as Record<string, unknown> | null;
  const row = (raw ?? {}) as AdvanceRow & {
    new_pages?: number;
    daily_total?: number;
    just_completed?: boolean;
  };
  const result: ReadingAdvanceResult = {
    newPages: Number(row.newPages ?? row.new_pages ?? 0),
    dailyTotal: Number(row.dailyTotal ?? row.daily_total ?? 0),
    target: row.target == null ? null : Number(row.target),
    justCompleted: Boolean(row.justCompleted ?? row.just_completed),
  };

  if (result.justCompleted) {
    emitGoalCompleted(result.dailyTotal, result.target ?? result.dailyTotal);
  }

  return result;
}

export async function fetchMonthReading(start: string, end: string) {
  const supabase = getSupabaseClient();
  if (!supabase) {
    return { goals: [] as ReadingGoal[], pagesByDate: {} as Record<string, number> };
  }

  const [{ data: goalRows, error: goalError }, { data: activityRows, error: activityError }] = await Promise.all([
    supabase
      .from('reading_goals')
      .select('read_date, target_pages, completed_at, celebrated_at')
      .gte('read_date', start)
      .lte('read_date', end),
    supabase
      .from('reading_activity')
      .select('read_date, pages_read')
      .gte('read_date', start)
      .lte('read_date', end),
  ]);

  if (goalError) throw goalError;
  if (activityError) throw activityError;

  const goals = (goalRows ?? []).map((row) => ({
    date: row.read_date as string,
    targetPages: Number(row.target_pages),
    completedAt: (row.completed_at as string | null) ?? null,
    celebratedAt: (row.celebrated_at as string | null) ?? null,
  }));

  const pagesByDate: Record<string, number> = {};
  for (const row of activityRows ?? []) {
    const date = row.read_date as string;
    pagesByDate[date] = (pagesByDate[date] ?? 0) + Number(row.pages_read ?? 0);
  }

  return { goals, pagesByDate };
}

export async function fetchCompletedGoalDates(since: string, until: string) {
  const supabase = getSupabaseClient();
  if (!supabase) return [] as string[];
  const { data, error } = await supabase
    .from('reading_goals')
    .select('read_date')
    .not('completed_at', 'is', null)
    .gte('read_date', since)
    .lte('read_date', until);
  if (error) throw error;
  return (data ?? []).map((row) => row.read_date as string);
}

export async function upsertReadingGoal(date: string, targetPages: number): Promise<{ justCompleted: boolean; pagesRead: number }> {
  const supabase = getSupabaseClient();
  if (!supabase) return { justCompleted: false, pagesRead: 0 };
  const { data: sessionData } = await supabase.auth.getUser();
  const userId = sessionData.user?.id;
  if (!userId) throw new Error('auth');

  const pagesRead = await fetchPagesForDate(date);
  const completed = pagesRead >= targetPages;

  const { data: existing } = await supabase
    .from('reading_goals')
    .select('completed_at, celebrated_at')
    .eq('read_date', date)
    .maybeSingle();

  const wasCompleted = Boolean(existing?.completed_at);
  const justCompleted = completed && !wasCompleted;
  const now = new Date().toISOString();

  const { error } = await supabase.from('reading_goals').upsert({
    user_id: userId,
    read_date: date,
    target_pages: targetPages,
    completed_at: completed ? (existing?.completed_at ?? now) : null,
    celebrated_at: completed
      ? justCompleted
        ? now
        : (existing?.celebrated_at ?? now)
      : null,
    updated_at: now,
  });
  if (error) throw error;

  if (justCompleted) emitGoalCompleted(pagesRead, targetPages);
  return { justCompleted, pagesRead };
}

export async function deleteReadingGoal(date: string) {
  const supabase = getSupabaseClient();
  if (!supabase) return;
  const { error } = await supabase.from('reading_goals').delete().eq('read_date', date);
  if (error) throw error;
}

async function fetchPagesForDate(date: string) {
  const supabase = getSupabaseClient();
  if (!supabase) return 0;
  const { data, error } = await supabase.from('reading_activity').select('pages_read').eq('read_date', date);
  if (error) throw error;
  return (data ?? []).reduce((sum, row) => sum + Number(row.pages_read ?? 0), 0);
}
