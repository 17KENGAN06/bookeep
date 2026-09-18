import { useEffect, useRef, useState } from 'react';
import { StyleSheet } from 'react-native';
import { WebView, type WebViewMessageEvent } from 'react-native-webview';
import { preparePdfEngine, type PdfEngine } from '../services/pdfEngine';
import { readLocalBase64 } from '../services/offline';

type PdfPageViewProps = {
  uri: string;
  page: number;
  nightPaper: boolean;
  background: string;
  onReady: (totalPages: number) => void;
  onError: () => void;
  onTurnPage: (delta: -1 | 1) => void;
};

const CHUNK = 256 * 1024;

function arrayBufferToBase64(buffer: ArrayBuffer) {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  const chunk = 8192;
  for (let i = 0; i < bytes.length; i += chunk) {
    const slice = bytes.subarray(i, i + chunk);
    binary += String.fromCharCode(...slice);
  }
  return btoa(binary);
}

function wait(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function PdfPageView({ uri, page, nightPaper, background, onReady, onError, onTurnPage }: PdfPageViewProps) {
  const viewRef = useRef<WebView>(null);
  const readyRef = useRef(false);
  const pageRef = useRef(page);
  const onReadyRef = useRef(onReady);
  const onErrorRef = useRef(onError);
  const onTurnPageRef = useRef(onTurnPage);
  const [engine, setEngine] = useState<PdfEngine | null>(null);
  const [pdfB64, setPdfB64] = useState<string | null>(null);
  const [bridgeReady, setBridgeReady] = useState(false);

  pageRef.current = page;
  onReadyRef.current = onReady;
  onErrorRef.current = onError;
  onTurnPageRef.current = onTurnPage;

  useEffect(() => {
    let active = true;
    void preparePdfEngine()
      .then((next) => {
        if (active) {
          if (next) setEngine(next);
          else onErrorRef.current();
        }
      })
      .catch(() => {
        if (active) onErrorRef.current();
      });
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    readyRef.current = false;
    setPdfB64(null);
    setBridgeReady(false);

    void (async () => {
      try {
        if (uri.startsWith('file://')) {
          const base64 = await readLocalBase64(uri);
          if (!cancelled) setPdfB64(base64);
          return;
        }
        const response = await fetch(uri);
        if (!response.ok) throw new Error('pdf');
        const buffer = await response.arrayBuffer();
        if (cancelled) return;
        setPdfB64(arrayBufferToBase64(buffer));
      } catch {
        if (!cancelled) onErrorRef.current();
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [uri]);

  useEffect(() => {
    if (!bridgeReady || !pdfB64) return;
    const view = viewRef.current;
    if (!view) return;
    let cancelled = false;

    void (async () => {
      view.injectJavaScript('window.__chunks=[]; true;');
      for (let i = 0; i < pdfB64.length; i += CHUNK) {
        if (cancelled) return;
        view.injectJavaScript(`window.__chunks.push(${JSON.stringify(pdfB64.slice(i, i + CHUNK))}); true;`);
        await wait(0);
      }
      if (cancelled) return;
      view.injectJavaScript('window.__finishPdf(); true;');
    })();

    return () => {
      cancelled = true;
    };
  }, [bridgeReady, pdfB64]);

  useEffect(() => {
    if (!readyRef.current) return;
    viewRef.current?.injectJavaScript(`window.bookeepGoTo(${page}); true;`);
  }, [page]);

  useEffect(() => {
    viewRef.current?.injectJavaScript(
      `window.bookeepChrome && window.bookeepChrome(${JSON.stringify(background)}, ${nightPaper}); true;`,
    );
  }, [background, nightPaper]);

  function onMessage(event: WebViewMessageEvent) {
    try {
      const payload = JSON.parse(event.nativeEvent.data) as {
        type: string;
        total?: number;
        delta?: number;
      };
      if (payload.type === 'bridge') {
        setBridgeReady(true);
        viewRef.current?.injectJavaScript(
          `window.bookeepChrome && window.bookeepChrome(${JSON.stringify(background)}, ${nightPaper}); true;`,
        );
        return;
      }
      if (payload.type === 'ready' && payload.total) {
        readyRef.current = true;
        onReadyRef.current(payload.total);
        viewRef.current?.injectJavaScript(
          `window.bookeepChrome && window.bookeepChrome(${JSON.stringify(background)}, ${nightPaper}); window.bookeepGoTo(${pageRef.current}); true;`,
        );
      }
      if (payload.type === 'page' && (payload.delta === 1 || payload.delta === -1)) {
        onTurnPageRef.current(payload.delta);
      }
      if (payload.type === 'error') onErrorRef.current();
    } catch {
      onErrorRef.current();
    }
  }

  if (!engine) return null;

  return (
    <WebView
      key={uri}
      ref={viewRef}
      originWhitelist={['*', 'file://*']}
      javaScriptEnabled
      setSupportMultipleWindows={false}
      mixedContentMode="always"
      nestedScrollEnabled
      allowFileAccess
      allowFileAccessFromFileURLs
      allowUniversalAccessFromFileURLs
      allowingReadAccessToURL={engine.readAccessUri}
      setBuiltInZoomControls={false}
      setDisplayZoomControls={false}
      scalesPageToFit={false}
      source={{ uri: engine.htmlUri }}
      onMessage={onMessage}
      style={[styles.web, { backgroundColor: background }]}
    />
  );
}

const styles = StyleSheet.create({
  web: {
    flex: 1,
  },
});
