import { getSupabaseClient } from '@/services/supabase';

export type AdminUser = {
  id: string;
  email: string | null;
  created_at: string;
  last_sign_in_at: string | null;
  is_admin: boolean;
  is_tester: boolean;
  subscription_status: string | null;
  subscription_end: string | null;
};

/** Accounts for the admin panel (admin_list_users, migration 011). Testers first, then newest. */
export async function fetchAdminUsers(search: string): Promise<AdminUser[]> {
  const supabase = getSupabaseClient();
  if (!supabase) return [];
  const { data, error } = await supabase.rpc('admin_list_users', { p_search: search.trim() || null, p_limit: 100 });
  if (error) throw error;
  return (data as AdminUser[] | null) ?? [];
}

/** Gives or takes the tester flag: full access without Stripe. */
export async function setTester(userId: string, enabled: boolean) {
  const supabase = getSupabaseClient();
  if (!supabase) throw new Error('Supabase is not configured');
  const { error } = await supabase.rpc('admin_set_tester', { p_user_id: userId, p_enabled: enabled });
  if (error) throw error;
}
