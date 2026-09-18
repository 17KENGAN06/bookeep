import type { Book } from '../types/book';
import { toUiLanguage } from '../i18n';

const TITLE_KEYS = {
  en: 'title_en',
  fi: 'title_fi',
  uk: 'title_uk',
  ru: 'title_ru',
} as const;

const DESCRIPTION_KEYS = {
  en: 'description_en',
  fi: 'description_fi',
  uk: 'description_uk',
  ru: 'description_ru',
} as const;

export function getLocalizedTitle(book: Book, language: string) {
  const ui = toUiLanguage(language);
  const localized = book[TITLE_KEYS[ui]];
  return localized?.trim() || book.title_original;
}

export function getLocalizedDescription(book: Book, language: string) {
  const preferred = book[DESCRIPTION_KEYS[toUiLanguage(language)]];
  if (preferred?.trim()) return preferred;

  return (
    book.description_en?.trim() ||
    book.description_fi?.trim() ||
    book.description_uk?.trim() ||
    book.description_ru?.trim() ||
    ''
  );
}
