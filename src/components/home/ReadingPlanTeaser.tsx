import { CalendarDays } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { ButtonArrow, ButtonLink } from '@/components/common/Button';
import { Container } from '@/components/common/Container';
import { Reveal } from '@/components/common/Reveal';
import { Scene } from '@/components/scene/Scene';
import { useAuth } from '@/hooks/useAuth';
import { cn } from '@/utils/cn';
import { weekdayLabels } from '@/utils/dates';

// Illustrative month: pages read against a 10-page daily goal.
const sampleDays = [
  10, 12, 0, 10, 14, 6, 0,
  10, 11, 10, 3, 0, 10, 15,
  12, 10, 0, 10, 10, 8, 0,
  10, 13, 10, null, null, null, null,
] as const;

export function ReadingPlanTeaser() {
  const { t, i18n } = useTranslation();
  const { user } = useAuth();
  const goalsTo = user ? '/goals' : '/login?next=/goals';
  const language = i18n.resolvedLanguage ?? 'en';
  const labels = weekdayLabels(language);

  return (
    <section className="relative py-10 sm:py-16">
      <Container>
        <Reveal direction="scale">
          <div className="relative isolate overflow-hidden rounded-[2rem] border border-line shadow-[var(--app-shadow-lg)] sm:rounded-[2.5rem]">
            <Scene name="library" shade="left" />
            <div className="relative grid items-center gap-10 p-6 sm:p-10 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:gap-16 lg:p-16">
              <div>
                <p className="eyebrow">{t('nav.goals')}</p>
                <h2 className="section-title mt-5">{t('home.planTitle')}</h2>
                <p className="mt-4 max-w-md text-[0.9375rem] leading-relaxed text-muted sm:text-base">{t('home.planLead')}</p>
                <ButtonLink to={goalsTo} className="mt-8 w-full min-[480px]:w-auto">
                  <CalendarDays className="h-4 w-4" aria-hidden />
                  {t('home.planCta')}
                  <ButtonArrow />
                </ButtonLink>
              </div>

              <div aria-hidden className="glass-card rounded-[1.5rem] p-3 sm:p-5">
                <div className="mb-3 flex items-baseline justify-between px-1">
                  <span className="font-display text-lg font-medium tracking-tight text-ink capitalize">
                    {new Intl.DateTimeFormat(language, { month: 'long' }).format(new Date())}
                  </span>
                  <span className="text-[11px] font-bold tracking-[0.18em] text-accent uppercase tabular-nums">10 / 10</span>
                </div>
                <div className="grid grid-cols-7 gap-1 sm:gap-1.5">
                  {labels.map((label) => (
                    <span key={label} className="pb-1 text-center text-[10px] font-semibold tracking-wide text-muted uppercase">
                      {label}
                    </span>
                  ))}
                  {sampleDays.map((pages, index) => {
                    if (pages === null) return <span key={index} />;
                    const done = pages >= 10;
                    const ratio = Math.min(1, pages / 10);
                    return (
                      <span
                        key={index}
                        className={cn(
                          'flex aspect-square flex-col justify-between rounded-lg p-1 text-[10px] font-semibold tabular-nums sm:rounded-xl sm:p-1.5 sm:text-xs',
                          done ? 'bg-accent-soft text-ink' : pages > 0 ? 'bg-surface-2/80 text-ink' : 'bg-surface-2/40 text-muted',
                          index === 23 && 'shadow-[inset_0_0_0_1px_var(--app-accent)]',
                        )}
                      >
                        {index + 1}
                        <span className="meter !h-0.5">
                          <span className="meter-fill block" style={{ width: `${ratio * 100}%` }} />
                        </span>
                      </span>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </Reveal>
      </Container>
    </section>
  );
}
