import { useEffect, useRef, useState } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import { Menu, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { BrandLockup } from '@/components/brand/BrandLockup';
import { Container } from '@/components/common/Container';
import { LanguageSwitcher } from '@/components/layout/LanguageSwitcher';
import { ThemeToggle } from '@/components/layout/ThemeToggle';
import { cn } from '@/utils/cn';
import { scrollToPageTop } from '@/utils/scroll';

const links = [
  { to: '/', key: 'nav.home' },
  { to: '/books', key: 'nav.books' },
  { to: '/about', key: 'nav.about' },
  { to: '/contact', key: 'nav.contact' },
] as const;

export function Header() {
  const { t } = useTranslation();
  const location = useLocation();
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

  return (
    <header className="sticky top-0 z-40 border-b border-line/80 bg-bg/80 backdrop-blur-md">
      <Container className="flex h-16 items-center justify-between gap-3 sm:h-[4.25rem]">
        <BrandLockup size="md" className="min-w-0 max-w-[58%]" />

        <nav className="hidden items-center gap-1 lg:flex" aria-label={t('nav.primary')}>
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
                  'focus-ring inline-flex min-h-10 items-center rounded-xl px-3 text-sm font-semibold transition',
                  isActive ? 'bg-surface-2 text-ink' : 'text-muted hover:bg-surface hover:text-ink',
                )
              }
            >
              {t(link.key)}
            </NavLink>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <ThemeToggle />
          <div className="hidden lg:block">
            <LanguageSwitcher />
          </div>
          <button
            ref={menuButtonRef}
            type="button"
            className="focus-ring inline-flex h-11 w-11 items-center justify-center rounded-xl border border-line bg-surface text-ink lg:hidden"
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
          className="border-t border-line bg-bg/95 px-4 py-4 backdrop-blur-md lg:hidden"
        >
          <nav className="flex flex-col gap-1" aria-label={t('nav.primary')}>
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
          </nav>
          <div className="mt-4">
            <LanguageSwitcher />
          </div>
        </div>
      ) : null}
    </header>
  );
}
