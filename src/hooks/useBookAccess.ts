import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { fetchHasSubscription } from '@/services/access';
import { isSupabaseConfigured } from '@/config/env';

export type BookAccess = {
  /** False until the subscription check has answered. */
  ready: boolean;
  /** Full books and downloads: admins and active subscribers. */
  hasFullAccess: boolean;
  isGuest: boolean;
};

// One check per signed-in user per page load.
const checks = new Map<string, Promise<boolean>>();

function checkFor(userId: string) {
  let request = checks.get(userId);
  if (!request) {
    request = fetchHasSubscription().catch((error: unknown) => {
      console.warn('Subscription check failed', error);
      checks.delete(userId);
      return false;
    });
    checks.set(userId, request);
  }
  return request;
}

export function forgetBookAccess() {
  checks.clear();
}

export function useBookAccess(): BookAccess {
  const { user, isLoading } = useAuth();
  const userId = user?.id ?? null;
  const openCatalog = !isSupabaseConfigured();
  const [result, setResult] = useState<{ userId: string; hasFullAccess: boolean } | null>(null);

  useEffect(() => {
    if (!userId) return;
    let active = true;
    void checkFor(userId).then((hasFullAccess) => {
      if (active) setResult({ userId, hasFullAccess });
    });
    return () => {
      active = false;
    };
  }, [userId]);

  if (openCatalog) return { ready: true, hasFullAccess: true, isGuest: false };
  if (isLoading) return { ready: false, hasFullAccess: false, isGuest: false };
  if (!userId) return { ready: true, hasFullAccess: false, isGuest: true };
  if (result?.userId !== userId) return { ready: false, hasFullAccess: false, isGuest: false };
  return { ready: true, hasFullAccess: result.hasFullAccess, isGuest: false };
}
