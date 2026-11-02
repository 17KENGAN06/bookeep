import type { Request, Response } from 'express';
import { EmailUnavailableError, escapeHtml, sendEmail } from './email.js';

/**
 * Contact form → Resend. The form posts here instead of FormSubmit.
 * From is a sender address that is not a Hostinger mailbox (hello@), otherwise Hostinger
 * treats "contact@ → contact@" as spoofed. Reply-To is the reader, so "Reply" answers them.
 */
const CONTACT_INBOX = process.env.CONTACT_INBOX?.trim() || 'contact@bookeep.cloud';
const CONTACT_FROM = process.env.CONTACT_MAIL_FROM?.trim() || 'Bookeep <hello@bookeep.cloud>';

const TOPICS: Record<string, string> = {
  partnership: 'Partnership / collaboration',
  question: 'Question',
  bug: 'Bug report',
};
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const WINDOW_MS = 10 * 60 * 1000;
const MAX_PER_WINDOW = 5;
const hits = new Map<string, number[]>();

function allow(ip: string): boolean {
  const now = Date.now();
  const recent = (hits.get(ip) ?? []).filter((time) => now - time < WINDOW_MS);
  if (recent.length >= MAX_PER_WINDOW) {
    hits.set(ip, recent);
    return false;
  }
  recent.push(now);
  hits.set(ip, recent);
  if (hits.size > 5000) hits.clear();
  return true;
}

function clean(value: unknown, max: number): string {
  return typeof value === 'string' ? value.replace(/\r\n/g, '\n').trim().slice(0, max) : '';
}

export async function contactHandler(req: Request, res: Response) {
  const body = (req.body ?? {}) as Record<string, unknown>;
  // Honeypot: bots fill the hidden "company" field. Pretend it worked.
  if (clean(body.company, 200)) {
    res.json({ ok: true });
    return;
  }

  const name = clean(body.name, 120);
  const email = clean(body.email, 200).toLowerCase();
  const message = clean(body.message, 5000);
  const topic = typeof body.topic === 'string' && body.topic in TOPICS ? body.topic : 'question';

  if (!name || !EMAIL_RE.test(email) || message.length < 10) {
    res.status(400).json({ error: 'invalid' });
    return;
  }
  if (!allow(req.ip ?? 'unknown')) {
    res.status(429).json({ error: 'rate_limited' });
    return;
  }

  const label = TOPICS[topic];
  const text = [`Topic: ${label}`, `Name: ${name}`, `Email: ${email}`, '', message].join('\n');
  const html = `<!DOCTYPE html>
<html>
<body style="margin:0;padding:24px;background:#f6f4ef;color:#1c1917;font-family:Georgia,serif;font-size:16px;line-height:1.5;">
  <div style="max-width:560px;margin:0 auto;padding:24px;background:#fff;border-radius:16px;">
    <p style="margin:0 0 8px;"><strong>Topic:</strong> ${escapeHtml(label)}</p>
    <p style="margin:0 0 8px;"><strong>Name:</strong> ${escapeHtml(name)}</p>
    <p style="margin:0 0 8px;"><strong>Email:</strong> ${escapeHtml(email)}</p>
    <p style="margin:16px 0 8px;"><strong>Message:</strong></p>
    <p style="margin:0;white-space:pre-wrap;">${escapeHtml(message)}</p>
  </div>
</body>
</html>`;

  try {
    await sendEmail({
      from: CONTACT_FROM,
      to: CONTACT_INBOX,
      replyTo: email,
      subject: `[Bookeep] ${label} — ${name}`,
      text,
      html,
    });
    res.json({ ok: true });
  } catch (error) {
    console.error('[contact] send failed', error);
    res.status(error instanceof EmailUnavailableError ? 503 : 500).json({ error: 'send_failed' });
  }
}
