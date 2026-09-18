import { Link } from 'react-router-dom';
import { Trans, useTranslation } from 'react-i18next';
import { BrandLockup } from '@/components/brand/BrandLockup';
import { Container } from '@/components/common/Container';
import { ADMIN_EMAIL, PARTNER_EMAIL } from '@/config/contact';
import { scrollToPageTop } from '@/utils/scroll';

const STUDIO_URL = 'http://weisezahoy.com/';

const linkClass = 'focus-ring rounded-md text-ink hover:text-accent';

export function Footer() {
  const { t } = useTranslation();
  const year = new Date().getFullYear();

  return (
    <footer className="relative z-10 mt-16 border-t border-line">
      <Container className="py-12 sm:py-16">
        <div className="flex flex-col gap-10 lg:flex-row lg:items-start lg:justify-between">
          <div className="max-w-md">
            <BrandLockup to="/" size="md" />
            <p className="mt-4 text-sm leading-relaxed text-muted">{t('footer.tagline')}</p>
          </div>

          <div className="flex flex-col gap-10 sm:flex-row sm:gap-16">
            <nav className="flex flex-wrap gap-x-5 gap-y-3 text-sm font-semibold lg:flex-col lg:gap-2">
              <Link to="/" onClick={() => scrollToPageTop()} className={linkClass}>
                {t('nav.home')}
              </Link>
              <Link to="/books" className={linkClass}>
                {t('nav.books')}
              </Link>
              <Link to="/library" className={linkClass}>
                {t('nav.library')}
              </Link>
              <Link to="/goals" className={linkClass}>
                {t('nav.goals')}
              </Link>
              <Link to="/about" className={linkClass}>
                {t('nav.about')}
              </Link>
              <Link to="/contact" className={linkClass}>
                {t('nav.contact')}
              </Link>
              <Link to="/privacy" className={linkClass}>
                {t('nav.privacy')}
              </Link>
            </nav>

            <div>
              <p className="text-sm font-semibold text-ink">{t('nav.contact')}</p>
              <ul className="mt-3 space-y-3 text-sm">
                <li>
                  <p className="text-xs text-muted">{t('contact.channels.partner.title')}</p>
                  <a className={`${linkClass} mt-0.5 inline-flex font-semibold`} href={`mailto:${PARTNER_EMAIL}`}>
                    {PARTNER_EMAIL}
                  </a>
                </li>
                <li>
                  <p className="text-xs text-muted">{t('contact.channels.admin.title')}</p>
                  <a className={`${linkClass} mt-0.5 inline-flex font-semibold`} href={`mailto:${ADMIN_EMAIL}`}>
                    {ADMIN_EMAIL}
                  </a>
                </li>
              </ul>
            </div>
          </div>
        </div>

        <div className="mt-10 space-y-2 text-xs leading-relaxed text-muted">
          <p>© {year} {t('common.appName')}</p>
          <p>
            <Trans
              i18nKey="footer.credit"
              components={{
                studio: (
                  <a
                    className="font-semibold text-ink underline decoration-accent/50 underline-offset-4 transition hover:text-accent"
                    href={STUDIO_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                  />
                ),
              }}
            />
          </p>
        </div>
      </Container>
    </footer>
  );
}
