import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { authPathFor } from '@/utils/auth';

/** Reading needs an account (the demo too): guests go to sign-up/log-in and come back here. */
export function RequireAuth() {
  const { user, isLoading, isConfigured } = useAuth();
  const location = useLocation();

  // Local preview without Supabase has no accounts at all.
  if (!isConfigured) return <Outlet />;

  if (isLoading) {
    return <div className="min-h-dvh bg-bg" />;
  }

  if (!user) {
    return <Navigate to={authPathFor(`${location.pathname}${location.search}`, 'read')} replace />;
  }

  return <Outlet />;
}
