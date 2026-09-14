import { useTranslation } from 'react-i18next';
import { ButtonLink } from '@/components/common/Button';
import { Container } from '@/components/common/Container';
import { DocumentTitle } from '@/components/common/DocumentTitle';
import { Reveal } from '@/components/common/Reveal';

const SECTIONS = ['purpose', 'adaptation', 'languages', 'levels', 'reading'] as const;

export function AboutPage() {
  const { t } = useTranslation();

  return (
    <Container className="py-12 sm:py-16">
      <DocumentTitle title={t('about.title')} description={t('about.lead')} />
      <div className="max-w-3xl">
        <Reveal>
          <p className="font-display text-xs tracking-[0.24em] text-accent uppercase">{t('about.eyebrow')}</p>
        </Reveal>
        <Reveal delay={80}>
          <h1 className="font-display mt-4 text-3xl font-bold tracking-tight text-ink sm:text-5xl">
            {t('about.title')}
          </h1>
        </Reveal>
        <Reveal delay={160}>
          <p className="mt-6 text-lg leading-relaxed text-muted">{t('about.lead')}</p>
        </Reveal>

        <div className="mt-12 space-y-10">
          {SECTIONS.map((section, index) => (
            <Reveal key={section} delay={200 + index * 60}>
              <h2 className="font-display text-xl font-semibold tracking-tight text-ink sm:text-2xl">
                {t(`about.sections.${section}.title`)}
              </h2>
              <p className="mt-3 text-base leading-relaxed text-muted">
                {t(`about.sections.${section}.text`)}
              </p>
            </Reveal>
          ))}
        </div>

        <Reveal delay={520}>
          <ButtonLink to="/books" className="mt-12 w-full min-w-44 sm:w-auto">
            {t('about.cta')}
          </ButtonLink>
        </Reveal>
      </div>
    </Container>
  );
}
