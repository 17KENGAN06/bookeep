import { Outlet } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { AmbientBackdrop } from '@/components/layout/AmbientBackdrop';
import { Footer } from '@/components/layout/Footer';
import { Header } from '@/components/layout/Header';

export function PublicLayout() {
  const { t } = useTranslation();

  return (
    <div className="relative flex min-h-dvh flex-col overflow-x-hidden">
      <AmbientBackdrop />
      <a href="#main-content" className="skip-link">
        {t('common.skipToContent')}
      </a>
      <Header />
      <main id="main-content" className="relative z-10 flex-1" tabIndex={-1}>
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}
