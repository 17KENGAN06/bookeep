import { BrowserRouter } from 'react-router-dom';
import { ScrollToTop } from '@/components/layout/ScrollToTop';
import { ToastProvider } from '@/components/common/Toast';
import { AuthProvider } from '@/hooks/AuthProvider';
import { ThemeProvider } from '@/hooks/ThemeProvider';
import { LibraryProvider } from '@/hooks/useLibrary';
import { AppRoutes } from '@/routes/AppRoutes';

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <LibraryProvider>
          <ToastProvider>
            <BrowserRouter>
              <ScrollToTop />
              <AppRoutes />
            </BrowserRouter>
          </ToastProvider>
        </LibraryProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
