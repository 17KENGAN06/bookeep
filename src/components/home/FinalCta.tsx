import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { ButtonArrow, ButtonLink } from '@/components/common/Button';
import { Container } from '@/components/common/Container';
import { Reveal } from '@/components/common/Reveal';
import { Scene } from '@/components/scene/Scene';
import { authPathFor } from '@/utils/auth';

/** Closing invitation for new visitors at the bottom of the home page. */
export function FinalCta() {
  const { t } = useTranslation();

  return (
    <section className="relative pt-6 pb-16 sm:pb-24">
      <Container>
        <Reveal direction="scale">
          <div className="final-cta relative isolate overflow-hidden rounded-[2rem] border border-line px-6 py-14 text-center shadow-[var(--app-shadow-lg)] sm:rounded-[2.5rem] sm:px-12 sm:py-20">
            <Scene name="room" shade="center" />
            <div aria-hidden className="final-cta-glow" />
            <div className="relative mx-auto max-w-2xl">
              <p className="eyebrow justify-center">{t('home.final.eyebrow')}</p>
              <h2 className="display-title mt-6">{t('home.final.title')}</h2>
              <p className="lead mx-auto mt-5 max-w-xl">{t('home.final.lead')}</p>
              <div className="mt-9 flex flex-col items-center gap-4">
                <ButtonLink to={authPathFor('/books')} className="hero-cta w-full !min-h-14 !px-8 !text-base min-[480px]:w-auto">
                  {t('home.final.cta')}
                  <ButtonArrow />
                </ButtonLink>
                <p className="text-sm text-muted">
                  {t('auth.hasAccount')}{' '}
                  <Link to="/login?next=/books" className="text-link">
                    {t('auth.loginLink')}
                  </Link>
                </p>
              </div>
            </div>
          </div>
        </Reveal>
      </Container>
    </section>
  );
}
