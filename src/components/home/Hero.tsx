import { ArrowRight } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { ButtonLink } from '@/components/common/Button';
import { Container } from '@/components/common/Container';
import { Reveal } from '@/components/common/Reveal';
import { HeroVisual } from '@/components/home/HeroVisual';

export function Hero() {
  const { t } = useTranslation();

  return (
    <section className="relative overflow-x-clip pt-8 pb-12 sm:pt-12 sm:pb-20 lg:pt-16 lg:pb-24">
      <Container>
        <div className="grid items-center gap-8 sm:gap-10 xl:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)] xl:gap-14">
          <div className="relative">
            <div
              aria-hidden
              className="pointer-events-none absolute inset-x-[-10%] top-[-8%] -z-10 h-[70%] rounded-[45%] bg-[radial-gradient(circle_at_center,var(--app-accent-soft),transparent_70%)]"
            />

            <Reveal>
              <p className="font-display text-xs font-medium tracking-[0.28em] text-accent uppercase sm:text-sm">
                {t('home.eyebrow')}
              </p>
            </Reveal>

            <h1 className="font-display mt-5 text-3xl leading-tight font-bold tracking-tight break-words text-ink sm:text-6xl lg:text-[4.2rem] lg:leading-[0.95]">
              <Reveal as="span" delay={80} className="block">
                {t('home.line1')}
              </Reveal>
              <Reveal as="span" delay={160} className="block">
                {t('home.line2')}
              </Reveal>
              <Reveal as="span" delay={240} className="block text-accent">
                {t('home.line3')}
              </Reveal>
            </h1>

            <Reveal delay={320}>
              <p className="mt-6 max-w-xl text-base leading-relaxed text-muted sm:text-lg">
                {t('home.subtitle')}
              </p>
            </Reveal>

            <Reveal delay={400}>
              <ButtonLink to="/books" className="mt-8 w-full min-w-44 sm:w-auto">
                {t('home.ctaPrimary')}
                <ArrowRight className="h-4 w-4" aria-hidden />
              </ButtonLink>
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
