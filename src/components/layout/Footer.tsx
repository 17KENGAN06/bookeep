import { Link } from 'react-router-dom';
import { Trans, useTranslation } from 'react-i18next';
import { BrandLockup } from '@/components/brand/BrandLockup';
import { Container } from '@/components/common/Container';
import { Scene } from '@/components/scene/Scene';
import { ADMIN_EMAIL, CONTACT_EMAIL } from '@/config/contact';
import { useAuth } from '@/hooks/useAuth';
import { scrollToPageTop } from '@/utils/scroll';

const STUDIO_URL = 'http://weisezahoy.com/';

const linkClass = 'focus-ring rounded-md text-muted transition-colors duration-200 hover:text-ink';

export function Footer() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const year = new Date().getFullYear();
  const goalsTo = user ? '/goals' : '/login?next=/goals';

  return (
    <footer className="site-footer relative isolate z-10 mt-24 overflow-hidden pb-[env(safe-area-inset-bottom)]">
      <Scene name="botanical" shade="soft" className="opacity-70" />
      <Container className="relative pt-14 pb-10 sm:pt-20 sm:pb-12">
        <div className="flex flex-col gap-12 lg:flex-row lg:items-start lg:justify-between">
          <div className="max-w-md tabp:max-w-xl">
            <BrandLockup to="/" size="md" />
            <p className="mt-8 font-display text-[1.75rem] leading-[1.15] font-semibold tracking-[-0.03em] text-ink sm:text-[2.25rem]">
              {t('footer.tagline')}
            </p>
          </div>

          <div className="flex flex-col gap-10 md:flex-row md:gap-12 lg:gap-16 tabp:justify-between">
            <div className="min-w-0 tabp:flex-1">
            <p className="footer-label">{t('common.appName')}</p>
            <nav aria-label={t('nav.primary')} className="mt-5 grid grid-cols-2 gap-x-6 gap-y-3 text-sm font-medium sm:grid-cols-3 md:grid-cols-2 lg:flex lg:flex-col lg:gap-3 tabp:grid tabp:content-start tabp:grid-cols-3 tabp:gap-x-10 tabp:gap-y-3">
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
            </div>

            <div>
              <p className="footer-label">{t('nav.contact')}</p>
              <ul className="mt-5 space-y-4 text-sm">
                <li>
                  <p className="text-xs text-muted">{t('contact.channels.support.title')}</p>
                  <a className={`${linkClass} mt-0.5 inline-flex font-semibold`} href={`mailto:${CONTACT_EMAIL}`}>
                    {CONTACT_EMAIL}
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

        <div className="mt-16 flex flex-col gap-2 border-t border-line pt-6 text-xs leading-relaxed text-muted sm:flex-row sm:items-center sm:justify-between">
          <p>© {year} {t('common.appName')}</p>
          <p>
            <Trans
              i18nKey="footer.credit"
              components={{
                studio: (
                  <a
                    className="text-link"
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
