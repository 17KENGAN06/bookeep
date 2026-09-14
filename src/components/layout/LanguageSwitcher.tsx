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
      className={cn('inline-flex items-center gap-1 rounded-xl border border-line bg-surface p-1', className)}
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
            className={cn(
              'focus-ring min-h-9 min-w-9 rounded-lg px-2 text-xs font-semibold tracking-wide transition',
              active ? 'bg-accent text-on-accent' : 'text-muted hover:text-ink',
            )}
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
