import i18n from 'i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import { initReactI18next } from 'react-i18next';
import { LANGUAGE_STORAGE_KEY } from '@/config/storage';
import de from '@/i18n/locales/de.json';
import en from '@/i18n/locales/en.json';
import es from '@/i18n/locales/es.json';
import fi from '@/i18n/locales/fi.json';
import fr from '@/i18n/locales/fr.json';
import it from '@/i18n/locales/it.json';
import pl from '@/i18n/locales/pl.json';
import ru from '@/i18n/locales/ru.json';
import uk from '@/i18n/locales/uk.json';

/** Site languages (same set as MindKeep). `short` is the code shown on small chips. */
export const supportedLanguages = [
  { code: 'fi', short: 'FI', label: 'Suomi' },
  { code: 'en', short: 'EN', label: 'English' },
  { code: 'uk', short: 'UA', label: 'Українська' },
  { code: 'ru', short: 'RU', label: 'Русский' },
  { code: 'pl', short: 'PL', label: 'Polski' },
  { code: 'de', short: 'DE', label: 'Deutsch' },
  { code: 'fr', short: 'FR', label: 'Français' },
  { code: 'it', short: 'IT', label: 'Italiano' },
  { code: 'es', short: 'ES', label: 'Español' },
] as const;

/** Languages a book's own title and description are written in (database columns). */
export const contentLanguages = supportedLanguages.filter(
  (language): language is Extract<(typeof supportedLanguages)[number], { code: 'fi' | 'en' | 'uk' | 'ru' }> =>
    ['fi', 'en', 'uk', 'ru'].includes(language.code),
);

export type AppLanguage = (typeof supportedLanguages)[number]['code'];

function syncDocumentLang(language?: string) {
  if (typeof document === 'undefined') return;
  document.documentElement.lang = language || 'en';
}

void i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      en: { translation: en },
      fi: { translation: fi },
      uk: { translation: uk },
      ru: { translation: ru },
      pl: { translation: pl },
      de: { translation: de },
      fr: { translation: fr },
      it: { translation: it },
      es: { translation: es },
    },
    fallbackLng: 'en',
    supportedLngs: supportedLanguages.map((language) => language.code),
    interpolation: {
      escapeValue: false,
    },
    detection: {
      order: ['localStorage', 'navigator'],
      caches: ['localStorage'],
      lookupLocalStorage: LANGUAGE_STORAGE_KEY,
    },
  })
  .then(() => {
    syncDocumentLang(i18n.resolvedLanguage);
  });

i18n.on('languageChanged', syncDocumentLang);

export default i18n;
