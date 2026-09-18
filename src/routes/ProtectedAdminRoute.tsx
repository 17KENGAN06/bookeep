import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';

export function ProtectedAdminRoute() {
  const { user, isLoading, isConfigured, isAdmin, adminReady } = useAuth();
  const location = useLocation();

  if (!isConfigured) {
    return <Navigate to="/admin/login" replace />;
  }

  if (isLoading) {
    return <div className="min-h-dvh bg-bg" />;
  }

  if (!user) {
    return <Navigate to="/admin/login" replace state={{ from: location.pathname }} />;
  }

  if (!adminReady && !isAdmin) {
    return <div className="min-h-dvh bg-bg" />;
  }

  if (!isAdmin) {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
}
