import { FileText, Globe, Target } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { ButtonArrow, ButtonLink } from '@/components/common/Button';
import { Container } from '@/components/common/Container';
import { Reveal } from '@/components/common/Reveal';
import { HeroVisual } from '@/components/home/HeroVisual';
import { Scene } from '@/components/scene/Scene';
import { useAuth } from '@/hooks/useAuth';

function LevelsIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" aria-hidden>
      <path d="M4 20v-5M9 20V9M14 20V4M19 20v-8" />
    </svg>
  );
}

export function Hero() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const goalsTo = user ? '/goals' : '/login?next=/goals';

  const stats = [
    { value: 'A2–B1', label: t('home.stats.levels'), icon: LevelsIcon },
    { value: 'EN · FI', label: t('home.stats.languages'), icon: Globe },
    { value: 'PDF', label: t('home.stats.reader'), icon: FileText },
  ];

  return (
    <section className="relative isolate overflow-x-clip">
      <Scene name="room" underHeader />
      <Container className="relative pt-10 pb-16 sm:pt-16 sm:pb-24 lg:pt-20 lg:pb-28">
        <div className="grid grid-cols-[minmax(0,1fr)] items-center gap-x-6 gap-y-10 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] md:grid-rows-[auto_auto] lg:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)] lg:gap-x-10">
          <div className="relative z-10 min-w-0 md:self-end">
            <Reveal>
              <p className="eyebrow">{t('home.eyebrow')}</p>
            </Reveal>

            <h1 className="hero-title mt-7 font-display text-[2.75rem] leading-[0.98] font-medium tracking-[-0.02em] break-words text-ink min-[400px]:text-[3.1rem] sm:text-[4rem] md:text-[3.4rem] lg:text-[3.9rem] xl:text-[4.9rem] 2xl:text-[5.4rem]">
              <Reveal as="span" delay={80} className="block">
                {t('home.line1')}
              </Reveal>
              <Reveal as="span" delay={160} className="block">
                {t('home.line2')}{' '}
                <em className="font-normal text-accent italic [text-shadow:0_0_40px_var(--app-glow)]">{t('home.line3')}</em>
              </Reveal>
            </h1>

            <Reveal delay={260}>
              <p className="lead mt-7 max-w-[34rem]">{t('home.subtitle')}</p>
            </Reveal>

            <Reveal delay={340}>
              <div className="mt-9 flex flex-col gap-3 min-[480px]:flex-row min-[480px]:flex-wrap">
                <ButtonLink to="/books" className="w-full !min-h-14 !px-7 !text-base min-[480px]:w-auto">
                  {t('home.ctaPrimary')}
                  <ButtonArrow />
                </ButtonLink>
                <ButtonLink to={goalsTo} variant="secondary" className="w-full !min-h-14 !px-7 !text-base min-[480px]:w-auto">
                  <Target className="h-[18px] w-[18px] text-accent" aria-hidden />
                  {t('home.ctaGoals')}
                </ButtonLink>
              </div>
            </Reveal>

          </div>

          <Reveal delay={180} direction="right" className="-mx-2 sm:mx-0 md:col-start-2 md:row-span-2 md:row-start-1 md:-mr-4 lg:-mr-8">
            <HeroVisual />
          </Reveal>

          <div className="md:col-start-1 md:row-start-2 md:self-start">
            <Reveal delay={420}>
              <dl className="grid max-w-xl grid-cols-3 gap-3 border-t border-line pt-7 sm:gap-6">
                {stats.map((item) => {
                  const Icon = item.icon;
                  return (
                    <div key={item.value} className="flex min-w-0 flex-col gap-3 sm:flex-row sm:items-start">
                      <Icon className="h-7 w-7 shrink-0 text-accent/90 sm:h-8 sm:w-8" />
                      <div className="min-w-0">
                        <dt className="sr-only">{item.label}</dt>
                        <dd className="font-display text-lg leading-tight font-medium tracking-tight text-ink sm:text-xl">{item.value}</dd>
                        <dd className="mt-1 text-xs leading-snug text-muted">{item.label}</dd>
                      </div>
                    </div>
                  );
                })}
              </dl>
            </Reveal>
          </div>
        </div>
      </Container>
    </section>
  );
}
