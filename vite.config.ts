import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { copyFileSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath, URL } from 'node:url';
import { defineConfig, loadEnv, type Plugin } from 'vite';
import { applyHomeHead, loadBooks, robotsTxt, sitemapXml, writePrerenderedPages } from './scripts/seo.ts';

const pdfjsLegacy = fileURLToPath(new URL('./node_modules/pdfjs-dist/legacy/build/pdf.mjs', import.meta.url));

function copyPdfWorker(destDir: string) {
  copyFileSync(
    resolve(fileURLToPath(new URL('./node_modules/pdfjs-dist/legacy/build/pdf.worker.min.mjs', import.meta.url))),
    resolve(destDir, 'pdf.worker.min.mjs'),
  );
}

function pdfWorkerPlugin(): Plugin {
  const publicDir = resolve(fileURLToPath(new URL('./public', import.meta.url)));
  const outDir = resolve(fileURLToPath(new URL('./dist', import.meta.url)));
  return {
    name: 'bookeep-pdf-worker',
    buildStart() {
      copyPdfWorker(publicDir);
    },
    closeBundle() {
      copyPdfWorker(outDir);
    },
  };
}

// Starts the runtime config request alongside the bundle instead of after it.
function apiConfigPreloadPlugin(apiUrl: string): Plugin {
  return {
    name: 'bookeep-api-config-preload',
    transformIndexHtml() {
      if (!apiUrl) return [];
      return [
        {
          tag: 'link',
          attrs: { rel: 'preload', as: 'fetch', href: `${apiUrl}/api/config`, crossorigin: 'anonymous' },
          injectTo: 'head',
        },
      ];
    },
  };
}

// Page heads, prerendered pages for link previews and crawlers, sitemap.xml and robots.txt (see scripts/seo.ts).
function seoPlugin(origin: string, apiUrl: string): Plugin {
  return {
    name: 'bookeep-seo',
    transformIndexHtml(html) {
      return applyHomeHead(html, origin);
    },
    async closeBundle() {
      const outDir = resolve(fileURLToPath(new URL('./dist', import.meta.url)));
      writeFileSync(resolve(outDir, 'robots.txt'), robotsTxt(origin));
      if (!origin) return;
      const books = await loadBooks(apiUrl);
      const builtIndex = readFileSync(resolve(outDir, 'index.html'), 'utf8');
      writePrerenderedPages(outDir, builtIndex, origin, books);
      writeFileSync(resolve(outDir, 'sitemap.xml'), sitemapXml(origin, books, new Date().toISOString().slice(0, 10)));
      console.log(`[seo] prerendered ${books.length} book pages, sitemap and robots.txt written`);
    },
  };
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const siteUrl = (env.VITE_SITE_URL ?? '').trim().replace(/\/$/, '');
  const apiUrl = (env.VITE_API_URL ?? '').trim().replace(/\/$/, '');

  return {
    plugins: [react(), tailwindcss(), pdfWorkerPlugin(), seoPlugin(siteUrl, apiUrl), apiConfigPreloadPlugin(apiUrl)],
    resolve: {
      alias: [
        { find: '@', replacement: fileURLToPath(new URL('./src', import.meta.url)) },
        { find: /^pdfjs-dist$/, replacement: pdfjsLegacy },
      ],
    },
    server: {
      port: 5173,
      host: true,
      proxy: {
        '/api': {
          target: 'http://localhost:4000',
          changeOrigin: true,
        },
      },
    },
    optimizeDeps: {
      include: ['react-pdf'],
      exclude: ['pdfjs-dist'],
    },
    worker: {
      format: 'es',
    },
    preview: {
      port: 4173,
      host: true,
    },
  };
});
