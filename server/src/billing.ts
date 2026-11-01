import Stripe from 'stripe';
import type { Request, Response } from 'express';
import { getAdminClient, userFromRequest } from './supabaseAdmin.js';

// Stripe subscription with a free trial. The webhook is the only writer of
// public.subscriptions, so access always follows what Stripe says.
const TRIAL_DAYS = Number(process.env.STRIPE_TRIAL_DAYS ?? 3);
const PLAN = 'premium';

let stripe: Stripe | null = null;

function getStripe() {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) return null;
  stripe ??= new Stripe(key);
  return stripe;
}

function siteUrl() {
  const explicit = process.env.SITE_URL?.trim();
  if (explicit) return explicit.replace(/\/$/, '');
  const firstOrigin = (process.env.CLIENT_ORIGIN ?? 'http://localhost:5173').split(',')[0].trim();
  return firstOrigin.replace(/\/$/, '');
}

type SubscriptionRow = {
  user_id: string;
  status: string;
  trial_used: boolean;
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
  current_period_end: string | null;
};

const ACTIVE = new Set(['trialing', 'active', 'past_due']);

async function readRow(userId: string) {
  const supabase = getAdminClient();
  if (!supabase) throw new Error('Supabase service role is not configured');
  const { data, error } = await supabase
    .from('subscriptions')
    .select('user_id, status, trial_used, stripe_customer_id, stripe_subscription_id, current_period_end')
    .eq('user_id', userId)
    .maybeSingle();
  if (error) throw error;
  return (data as SubscriptionRow | null) ?? null;
}

// Same day of grace as public.has_active_subscription(): a renewal webhook can land a bit late.
const GRACE_MS = 24 * 60 * 60 * 1000;

function isActiveRow(row: SubscriptionRow | null) {
  if (!row || !ACTIVE.has(row.status)) return false;
  return !row.current_period_end || new Date(row.current_period_end).getTime() > Date.now() - GRACE_MS;
}

function isMissing(error: unknown) {
  return error instanceof Stripe.errors.StripeError && error.code === 'resource_missing';
}

/** True when the customer exists in the Stripe account of the current key (test and live are separate). */
async function customerExists(api: Stripe, id: string) {
  try {
    const customer = await api.customers.retrieve(id);
    return !('deleted' in customer && customer.deleted);
  } catch (error) {
    if (isMissing(error)) return false;
    throw error;
  }
}

async function ensureCustomer(api: Stripe, userId: string, email: string | undefined, row: SubscriptionRow | null) {
  // A customer saved under another key (test vs live, or an old account) does not exist here: make a new one.
  if (row?.stripe_customer_id && (await customerExists(api, row.stripe_customer_id))) return row.stripe_customer_id;

  const customer = await api.customers.create({
    email,
    metadata: { user_id: userId },
  });

  const supabase = getAdminClient()!;
  const { error } = row
    ? await supabase.from('subscriptions').update({ stripe_customer_id: customer.id }).eq('user_id', userId)
    : await supabase
        .from('subscriptions')
        .insert({ user_id: userId, plan: PLAN, status: 'incomplete', stripe_customer_id: customer.id });
  if (error) throw error;
  return customer.id;
}

type PlanInfo = { amount: number | null; currency: string; interval: string | null; trialDays: number };
let planCache: { value: PlanInfo; at: number } | null = null;

/** GET /api/billing/plan: price shown on the subscribe page, straight from Stripe. */
export async function planHandler(_req: Request, res: Response) {
  const api = getStripe();
  const price = process.env.STRIPE_PRICE_ID;
  if (!api || !price) {
    res.status(503).json({ error: 'not_configured' });
    return;
  }
  try {
    if (!planCache || Date.now() - planCache.at > 10 * 60 * 1000) {
      const item = await api.prices.retrieve(price);
      planCache = {
        value: {
          amount: item.unit_amount,
          currency: item.currency,
          interval: item.recurring?.interval ?? null,
          trialDays: TRIAL_DAYS,
        },
        at: Date.now(),
      };
    }
    res.set('Cache-Control', 'public, max-age=300');
    res.json(planCache.value);
  } catch (error) {
    console.error('Plan lookup failed', error);
    res.status(502).json({ error: 'stripe_failed' });
  }
}

/** POST /api/billing/checkout: a Stripe Checkout link for the signed-in reader. */
export async function checkoutHandler(req: Request, res: Response) {
  const api = getStripe();
  const price = process.env.STRIPE_PRICE_ID;
  if (!api || !price || !getAdminClient()) {
    res.status(503).json({ error: 'not_configured' });
    return;
  }

  const user = await userFromRequest(req);
  if (!user) {
    res.status(401).json({ error: 'auth_required' });
    return;
  }

  try {
    const row = await readRow(user.id);
    if (isActiveRow(row)) {
      res.status(409).json({ error: 'already_subscribed' });
      return;
    }

    const customer = await ensureCustomer(api, user.id, user.email, row);
    const trial = !row?.trial_used && TRIAL_DAYS > 0;
    const base = siteUrl();

    const session = await api.checkout.sessions.create({
      mode: 'subscription',
      customer,
      client_reference_id: user.id,
      line_items: [{ price, quantity: 1 }],
      allow_promotion_codes: true,
      // A card is always required, also for the free trial. Stripe checks it when it is saved
      // (a zero-amount authorisation) and charges it automatically when the trial ends.
      payment_method_collection: 'always',
      metadata: { user_id: user.id },
      subscription_data: {
        metadata: { user_id: user.id },
        ...(trial
          ? {
              trial_period_days: TRIAL_DAYS,
              // No card left on file after the trial: the subscription simply stops.
              trial_settings: { end_behavior: { missing_payment_method: 'cancel' as const } },
            }
          : {}),
      },
      success_url: `${base}/subscribe?checkout=success`,
      cancel_url: `${base}/subscribe?checkout=cancel`,
    });

    res.json({ url: session.url, trial });
  } catch (error) {
    console.error('Checkout failed', error);
    res.status(502).json({ error: 'stripe_failed' });
  }
}

/** POST /api/billing/portal: Stripe's page to change the card or cancel. */
export async function portalHandler(req: Request, res: Response) {
  const api = getStripe();
  if (!api || !getAdminClient()) {
    res.status(503).json({ error: 'not_configured' });
    return;
  }

  const user = await userFromRequest(req);
  if (!user) {
    res.status(401).json({ error: 'auth_required' });
    return;
  }

  try {
    const row = await readRow(user.id);
    if (!row?.stripe_customer_id || !(await customerExists(api, row.stripe_customer_id))) {
      res.status(404).json({ error: 'no_customer' });
      return;
    }
    const session = await api.billingPortal.sessions.create({
      customer: row.stripe_customer_id,
      return_url: `${siteUrl()}/subscribe`,
    });
    res.json({ url: session.url });
  } catch (error) {
    console.error('Portal failed', error);
    res.status(502).json({ error: 'stripe_failed' });
  }
}

function mapStatus(status: Stripe.Subscription.Status) {
  switch (status) {
    case 'trialing':
    case 'active':
    case 'past_due':
    case 'incomplete':
    case 'canceled':
      return status;
    case 'paused':
      return 'canceled';
    default:
      // incomplete_expired, unpaid
      return 'expired';
  }
}

function iso(seconds: number | null | undefined) {
  return seconds ? new Date(seconds * 1000).toISOString() : null;
}

async function userIdFor(subscription: Stripe.Subscription) {
  const fromMeta = subscription.metadata?.user_id;
  if (fromMeta) return fromMeta;
  const customer = typeof subscription.customer === 'string' ? subscription.customer : subscription.customer.id;
  const { data } = await getAdminClient()!
    .from('subscriptions')
    .select('user_id')
    .eq('stripe_customer_id', customer)
    .maybeSingle();
  return (data?.user_id as string | undefined) ?? null;
}

/** The subscription an invoice belongs to (the field moved in newer Stripe API versions). */
function invoiceSubscriptionId(invoice: Stripe.Invoice) {
  const fromParent = invoice.parent?.subscription_details?.subscription;
  const legacy = (invoice as unknown as { subscription?: string | { id: string } | null }).subscription;
  const value = fromParent ?? legacy ?? null;
  return typeof value === 'string' ? value : (value?.id ?? null);
}

async function syncSubscription(api: Stripe, subscriptionId: string) {
  // Always read the latest state: webhook events can arrive out of order.
  const subscription = await api.subscriptions.retrieve(subscriptionId);
  const userId = await userIdFor(subscription);
  if (!userId) {
    console.warn('Stripe subscription without a Bookeep user', subscription.id);
    return;
  }
  console.log('Stripe subscription synced', subscription.id, subscription.status);

  const row = await readRow(userId);
  const status = mapStatus(subscription.status);
  // An old, ended subscription must not overwrite a newer one that is running.
  if (row && row.stripe_subscription_id && row.stripe_subscription_id !== subscription.id && isActiveRow(row) && !ACTIVE.has(status)) {
    return;
  }

  const periodEnd = Math.max(0, ...subscription.items.data.map((item) => item.current_period_end ?? 0));
  const customer = typeof subscription.customer === 'string' ? subscription.customer : subscription.customer.id;

  const { error } = await getAdminClient()!
    .from('subscriptions')
    .upsert(
      {
        user_id: userId,
        plan: PLAN,
        status,
        current_period_end: iso(periodEnd || subscription.ended_at),
        trial_end: iso(subscription.trial_end),
        cancel_at_period_end: Boolean(subscription.cancel_at_period_end || subscription.cancel_at),
        trial_used: Boolean(row?.trial_used || subscription.trial_end || subscription.trial_start),
        stripe_customer_id: customer,
        stripe_subscription_id: subscription.id,
      },
      { onConflict: 'user_id' },
    );
  if (error) throw error;
}

/** POST /api/stripe/webhook. Needs the raw body for the signature check. */
export async function webhookHandler(req: Request, res: Response) {
  const api = getStripe();
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!api || !secret || !getAdminClient()) {
    res.status(503).json({ error: 'not_configured' });
    return;
  }

  let event: Stripe.Event;
  try {
    event = api.webhooks.constructEvent(req.body as Buffer, req.get('stripe-signature') ?? '', secret);
  } catch (error) {
    console.warn('Bad Stripe signature', error instanceof Error ? error.message : error);
    res.status(400).json({ error: 'bad_signature' });
    return;
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object;
        const id = typeof session.subscription === 'string' ? session.subscription : session.subscription?.id;
        if (id) await syncSubscription(api, id);
        break;
      }
      case 'customer.subscription.created':
      case 'customer.subscription.updated':
      case 'customer.subscription.deleted':
      case 'customer.subscription.paused':
      case 'customer.subscription.resumed':
        await syncSubscription(api, event.data.object.id);
        break;
      // Renewals and failed charges. subscription.updated usually says the same, these make it certain.
      case 'invoice.paid':
      case 'invoice.payment_succeeded':
      case 'invoice.payment_failed': {
        const id = invoiceSubscriptionId(event.data.object);
        if (id) await syncSubscription(api, id);
        break;
      }
      default:
        break;
    }
    res.json({ received: true });
  } catch (error) {
    // A 500 makes Stripe retry the event later.
    console.error('Stripe webhook failed', event.type, event.id, error instanceof Error ? error.message : error);
    res.status(500).json({ error: 'sync_failed' });
  }
}

/** GET /api/billing/health: which settings are present (yes/no only, never the values). */
export function billingHealthHandler(_req: Request, res: Response) {
  const key = process.env.STRIPE_SECRET_KEY ?? '';
  const mode = key.startsWith('sk_live_') || key.startsWith('rk_live_') ? 'live' : key ? 'test' : null;
  res.set('Cache-Control', 'no-store');
  res.json({
    stripeMode: mode,
    stripeSecretKey: Boolean(key),
    stripePriceId: Boolean(process.env.STRIPE_PRICE_ID),
    stripeWebhookSecret: Boolean(process.env.STRIPE_WEBHOOK_SECRET),
    supabaseServiceKey: Boolean(getAdminClient()),
    siteUrl: siteUrl(),
    trialDays: TRIAL_DAYS,
  });
}
