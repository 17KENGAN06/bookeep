import { Link } from 'react-router-dom';
import { Trans, useTranslation } from 'react-i18next';
import { BrandLockup } from '@/components/brand/BrandLockup';
import { Container } from '@/components/common/Container';
import { scrollToPageTop } from '@/utils/scroll';

const STUDIO_URL = 'http://weisezahoy.com/';

export function Footer() {
  const { t } = useTranslation();
  const year = new Date().getFullYear();

  return (
    <footer className="relative z-10 mt-16 border-t border-line">
      <Container className="py-12 sm:py-16">
        <div className="flex flex-col gap-10 md:flex-row md:items-start md:justify-between">
          <div className="max-w-md">
            <BrandLockup to="/" size="md" />
            <p className="mt-4 text-sm leading-relaxed text-muted">{t('footer.tagline')}</p>
          </div>

          <nav className="flex flex-wrap gap-x-5 gap-y-3 text-sm font-semibold">
            <Link
              to="/"
              onClick={() => scrollToPageTop()}
              className="focus-ring rounded-md text-ink hover:text-accent"
            >
              {t('nav.home')}
            </Link>
            <Link to="/books" className="focus-ring rounded-md text-ink hover:text-accent">
              {t('nav.books')}
            </Link>
            <Link to="/about" className="focus-ring rounded-md text-ink hover:text-accent">
              {t('nav.about')}
            </Link>
            <Link to="/contact" className="focus-ring rounded-md text-ink hover:text-accent">
              {t('nav.contact')}
            </Link>
            <Link to="/privacy" className="focus-ring rounded-md text-ink hover:text-accent">
              {t('nav.privacy')}
            </Link>
          </nav>
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
