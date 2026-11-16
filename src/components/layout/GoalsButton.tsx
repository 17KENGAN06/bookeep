import { Target } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { NavLink } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useReadingGoals } from '@/hooks/useReadingGoals';
import { localDateISO } from '@/utils/dates';
import { cn } from '@/utils/cn';

/** Today's goal: how many of the planned pages are read. */
function useTodayGoal() {
  const { user } = useAuth();
  const now = new Date();
  const { days } = useReadingGoals(now.getFullYear(), now.getMonth() + 1);
  if (!user) return null;
  const today = days.find((day) => day.date === localDateISO());
  if (!today?.targetPages) return null;
  return { read: Math.min(today.pagesRead, today.targetPages), target: today.targetPages, done: today.completed };
}

/**
 * Header link to reading goals. Wide screens: the label, plus a hairline progress track and
 * "read/target" when a goal is set for today. Phones: a plain target icon (a small lime mark
 * once today's goal is met).
 */
export function GoalsButton({ to }: { to: string }) {
  const { t } = useTranslation();
  const today = useTodayGoal();
  const progress = today ? today.read / today.target : 0;
  const label = today ? `${t('nav.goals')}: ${today.read} / ${today.target}` : t('nav.goals');

  return (
    <NavLink to={to} aria-label={label} title={label} className={({ isActive }) => cn('goals-btn', isActive && 'is-active')}>
      <Target className="goals-btn-icon" strokeWidth={1.75} aria-hidden />
      {today?.done ? <span className="goals-dot" aria-hidden /> : null}
      <span className="goals-btn-text">
        <span className="goals-btn-label">{t('nav.goals')}</span>
        {today ? (
          <span className="goals-btn-meta">
            <span className="goals-track" aria-hidden>
              <span style={{ width: `${Math.round(progress * 100)}%` }} />
            </span>
            {today.read}/{today.target}
          </span>
        ) : null}
      </span>
    </NavLink>
  );
}
