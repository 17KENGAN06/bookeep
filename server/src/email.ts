/**
 * Transactional email through Resend (same setup as MindKeep).
 * EMAIL_FROM is what readers see on account emails, e.g. "Bookeep <contact@bookeep.cloud>".
 * RESEND_API_KEY comes from resend.com after the bookeep.cloud domain is verified there.
 */
export type SendEmailInput = {
  to: string;
  from?: string;
  replyTo?: string;
  subject: string;
  text: string;
  html?: string;
};

export class EmailUnavailableError extends Error {
  constructor(message = 'email_unavailable') {
    super(message);
  }
}

export function emailConfigured(): boolean {
  return Boolean(process.env.RESEND_API_KEY?.trim() && process.env.EMAIL_FROM?.trim());
}

export async function sendEmail(input: SendEmailInput): Promise<void> {
  const from = input.from?.trim() || process.env.EMAIL_FROM?.trim();
  const apiKey = process.env.RESEND_API_KEY?.trim();

  if (!from || !apiKey) {
    // Fail loudly: a silent skip would tell Supabase the email went out when it did not.
    console.error('[email] RESEND_API_KEY / EMAIL_FROM are not set');
    throw new EmailUnavailableError();
  }

  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      from,
      to: [input.to],
      ...(input.replyTo ? { reply_to: input.replyTo } : {}),
      subject: input.subject,
      text: input.text,
      ...(input.html ? { html: input.html } : {}),
    }),
  });

  if (!response.ok) {
    const details = await response.text().catch(() => '');
    console.error('[email] Resend rejected email', response.status, details.slice(0, 500));
    throw new EmailUnavailableError(`resend_${response.status}`);
  }
}

export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
