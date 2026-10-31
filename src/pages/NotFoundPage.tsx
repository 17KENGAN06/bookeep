import { useTranslation } from 'react-i18next';
import { ButtonArrow, ButtonLink } from '@/components/common/Button';
import { Container } from '@/components/common/Container';
import { DocumentTitle } from '@/components/common/DocumentTitle';
import { Reveal } from '@/components/common/Reveal';
import { Scene } from '@/components/scene/Scene';

export function NotFoundPage() {
  const { t } = useTranslation();

  return (
    <section className="relative isolate">
      <DocumentTitle title={t('notFound.title')} noindex />
      <Scene name="botanical" underHeader shade="center" />
      <Container className="relative flex min-h-[72vh] flex-col items-center justify-center py-16 text-center">
        <Reveal>
          <p className="eyebrow">{t('notFound.eyebrow')}</p>
          <p className="mt-6 font-display text-[7rem] leading-none font-medium tracking-tight text-ink/90 italic [text-shadow:0_0_60px_var(--app-glow)] sm:text-[10rem]">
            404
          </p>
        </Reveal>
        <Reveal delay={80}>
          <h1 className="mt-6 font-display text-3xl font-medium text-ink sm:text-4xl">{t('notFound.title')}</h1>
        </Reveal>
        <Reveal delay={140}>
          <p className="mt-4 max-w-md text-sm leading-relaxed text-muted sm:text-base">{t('notFound.subtitle')}</p>
        </Reveal>
        <Reveal delay={220}>
          <div className="mt-9 flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
            <ButtonLink to="/" className="w-full min-w-40 sm:w-auto">
              {t('notFound.home')}
              <ButtonArrow />
            </ButtonLink>
            <ButtonLink to="/books" variant="secondary" className="w-full min-w-40 sm:w-auto">
              {t('notFound.catalog')}
            </ButtonLink>
          </div>
        </Reveal>
      </Container>
    </section>
  );
}
