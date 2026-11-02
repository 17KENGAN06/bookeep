export type BookLanguage = 'fi' | 'en';
export type CefrLevel = 'A2' | 'B1';
export type UiLanguage = 'fi' | 'en' | 'uk' | 'ru' | 'pl' | 'de' | 'fr' | 'it' | 'es';
/** Languages a book's title and description columns exist for. */
export type ContentLanguage = 'fi' | 'en' | 'uk' | 'ru';

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
  /** Storage path in the private book-pdfs bucket. Open it with getFullPdfUrl. */
  pdf_path: string | null;
  /** Public URL of the short demo PDF (first pages), or null until one is made. */
  demo_path: string | null;
  demo_pages: number;
  page_count: number | null;
  published: boolean;
  complete: boolean;
  hero_slot?: number | null;
  created_at: string;
  updated_at: string;
};

export const BOOK_LANGUAGES: BookLanguage[] = ['fi', 'en'];
export const CEFR_LEVELS: CefrLevel[] = ['A2', 'B1'];
