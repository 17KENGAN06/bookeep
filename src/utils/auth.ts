import { HAS_ACCOUNT_STORAGE_KEY } from '@/config/storage';

export const AUTH_NEXT_KEY = 'bookeep_auth_next';

export function safeNextPath(value: string | null | undefined) {
  if (!value || !value.startsWith('/') || value.startsWith('//')) return '/library';
  if (value.startsWith('/login') || value.startsWith('/register') || value.startsWith('/auth/')) {
    return '/library';
  }
  return value;
}

// localStorage, not sessionStorage: the confirmation link from the sign-up email
// usually opens in a new tab, and the reader should still land on the book.
export function setAuthNext(path: string) {
  try {
    localStorage.setItem(AUTH_NEXT_KEY, safeNextPath(path));
  } catch {
    // private mode: the callback falls back to the library
  }
}

export function takeAuthNext() {
  let next: string | null = null;
  try {
    next = localStorage.getItem(AUTH_NEXT_KEY);
    localStorage.removeItem(AUTH_NEXT_KEY);
  } catch {
    // ignore
  }
  return safeNextPath(next);
}

export function authRedirectTo() {
  return `${window.location.origin}/auth/callback`;
}

export function rememberHasAccount() {
  try {
    localStorage.setItem(HAS_ACCOUNT_STORAGE_KEY, '1');
  } catch {
    // ignore
  }
}

function hasAccountOnDevice() {
  try {
    return localStorage.getItem(HAS_ACCOUNT_STORAGE_KEY) === '1';
  } catch {
    return false;
  }
}

/**
 * Where a guest goes to start reading: sign-up for new visitors, log-in for people
 * who have signed in on this device before. Both pages link to each other and keep `next`.
 */
export function authPathFor(next: string, reason?: 'read') {
  const base = hasAccountOnDevice() ? '/login' : '/register';
  const params = new URLSearchParams({ next: safeNextPath(next) });
  if (reason) params.set('reason', reason);
  return `${base}?${params.toString()}`;
}
