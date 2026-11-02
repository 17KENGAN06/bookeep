import { emailForTopic, type ContactTopic } from '@/config/contact';

export type ContactPayload = {
  topic: ContactTopic;
  name: string;
  email: string;
  message: string;
  company?: string;
};

type FormSubmitResponse = {
  success?: boolean | string;
  message?: string;
};

export async function sendContactMessage(payload: ContactPayload) {
  const to = emailForTopic(payload.topic);
  const response = await fetch(`https://formsubmit.co/ajax/${encodeURIComponent(to)}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify({
      name: payload.name,
      email: payload.email,
      message: payload.message,
      topic: payload.topic,
      _subject: `Bookeep · ${payload.topic}`,
      _template: 'table',
      _captcha: 'false',
      _honey: payload.company ?? '',
    }),
  });

  let data: FormSubmitResponse | null = null;
  try {
    data = (await response.json()) as FormSubmitResponse;
  } catch {
    data = null;
  }

  if (!response.ok || data?.success === false || data?.success === 'false') {
    // FormSubmit answers "This form needs Activation..." until the inbox owner
    // clicks the link in its activation email.
    throw new Error(`${response.status}: ${data?.message || 'contact-send-failed'}`);
  }
}
