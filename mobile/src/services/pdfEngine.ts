import { Platform } from 'react-native';
import { Asset } from 'expo-asset';
import { Directory, File, Paths } from 'expo-file-system';

const ENGINE_ID = 'pdfjs-3.11.174-2';

export type PdfEngine = {
  htmlUri: string;
  readAccessUri: string;
};

let enginePromise: Promise<PdfEngine | null> | null = null;

function viewerHtml() {
  return `<!DOCTYPE html>
<html>
<head>
  <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no">
  <style>
    html, body { margin: 0; padding: 0; height: 100%; overflow: hidden; background: #F7FAF8; }
    #stage { width: 100%; height: 100%; overflow: auto; -webkit-overflow-scrolling: touch; }
    #page { display: block; margin: 0 auto; transform-origin: 0 0; }
    #page.night { filter: invert(1) hue-rotate(180deg); }
  </style>
</head>
<body>
  <div id="stage"><canvas id="page"></canvas></div>
  <script src="pdf.min.js"></script>
  <script>
    if (typeof pdfjsLib === 'undefined') {
      window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'error' }));
    } else {
      pdfjsLib.GlobalWorkerOptions.workerSrc = 'pdf.worker.min.js';
      let pdfDoc = null;
      let renderTask = null;
      let currentPage = 1;
      let currentZoom = 1;
      let pendingZoom = 1;
      let pinch = null;
      let swipe = null;
      let lastTap = 0;
      let lastTapX = 0;
      let lastTapY = 0;
      const MIN_ZOOM = 1;
      const MAX_ZOOM = 3;
      window.__chunks = [];
      function post(payload) {
        window.ReactNativeWebView.postMessage(JSON.stringify(payload));
      }
      function bytesFromBase64(b64) {
        const raw = atob(b64);
        const bytes = new Uint8Array(raw.length);
        for (let i = 0; i < raw.length; i++) bytes[i] = raw.charCodeAt(i);
        return bytes;
      }
      function clampZoom(value) {
        return Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, value));
      }
      function touchDistance(a, b) {
        return Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY);
      }
      function clearPreview() {
        document.getElementById('page').style.transform = '';
      }
      window.bookeepChrome = function(bg, night) {
        document.documentElement.style.background = bg;
        document.body.style.background = bg;
        document.getElementById('stage').style.background = bg;
        document.getElementById('page').className = night ? 'night' : '';
      };
      function renderPage(num, zoom, keepScroll) {
        if (!pdfDoc) return;
        const stage = document.getElementById('stage');
        const scrollLeft = stage.scrollLeft;
        const scrollTop = stage.scrollTop;
        currentPage = Math.min(pdfDoc.numPages, Math.max(1, num));
        currentZoom = clampZoom(zoom == null ? currentZoom : zoom);
        pendingZoom = currentZoom;
        pdfDoc.getPage(currentPage).then(function(page) {
          const canvas = document.getElementById('page');
          const context = canvas.getContext('2d');
          const screenWidth = stage.clientWidth || document.documentElement.clientWidth || 360;
          const unscaled = page.getViewport({ scale: 1 });
          const scale = (screenWidth / unscaled.width) * currentZoom;
          const viewport = page.getViewport({ scale: scale });
          const outputScale = Math.min(window.devicePixelRatio || 1, 2);
          canvas.width = Math.floor(viewport.width * outputScale);
          canvas.height = Math.floor(viewport.height * outputScale);
          canvas.style.width = Math.floor(viewport.width) + 'px';
          canvas.style.height = Math.floor(viewport.height) + 'px';
          canvas.style.transform = '';
          const transform = outputScale !== 1 ? [outputScale, 0, 0, outputScale, 0, 0] : null;
          if (renderTask) renderTask.cancel();
          renderTask = page.render({ canvasContext: context, viewport: viewport, transform: transform });
          renderTask.promise.then(function() {
            if (keepScroll) {
              stage.scrollLeft = scrollLeft;
              stage.scrollTop = scrollTop;
            } else {
              stage.scrollTop = 0;
              stage.scrollLeft = 0;
            }
            post({ type: 'rendered', page: currentPage });
          }).catch(function() {});
        });
      }
      window.bookeepGoTo = function(num, zoom) {
        const pageChanged = num !== currentPage;
        renderPage(num, zoom == null ? currentZoom : zoom, !pageChanged);
      };
      window.bookeepNight = function(on) {
        document.getElementById('page').className = on ? 'night' : '';
      };
      (function bindPinch() {
        const stage = document.getElementById('stage');
        stage.addEventListener('touchstart', function(event) {
          if (event.touches.length >= 2) {
            pinch = {
              start: Math.max(1, touchDistance(event.touches[0], event.touches[1])),
              zoom: currentZoom
            };
            swipe = null;
            return;
          }
          pinch = null;
          swipe = {
            x: event.touches[0].clientX,
            y: event.touches[0].clientY
          };
        }, { passive: true });
        stage.addEventListener('touchmove', function(event) {
          if (!pinch || event.touches.length < 2) return;
          event.preventDefault();
          const ratio = touchDistance(event.touches[0], event.touches[1]) / pinch.start;
          pendingZoom = clampZoom(pinch.zoom * ratio);
          const canvas = document.getElementById('page');
          canvas.style.transformOrigin = 'center center';
          canvas.style.transform = 'scale(' + (pendingZoom / currentZoom) + ')';
        }, { passive: false });
        stage.addEventListener('touchend', function(event) {
          if (pinch && event.touches.length < 2) {
            pinch = null;
            lastTap = 0;
            clearPreview();
            if (Math.abs(pendingZoom - currentZoom) > 0.04) {
              renderPage(currentPage, pendingZoom, true);
            }
            return;
          }
          if (!swipe || event.changedTouches.length === 0) {
            swipe = null;
            return;
          }
          const touch = event.changedTouches[0];
          const dx = touch.clientX - swipe.x;
          const dy = touch.clientY - swipe.y;
          swipe = null;
          const now = Date.now();
          if (Math.abs(dx) < 14 && Math.abs(dy) < 14) {
            if (now - lastTap < 280 && Math.hypot(touch.clientX - lastTapX, touch.clientY - lastTapY) < 48) {
              lastTap = 0;
              if (currentZoom > 1.04) renderPage(currentPage, 1, false);
              else renderPage(currentPage, 2, true);
              return;
            }
            lastTap = now;
            lastTapX = touch.clientX;
            lastTapY = touch.clientY;
            return;
          }
          lastTap = 0;
          if (currentZoom > 1.04) return;
          if (Math.abs(dx) < 56 || Math.abs(dx) <= Math.abs(dy) * 1.6) return;
          post({ type: 'page', delta: dx > 0 ? -1 : 1 });
        }, { passive: true });
      })();
      window.__finishPdf = function() {
        const b64 = window.__chunks.join('');
        window.__chunks = [];
        pdfjsLib.getDocument({
          data: bytesFromBase64(b64),
          disableRange: true,
          disableStream: true,
          isEvalSupported: false
        }).promise.then(function(pdf) {
          pdfDoc = pdf;
          post({ type: 'ready', total: pdf.numPages });
        }).catch(function() {
          post({ type: 'error' });
        });
      };
      post({ type: 'bridge' });
    }
  </script>
</body>
</html>`;
}

function writeText(file: File, contents: string) {
  if (file.exists) file.delete();
  file.create();
  file.write(contents);
}

async function readAssetText(moduleId: number) {
  const asset = Asset.fromModule(moduleId);
  await asset.downloadAsync();
  const uri = asset.localUri ?? asset.uri;
  return new File(uri).text();
}

async function materialize(): Promise<PdfEngine> {
  const dir = new Directory(Paths.document, 'pdfjs');
  if (!dir.exists) dir.create({ intermediates: true });

  const stamp = new File(dir, 'engine-id.txt');
  const html = new File(dir, 'viewer.html');
  const main = new File(dir, 'pdf.min.js');
  const worker = new File(dir, 'pdf.worker.min.js');
  const current = stamp.exists ? (await stamp.text()).trim() : '';

  if (current !== ENGINE_ID || !html.exists || !main.exists || !worker.exists) {
    const [mainJs, workerJs] = await Promise.all([
      readAssetText(require('../../assets/pdfjs/pdf.min.js.txt')),
      readAssetText(require('../../assets/pdfjs/pdf.worker.min.js.txt')),
    ]);
    writeText(main, mainJs);
    writeText(worker, workerJs);
    writeText(html, viewerHtml());
    writeText(stamp, ENGINE_ID);
  }

  return { htmlUri: html.uri, readAccessUri: dir.uri };
}

export function preparePdfEngine() {
  if (Platform.OS === 'web') {
    return Promise.resolve(null);
  }
  if (!enginePromise) {
    enginePromise = materialize().catch((error) => {
      enginePromise = null;
      throw error;
    });
  }
  return enginePromise;
}
