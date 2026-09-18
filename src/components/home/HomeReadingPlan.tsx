import { ArrowRight } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { GoalsCalendar } from '@/components/goals/GoalsCalendar';
import { ButtonLink } from '@/components/common/Button';
import { Container } from '@/components/common/Container';
import { Reveal } from '@/components/common/Reveal';
import { useAuth } from '@/hooks/useAuth';
import { useReadingGoals } from '@/hooks/useReadingGoals';
import { useNavigate } from 'react-router-dom';

export function HomeReadingPlan() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const now = new Date();
  const { days, today } = useReadingGoals(now.getFullYear(), now.getMonth());

  return (
    <section className="relative py-6 sm:py-10">
      <Container>
        <div className="grid items-center gap-8 rounded-[2rem] border border-line bg-surface px-5 py-8 sm:px-8 sm:py-10 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] lg:gap-12">
          <Reveal>
            <p className="font-display text-xs tracking-[0.24em] text-accent uppercase">{t('goals.eyebrow')}</p>
            <h2 className="font-display mt-3 text-2xl font-semibold tracking-tight text-ink sm:text-3xl">
              {t('home.planTitle')}
            </h2>
            <p className="mt-3 max-w-md text-sm leading-relaxed text-muted sm:text-base">{t('home.planLead')}</p>
            <ButtonLink to="/goals" className="mt-6 w-full sm:w-auto">
              {t('home.planCta')}
              <ArrowRight className="h-4 w-4" aria-hidden />
            </ButtonLink>
          </Reveal>
          <Reveal delay={120} direction="right">
            <div className="rounded-3xl border border-line bg-bg p-3 sm:p-4">
              <GoalsCalendar
                year={now.getFullYear()}
                month={now.getMonth()}
                today={today}
                days={days}
                onSelect={() => navigate(user ? '/goals' : '/login?next=/goals')}
              />
            </div>
          </Reveal>
        </div>
      </Container>
    </section>
  );
}
