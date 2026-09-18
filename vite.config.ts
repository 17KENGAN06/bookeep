import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { copyFileSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath, URL } from 'node:url';
import { defineConfig, loadEnv, type Plugin } from 'vite';

const pdfjsLegacy = fileURLToPath(new URL('./node_modules/pdfjs-dist/legacy/build/pdf.mjs', import.meta.url));

function applySiteUrl(source: string, origin: string) {
  if (origin) return source.replaceAll('__SITE_URL__', origin);
  return source
    .replace(/^Sitemap: __SITE_URL__\/sitemap\.xml\r?\n/m, '')
    .replaceAll('__SITE_URL__', '');
}

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

function seoSiteUrlPlugin(origin: string): Plugin {
  return {
    name: 'bookeep-seo-site-url',
    transformIndexHtml(html) {
      return applySiteUrl(html, origin);
    },
    closeBundle() {
      const publicDir = resolve(fileURLToPath(new URL('./public', import.meta.url)));
      const outDir = resolve(fileURLToPath(new URL('./dist', import.meta.url)));
      for (const fileName of ['robots.txt', 'sitemap.xml']) {
        const source = readFileSync(resolve(publicDir, fileName), 'utf8');
        writeFileSync(resolve(outDir, fileName), applySiteUrl(source, origin));
      }
    },
  };
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const siteUrl = (env.VITE_SITE_URL ?? '').trim().replace(/\/$/, '');

  return {
    plugins: [react(), tailwindcss(), pdfWorkerPlugin(), seoSiteUrlPlugin(siteUrl)],
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
