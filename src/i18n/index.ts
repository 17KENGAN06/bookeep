import i18n from 'i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import { initReactI18next } from 'react-i18next';
import { LANGUAGE_STORAGE_KEY } from '@/config/storage';
import en from '@/i18n/locales/en.json';
import fi from '@/i18n/locales/fi.json';
import ru from '@/i18n/locales/ru.json';
import uk from '@/i18n/locales/uk.json';

export const supportedLanguages = [
  { code: 'fi', short: 'FI' },
  { code: 'en', short: 'EN' },
  { code: 'uk', short: 'UA' },
  { code: 'ru', short: 'RU' },
] as const;

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
    },
    fallbackLng: 'en',
    supportedLngs: ['fi', 'en', 'uk', 'ru'],
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
