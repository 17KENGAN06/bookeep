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

        <ol className="start-steps mt-12 grid gap-4 sm:mt-14 md:grid-cols-3 md:gap-5">
          {steps.map((step, index) => {
            const Icon = step.icon;
            return (
              <Reveal as="li" key={step.key} delay={index * 110}>
                <article className="lux-card lift start-step h-full rounded-[1.5rem] p-6 sm:p-7">
                  <div className="flex items-center justify-between">
                    <span className="grid h-12 w-12 place-items-center rounded-full bg-accent-soft text-accent shadow-[inset_0_0_0_1px_color-mix(in_oklab,var(--app-accent)_28%,transparent)]">
                      <Icon className="h-5 w-5" aria-hidden />
                    </span>
                    <span aria-hidden className="start-step-num">0{index + 1}</span>
                  </div>
                  <h3 className="mt-6 font-display text-[1.375rem] font-medium tracking-tight text-ink sm:text-2xl">
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
                </article>
              </Reveal>
            );
          })}
        </ol>

        <Reveal delay={200}>
          <div className="mt-10 flex justify-center">
            <ButtonLink to={authPathFor('/books')} className="hero-cta w-full !min-h-14 !px-8 !text-base min-[480px]:w-auto">
              {t('home.start.cta')}
              <ButtonArrow />
            </ButtonLink>
          </div>
        </Reveal>
      </Container>
    </section>
  );
}
