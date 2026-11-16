import { useTranslation } from 'react-i18next';
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

      </Container>
    </>
  );
}
