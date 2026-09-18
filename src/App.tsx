import { BrowserRouter } from 'react-router-dom';
import { ScrollToTop } from '@/components/layout/ScrollToTop';
import { ToastProvider } from '@/components/common/Toast';
import { GoalCompletedToast } from '@/components/goals/GoalCompletedToast';
import { AuthProvider } from '@/hooks/AuthProvider';
import { ThemeProvider } from '@/hooks/ThemeProvider';
import { LibraryProvider } from '@/hooks/useLibrary';
import { ReadingProgressProvider } from '@/hooks/useReadingProgress';
import { AppRoutes } from '@/routes/AppRoutes';

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <LibraryProvider>
          <ReadingProgressProvider>
            <ToastProvider>
              <BrowserRouter>
                <ScrollToTop />
                <AppRoutes />
                <GoalCompletedToast />
              </BrowserRouter>
            </ToastProvider>
          </ReadingProgressProvider>
        </LibraryProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
