import { useTranslation } from 'react-i18next';
import { ButtonLink } from '@/components/common/Button';
import { Container } from '@/components/common/Container';
import { DocumentTitle } from '@/components/common/DocumentTitle';
import { Reveal } from '@/components/common/Reveal';

export function HowItWorksPage() {
  const { t } = useTranslation();

  return (
    <Container className="py-12 sm:py-16">
      <DocumentTitle title={t('how.title')} description={t('how.lead')} />
      <div className="max-w-2xl">
        <Reveal>
          <p className="font-display text-xs tracking-[0.24em] text-accent uppercase">{t('how.eyebrow')}</p>
        </Reveal>
        <Reveal delay={80}>
          <h1 className="font-display mt-4 text-3xl font-bold tracking-tight text-ink sm:text-5xl">
            {t('how.title')}
          </h1>
        </Reveal>
        <Reveal delay={160}>
          <p className="mt-6 text-lg leading-relaxed text-muted">{t('how.lead')}</p>
        </Reveal>
        <div className="mt-8 space-y-5 text-base leading-relaxed text-muted">
          <Reveal delay={220} as="p">{t('how.body1')}</Reveal>
          <Reveal delay={300} as="p">{t('how.body2')}</Reveal>
        </div>
        <Reveal delay={380}>
          <ButtonLink to="/books" className="mt-10 w-full min-w-44 sm:w-auto">
            {t('how.cta')}
          </ButtonLink>
        </Reveal>
      </div>
    </Container>
  );
}
