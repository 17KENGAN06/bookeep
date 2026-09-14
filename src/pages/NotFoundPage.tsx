import { useTranslation } from 'react-i18next';
import { ButtonLink } from '@/components/common/Button';
import { Container } from '@/components/common/Container';
import { DocumentTitle } from '@/components/common/DocumentTitle';
import { Reveal } from '@/components/common/Reveal';

export function NotFoundPage() {
  const { t } = useTranslation();

  return (
    <Container className="flex min-h-[70vh] flex-col items-center justify-center py-16 text-center">
      <DocumentTitle title={t('notFound.title')} noindex />
      <Reveal>
        <p className="font-display text-xs tracking-[0.28em] text-accent uppercase">
          {t('notFound.eyebrow')}
        </p>
        <p className="font-display mt-4 text-7xl font-semibold tracking-tight text-ink sm:text-8xl">404</p>
      </Reveal>
      <Reveal delay={80}>
        <h1 className="font-display mt-4 text-2xl font-semibold text-ink sm:text-3xl">
          {t('notFound.title')}
        </h1>
      </Reveal>
      <Reveal delay={140}>
        <p className="mt-4 max-w-md text-sm leading-relaxed text-muted sm:text-base">
          {t('notFound.subtitle')}
        </p>
      </Reveal>
      <Reveal delay={220}>
        <div className="mt-8 flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
          <ButtonLink to="/" className="w-full min-w-40 sm:w-auto">
            {t('notFound.home')}
          </ButtonLink>
          <ButtonLink to="/books" variant="secondary" className="w-full min-w-40 sm:w-auto">
            {t('notFound.catalog')}
          </ButtonLink>
        </div>
      </Reveal>
    </Container>
  );
}
