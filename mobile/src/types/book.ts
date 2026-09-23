export type BookLanguage = 'fi' | 'en';
export type CefrLevel = 'A2' | 'B1';
export type UiLanguage = 'fi' | 'en' | 'uk' | 'ru';

export type Book = {
  id: string;
  slug: string;
  title_original: string;
  title_en: string | null;
  title_fi: string | null;
  title_uk: string | null;
  title_ru: string | null;
  description_en: string | null;
  description_fi: string | null;
  description_uk: string | null;
  description_ru: string | null;
  language: BookLanguage;
  level: CefrLevel;
  cover_path: string | null;
  thumbnail_path: string | null;
  pdf_path: string | null;
  page_count: number | null;
  published: boolean;
  complete: boolean;
  created_at: string;
  updated_at: string;
};

export const BOOK_LANGUAGES: BookLanguage[] = ['fi', 'en'];
export const CEFR_LEVELS: CefrLevel[] = ['A2', 'B1'];
