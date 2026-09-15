import type { ReadingProgress, ReadingProgressMap } from '@/types/progress';
import { getSupabaseClient } from '@/services/supabase';

type ProgressRow = {
  book_id: string;
  current_page: number;
  total_pages: number;
  percentage: number | string;
  last_read_at: string;
};

function rowToProgress(row: ProgressRow): ReadingProgress {
  return {
    currentPage: row.current_page,
    totalPages: row.total_pages,
    percentage: Number(row.percentage),
    lastReadAt: row.last_read_at,
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

export async function fetchCloudProgress(): Promise<ReadingProgressMap> {
  const supabase = getSupabaseClient();
  if (!supabase) return {};
  const { data, error } = await supabase
    .from('reading_progress')
    .select('book_id, current_page, total_pages, percentage, last_read_at');
  if (error) throw error;

  const map: ReadingProgressMap = {};
  for (const row of (data ?? []) as ProgressRow[]) {
    map[row.book_id] = rowToProgress(row);
  }
  return map;
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

export async function mergeProgressMaps(local: ReadingProgressMap, cloud: ReadingProgressMap) {
  const merged: ReadingProgressMap = { ...cloud };

  for (const [bookId, localItem] of Object.entries(local)) {
    const cloudItem = cloud[bookId];
    if (!cloudItem || localItem.lastReadAt > cloudItem.lastReadAt) {
      merged[bookId] = localItem;
      try {
        await upsertCloudProgress(bookId, localItem);
      } catch {
        // keep local copy if the network write fails
      }
    }
  }

  return merged;
}
