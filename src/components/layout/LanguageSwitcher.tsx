import { useTranslation } from 'react-i18next';
import { supportedLanguages, type AppLanguage } from '@/i18n';
import { cn } from '@/utils/cn';

const nativeNames: Record<AppLanguage, string> = {
  fi: 'Suomi',
  en: 'English',
  uk: 'Українська',
  ru: 'Русский',
};

type LanguageSwitcherProps = {
  className?: string;
};

export function LanguageSwitcher({ className }: LanguageSwitcherProps) {
  const { i18n, t } = useTranslation();
  const current = (i18n.resolvedLanguage ?? 'en') as AppLanguage;

  return (
    <div
      className={cn('seg', className)}
      role="group"
      aria-label={t('common.language')}
    >
      {supportedLanguages.map((language) => {
        const active = current === language.code;
        return (
          <button
            key={language.code}
            type="button"
            onClick={() => {
              void i18n.changeLanguage(language.code);
            }}
            className="seg-item !min-h-8 min-w-9 !px-2.5 text-xs tracking-wide"
            aria-label={nativeNames[language.code]}
            aria-pressed={active}
            lang={language.code}
          >
            {language.short}
          </button>
        );
      })}
    </div>
  );
}
