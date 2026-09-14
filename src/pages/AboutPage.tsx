import { useTranslation } from 'react-i18next';
import { Container } from '@/components/common/Container';
import { DocumentTitle } from '@/components/common/DocumentTitle';
import { Reveal } from '@/components/common/Reveal';

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
        <div className="mt-8 space-y-5 text-base leading-relaxed text-muted">
          <Reveal delay={220} as="p">{t('about.body1')}</Reveal>
          <Reveal delay={300} as="p">{t('about.body2')}</Reveal>
          <Reveal delay={380} as="p">{t('about.body3')}</Reveal>
        </div>
      </div>
    </Container>
  );
}
