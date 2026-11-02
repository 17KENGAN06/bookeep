import type { Request, Response } from 'express';
import { EmailUnavailableError, escapeHtml, sendEmail } from './email.js';
import { EMAIL_COLORS, paragraph, renderEmail } from './emailLayout.js';

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
  const c = EMAIL_COLORS;
  const row = (label: string, value: string) =>
    `<tr><td style="padding:10px 0;border-bottom:1px solid ${c.line};font-family:Manrope,Helvetica,Arial,sans-serif;font-size:12px;letter-spacing:1.6px;text-transform:uppercase;color:${c.faint};width:96px;vertical-align:top;">${escapeHtml(label)}</td><td style="padding:10px 0;border-bottom:1px solid ${c.line};font-family:Manrope,Helvetica,Arial,sans-serif;font-size:15px;color:${c.ink};">${escapeHtml(value)}</td></tr>`;
  const html = renderEmail({
    lang: 'en',
    preheader: message.slice(0, 120),
    eyebrow: label,
    heading: `Message from ${name}`,
    bodyHtml: `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:4px 0 22px;">
                ${row('Topic', label)}
                ${row('Name', name)}
                ${row('Email', email)}
              </table>
              <p style="margin:0;font-family:Manrope,Helvetica,Arial,sans-serif;font-size:16px;line-height:1.65;color:${c.ink};white-space:pre-wrap;">${escapeHtml(message)}</p>
              ${paragraph('Reply to this email to answer the reader directly.', 'muted')}`,
    footer: 'Sent from the contact form on bookeep.cloud',
  });

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
