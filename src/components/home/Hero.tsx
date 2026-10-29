import { Target } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { ButtonArrow, ButtonLink } from '@/components/common/Button';
import { Container } from '@/components/common/Container';
import { Reveal } from '@/components/common/Reveal';
import { HeroVisual } from '@/components/home/HeroVisual';
import { useAuth } from '@/hooks/useAuth';

export function Hero() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const goalsTo = user ? '/goals' : '/login?next=/goals';

  const stats = [
    { value: 'A2–B1', label: t('home.stats.levels') },
    { value: 'EN · FI', label: t('home.stats.languages') },
    { value: 'PDF', label: t('home.stats.reader') },
  ];

  return (
    <section className="relative overflow-x-clip pt-8 pb-14 sm:pt-14 sm:pb-20 lg:pt-20 lg:pb-28">
      <Container>
        <div className="grid items-center gap-10 md:grid-cols-[minmax(0,1.08fr)_minmax(0,0.92fr)] md:gap-8 lg:gap-14">
          <div className="relative">
            <Reveal>
              <p className="eyebrow">{t('home.eyebrow')}</p>
            </Reveal>

            <h1 className="mt-6 font-display text-[2.6rem] leading-[1.02] font-medium tracking-[-0.03em] break-words text-ink min-[400px]:text-[2.9rem] sm:text-6xl md:text-[3.1rem] lg:text-[4.1rem] xl:text-[4.75rem]">
              <Reveal as="span" delay={80} className="block">
                {t('home.line1')}
              </Reveal>
              <Reveal as="span" delay={160} className="block">
                {t('home.line2')}{' '}
                <em className="font-normal text-gold italic">{t('home.line3')}</em>
              </Reveal>
            </h1>

            <Reveal delay={260}>
              <p className="mt-6 max-w-[34rem] text-base leading-relaxed text-muted sm:text-[1.0625rem] lg:text-lg">
                {t('home.subtitle')}
              </p>
            </Reveal>

            <Reveal delay={340}>
              <div className="mt-9 flex flex-col gap-3 min-[480px]:flex-row min-[480px]:flex-wrap">
                <ButtonLink to="/books" className="w-full min-[480px]:w-auto">
                  {t('home.ctaPrimary')}
                  <ButtonArrow />
                </ButtonLink>
                <ButtonLink to={goalsTo} variant="secondary" className="w-full min-[480px]:w-auto">
                  <Target className="h-4 w-4 text-gold" aria-hidden />
                  {t('home.ctaGoals')}
                </ButtonLink>
              </div>
            </Reveal>

            <Reveal delay={420}>
              <dl className="mt-10 grid max-w-md grid-cols-3 gap-4 border-t border-line pt-6">
                {stats.map((item) => (
                  <div key={item.value} className="min-w-0">
                    <dt className="sr-only">{item.label}</dt>
                    <dd className="font-display text-xl font-medium tracking-tight text-ink sm:text-2xl">{item.value}</dd>
                    <dd className="mt-1 text-xs leading-snug text-muted">{item.label}</dd>
                  </div>
                ))}
              </dl>
            </Reveal>
          </div>

          <Reveal delay={180} direction="right">
            <HeroVisual />
          </Reveal>
        </div>
      </Container>
    </section>
  );
}
