import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Localization from 'expo-localization';
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import { LANGUAGE_STORAGE_KEY } from '../config/storage';
import type { UiLanguage } from '../types/book';
import en from './locales/en.json';
import fi from './locales/fi.json';
import ru from './locales/ru.json';
import uk from './locales/uk.json';

export const supportedLanguages = [
  { code: 'fi', short: 'FI' },
  { code: 'en', short: 'EN' },
  { code: 'uk', short: 'UA' },
  { code: 'ru', short: 'RU' },
] as const;

export type AppLanguage = (typeof supportedLanguages)[number]['code'];

const supportedCodes: AppLanguage[] = ['fi', 'en', 'uk', 'ru'];

export function isAppLanguage(value: string | undefined): value is AppLanguage {
  return value === 'fi' || value === 'en' || value === 'uk' || value === 'ru';
}

export function toUiLanguage(value: string | undefined): UiLanguage {
  return isAppLanguage(value) ? value : 'en';
}

function deviceLanguage(): AppLanguage {
  const code = Localization.getLocales()[0]?.languageCode ?? 'en';
  if (code === 'ua') return 'uk';
  return isAppLanguage(code) ? code : 'en';
}

const languageDetector = {
  type: 'languageDetector' as const,
  async: true,
    init: () => {},
    detect: (callback: (language: string) => void) => {
    void AsyncStorage.getItem(LANGUAGE_STORAGE_KEY).then((saved) => {
      const stored = saved ?? undefined;
      if (isAppLanguage(stored)) {
        callback(stored);
        return;
      }
      callback(deviceLanguage());
    });
  },
  cacheUserLanguage: (language: string) => {
    void AsyncStorage.setItem(LANGUAGE_STORAGE_KEY, language);
  },
};

void i18n
  .use(languageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      en: { translation: en },
      fi: { translation: fi },
      uk: { translation: uk },
      ru: { translation: ru },
    },
    fallbackLng: 'en',
    supportedLngs: supportedCodes,
    interpolation: {
      escapeValue: false,
    },
    react: {
      useSuspense: false,
    },
  });

export default i18n;
