export const AUTH_NEXT_KEY = 'bookeep_auth_next';

export function safeNextPath(value: string | null | undefined) {
  if (!value || !value.startsWith('/') || value.startsWith('//')) return '/library';
  if (value.startsWith('/login') || value.startsWith('/register') || value.startsWith('/auth/')) {
    return '/library';
  }
  return value;
}

export function setAuthNext(path: string) {
  sessionStorage.setItem(AUTH_NEXT_KEY, safeNextPath(path));
}

export function takeAuthNext() {
  const next = sessionStorage.getItem(AUTH_NEXT_KEY);
  sessionStorage.removeItem(AUTH_NEXT_KEY);
  return safeNextPath(next);
}

export function authRedirectTo() {
  return `${window.location.origin}/auth/callback`;
}
