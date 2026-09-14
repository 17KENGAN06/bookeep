import { Navigate, Route, Routes } from 'react-router-dom';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { PublicLayout } from '@/components/layout/PublicLayout';
import { AboutPage } from '@/pages/AboutPage';
import { AdminBookFormPage } from '@/pages/admin/AdminBookFormPage';
import { AdminDashboardPage } from '@/pages/admin/AdminDashboardPage';
import { AdminLoginPage } from '@/pages/admin/AdminLoginPage';
import { BookDetailsPage } from '@/pages/BookDetailsPage';
import { BooksPage } from '@/pages/BooksPage';
import { HomePage } from '@/pages/HomePage';
import { NotFoundPage } from '@/pages/NotFoundPage';
import { ReaderPage } from '@/pages/ReaderPage';
import { ProtectedAdminRoute } from '@/routes/ProtectedAdminRoute';

export function AppRoutes() {
  return (
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
        <Route path="/how-it-works" element={<Navigate to="/about" replace />} />
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  );
}
