import { Check } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { ProgressBar } from '@/components/common/ProgressBar';
import type { DayReadingState } from '@/types/reading';
import { cn } from '@/utils/cn';
import { monthCellDays, weekdayLabels } from '@/utils/dates';

type GoalsCalendarProps = {
  year: number;
  month: number;
  today: string;
  selectedDate?: string;
  days: DayReadingState[];
  onSelect: (day: DayReadingState) => void;
};

export function GoalsCalendar({ year, month, today, selectedDate, days, onSelect }: GoalsCalendarProps) {
  const { i18n } = useTranslation();
  const labels = weekdayLabels(i18n.resolvedLanguage ?? 'en');
  const cells = monthCellDays(year, month);
  const byDate = new Map(days.map((day) => [day.date, day]));

  return (
    <div>
      <div className="grid grid-cols-7 gap-1.5 sm:gap-2">
        {labels.map((label) => (
          <p key={label} className="px-1 pb-2 text-center text-[11px] font-semibold tracking-wide text-muted uppercase sm:text-xs">
            {label}
          </p>
        ))}
        {cells.map((day, index) => {
          if (!day) return <div key={`empty-${index}`} />;
          const iso = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
          const state = byDate.get(iso);
          if (!state) return <div key={iso} />;
          return (
            <DayCard
              key={iso}
              day={state}
              isToday={iso === today}
              isSelected={iso === selectedDate}
              onSelect={() => onSelect(state)}
            />
          );
        })}
      </div>
    </div>
  );
}

function DayCard({
  day,
  isToday,
  isSelected,
  onSelect,
}: {
  day: DayReadingState;
  isToday: boolean;
  isSelected: boolean;
  onSelect: () => void;
}) {
  const { t } = useTranslation();
  const hasGoal = Boolean(day.targetPages);
  const ratio = hasGoal ? Math.min(100, (day.pagesRead / (day.targetPages ?? 1)) * 100) : 0;

  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        'focus-ring flex min-h-[4.6rem] flex-col rounded-2xl border px-1.5 py-1.5 text-left transition sm:min-h-[6.5rem] sm:px-2.5 sm:py-2.5',
        day.completed
          ? 'border-accent/40 bg-accent-soft'
          : hasGoal
            ? 'border-line bg-surface hover:border-accent/30'
            : 'border-line/80 bg-surface/60 hover:border-accent/25',
        isToday && 'ring-2 ring-accent/45 ring-offset-2 ring-offset-bg',
        isSelected && 'border-accent bg-accent-soft',
      )}
      aria-current={isToday ? 'date' : undefined}
      aria-pressed={isSelected}
    >
      <span className="flex items-center justify-between gap-1">
        <span className="font-display text-sm font-semibold text-ink sm:text-base">{Number(day.date.slice(-2))}</span>
        {day.completed ? <Check className="h-3.5 w-3.5 text-accent" aria-hidden /> : null}
      </span>
        {isToday ? (
          <span className="mt-0.5 hidden text-[10px] font-semibold text-accent uppercase sm:inline">{t('goals.today')}</span>
        ) : null}
      {hasGoal ? (
        <>
          <p className="mt-auto font-display text-[11px] font-semibold tabular-nums text-ink sm:text-sm">
            {day.pagesRead} / {day.targetPages}
          </p>
          <p className="hidden text-[10px] text-muted sm:block">
            {day.completed ? t('goals.goalCompleted') : t('goals.pages')}
          </p>
          <div className="mt-1 hidden sm:block">
            <ProgressBar value={ratio} />
          </div>
          <div className="mt-1 h-1 overflow-hidden rounded-full bg-surface-2 sm:hidden">
            <div className="h-full rounded-full bg-accent" style={{ width: `${ratio}%` }} />
          </div>
        </>
      ) : (
        <p className="mt-auto text-[10px] text-muted sm:text-xs">{t('goals.noGoal')}</p>
      )}
    </button>
  );
}
