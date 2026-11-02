import { createHmac, timingSafeEqual } from 'node:crypto';
import type { Request, Response } from 'express';
import { sendEmail } from './email.js';
import { authMail, resolveMailLocale, type AuthMailKind } from './emailCopy.js';

/**
 * Supabase "Send Email" auth hook (Authentication → Hooks).
 * Supabase stops sending its own auth emails and posts them here instead; we send them
 * through Resend from EMAIL_FROM in the reader's language (user_metadata.locale).
 * SEND_EMAIL_HOOK_SECRET is the "v1,whsec_..." value Supabase shows for the hook.
 */

type HookUser = {
  email?: string;
  new_email?: string;
  user_metadata?: Record<string, unknown>;
};

type HookEmailData = {
  token?: string;
  token_hash?: string;
  token_new?: string;
  token_hash_new?: string;
  redirect_to?: string;
  email_action_type?: string;
  site_url?: string;
};

const KINDS: AuthMailKind[] = ['signup', 'recovery', 'magiclink', 'invite', 'email_change', 'reauthentication'];
const TOLERANCE_SECONDS = 5 * 60;

function hookSecret(): Buffer | null {
  const raw = process.env.SEND_EMAIL_HOOK_SECRET?.trim();
  if (!raw) return null;
  return Buffer.from(raw.replace(/^v1,/, '').replace(/^whsec_/, ''), 'base64');
}

/** Standard Webhooks signature check (what Supabase signs hook calls with). */
function verifySignature(req: Request, body: string): boolean {
  const secret = hookSecret();
  if (!secret) return false;
  const id = req.header('webhook-id');
  const timestamp = req.header('webhook-timestamp');
  const signatures = req.header('webhook-signature');
  if (!id || !timestamp || !signatures) return false;

  const seconds = Number(timestamp);
  if (!Number.isFinite(seconds) || Math.abs(Date.now() / 1000 - seconds) > TOLERANCE_SECONDS) return false;

  const expected = createHmac('sha256', secret).update(`${id}.${timestamp}.${body}`).digest();
  return signatures.split(' ').some((entry) => {
    const [version, value] = entry.split(',');
    if (version !== 'v1' || !value) return false;
    const given = Buffer.from(value, 'base64');
    return given.length === expected.length && timingSafeEqual(given, expected);
  });
}

function verifyLink(tokenHash: string, type: string, redirectTo?: string): string {
  const base = (process.env.SUPABASE_URL ?? '').replace(/\/$/, '');
  const params = new URLSearchParams({ token: tokenHash, type });
  const fallback = process.env.SITE_URL ?? process.env.CLIENT_ORIGIN?.split(',')[0]?.trim();
  const redirect = redirectTo || fallback;
  if (redirect) params.set('redirect_to', redirect);
  return `${base}/auth/v1/verify?${params.toString()}`;
}

function fail(res: Response, status: number, message: string) {
  res.status(status).json({ error: { http_code: status, message } });
}

export async function authEmailHookHandler(req: Request, res: Response) {
  const body = Buffer.isBuffer(req.body) ? req.body.toString('utf8') : '';
  if (!verifySignature(req, body)) {
    fail(res, 401, 'invalid signature');
    return;
  }

  let payload: { user?: HookUser; email_data?: HookEmailData };
  try {
    payload = JSON.parse(body);
  } catch {
    fail(res, 400, 'invalid json');
    return;
  }

  const user = payload.user ?? {};
  const data = payload.email_data ?? {};
  const kind = data.email_action_type as AuthMailKind;
  if (!KINDS.includes(kind) || !user.email) {
    // Unknown action types are acknowledged so sign-in never breaks on a new Supabase type.
    console.warn('[auth-hook] skipped email action', data.email_action_type);
    res.json({});
    return;
  }

  const locale = resolveMailLocale(user.user_metadata?.locale);
  const jobs: Array<{ to: string; link: string; code?: string }> = [];

  if (kind === 'email_change') {
    // Supabase names these the other way round (kept for backward compatibility):
    // the current address gets token_hash_new, the new address gets token_hash.
    if (data.token_hash_new && user.email) {
      jobs.push({ to: user.email, link: verifyLink(data.token_hash_new, kind, data.redirect_to) });
    }
    if (data.token_hash && user.new_email) {
      jobs.push({ to: user.new_email, link: verifyLink(data.token_hash, kind, data.redirect_to) });
    }
  } else if (kind === 'reauthentication') {
    jobs.push({ to: user.email, link: '', code: data.token });
  } else if (data.token_hash) {
    jobs.push({ to: user.email, link: verifyLink(data.token_hash, kind, data.redirect_to) });
  }

  try {
    for (const job of jobs) {
      const mail = authMail(kind, locale, job.link, job.code);
      await sendEmail({ to: job.to, subject: mail.subject, text: mail.text, html: mail.html });
    }
    res.json({});
  } catch (error) {
    console.error('[auth-hook] send failed', error);
    fail(res, 500, 'email could not be sent');
  }
}
