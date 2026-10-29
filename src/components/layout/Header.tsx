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
    'focus-ring hidden min-h-10 items-center rounded-full px-3.5 text-sm font-semibold whitespace-nowrap text-muted transition hover:text-ink xl:inline-flex';

  return (
    <header className="sticky top-0 z-40 pt-[max(0.5rem,env(safe-area-inset-top))] sm:pt-3">
      <Container>
        <div className="glass-card flex h-14 items-center justify-between gap-3 rounded-full pr-1.5 pl-4 sm:h-16 sm:pr-2 sm:pl-5">
          <BrandLockup size="md" className="shrink-0" />

          <nav className="hidden min-w-0 items-center gap-0.5 xl:flex" aria-label={t('nav.primary')}>
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
                    'focus-ring relative inline-flex min-h-10 items-center rounded-full px-3.5 text-sm font-semibold whitespace-nowrap transition',
                    isActive
                      ? 'text-ink after:absolute after:inset-x-3.5 after:bottom-1.5 after:h-px after:bg-gold'
                      : 'text-muted hover:text-ink',
                  )
                }
              >
                {t(link.key)}
              </NavLink>
            ))}
          </nav>

          <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
            <Link
              to={goalsTo}
              aria-label={t('nav.goals')}
              className="btn btn-primary btn-sm hidden !min-h-10 sm:inline-flex"
            >
              <Target className="h-4 w-4 shrink-0" aria-hidden />
              <span>{t('nav.goals')}</span>
            </Link>
            <Link to={goalsTo} aria-label={t('nav.goals')} className="icon-btn sm:hidden">
              <Target className="h-[18px] w-[18px]" aria-hidden />
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
              className="icon-btn xl:hidden"
              aria-expanded={open}
              aria-controls="mobile-nav"
              aria-haspopup="true"
              aria-label={open ? t('common.closeMenu') : t('common.openMenu')}
              onClick={() => setOpen((value) => !value)}
            >
              {open ? <X className="h-[18px] w-[18px]" /> : <Menu className="h-[18px] w-[18px]" />}
            </button>
          </div>
        </div>
      </Container>

      {open ? (
        <div
          ref={panelRef}
          id="mobile-nav"
          className="menu-sheet fixed inset-x-0 top-[calc(max(0.5rem,env(safe-area-inset-top))+4rem)] bottom-0 z-40 overflow-y-auto px-4 pt-2 pb-[max(1.5rem,env(safe-area-inset-bottom))] sm:top-[5.25rem] xl:hidden"
        >
          <div className="lux-panel mx-auto max-w-xl rounded-[2rem] p-3 sm:p-4">
            <nav className="flex flex-col" aria-label={t('nav.primary')}>
              {links.map((link) => {
                const active = link.to === '/' ? location.pathname === '/' : location.pathname.startsWith(link.to);
                return (
                  <Link
                    key={link.to}
                    to={link.to}
                    onClick={() => {
                      setOpen(false);
                      if (link.to === '/') scrollToPageTop();
                    }}
                    aria-current={active ? 'page' : undefined}
                    className={cn(
                      'focus-ring flex items-center justify-between rounded-2xl px-4 py-3.5 font-display text-[1.375rem] font-medium tracking-tight transition',
                      active ? 'bg-surface-2 text-ink' : 'text-ink/85 hover:bg-surface-2/70',
                    )}
                  >
                    {t(link.key)}
                    {active ? <span className="h-1.5 w-1.5 rounded-full bg-gold" aria-hidden /> : null}
                  </Link>
                );
              })}
            </nav>
            <div className="hairline my-3" />
            <div className="flex flex-col gap-2 px-1 pb-1 sm:flex-row">
              <Link to={goalsTo} onClick={() => setOpen(false)} className="btn btn-primary w-full sm:flex-1">
                <Target className="h-4 w-4" aria-hidden />
                {t('nav.goals')}
              </Link>
              {!isLoading && user ? (
                <button
                  type="button"
                  className="btn btn-secondary w-full sm:flex-1"
                  onClick={() => {
                    setOpen(false);
                    void signOut();
                  }}
                >
                  {t('auth.signOut')}
                </button>
              ) : !isLoading ? (
                <Link to="/login" onClick={() => setOpen(false)} className="btn btn-secondary w-full sm:flex-1">
                  {t('nav.login')}
                </Link>
              ) : null}
            </div>
            <div className="mt-3 flex justify-center px-1 pb-1">
              <LanguageSwitcher />
            </div>
          </div>
        </div>
      ) : null}
    </header>
  );
}
