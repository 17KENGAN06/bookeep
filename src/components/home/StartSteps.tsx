import { BookMarked, Sparkles, UserRound } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { ButtonArrow, ButtonLink } from '@/components/common/Button';
import { Container } from '@/components/common/Container';
import { Reveal } from '@/components/common/Reveal';
import { authPathFor } from '@/utils/auth';

const steps = [
  { key: 'account', icon: UserRound },
  { key: 'choose', icon: BookMarked },
  { key: 'read', icon: Sparkles },
] as const;

/** For new visitors: three steps from the home page to the first page of a book. */
export function StartSteps() {
  const { t } = useTranslation();

  return (
    <section className="relative py-14 sm:py-20">
      <div aria-hidden className="hairline absolute inset-x-0 top-0" />
      <Container>
        <Reveal>
          <div className="mx-auto max-w-2xl text-center">
            <p className="eyebrow justify-center">{t('home.start.eyebrow')}</p>
            <h2 className="section-title mt-5">{t('home.start.title')}</h2>
            <p className="mx-auto mt-4 max-w-xl text-[0.9375rem] leading-relaxed text-muted sm:text-base">{t('home.start.lead')}</p>
          </div>
        </Reveal>

        <Reveal>
          <ol className="start-steps lux-card mt-12 grid overflow-hidden rounded-sheet sm:mt-14 md:grid-cols-3">
            {steps.map((step, index) => {
              const Icon = step.icon;
              return (
                <li
                  key={step.key}
                  className="start-step border-line p-6 not-first:border-t sm:p-8 md:not-first:border-t-0 md:not-first:border-l"
                >
                  <div className="flex items-center justify-between">
                    <span className="icon-tile">
                      <Icon aria-hidden />
                    </span>
                    <span aria-hidden className="start-step-num">
                      0{index + 1}
                      <span className="text-faint/60"> / 03</span>
                    </span>
                  </div>
                  <h3 className="mt-8 font-display text-[1.25rem] font-semibold tracking-[-0.025em] text-ink sm:text-[1.375rem]">
                    {t(`home.start.${step.key}.title`)}
                  </h3>
                  <p className="mt-2.5 text-[0.9375rem] leading-relaxed text-muted">{t(`home.start.${step.key}.text`)}</p>
                  {step.key === 'read' ? (
                    <div aria-hidden className="start-explain mt-5">
                      <p className="text-[0.8125rem] leading-relaxed text-muted">
                        {t('home.start.sampleBefore')} <mark className="start-mark">{t('home.start.sampleWord')}</mark>{' '}
                        {t('home.start.sampleAfter')}
                      </p>
                      <div className="start-explain-card">
                        <Sparkles className="h-3.5 w-3.5 shrink-0 text-accent" />
                        <span>{t('home.start.sampleExplain')}</span>
                      </div>
                    </div>
                  ) : null}
                </li>
              );
            })}
          </ol>
        </Reveal>

        <Reveal delay={200}>
          <div className="mt-10 flex justify-center">
            <ButtonLink to={authPathFor('/books')} className="hero-cta w-full min-[480px]:w-auto">
              {t('home.start.cta')}
              <ButtonArrow />
            </ButtonLink>
          </div>
        </Reveal>
      </Container>
    </section>
  );
}
