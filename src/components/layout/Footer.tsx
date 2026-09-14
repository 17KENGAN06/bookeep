import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { BrandLockup } from '@/components/brand/BrandLockup';
import { Container } from '@/components/common/Container';

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
            <Link to="/" className="focus-ring rounded-md text-ink hover:text-accent">
              {t('nav.home')}
            </Link>
            <Link to="/books" className="focus-ring rounded-md text-ink hover:text-accent">
              {t('nav.books')}
            </Link>
            <Link to="/about" className="focus-ring rounded-md text-ink hover:text-accent">
              {t('nav.about')}
            </Link>
            <Link to="/how-it-works" className="focus-ring rounded-md text-ink hover:text-accent">
              {t('nav.howItWorks')}
            </Link>
          </nav>
        </div>

        <p className="mt-10 text-xs leading-relaxed text-muted">
          © {year} {t('common.appName')}. {t('footer.rights')}
        </p>
      </Container>
    </footer>
  );
}
