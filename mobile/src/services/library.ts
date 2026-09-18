import type { ReadingProgress, ReadingProgressMap } from '../types/progress';
import { getSupabaseClient } from './supabase';

type ProgressRow = {
  book_id: string;
  current_page: number;
  total_pages: number;
  percentage: number | string;
  last_read_at: string;
  max_page_reached?: number | null;
  completed_at?: string | null;
};

function rowToProgress(row: ProgressRow): ReadingProgress {
  return {
    currentPage: row.current_page,
    totalPages: row.total_pages,
    percentage: Number(row.percentage),
    lastReadAt: row.last_read_at,
    maxPageReached: row.max_page_reached ?? row.current_page,
    completedAt: row.completed_at ?? null,
  };
}

export async function fetchFavoriteIds() {
  const supabase = getSupabaseClient();
  if (!supabase) return [] as string[];
  const { data, error } = await supabase.from('favorites').select('book_id').order('created_at', { ascending: false });
  if (error) throw error;
  return (data ?? []).map((row) => row.book_id as string);
}

export async function setFavorite(bookId: string, liked: boolean) {
  const supabase = getSupabaseClient();
  if (!supabase) throw new Error('auth');
  const { data: sessionData } = await supabase.auth.getUser();
  const userId = sessionData.user?.id;
  if (!userId) throw new Error('auth');

  if (liked) {
    const { error } = await supabase.from('favorites').upsert({ user_id: userId, book_id: bookId });
    if (error) throw error;
    return;
  }

  const { error } = await supabase.from('favorites').delete().eq('book_id', bookId);
  if (error) throw error;
}

export async function fetchPlannedIds() {
  const supabase = getSupabaseClient();
  if (!supabase) return [] as string[];
  const { data, error } = await supabase.from('planned_books').select('book_id').order('created_at', { ascending: false });
  if (error) throw error;
  return (data ?? []).map((row) => row.book_id as string);
}

export async function setPlanned(bookId: string, planned: boolean) {
  const supabase = getSupabaseClient();
  if (!supabase) throw new Error('auth');
  const { data: sessionData } = await supabase.auth.getUser();
  const userId = sessionData.user?.id;
  if (!userId) throw new Error('auth');

  if (planned) {
    const { error } = await supabase.from('planned_books').upsert({ user_id: userId, book_id: bookId });
    if (error) throw error;
    return;
  }

  const { error } = await supabase.from('planned_books').delete().eq('book_id', bookId);
  if (error) throw error;
}

export async function upsertCloudProgress(bookId: string, progress: ReadingProgress) {
  const supabase = getSupabaseClient();
  if (!supabase) return;
  const { data: sessionData } = await supabase.auth.getUser();
  const userId = sessionData.user?.id;
  if (!userId) return;

  const { error } = await supabase.from('reading_progress').upsert({
    user_id: userId,
    book_id: bookId,
    current_page: progress.currentPage,
    total_pages: progress.totalPages,
    percentage: progress.percentage,
    last_read_at: progress.lastReadAt,
  });
  if (error) throw error;
}

export async function fetchCloudProgress(): Promise<ReadingProgressMap> {
  const supabase = getSupabaseClient();
  if (!supabase) return {};
  let { data, error } = await supabase
    .from('reading_progress')
    .select('book_id, current_page, total_pages, percentage, last_read_at, max_page_reached, completed_at');
  if (error) {
    const fallback = await supabase
      .from('reading_progress')
      .select('book_id, current_page, total_pages, percentage, last_read_at');
    data = fallback.data;
    error = fallback.error;
  }
  if (error) throw error;

  const map: ReadingProgressMap = {};
  for (const row of (data ?? []) as ProgressRow[]) {
    map[row.book_id] = rowToProgress(row);
  }
  return map;
}
