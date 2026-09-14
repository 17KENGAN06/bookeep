import { Outlet } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { BrandLockup } from '@/components/brand/BrandLockup';
import { Button } from '@/components/common/Button';
import { LanguageSwitcher } from '@/components/layout/LanguageSwitcher';
import { ThemeToggle } from '@/components/layout/ThemeToggle';
import { useAuth } from '@/hooks/useAuth';

export function AdminLayout() {
  const { t } = useTranslation();
  const { signOut, user } = useAuth();

  return (
    <div className="min-h-dvh bg-bg">
      <header className="border-b border-line bg-surface/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-[1360px] flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-6">
          <BrandLockup to="/admin" size="sm" />
          <div className="flex min-w-0 flex-wrap items-center justify-end gap-2">
            <p className="hidden max-w-[12rem] truncate text-xs text-muted sm:block">{user?.email}</p>
            <ThemeToggle />
            <LanguageSwitcher className="max-sm:order-3 max-sm:w-full max-sm:justify-center" />
            <Button
              type="button"
              variant="secondary"
              className="min-h-10 px-3 text-xs"
              onClick={() => {
                void signOut();
              }}
            >
              {t('admin.logout')}
            </Button>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-[1360px] px-4 py-8 sm:px-6 sm:py-10">
        <Outlet />
      </main>
    </div>
  );
}
