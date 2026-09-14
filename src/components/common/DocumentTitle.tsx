import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useLocation } from 'react-router-dom';
import { absoluteUrl, ogLocale, truncateMeta } from '@/config/site';

type DocumentTitleProps = {
  title?: string;
  description?: string;
  image?: string | null;
  noindex?: boolean;
};

function setMeta(attr: 'name' | 'property', key: string, content: string) {
  const selector = `meta[${attr}="${key}"]`;
  let el = document.head.querySelector(selector);
  if (!el) {
    el = document.createElement('meta');
    el.setAttribute(attr, key);
    document.head.appendChild(el);
  }
  el.setAttribute('content', content);
}

function setCanonical(href: string) {
  let el = document.head.querySelector('link[rel="canonical"]');
  if (!el) {
    el = document.createElement('link');
    el.setAttribute('rel', 'canonical');
    document.head.appendChild(el);
  }
  el.setAttribute('href', href);
}

export function DocumentTitle({ title, description, image, noindex = false }: DocumentTitleProps) {
  const { t, i18n } = useTranslation();
  const { pathname } = useLocation();
  const appName = t('common.appName');
  const language = i18n.resolvedLanguage ?? 'en';

  useEffect(() => {
    const pageTitle = title ? `${title} · ${appName}` : t('seo.title');
    const pageDescription = truncateMeta(description?.trim() || t('seo.description'));
    const canonical = absoluteUrl(pathname);
    const shareImage = image?.startsWith('http') ? image : absoluteUrl(image || '/favicon.png');
    const robots = noindex ? 'noindex,nofollow' : 'index,follow';

    document.title = pageTitle;
    document.documentElement.lang = language;

    setMeta('name', 'description', pageDescription);
    setMeta('name', 'keywords', t('seo.keywords'));
    setMeta('name', 'robots', robots);
    setCanonical(canonical);

    setMeta('property', 'og:type', 'website');
    setMeta('property', 'og:site_name', appName);
    setMeta('property', 'og:title', pageTitle);
    setMeta('property', 'og:description', pageDescription);
    setMeta('property', 'og:url', canonical);
    setMeta('property', 'og:image', shareImage);
    setMeta('property', 'og:locale', ogLocale(language));

    setMeta('name', 'twitter:card', image?.startsWith('http') ? 'summary_large_image' : 'summary');
    setMeta('name', 'twitter:title', pageTitle);
    setMeta('name', 'twitter:description', pageDescription);
    setMeta('name', 'twitter:image', shareImage);
  }, [appName, description, image, language, noindex, pathname, t, title]);

  return null;
}
