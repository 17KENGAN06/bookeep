import { Link } from 'react-router-dom';
import { Trans, useTranslation } from 'react-i18next';
import { BrandLockup } from '@/components/brand/BrandLockup';
import { ButtonArrow, ButtonLink } from '@/components/common/Button';
import { Container } from '@/components/common/Container';
import { ADMIN_EMAIL, CONTACT_EMAIL } from '@/config/contact';
import { useAuth } from '@/hooks/useAuth';
import { scrollToPageTop } from '@/utils/scroll';

const STUDIO_URL = 'http://weisezahoy.com/';

const linkClass = 'footer-link focus-ring';

/**
 * Site footer: a statement with the catalogue CTA, labelled link columns, an oversized
 * wordmark set into the floor of the band, and the legal line.
 */
export function Footer() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const year = new Date().getFullYear();
  const goalsTo = user ? '/goals' : '/login?next=/goals';

  return (
    <footer className="site-footer relative isolate z-10 mt-24 overflow-hidden pb-[env(safe-area-inset-bottom)]">
      <Container className="relative pt-16 sm:pt-20">
        <div className="grid gap-12 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)] lg:gap-16 tabp:grid-cols-[minmax(0,1fr)]">
          <div className="max-w-xl">
            <BrandLockup to="/" size="md" />
            <p className="mt-8 font-display text-[1.875rem] leading-[1.12] font-semibold tracking-[-0.035em] text-ink sm:text-[2.5rem]">
              {t('footer.tagline')}
            </p>
            <ButtonLink to="/books" variant="secondary" className="mt-8 w-full min-[480px]:w-auto">
              {t('home.ctaPrimary')}
              <ButtonArrow />
            </ButtonLink>
          </div>

          <div className="grid grid-cols-1 gap-10 min-[480px]:grid-cols-2 sm:gap-12">
            <div className="footer-col">
              <p className="footer-label">{t('common.appName')}</p>
              <nav aria-label={t('nav.primary')} className="mt-5 grid gap-3 text-[0.9375rem]">
                <Link to="/" onClick={() => scrollToPageTop()} className={linkClass}>
                  {t('nav.home')}
                </Link>
                <Link to="/books" className={linkClass}>
                  {t('nav.books')}
                </Link>
                <Link to="/library" className={linkClass}>
                  {t('nav.library')}
                </Link>
                <Link to={goalsTo} className={linkClass}>
                  {t('nav.goals')}
                </Link>
                <Link to="/subscribe" className={linkClass}>
                  {t('nav.subscribe')}
                </Link>
                <Link to="/about" className={linkClass}>
                  {t('nav.about')}
                </Link>
                <Link to="/privacy" className={linkClass}>
                  {t('nav.privacy')}
                </Link>
              </nav>
            </div>

            <div className="footer-col">
              <p className="footer-label">{t('nav.contact')}</p>
              <ul className="mt-5 space-y-5">
                <li>
                  <p className="text-xs text-faint">{t('contact.channels.support.title')}</p>
                  <a className={`${linkClass} mt-1 inline-flex text-[0.9375rem] font-semibold text-ink`} href={`mailto:${CONTACT_EMAIL}`}>
                    {CONTACT_EMAIL}
                  </a>
                </li>
                <li>
                  <p className="text-xs text-faint">{t('contact.channels.admin.title')}</p>
                  <a className={`${linkClass} mt-1 inline-flex text-[0.9375rem] font-semibold text-ink`} href={`mailto:${ADMIN_EMAIL}`}>
                    {ADMIN_EMAIL}
                  </a>
                </li>
                <li>
                  <Link to="/contact" className={`${linkClass} inline-flex text-[0.9375rem]`}>
                    {t('nav.contact')} →
                  </Link>
                </li>
              </ul>
            </div>
          </div>
        </div>

        <div className="mt-16 flex flex-col gap-4 border-t border-line pt-6 text-xs leading-relaxed text-muted sm:flex-row sm:items-center sm:justify-between">
          <p>
            © {year} {t('common.appName')}
          </p>
          <p>
            <Trans
              i18nKey="footer.credit"
              components={{
                studio: <a className="text-link" href={STUDIO_URL} target="_blank" rel="noopener noreferrer" />,
              }}
            />
          </p>
        </div>
      </Container>

      <p aria-hidden className="footer-wordmark">
        {t('common.appName')}
      </p>
    </footer>
  );
}
