import type { Request, Response } from 'express';
import { EmailUnavailableError, escapeHtml, sendEmail } from './email.js';
import { EMAIL_COLORS, paragraph, renderEmail } from './emailLayout.js';
import { resolveMailLocale, type MailLocale } from './emailCopy.js';

/**
 * Contact form → Resend. The form posts here instead of FormSubmit.
 * From is a sender address that is not a Hostinger mailbox (hello@), otherwise Hostinger
 * treats "contact@ → contact@" as spoofed. Reply-To is the reader, so "Reply" answers them.
 */
const CONTACT_INBOX = process.env.CONTACT_INBOX?.trim() || 'contact@bookeep.cloud';
const CONTACT_FROM = process.env.CONTACT_MAIL_FROM?.trim() || 'Bookeep <hello@bookeep.cloud>';

const TOPICS = ['partnership', 'question', 'bug'] as const;
type Topic = (typeof TOPICS)[number];

type ContactCopy = {
  heading: string;
  reply: string;
  footer: string;
  topic: string;
  name: string;
  email: string;
  topics: Record<Topic, string>;
};

/** The notification is written in the language of the site the reader wrote from. */
const CONTACT_COPY: Record<MailLocale, ContactCopy> = {
  en: {"heading": "Message from {name}", "reply": "Reply to this email to answer the reader directly.", "footer": "Sent from the contact form on bookeep.cloud", "topic": "Topic", "name": "Name", "email": "Email", "topics": {"partnership": "Partnership / collaboration", "question": "A question", "bug": "I found a bug"}},
  fi: {"heading": "Viesti henkilöltä {name}", "reply": "Vastaa tähän viestiin, niin vastaus menee suoraan lukijalle.", "footer": "Lähetetty bookeep.cloudin yhteydenottolomakkeella", "topic": "Aihe", "name": "Nimi", "email": "Sähköposti", "topics": {"partnership": "Yhteistyö", "question": "Kysymys", "bug": "Löysin virheen"}},
  uk: {"heading": "Повідомлення від {name}", "reply": "Відповідайте на цей лист, і відповідь піде просто читачеві.", "footer": "Надіслано з форми зворотного зв’язку на bookeep.cloud", "topic": "Тема", "name": "Ім’я", "email": "Email", "topics": {"partnership": "Співпраця", "question": "Запитання", "bug": "Знайшов помилку"}},
  ru: {"heading": "Сообщение от {name}", "reply": "Ответьте на это письмо, и ответ уйдёт прямо читателю.", "footer": "Отправлено из формы обратной связи на bookeep.cloud", "topic": "Тема", "name": "Имя", "email": "Email", "topics": {"partnership": "Сотрудничество", "question": "Вопрос", "bug": "Нашёл ошибку"}},
  pl: {"heading": "Wiadomość od {name}", "reply": "Odpowiedz na tę wiadomość, a odpowiedź trafi bezpośrednio do czytelnika.", "footer": "Wysłano z formularza kontaktowego na bookeep.cloud", "topic": "Temat", "name": "Imię", "email": "E-mail", "topics": {"partnership": "Partnerstwo / współpraca", "question": "Pytanie", "bug": "Znalazłem błąd"}},
  de: {"heading": "Nachricht von {name}", "reply": "Antworte auf diese E-Mail, dann geht die Antwort direkt an die lesende Person.", "footer": "Gesendet über das Kontaktformular auf bookeep.cloud", "topic": "Thema", "name": "Name", "email": "E-Mail", "topics": {"partnership": "Partnerschaft / Zusammenarbeit", "question": "Eine Frage", "bug": "Ich habe einen Fehler gefunden"}},
  fr: {"heading": "Message de {name}", "reply": "Répondez à cet e-mail pour répondre directement au lecteur.", "footer": "Envoyé depuis le formulaire de contact de bookeep.cloud", "topic": "Sujet", "name": "Nom", "email": "E-mail", "topics": {"partnership": "Partenariat / collaboration", "question": "Une question", "bug": "J’ai trouvé un bug"}},
  it: {"heading": "Messaggio da {name}", "reply": "Rispondi a questa e-mail per rispondere direttamente al lettore.", "footer": "Inviato dal modulo di contatto di bookeep.cloud", "topic": "Argomento", "name": "Nome", "email": "E-mail", "topics": {"partnership": "Collaborazione / partnership", "question": "Una domanda", "bug": "Ho trovato un bug"}},
  es: {"heading": "Mensaje de {name}", "reply": "Responde a este correo para contestar directamente al lector.", "footer": "Enviado desde el formulario de contacto de bookeep.cloud", "topic": "Tema", "name": "Nombre", "email": "Correo electrónico", "topics": {"partnership": "Colaboración / alianza", "question": "Una pregunta", "bug": "Encontré un error"}},
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
  const topic: Topic = (TOPICS as readonly string[]).includes(body.topic as string) ? (body.topic as Topic) : 'question';
  const locale = resolveMailLocale(body.locale);
  const copy = CONTACT_COPY[locale];

  if (!name || !EMAIL_RE.test(email) || message.length < 10) {
    res.status(400).json({ error: 'invalid' });
    return;
  }
  if (!allow(req.ip ?? 'unknown')) {
    res.status(429).json({ error: 'rate_limited' });
    return;
  }

  const label = copy.topics[topic];
  const heading = copy.heading.replace('{name}', name);
  const text = [`${copy.topic}: ${label}`, `${copy.name}: ${name}`, `${copy.email}: ${email}`, '', message, '', copy.reply].join('\n');
  const c = EMAIL_COLORS;
  const row = (label: string, value: string) =>
    `<tr><td style="padding:10px 0;border-bottom:1px solid ${c.line};font-family:Manrope,Helvetica,Arial,sans-serif;font-size:12px;letter-spacing:1.6px;text-transform:uppercase;color:${c.faint};width:96px;vertical-align:top;">${escapeHtml(label)}</td><td style="padding:10px 0;border-bottom:1px solid ${c.line};font-family:Manrope,Helvetica,Arial,sans-serif;font-size:15px;color:${c.ink};">${escapeHtml(value)}</td></tr>`;
  const html = renderEmail({
    lang: locale,
    preheader: message.slice(0, 120),
    eyebrow: label,
    heading,
    bodyHtml: `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:4px 0 22px;">
                ${row(copy.topic, label)}
                ${row(copy.name, name)}
                ${row(copy.email, email)}
              </table>
              <p style="margin:0;font-family:Manrope,Helvetica,Arial,sans-serif;font-size:16px;line-height:1.65;color:${c.ink};white-space:pre-wrap;">${escapeHtml(message)}</p>
              ${paragraph(copy.reply, 'muted')}`,
    footer: copy.footer,
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
