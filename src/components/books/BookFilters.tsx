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
    <div className="flex flex-col gap-5 md:flex-row md:flex-wrap md:items-end md:gap-8">
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
    <div className="min-w-0">
      <p className="mb-2.5 text-[11px] font-bold tracking-[0.22em] text-muted uppercase">{label}</p>
      <div role="radiogroup" aria-label={label} className="seg">
        {children}
      </div>
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
      className={cn('seg-item min-h-10 sm:min-h-10', active && 'is-active')}
    >
      {children}
    </button>
  );
}
