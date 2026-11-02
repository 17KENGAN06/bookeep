import { useEffect, useId, useRef, useState } from 'react';
import { Check, ChevronDown, Languages } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { supportedLanguages, type AppLanguage } from '@/i18n';
import { cn } from '@/utils/cn';

type LanguageSwitcherProps = {
  /** compact: a button with a dropdown (header). panel: all languages as a grid (mobile menu). */
  variant?: 'compact' | 'panel';
  className?: string;
};

function useCurrentLanguage() {
  const { i18n } = useTranslation();
  const resolved = i18n.resolvedLanguage ?? 'en';
  const current = (supportedLanguages.some((language) => language.code === resolved) ? resolved : 'en') as AppLanguage;
  return { i18n, current };
}

export function LanguageSwitcher({ variant = 'compact', className }: LanguageSwitcherProps) {
  if (variant === 'panel') return <LanguagePanel className={className} />;
  return <LanguageMenu className={className} />;
}

function LanguagePanel({ className }: { className?: string }) {
  const { t } = useTranslation();
  const { i18n, current } = useCurrentLanguage();

  return (
    <div role="listbox" aria-label={t('common.language')} className={cn('lang-panel', className)}>
      {supportedLanguages.map((language) => {
        const active = language.code === current;
        return (
          <button
            key={language.code}
            type="button"
            role="option"
            aria-selected={active}
            lang={language.code}
            className={cn('lang-option', active && 'is-active')}
            onClick={() => void i18n.changeLanguage(language.code)}
          >
            <span className="lang-code" aria-hidden>
              {language.short}
            </span>
            <span className="truncate">{language.label}</span>
          </button>
        );
      })}
    </div>
  );
}

function LanguageMenu({ className }: { className?: string }) {
  const { t } = useTranslation();
  const { i18n, current } = useCurrentLanguage();
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const listId = useId();
  const active = supportedLanguages.find((language) => language.code === current) ?? supportedLanguages[1];

  useEffect(() => {
    if (!open) return;
    const onPointer = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false);
    };
    document.addEventListener('pointerdown', onPointer);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('pointerdown', onPointer);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  return (
    <div ref={rootRef} className={cn('relative shrink-0', className)}>
      <button
        type="button"
        className="lang-trigger"
        aria-label={`${t('common.language')}: ${active.label}`}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listId}
        onClick={() => setOpen((value) => !value)}
      >
        <Languages className="h-4 w-4 text-accent" aria-hidden />
        <span className="text-xs font-bold tracking-[0.08em]">{active.short}</span>
        <ChevronDown className={cn('h-3.5 w-3.5 text-muted transition-transform', open && 'rotate-180')} aria-hidden />
      </button>

      {open ? (
        <div id={listId} role="listbox" aria-label={t('common.language')} className="lang-menu">
          {supportedLanguages.map((language) => {
            const selected = language.code === current;
            return (
              <button
                key={language.code}
                type="button"
                role="option"
                aria-selected={selected}
                lang={language.code}
                className={cn('lang-option', selected && 'is-active')}
                onClick={() => {
                  void i18n.changeLanguage(language.code);
                  setOpen(false);
                }}
              >
                <span className="lang-code" aria-hidden>
                  {language.short}
                </span>
                <span className="flex-1 truncate">{language.label}</span>
                {selected ? <Check className="h-4 w-4 shrink-0" aria-hidden /> : null}
              </button>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}
