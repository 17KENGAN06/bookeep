import { Suspense } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { PublicLayout } from '@/components/layout/PublicLayout';
import { AboutPage } from '@/pages/AboutPage';
import { AuthCallbackPage } from '@/pages/AuthCallbackPage';
import { BookDetailsPage } from '@/pages/BookDetailsPage';
import { BooksPage } from '@/pages/BooksPage';
import { ContactPage } from '@/pages/ContactPage';
import { HomePage } from '@/pages/HomePage';
import { LibraryPage } from '@/pages/LibraryPage';
import { LoginPage } from '@/pages/LoginPage';
import { NotFoundPage } from '@/pages/NotFoundPage';
import { PrivacyPage } from '@/pages/PrivacyPage';
import { ReadingGoalsPage } from '@/pages/ReadingGoalsPage';
import { RegisterPage } from '@/pages/RegisterPage';
import { lazyPage, loadReaderPage } from '@/routes/lazyPage';
import { ProtectedAdminRoute } from '@/routes/ProtectedAdminRoute';

const AdminLayout = lazyPage(() => import('@/components/admin/AdminLayout').then((module) => module.AdminLayout));
const AdminBookFormPage = lazyPage(() => import('@/pages/admin/AdminBookFormPage').then((module) => module.AdminBookFormPage));
const AdminDashboardPage = lazyPage(() => import('@/pages/admin/AdminDashboardPage').then((module) => module.AdminDashboardPage));
const AdminLoginPage = lazyPage(() => import('@/pages/admin/AdminLoginPage').then((module) => module.AdminLoginPage));
const ReaderPage = lazyPage(loadReaderPage);

function PageFallback() {
  return <div className="min-h-dvh bg-bg" />;
}

export function AppRoutes() {
  return (
    <Suspense fallback={<PageFallback />}>
      <Routes>
        <Route path="/admin/login" element={<AdminLoginPage />} />
        <Route element={<ProtectedAdminRoute />}>
          <Route element={<AdminLayout />}>
            <Route path="/admin" element={<AdminDashboardPage />} />
            <Route path="/admin/books/new" element={<AdminBookFormPage />} />
            <Route path="/admin/books/:id/edit" element={<AdminBookFormPage />} />
          </Route>
        </Route>

        <Route path="/read/:slug" element={<ReaderPage />} />

        <Route element={<PublicLayout />}>
          <Route path="/" element={<HomePage />} />
          <Route path="/books" element={<BooksPage />} />
          <Route path="/books/:slug" element={<BookDetailsPage />} />
          <Route path="/about" element={<AboutPage />} />
          <Route path="/contact" element={<ContactPage />} />
          <Route path="/privacy" element={<PrivacyPage />} />
          <Route path="/library" element={<LibraryPage />} />
          <Route path="/goals" element={<ReadingGoalsPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/auth/callback" element={<AuthCallbackPage />} />
          <Route path="/how-it-works" element={<Navigate to="/about" replace />} />
          <Route path="*" element={<NotFoundPage />} />
        </Route>
      </Routes>
    </Suspense>
  );
}
