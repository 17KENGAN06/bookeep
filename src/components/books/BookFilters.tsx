import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { BOOK_LANGUAGES, CEFR_LEVELS, type BookLanguage, type CefrLevel } from '@/types/book';
import { cn } from '@/utils/cn';

type BookFiltersProps = {
  language: BookLanguage | 'all';
  level: CefrLevel | 'all';
  onLanguageChange: (value: BookLanguage | 'all') => void;
  onLevelChange: (value: CefrLevel | 'all') => void;
};

export function BookFilters({
  language,
  level,
  onLanguageChange,
  onLevelChange,
}: BookFiltersProps) {
  const { t } = useTranslation();

  return (
    <div className="space-y-4">
      <FilterRow label={t('books.language')}>
        <FilterChip active={language === 'all'} onClick={() => onLanguageChange('all')}>
          {t('books.all')}
        </FilterChip>
        {BOOK_LANGUAGES.map((code) => (
          <FilterChip
            key={code}
            active={language === code}
            onClick={() => onLanguageChange(code)}
          >
            {t(`languages.${code}`)}
          </FilterChip>
        ))}
      </FilterRow>

      <FilterRow label={t('books.level')}>
        <FilterChip active={level === 'all'} onClick={() => onLevelChange('all')}>
          {t('books.allLevels')}
        </FilterChip>
        {CEFR_LEVELS.map((code) => (
          <FilterChip key={code} active={level === code} onClick={() => onLevelChange(code)}>
            {code}
          </FilterChip>
        ))}
      </FilterRow>
    </div>
  );
}

function FilterRow({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div role="radiogroup" aria-label={label}>
      <p className="mb-2 text-[11px] font-semibold tracking-[0.18em] text-muted uppercase">
        {label}
      </p>
      <div className="flex flex-wrap gap-2">{children}</div>
    </div>
  );
}

function FilterChip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      role="radio"
      onClick={onClick}
      aria-checked={active}
      className={cn(
        'focus-ring inline-flex min-h-11 items-center rounded-xl px-3.5 text-sm font-semibold transition',
        active
          ? 'bg-accent text-on-accent'
          : 'bg-surface text-muted ring-1 ring-line hover:text-ink hover:ring-accent/40',
      )}
    >
      {children}
    </button>
  );
}
