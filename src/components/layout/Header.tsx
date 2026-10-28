import { useEffect, useRef, useState } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import { Menu, Target, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { BrandLockup } from '@/components/brand/BrandLockup';
import { Container } from '@/components/common/Container';
import { LanguageSwitcher } from '@/components/layout/LanguageSwitcher';
import { ThemeToggle } from '@/components/layout/ThemeToggle';
import { useAuth } from '@/hooks/useAuth';
import { cn } from '@/utils/cn';
import { scrollToPageTop } from '@/utils/scroll';

const links = [
  { to: '/', key: 'nav.home' },
  { to: '/books', key: 'nav.books' },
  { to: '/library', key: 'nav.library' },
  { to: '/about', key: 'nav.about' },
  { to: '/contact', key: 'nav.contact' },
] as const;

export function Header() {
  const { t } = useTranslation();
  const location = useLocation();
  const { user, signOut, isLoading } = useAuth();
  const [open, setOpen] = useState(false);
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    if (!open) return;

    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setOpen(false);
        menuButtonRef.current?.focus();
      }
    };

    document.body.style.overflow = 'hidden';
    document.addEventListener('keydown', onKey);

    const firstLink = panelRef.current?.querySelector<HTMLElement>('a, button');
    firstLink?.focus();

    return () => {
      document.body.style.overflow = '';
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  const goalsTo = user ? '/goals' : '/login?next=/goals';
  const accountClassName =
    'focus-ring hidden min-h-10 items-center rounded-xl px-3 text-sm font-semibold whitespace-nowrap text-muted transition hover:bg-surface hover:text-ink xl:inline-flex';

  return (
    <header className="sticky top-0 z-40 border-b border-line/80 bg-bg/80 backdrop-blur-md">
      <Container className="flex h-16 items-center justify-between gap-3 sm:h-[4.25rem]">
        <BrandLockup size="md" className="shrink-0" />

        <nav className="hidden min-w-0 items-center gap-1 xl:flex" aria-label={t('nav.primary')}>
          {links.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              end={link.to === '/'}
              onClick={() => {
                if (link.to === '/') scrollToPageTop();
              }}
              className={({ isActive }) =>
                cn(
                  'focus-ring inline-flex min-h-10 items-center rounded-xl px-3 text-sm font-semibold whitespace-nowrap transition',
                  isActive ? 'bg-surface-2 text-ink' : 'text-muted hover:bg-surface hover:text-ink',
                )
              }
            >
              {t(link.key)}
            </NavLink>
          ))}
        </nav>

        <div className="flex shrink-0 items-center gap-2">
          <Link
            to={goalsTo}
            aria-label={t('nav.goals')}
            className="focus-ring inline-flex h-11 min-w-11 items-center justify-center gap-2 rounded-xl bg-accent px-3 text-sm font-semibold whitespace-nowrap text-on-accent transition hover:bg-accent-hover sm:h-10 sm:min-w-0"
          >
            <Target className="h-5 w-5 shrink-0 sm:h-4 sm:w-4" aria-hidden />
            <span className="hidden sm:inline">{t('nav.goals')}</span>
          </Link>
          <ThemeToggle />
          <div className="hidden xl:block">
            <LanguageSwitcher />
          </div>
          {!isLoading ? (
            user ? (
              <button type="button" className={accountClassName} onClick={() => void signOut()}>
                {t('auth.signOut')}
              </button>
            ) : (
              <Link to="/login" className={accountClassName}>
                {t('nav.login')}
              </Link>
            )
          ) : null}
          <button
            ref={menuButtonRef}
            type="button"
            className="focus-ring inline-flex h-11 w-11 items-center justify-center rounded-xl border border-line bg-surface text-ink xl:hidden"
            aria-expanded={open}
            aria-controls="mobile-nav"
            aria-haspopup="true"
            aria-label={open ? t('common.closeMenu') : t('common.openMenu')}
            onClick={() => setOpen((value) => !value)}
          >
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </Container>

      {open ? (
        <div
          ref={panelRef}
          id="mobile-nav"
          className="border-t border-line bg-bg/95 px-4 py-4 backdrop-blur-md xl:hidden"
        >
          <nav className="flex flex-col gap-1 sm:grid sm:grid-cols-2 sm:gap-2" aria-label={t('nav.primary')}>
            {links.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                onClick={() => {
                  setOpen(false);
                  if (link.to === '/') scrollToPageTop();
                }}
                className="focus-ring rounded-xl px-3 py-3 text-base font-semibold text-ink hover:bg-surface-2"
              >
                {t(link.key)}
              </Link>
            ))}
            <Link
              to={goalsTo}
              onClick={() => setOpen(false)}
              className="focus-ring rounded-xl bg-accent px-3 py-3 text-base font-semibold text-on-accent"
            >
              {t('nav.goals')}
            </Link>
            {!isLoading && user ? (
              <button
                type="button"
                className="focus-ring rounded-xl px-3 py-3 text-left text-base font-semibold text-ink hover:bg-surface-2"
                onClick={() => {
                  setOpen(false);
                  void signOut();
                }}
              >
                {t('auth.signOut')}
              </button>
            ) : !isLoading ? (
              <Link
                to="/login"
                onClick={() => setOpen(false)}
                className="focus-ring rounded-xl px-3 py-3 text-base font-semibold text-ink hover:bg-surface-2"
              >
                {t('nav.login')}
              </Link>
            ) : null}
          </nav>
          <div className="mt-4">
            <LanguageSwitcher />
          </div>
        </div>
      ) : null}
    </header>
  );
}
