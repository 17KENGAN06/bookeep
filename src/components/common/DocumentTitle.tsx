import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useLocation } from 'react-router-dom';
import { getSiteUrl } from '@/config/site';
import {
  bookJsonLd,
  bookSeoText,
  hreflangAlternates,
  localizedUrl,
  OG_IMAGE_PATH,
  OG_IMAGE_SIZE,
  OG_LOCALES,
  pageKeyForPath,
  SEO_COPY,
  SEO_LANGUAGES,
  SITE_NAME,
  toSeoLanguage,
  truncateMeta,
  type SeoBook,
} from '@/seo/shared';

type DocumentTitleProps = {
  title?: string;
  description?: string;
  image?: string | null;
  noindex?: boolean;
  /** On a book page: gives it the book title template and Book structured data. */
  book?: SeoBook;
};

function setMeta(attr: 'name' | 'property', key: string, content: string | null) {
  const selector = `meta[${attr}="${key}"]`;
  let el = document.head.querySelector(selector);
  if (content === null) {
    el?.remove();
    return;
  }
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

function setAlternates(links: { hreflang: string; href: string }[]) {
  document.head.querySelectorAll('link[rel="alternate"][hreflang]').forEach((el) => el.remove());
  for (const link of links) {
    const el = document.createElement('link');
    el.setAttribute('rel', 'alternate');
    el.setAttribute('hreflang', link.hreflang);
    el.setAttribute('href', link.href);
    document.head.appendChild(el);
  }
}

function setOgLocales(language: keyof typeof OG_LOCALES) {
  setMeta('property', 'og:locale', OG_LOCALES[language]);
  document.head.querySelectorAll('meta[property="og:locale:alternate"]').forEach((el) => el.remove());
  for (const other of SEO_LANGUAGES) {
    if (other === language) continue;
    const el = document.createElement('meta');
    el.setAttribute('property', 'og:locale:alternate');
    el.setAttribute('content', OG_LOCALES[other]);
    document.head.appendChild(el);
  }
}

/**
 * Page structured data is tagged with the path it belongs to. The prerendered copy of the
 * page the visitor landed on is kept; anything left over from another route is removed.
 */
function setPageJsonLd(pathname: string, data: object | null) {
  document.head.querySelectorAll('script[data-seo-page]').forEach((el) => {
    if (data || el.getAttribute('data-seo-page') !== pathname) el.remove();
  });
  if (!data) return;
  const el = document.createElement('script');
  el.type = 'application/ld+json';
  el.setAttribute('data-seo-page', pathname);
  el.textContent = JSON.stringify(data);
  document.head.appendChild(el);
}

export function DocumentTitle({ title, description, image, noindex = false, book }: DocumentTitleProps) {
  const { i18n } = useTranslation();
  const { pathname } = useLocation();
  const language = toSeoLanguage(i18n.resolvedLanguage);
  const bookKey = book ? JSON.stringify(book) : '';

  useEffect(() => {
    const origin = getSiteUrl();
    const copy = SEO_COPY[language];
    const pageKey = noindex ? null : pageKeyForPath(pathname);
    const seoBook = bookKey ? (JSON.parse(bookKey) as SeoBook) : null;

    let pageTitle: string;
    let pageDescription: string;
    if (pageKey) {
      pageTitle = copy.pages[pageKey].title;
      pageDescription = copy.pages[pageKey].description;
    } else if (seoBook && !noindex) {
      const text = bookSeoText(seoBook, language);
      pageTitle = text.title;
      pageDescription = text.description;
    } else {
      pageTitle = title ? `${title} · ${SITE_NAME}` : copy.pages.home.title;
      pageDescription = truncateMeta(description?.trim() || copy.pages.home.description);
    }

    const canonical = noindex ? `${origin}${pathname}` : localizedUrl(origin, pathname, language);
    const ownImage = image?.startsWith('http') ? image : null;
    const shareImage = ownImage ?? `${origin}${OG_IMAGE_PATH}`;

    document.title = pageTitle;
    document.documentElement.lang = language;

    setMeta('name', 'description', pageDescription);
    setMeta('name', 'keywords', copy.keywords);
    setMeta('name', 'robots', noindex ? 'noindex,nofollow' : 'index,follow,max-image-preview:large');
    setCanonical(canonical);
    setAlternates(noindex ? [] : hreflangAlternates(origin, pathname));

    setMeta('property', 'og:type', seoBook ? 'book' : 'website');
    setMeta('property', 'og:site_name', SITE_NAME);
    setMeta('property', 'og:title', pageTitle);
    setMeta('property', 'og:description', pageDescription);
    setMeta('property', 'og:url', canonical);
    setMeta('property', 'og:image', shareImage);
    setMeta('property', 'og:image:alt', pageTitle);
    setMeta('property', 'og:image:width', ownImage ? null : String(OG_IMAGE_SIZE.width));
    setMeta('property', 'og:image:height', ownImage ? null : String(OG_IMAGE_SIZE.height));
    setOgLocales(language);

    setMeta('name', 'twitter:card', 'summary_large_image');
    setMeta('name', 'twitter:title', pageTitle);
    setMeta('name', 'twitter:description', pageDescription);
    setMeta('name', 'twitter:image', shareImage);

    setPageJsonLd(pathname, seoBook && !noindex ? bookJsonLd(origin, seoBook, language) : null);
  }, [bookKey, description, image, language, noindex, pathname, title]);

  return null;
}
