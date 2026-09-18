import { emitGoalCompleted } from '../hooks/goalCelebration';
import { getSupabaseClient } from './supabase';

type AdvanceRow = {
  newPages?: number;
  new_pages?: number;
  dailyTotal?: number;
  daily_total?: number;
  target?: number | null;
  justCompleted?: boolean;
  just_completed?: boolean;
};

export async function recordReadingAdvance(input: {
  bookId: string;
  currentPage: number;
  totalPages: number;
  readDate: string;
}) {
  const supabase = getSupabaseClient();
  if (!supabase) return null;

  const { data, error } = await supabase.rpc('record_reading_advance', {
    p_book_id: input.bookId,
    p_current_page: input.currentPage,
    p_total_pages: input.totalPages,
    p_read_date: input.readDate,
  });

  if (error) throw error;

  const raw = (Array.isArray(data) ? data[0] : data) as AdvanceRow | null;
  const row = raw ?? {};
  const result = {
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
