import { escapeHtml } from './email.js';

/**
 * One email shell in the site's look: deep green-charcoal page, a bordered dark card,
 * Playfair-style serif heading, mint accent line and the flat ivory button from the site.
 * Built with tables and inline styles so Gmail, Outlook and Apple Mail render it the same.
 */
export const EMAIL_COLORS = {
  page: '#0b1113',
  card: '#111c1d',
  line: '#223334',
  ink: '#f3f5f2',
  muted: '#98a9a6',
  faint: '#6f817e',
  accent: '#9be5c4',
  accentStrong: '#75cda8',
  button: '#f3f5f2',
  buttonInk: '#0b1113',
} as const;

const SERIF = "'Playfair Display', Georgia, 'Times New Roman', serif";
const SANS = "Manrope, 'Segoe UI', Helvetica, Arial, sans-serif";

export function siteUrl(): string {
  const raw = process.env.SITE_URL?.trim() || process.env.CLIENT_ORIGIN?.split(',')[0]?.trim() || 'https://bookeep.cloud';
  return raw.replace(/\/$/, '');
}

export type EmailShell = {
  lang: string;
  /** Hidden preview line that inboxes show next to the subject. */
  preheader: string;
  eyebrow: string;
  heading: string;
  /** Already-escaped HTML for the body of the card. */
  bodyHtml: string;
  footer: string;
};

export function emailButton(href: string, label: string): string {
  const c = EMAIL_COLORS;
  return `<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:28px 0 8px;">
  <tr>
    <td align="center" bgcolor="${c.button}" style="border-radius:999px;">
      <a href="${escapeHtml(href)}" target="_blank" style="display:inline-block;padding:15px 30px;border-radius:999px;background:${c.button};color:${c.buttonInk};font-family:${SANS};font-size:15px;font-weight:700;line-height:1;text-decoration:none;">${escapeHtml(label)}</a>
    </td>
  </tr>
</table>`;
}

export function renderEmail(shell: EmailShell): string {
  const c = EMAIL_COLORS;
  const home = siteUrl();
  const logo = `${home}/favicon.png`;

  return `<!DOCTYPE html>
<html lang="${escapeHtml(shell.lang)}" xmlns="http://www.w3.org/1999/xhtml">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="color-scheme" content="dark">
  <meta name="supported-color-schemes" content="dark">
  <title>${escapeHtml(shell.heading)}</title>
  <style>
    @media (max-width: 600px) {
      .bk-card { padding: 28px 22px !important; border-radius: 22px !important; }
      .bk-h1 { font-size: 26px !important; }
      .bk-outer { padding: 20px 12px !important; }
    }
    a { color: ${c.accent}; }
  </style>
</head>
<body style="margin:0;padding:0;background:${c.page};-webkit-text-size-adjust:100%;">
  <div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent;">${escapeHtml(shell.preheader)}&#8203;&nbsp;&#8203;&nbsp;&#8203;&nbsp;</div>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="${c.page}" style="background:${c.page};">
    <tr>
      <td class="bk-outer" align="center" style="padding:40px 16px;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:560px;">
          <tr>
            <td style="padding:0 6px 22px;">
              <a href="${escapeHtml(home)}" target="_blank" style="text-decoration:none;">
                <img src="${escapeHtml(logo)}" width="32" height="32" alt="" style="display:inline-block;vertical-align:middle;border:0;border-radius:8px;">
                <span style="display:inline-block;vertical-align:middle;margin-left:10px;font-family:${SERIF};font-size:22px;font-weight:700;color:${c.ink};letter-spacing:0.2px;">Bookeep</span>
              </a>
            </td>
          </tr>
          <tr>
            <td class="bk-card" bgcolor="${c.card}" style="background:${c.card};border:1px solid ${c.line};border-radius:28px;padding:40px 36px;">
              <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:0 0 18px;">
                <tr>
                  <td style="width:28px;vertical-align:middle;"><div style="width:28px;height:0;border-top:1px solid ${c.accent};font-size:0;line-height:0;"></div></td>
                  <td style="padding-left:12px;font-family:${SANS};font-size:11px;font-weight:700;letter-spacing:2.6px;text-transform:uppercase;color:${c.accent};">${escapeHtml(shell.eyebrow)}</td>
                </tr>
              </table>
              <h1 class="bk-h1" style="margin:0 0 14px;font-family:${SERIF};font-size:30px;line-height:1.2;font-weight:700;color:${c.ink};">${escapeHtml(shell.heading)}</h1>
              ${shell.bodyHtml}
            </td>
          </tr>
          <tr>
            <td align="center" style="padding:24px 12px 0;font-family:${SANS};font-size:12px;line-height:1.6;color:${c.faint};">
              ${escapeHtml(shell.footer)}<br>
              <a href="${escapeHtml(home)}" target="_blank" style="color:${c.muted};text-decoration:none;">bookeep.cloud</a>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

export function paragraph(text: string, tone: 'body' | 'muted' | 'small' = 'body'): string {
  const c = EMAIL_COLORS;
  const style =
    tone === 'body'
      ? `margin:0;font-family:${SANS};font-size:16px;line-height:1.6;color:${c.muted};`
      : tone === 'muted'
        ? `margin:24px 0 0;font-family:${SANS};font-size:13px;line-height:1.6;color:${c.faint};`
        : `margin:0;font-family:${SANS};font-size:12px;line-height:1.6;color:${c.faint};`;
  return `<p style="${style}">${escapeHtml(text)}</p>`;
}
