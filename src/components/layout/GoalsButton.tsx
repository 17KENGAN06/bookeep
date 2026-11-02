import { Target } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { NavLink } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useReadingGoals } from '@/hooks/useReadingGoals';
import { localDateISO } from '@/utils/dates';
import { cn } from '@/utils/cn';

const RADIUS = 13;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

/** Today's goal as a ring: how many of the planned pages are read. */
function useTodayGoal() {
  const { user } = useAuth();
  const now = new Date();
  const { days } = useReadingGoals(now.getFullYear(), now.getMonth() + 1);
  if (!user) return null;
  const today = days.find((day) => day.date === localDateISO());
  if (!today?.targetPages) return null;
  return { read: Math.min(today.pagesRead, today.targetPages), target: today.targetPages, done: today.completed };
}

function GoalRing({ progress, done }: { progress: number; done: boolean }) {
  return (
    <span className={cn('goals-ring', done && 'is-done')} aria-hidden>
      <svg viewBox="0 0 32 32" className="absolute inset-0 h-full w-full -rotate-90">
        <circle cx="16" cy="16" r={RADIUS} className="goals-ring-track" />
        <circle
          cx="16"
          cy="16"
          r={RADIUS}
          className="goals-ring-value"
          strokeDasharray={CIRCUMFERENCE}
          strokeDashoffset={CIRCUMFERENCE * (1 - progress)}
        />
      </svg>
      <Target className="relative h-[15px] w-[15px]" strokeWidth={2.2} />
    </span>
  );
}

export function GoalsButton({ to }: { to: string }) {
  const { t } = useTranslation();
  const today = useTodayGoal();
  const progress = today ? today.read / today.target : 0;
  const label = today ? `${t('nav.goals')}: ${today.read} / ${today.target}` : t('nav.goals');

  return (
    <NavLink to={to} aria-label={label} title={label} className={({ isActive }) => cn('goals-btn', isActive && 'is-active')}>
      <GoalRing progress={progress} done={Boolean(today?.done)} />
      <span className="goals-btn-text">
        <span className="goals-btn-label">{t('nav.goals')}</span>
        {today ? (
          <span className="goals-btn-meta">
            {today.read}/{today.target}
          </span>
        ) : null}
      </span>
    </NavLink>
  );
}
