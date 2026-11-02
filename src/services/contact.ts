import { env } from '@/config/env';
import type { ContactTopic } from '@/config/contact';

export type ContactPayload = {
  topic: ContactTopic;
  name: string;
  email: string;
  message: string;
  company?: string;
};

/** Sends the contact form through our server (Resend) to contact@bookeep.cloud. */
export async function sendContactMessage(payload: ContactPayload) {
  const response = await fetch(`${env.apiUrl}/api/contact`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify({
      topic: payload.topic,
      name: payload.name,
      email: payload.email,
      message: payload.message,
      company: payload.company ?? '',
    }),
  });

  if (!response.ok) {
    const data = (await response.json().catch(() => null)) as { error?: string } | null;
    throw new Error(`${response.status}: ${data?.error || 'contact-send-failed'}`);
  }
}
