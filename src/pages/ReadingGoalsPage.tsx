import { useEffect, useMemo, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { GoalComposer } from '@/components/goals/GoalComposer';
import { GoalsCalendar } from '@/components/goals/GoalsCalendar';
import { Container } from '@/components/common/Container';
import { DocumentTitle } from '@/components/common/DocumentTitle';
import { ErrorState } from '@/components/common/ErrorState';
import { Skeleton } from '@/components/common/Skeleton';
import { useAuth } from '@/hooks/useAuth';
import { useReadingGoals } from '@/hooks/useReadingGoals';
import type { DayReadingState } from '@/types/reading';
import { dateISO, localDateISO, monthRange, monthTitle, shiftMonth } from '@/utils/dates';

function pickDefaultDate(year: number, month: number, today: string) {
  const { start, end } = monthRange(year, month);
  if (today >= start && today <= end) return today;
  return dateISO(year, month, 1);
}

function dayStateFor(date: string, days: DayReadingState[]): DayReadingState {
  return days.find((day) => day.date === date) ?? {
    date,
    pagesRead: 0,
    targetPages: null,
    completed: false,
  };
}

export function ReadingGoalsPage() {
  const { t, i18n } = useTranslation();
  const { user, isLoading } = useAuth();
  const now = new Date();
  const today = localDateISO();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth());
  const [selectedDate, setSelectedDate] = useState(() => pickDefaultDate(now.getFullYear(), now.getMonth(), today));
  const { days, summary, status, reload, saveGoal, removeGoal } = useReadingGoals(year, month);
  const selected = dayStateFor(selectedDate, days);
  const { start, end } = useMemo(() => monthRange(year, month), [month, year]);

  const years = useMemo(() => {
    const current = now.getFullYear();
    return Array.from({ length: 7 }, (_, index) => current - 3 + index);
  }, [now]);

  useEffect(() => {
    setSelectedDate(pickDefaultDate(year, month, today));
  }, [month, today, year]);

  function move(delta: number) {
    const next = shiftMonth(year, month, delta);
    setYear(next.year);
    setMonth(next.month);
  }

  function onPickDate(date: string) {
    if (date < start || date > end) return;
    setSelectedDate(date);
  }

  function scrollToComposer() {
    document.getElementById('goal-composer')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  if (isLoading) return <div className="min-h-[40vh]" />;
  if (!user) return <Navigate to="/login?next=/goals" replace />;

  return (
    <Container className="py-10 sm:py-14">
      <DocumentTitle title={t('goals.title')} noindex />
      <p className="eyebrow">{t('goals.eyebrow')}</p>
      <div className="mt-4 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="display-title">{t('goals.title')}</h1>
          <p className="mt-3 max-w-2xl text-sm text-muted sm:text-base">{t('goals.lead')}</p>
        </div>
        <div className="flex w-full items-center gap-2 sm:w-auto lg:shrink-0">
          <button type="button" className="icon-btn" onClick={() => move(-1)} aria-label={t('goals.prevMonth')}>
            <ChevronLeft className="h-5 w-5" />
          </button>
          <select
            className="field-control !min-h-11 min-w-0 flex-1 !rounded-full !py-0 font-semibold capitalize sm:w-44 sm:flex-none"
            value={month}
            aria-label={t('goals.month')}
            onChange={(event) => setMonth(Number(event.target.value))}
          >
            {Array.from({ length: 12 }, (_, index) => (
              <option key={index} value={index}>
                {new Intl.DateTimeFormat(i18n.resolvedLanguage ?? 'en', { month: 'long' }).format(new Date(2024, index, 1))}
              </option>
            ))}
          </select>
          <select
            className="field-control !min-h-11 !w-28 shrink-0 !rounded-full !py-0 font-semibold"
            value={year}
            aria-label={t('goals.year')}
            onChange={(event) => setYear(Number(event.target.value))}
          >
            {years.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
          <button type="button" className="icon-btn" onClick={() => move(1)} aria-label={t('goals.nextMonth')}>
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>
      </div>

      <p className="mt-10 font-display text-xl font-medium tracking-tight text-ink capitalize sm:text-2xl">{monthTitle(year, month, i18n.resolvedLanguage ?? 'en')}</p>
      <p className="mt-2 text-sm text-muted">{t('goals.calendarHint')}</p>
      <div className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-4">
        <SummaryCard label={t('goals.readingDays')} value={String(summary.readingDays)} />
        <SummaryCard label={t('goals.pagesRead')} value={String(summary.pagesRead)} />
        <SummaryCard label={t('goals.goalsCompleted')} value={`${summary.goalsCompleted} / ${summary.goalsSet}`} />
        <SummaryCard label={t('goals.currentStreak')} value={t('goals.streakValue', { count: summary.streak })} />
      </div>

      <div className="mt-8 grid items-start gap-6 lg:grid-cols-[minmax(0,1.35fr)_minmax(18rem,0.75fr)]">
        <div className="lux-card order-2 rounded-[1.75rem] p-2.5 sm:p-5 lg:order-1">
          {status === 'loading' ? (
            <Skeleton className="h-[28rem] w-full rounded-3xl" />
          ) : status === 'error' ? (
            <ErrorState onRetry={() => void reload()} />
          ) : (
            <GoalsCalendar
              year={year}
              month={month}
              today={today}
              selectedDate={selectedDate}
              days={days}
              onSelect={(day) => {
                setSelectedDate(day.date);
                if (window.matchMedia('(max-width: 1023px)').matches) scrollToComposer();
              }}
            />
          )}
        </div>

        <div className="order-1 lg:order-2">
          <GoalComposer
            date={selected.date}
            minDate={start}
            maxDate={end}
            pagesRead={selected.pagesRead}
            targetPages={selected.targetPages}
            onDateChange={onPickDate}
            onSave={(target) => saveGoal(selected.date, target)}
            onDelete={() => removeGoal(selected.date)}
          />
        </div>
      </div>
    </Container>
  );
}

function SummaryCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="lux-card flex flex-col justify-between rounded-[1.25rem] px-4 py-4 sm:px-5 sm:py-5">
      <p className="text-[10px] leading-snug font-bold tracking-[0.18em] break-words text-muted uppercase sm:text-[11px]">{label}</p>
      <p className="mt-3 font-display text-2xl font-medium tracking-tight text-ink tabular-nums sm:text-3xl">{value}</p>
    </div>
  );
}
