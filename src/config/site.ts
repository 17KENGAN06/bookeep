const OG_LOCALES: Record<string, string> = {
  en: 'en_US',
  fi: 'fi_FI',
  uk: 'uk_UA',
  ru: 'ru_RU',
};

export function getSiteUrl() {
  const fromEnv = (import.meta.env.VITE_SITE_URL ?? '').trim().replace(/\/$/, '');
  if (fromEnv) return fromEnv;
  if (typeof window !== 'undefined') return window.location.origin;
  return '';
}

export function absoluteUrl(path = '/') {
  const origin = getSiteUrl();
  const normalized = path.startsWith('/') ? path : `/${path}`;
  if (!origin) return normalized;
  return `${origin}${normalized === '/' ? '/' : normalized}`;
}

export function ogLocale(language?: string) {
  return OG_LOCALES[language ?? ''] ?? OG_LOCALES.en;
}

export function truncateMeta(text: string, max = 180) {
  const compact = text.replace(/\s+/g, ' ').trim();
  if (compact.length <= max) return compact;
  return `${compact.slice(0, max - 1).trimEnd()}…`;
}
