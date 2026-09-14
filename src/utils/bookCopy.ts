import type { Book, UiLanguage } from '@/types/book';

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

function isUiLanguage(value: string): value is UiLanguage {
  return value === 'en' || value === 'fi' || value === 'uk' || value === 'ru';
}

export function getLocalizedTitle(book: Book, language: string) {
  const key = isUiLanguage(language) ? TITLE_KEYS[language] : TITLE_KEYS.en;
  const localized = book[key];
  return localized?.trim() || book.title_original;
}

export function getLocalizedDescription(book: Book, language: string) {
  const preferred = isUiLanguage(language) ? book[DESCRIPTION_KEYS[language]] : null;
  if (preferred?.trim()) return preferred;

  return (
    book.description_en?.trim() ||
    book.description_fi?.trim() ||
    book.description_uk?.trim() ||
    book.description_ru?.trim() ||
    ''
  );
}
