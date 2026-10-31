import { Link } from 'react-router-dom';
import { Trans, useTranslation } from 'react-i18next';
import { BrandLockup } from '@/components/brand/BrandLockup';
import { Container } from '@/components/common/Container';
import { Scene } from '@/components/scene/Scene';
import { ADMIN_EMAIL, PARTNER_EMAIL } from '@/config/contact';
import { useAuth } from '@/hooks/useAuth';
import { scrollToPageTop } from '@/utils/scroll';

const STUDIO_URL = 'http://weisezahoy.com/';

const linkClass = 'focus-ring rounded-md text-ink/80 transition hover:text-accent';

export function Footer() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const year = new Date().getFullYear();
  const goalsTo = user ? '/goals' : '/login?next=/goals';

  return (
    <footer className="relative isolate z-10 mt-20 overflow-hidden pb-[env(safe-area-inset-bottom)]">
      <Scene name="botanical" shade="soft" className="opacity-70" />
      <Container className="relative pt-4 pb-10 sm:pb-14">
        <div className="hairline mb-12 sm:mb-16" />
        <div className="flex flex-col gap-12 lg:flex-row lg:items-start lg:justify-between">
          <div className="max-w-md">
            <BrandLockup to="/" size="md" />
            <p className="mt-6 font-display text-[1.75rem] leading-snug font-normal tracking-tight text-ink/90 italic sm:text-[2rem]">
              {t('footer.tagline')}
            </p>
          </div>

          <div className="flex flex-col gap-10 md:flex-row md:gap-12 lg:gap-16">
            <nav className="grid grid-cols-2 gap-x-6 gap-y-3.5 text-sm font-medium sm:grid-cols-3 md:grid-cols-2 lg:flex lg:flex-col lg:gap-2.5">
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

            <div>
              <p className="text-[11px] font-bold tracking-[0.24em] text-accent uppercase">{t('nav.contact')}</p>
              <ul className="mt-4 space-y-4 text-sm">
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

        <div className="mt-14 flex flex-col gap-2 border-t border-line pt-6 text-xs leading-relaxed text-muted sm:flex-row sm:items-center sm:justify-between">
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
