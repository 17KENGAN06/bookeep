import { createClient, type SupabaseClient, type User } from '@supabase/supabase-js';
import type { Request } from 'express';

// Server-only client. SUPABASE_SERVICE_ROLE_KEY bypasses RLS: never send it to the site.
let admin: SupabaseClient | null = null;

export function getAdminClient() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  admin ??= createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  return admin;
}

// A reader sends several explain requests a minute; checking each token once a minute is enough.
const TOKEN_TTL_MS = 60 * 1000;
const tokens = new Map<string, { user: User | null; at: number }>();

function bearer(req: Request) {
  const header = req.get('authorization') ?? '';
  const match = /^Bearer\s+(.+)$/i.exec(header);
  return match ? match[1].trim() : null;
}

/** The signed-in Supabase user behind the request, or null for guests and bad tokens. */
export async function userFromRequest(req: Request): Promise<User | null> {
  const token = bearer(req);
  if (!token) return null;
  const supabase = getAdminClient();
  if (!supabase) return null;

  const now = Date.now();
  const cached = tokens.get(token);
  if (cached && now - cached.at < TOKEN_TTL_MS) return cached.user;

  const { data, error } = await supabase.auth.getUser(token);
  const user = error ? null : (data.user ?? null);
  if (tokens.size > 5000) tokens.clear();
  tokens.set(token, { user, at: now });
  return user;
}

const ACTIVE = ['trialing', 'active', 'past_due'];
const GRACE_MS = 24 * 60 * 60 * 1000;

/** Same rule as public.has_active_subscription(): admins and active / trialing subscribers. */
export async function hasActiveSubscription(userId: string): Promise<boolean> {
  const supabase = getAdminClient();
  if (!supabase) return false;

  const [{ data: adminRow }, { data: sub }] = await Promise.all([
    supabase.from('admins').select('user_id').eq('user_id', userId).maybeSingle(),
    supabase
      .from('subscriptions')
      .select('status, current_period_end')
      .eq('user_id', userId)
      .maybeSingle(),
  ]);
  if (adminRow) return true;
  if (!sub || !ACTIVE.includes(sub.status as string)) return false;
  const end = sub.current_period_end as string | null;
  return !end || new Date(end).getTime() > Date.now() - GRACE_MS;
}
