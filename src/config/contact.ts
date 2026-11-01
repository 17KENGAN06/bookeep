/** Для пользователей: вопросы, ошибки, сотрудничество. Сюда же уходит форма. */
export const CONTACT_EMAIL = 'contact@bookeep.cloud';
/** Админские, юридические и платёжные вопросы (подписка, возвраты, персональные данные). */
export const ADMIN_EMAIL = 'admin@bookeep.cloud';

export const CONTACT_TOPICS = ['partnership', 'question', 'bug'] as const;

export type ContactTopic = (typeof CONTACT_TOPICS)[number];

export function emailForTopic(topic: ContactTopic) {
  void topic;
  return CONTACT_EMAIL;
}
