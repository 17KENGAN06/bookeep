import { useTranslation } from 'react-i18next';
import { ButtonArrow, ButtonLink } from '@/components/common/Button';
import { Container } from '@/components/common/Container';
import { DocumentTitle } from '@/components/common/DocumentTitle';
import { Reveal } from '@/components/common/Reveal';
import { PageHero } from '@/components/scene/PageHero';

const SECTIONS = ['purpose', 'adaptation', 'languages', 'levels', 'reading'] as const;

export function AboutPage() {
  const { t } = useTranslation();

  return (
    <>
      <DocumentTitle title={t('about.title')} description={t('about.lead')} />
      <PageHero scene="room" eyebrow={t('about.eyebrow')} title={t('about.title')} lead={t('about.lead')} />

      <Container>
        <ol>
          {SECTIONS.map((section, index) => (
            <Reveal as="li" key={section} delay={index * 60} className="border-b border-line first:pt-0">
              <article className="grid gap-4 py-9 sm:py-12 md:grid-cols-[minmax(0,0.42fr)_minmax(0,1fr)] md:gap-12 tabp:grid-cols-[minmax(0,1fr)] tabp:gap-4">
                <div className="flex items-baseline gap-5">
                  <span aria-hidden className="font-display font-semibold text-sm text-faint tabular-nums">0{index + 1}</span>
                  <h2 className="font-display text-2xl font-semibold tracking-tight text-ink sm:text-[1.875rem]">
                    {t(`about.sections.${section}.title`)}
                  </h2>
                </div>
                <p className="max-w-2xl text-base leading-relaxed text-muted sm:text-[1.0625rem] md:pt-1.5 tabp:pt-0">
                  {t(`about.sections.${section}.text`)}
                </p>
              </article>
            </Reveal>
          ))}
        </ol>

        <Reveal delay={120}>
          <div className="feature-panel mt-14 flex flex-col items-start gap-6 p-8 sm:mt-20 sm:flex-row sm:items-center sm:justify-between sm:p-12">
            <p className="max-w-xl font-display font-semibold text-[1.75rem] leading-[1.15] tracking-[-0.03em] text-ink sm:text-[2.25rem]">{t('footer.tagline')}</p>
            <ButtonLink to="/books" className="w-full shrink-0 sm:w-auto">
              {t('about.cta')}
              <ButtonArrow />
            </ButtonLink>
          </div>
        </Reveal>
      </Container>
    </>
  );
}
