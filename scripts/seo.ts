/**
 * Build-time SEO for the static Hostinger deploy.
 *
 * The app is a client-side SPA, so link previews (Telegram, WhatsApp, Facebook, X) and crawlers
 * that do not run JavaScript would only ever see the home page head. At build time this:
 *  - writes the home head into index.html (between the seo:start / seo:end markers),
 *  - writes dist/prerender/<page>.html and dist/prerender/books/<slug>.html with each page's own
 *    title, description, canonical, hreflang, Open Graph and structured data
 *    (public/.htaccess serves them for /about, /books/<slug> and so on; the SPA takes over in the browser),
 *  - writes sitemap.xml (pages and books, with hreflang alternates and cover images) and robots.txt.
 *
 * Books come from the public Supabase REST API, found through the Railway API's /api/config.
 * If that fails the build still succeeds, just without book pages in the sitemap.
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import {
  bookJsonLd,
  bookSeoText,
  catalogJsonLd,
  DEFAULT_SEO_LANGUAGE,
  hreflangAlternates,
  OG_IMAGE_PATH,
  OG_IMAGE_SIZE,
  OG_LOCALES,
  SEO_COPY,
  SEO_LANGUAGES,
  SEO_PAGES,
  siteJsonLd,
  SITE_NAME,
  type SeoBook,
  type SeoPageKey,
} from '../src/seo/shared.ts';

const START = '<!-- seo:start -->';
const END = '<!-- seo:end -->';

type BookRow = {
  slug: string;
  title_original: string;
  title_en: string | null;
  description_en: string | null;
  description_fi: string | null;
  language: string;
  level: string;
  cover_path: string | null;
  page_count: number | null;
  updated_at: string | null;
};

function escapeHtml(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function jsonLdTag(data: object, pagePath?: string) {
  // `<` is escaped so a title can never close the script tag.
  const json = JSON.stringify(data).replace(/</g, '\\u003c');
  const attr = pagePath ? ` data-seo-page="${escapeHtml(pagePath)}"` : '';
  return `<script type="application/ld+json"${attr}>${json}</script>`;
}

type HeadInput = {
  origin: string;
  path: string;
  title: string;
  description: string;
  image?: string | null;
  type?: 'website' | 'book';
  jsonLd?: object[];
  pageJsonLd?: object | null;
};

export function renderHead({ origin, path, title, description, image, type = 'website', jsonLd = [], pageJsonLd }: HeadInput) {
  const copy = SEO_COPY[DEFAULT_SEO_LANGUAGE];
  const url = `${origin}${path}`;
  const shareImage = image || `${origin}${OG_IMAGE_PATH}`;
  const e = escapeHtml;
  const lines = [
    `<title>${e(title)}</title>`,
    `<meta name="description" content="${e(description)}" />`,
    `<meta name="keywords" content="${e(copy.keywords)}" />`,
    `<meta name="robots" content="index,follow,max-image-preview:large" />`,
    `<link rel="canonical" href="${e(url)}" />`,
    ...hreflangAlternates(origin, path).map(
      (link) => `<link rel="alternate" hreflang="${link.hreflang}" href="${e(link.href)}" />`,
    ),
    `<meta property="og:type" content="${type}" />`,
    `<meta property="og:site_name" content="${SITE_NAME}" />`,
    `<meta property="og:title" content="${e(title)}" />`,
    `<meta property="og:description" content="${e(description)}" />`,
    `<meta property="og:url" content="${e(url)}" />`,
    `<meta property="og:image" content="${e(shareImage)}" />`,
    `<meta property="og:image:alt" content="${e(title)}" />`,
    ...(image
      ? []
      : [
          `<meta property="og:image:width" content="${OG_IMAGE_SIZE.width}" />`,
          `<meta property="og:image:height" content="${OG_IMAGE_SIZE.height}" />`,
        ]),
    `<meta property="og:locale" content="${OG_LOCALES[DEFAULT_SEO_LANGUAGE]}" />`,
    ...SEO_LANGUAGES.filter((language) => language !== DEFAULT_SEO_LANGUAGE).map(
      (language) => `<meta property="og:locale:alternate" content="${OG_LOCALES[language]}" />`,
    ),
    `<meta name="twitter:card" content="summary_large_image" />`,
    `<meta name="twitter:title" content="${e(title)}" />`,
    `<meta name="twitter:description" content="${e(description)}" />`,
    `<meta name="twitter:image" content="${e(shareImage)}" />`,
    ...jsonLd.map((data) => jsonLdTag(data)),
    ...(pageJsonLd ? [jsonLdTag(pageJsonLd, path)] : []),
  ];
  return lines.map((line) => `    ${line}`).join('\n');
}

function replaceHead(html: string, head: string) {
  const start = html.indexOf(START);
  const end = html.indexOf(END);
  if (start === -1 || end === -1) throw new Error('index.html is missing the seo:start / seo:end markers');
  return `${html.slice(0, start + START.length)}\n${head}\n    ${html.slice(end)}`;
}

/** A plain-HTML summary for crawlers without JavaScript. The app replaces it on load. */
function noscript(heading: string, text: string, links: { href: string; label: string }[] = []) {
  const e = escapeHtml;
  const list = links.length
    ? `<ul>${links.map((link) => `<li><a href="${e(link.href)}">${e(link.label)}</a></li>`).join('')}</ul>`
    : '';
  return `<noscript><h1>${e(heading)}</h1><p>${e(text)}</p>${list}</noscript>`;
}

function withNoscript(html: string, content: string) {
  return html.replace('<div id="root"></div>', `<div id="root"></div>\n    ${content}`);
}

export function homeHead(origin: string) {
  const page = SEO_COPY[DEFAULT_SEO_LANGUAGE].pages.home;
  return renderHead({ origin, path: '/', title: page.title, description: page.description, jsonLd: [siteJsonLd(origin)] });
}

export function applyHomeHead(html: string, origin: string) {
  return replaceHead(html, homeHead(origin));
}

async function fetchJson<T>(url: string, headers: Record<string, string> = {}) {
  const response = await fetch(url, { headers, signal: AbortSignal.timeout(10000) });
  if (!response.ok) throw new Error(`${response.status} ${url}`);
  return (await response.json()) as T;
}

export async function loadBooks(apiUrl: string): Promise<SeoBook[]> {
  if (!apiUrl) return [];
  try {
    const config = await fetchJson<{ supabaseUrl?: string; supabasePublishableKey?: string }>(`${apiUrl}/api/config`);
    const base = config.supabaseUrl?.replace(/\/$/, '');
    const key = config.supabasePublishableKey;
    if (!base || !key) return [];
    const select = 'slug,title_original,title_en,description_en,description_fi,language,level,cover_path,page_count,updated_at';
    const rows = await fetchJson<BookRow[]>(
      `${base}/rest/v1/books?select=${select}&published=eq.true&language=eq.en&order=created_at.desc`,
      { apikey: key, Authorization: `Bearer ${key}` },
    );
    return rows
      .filter((row) => row.slug)
      .map((row) => ({
        slug: row.slug,
        title: row.title_en?.trim() || row.title_original,
        description: row.description_en?.trim() || row.description_fi?.trim() || '',
        language: row.language,
        level: row.level,
        cover: !row.cover_path
          ? null
          : /^https?:\/\//.test(row.cover_path)
            ? row.cover_path
            : `${base}/storage/v1/object/public/book-covers/${row.cover_path}`,
        pageCount: row.page_count,
        updatedAt: row.updated_at,
      }));
  } catch (error) {
    console.warn(`[seo] Books not loaded, sitemap has pages only: ${(error as Error).message}`);
    return [];
  }
}

function writeFile(path: string, content: string) {
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, content);
}

export function writePrerenderedPages(outDir: string, builtIndex: string, origin: string, books: SeoBook[]) {
  const copy = SEO_COPY[DEFAULT_SEO_LANGUAGE];
  const bookLinks = books.map((book) => ({ href: `/books/${book.slug}`, label: `${book.title} (${book.level})` }));

  for (const page of SEO_PAGES) {
    const text = copy.pages[page.key as SeoPageKey];
    const pageJsonLd = page.key === 'books' && books.length ? catalogJsonLd(origin, books, DEFAULT_SEO_LANGUAGE) : null;
    const head = renderHead({ origin, path: page.path, title: text.title, description: text.description, pageJsonLd });
    const links = page.key === 'books' || page.key === 'home' ? bookLinks : [];
    const html = withNoscript(replaceHead(builtIndex, page.key === 'home' ? homeHead(origin) : head), noscript(text.title, text.description, links));
    if (page.key === 'home') writeFile(resolve(outDir, 'index.html'), html);
    else writeFile(resolve(outDir, 'prerender', `${page.path.slice(1)}.html`), html);
  }

  for (const book of books) {
    const path = `/books/${book.slug}`;
    const text = bookSeoText(book, DEFAULT_SEO_LANGUAGE);
    const head = renderHead({
      origin,
      path,
      title: text.title,
      description: text.description,
      image: book.cover,
      type: 'book',
      pageJsonLd: bookJsonLd(origin, book, DEFAULT_SEO_LANGUAGE),
    });
    const html = withNoscript(replaceHead(builtIndex, head), noscript(text.title, text.description, [{ href: '/books', label: copy.catalog }]));
    writeFile(resolve(outDir, 'prerender', 'books', `${book.slug}.html`), html);
  }
}

export function sitemapXml(origin: string, books: SeoBook[], buildDate: string) {
  const e = escapeHtml;
  const entry = (path: string, changefreq: string, priority: string, lastmod: string, image?: { loc: string; title: string } | null) => {
    const alternates = hreflangAlternates(origin, path)
      .map((link) => `    <xhtml:link rel="alternate" hreflang="${link.hreflang}" href="${e(link.href)}" />`)
      .join('\n');
    const imageTag = image
      ? `\n    <image:image>\n      <image:loc>${e(image.loc)}</image:loc>\n      <image:title>${e(image.title)}</image:title>\n    </image:image>`
      : '';
    return `  <url>\n    <loc>${e(`${origin}${path}`)}</loc>\n    <lastmod>${lastmod}</lastmod>\n    <changefreq>${changefreq}</changefreq>\n    <priority>${priority}</priority>\n${alternates}${imageTag}\n  </url>`;
  };

  const newestBook = books.map((book) => book.updatedAt?.slice(0, 10) ?? '').sort().at(-1);
  const urls = [
    ...SEO_PAGES.map((page) =>
      entry(page.path, page.changefreq, page.priority, (page.key === 'books' && newestBook) || buildDate),
    ),
    ...books.map((book) =>
      entry(`/books/${book.slug}`, 'monthly', '0.8', book.updatedAt?.slice(0, 10) || buildDate, book.cover ? { loc: book.cover, title: book.title } : null),
    ),
  ];

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:xhtml="http://www.w3.org/1999/xhtml"
        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">
${urls.join('\n')}
</urlset>
`;
}

export function robotsTxt(origin: string) {
  return `User-agent: *
Allow: /
Disallow: /admin
Disallow: /read/
Disallow: /auth/
Disallow: /prerender/
${origin ? `\nSitemap: ${origin}/sitemap.xml\n` : ''}`;
}
