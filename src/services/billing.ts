import { env, isSupabaseConfigured } from '@/config/env';
import { getSupabaseClient } from '@/services/supabase';

export type Plan = { amount: number | null; currency: string; interval: string | null; trialDays: number };

export type MySubscription = {
  status: 'trialing' | 'active' | 'past_due' | 'incomplete' | 'canceled' | 'expired';
  current_period_end: string | null;
  trial_end: string | null;
  cancel_at_period_end: boolean;
  trial_used: boolean;
  stripe_customer_id: string | null;
};

export type BillingErrorCode = 'not_configured' | 'auth_required' | 'already_subscribed' | 'failed';

export class BillingError extends Error {
  code: BillingErrorCode;

  constructor(code: BillingErrorCode) {
    super(code);
    this.code = code;
  }
}

async function authHeaders() {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  const session = await getSupabaseClient()?.auth.getSession();
  const token = session?.data.session?.access_token;
  if (!token) throw new BillingError('auth_required');
  headers.Authorization = `Bearer ${token}`;
  return headers;
}

async function post(path: string) {
  let response: Response;
  try {
    response = await fetch(`${env.apiUrl}${path}`, { method: 'POST', headers: await authHeaders() });
  } catch (error) {
    if (error instanceof BillingError) throw error;
    throw new BillingError('failed');
  }
  const data = (await response.json().catch(() => ({}))) as { url?: string; error?: string };
  if (response.status === 503) throw new BillingError('not_configured');
  if (response.status === 401) throw new BillingError('auth_required');
  if (response.status === 409) throw new BillingError('already_subscribed');
  if (!response.ok || !data.url) throw new BillingError('failed');
  return data.url;
}

/** Sends the reader to Stripe Checkout. */
export async function startCheckout() {
  window.location.assign(await post('/api/billing/checkout'));
}

/** Sends the reader to Stripe's page for the card, invoices and cancelling. */
export async function openBillingPortal() {
  window.location.assign(await post('/api/billing/portal'));
}

export async function fetchPlan(): Promise<Plan | null> {
  if (!env.apiUrl) return null;
  try {
    const response = await fetch(`${env.apiUrl}/api/billing/plan`);
    if (!response.ok) return null;
    return (await response.json()) as Plan;
  } catch {
    return null;
  }
}

/** The signed-in reader's own row (RLS lets each user read only theirs). */
export async function fetchMySubscription(userId: string): Promise<MySubscription | null> {
  if (!isSupabaseConfigured()) return null;
  const supabase = getSupabaseClient();
  if (!supabase) return null;
  const { data, error } = await supabase
    .from('subscriptions')
    .select('status, current_period_end, trial_end, cancel_at_period_end, trial_used, stripe_customer_id')
    .eq('user_id', userId)
    .maybeSingle();
  if (error) throw error;
  return (data as MySubscription | null) ?? null;
}

export function formatPrice(plan: Plan, locale: string) {
  if (plan.amount == null) return null;
  return new Intl.NumberFormat(locale, { style: 'currency', currency: plan.currency.toUpperCase() }).format(
    plan.amount / 100,
  );
}
