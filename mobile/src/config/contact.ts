export const PARTNER_EMAIL = 'partner@weisezahoy.com';
export const ADMIN_EMAIL = 'admin@weisezahoy.com';

export const CONTACT_TOPICS = ['partnership', 'question', 'bug'] as const;

export type ContactTopic = (typeof CONTACT_TOPICS)[number];

export function emailForTopic(topic: ContactTopic) {
  return topic === 'partnership' ? PARTNER_EMAIL : ADMIN_EMAIL;
}
