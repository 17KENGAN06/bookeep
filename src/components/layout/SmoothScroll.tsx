import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import Lenis from 'lenis';
import 'lenis/dist/lenis.css';
import { setSmoothScroller } from '@/utils/scroll';

/*
 * Inertial wheel scrolling for the site pages. Lenis only smooths wheel/trackpad input; touch
 * gestures stay native, so phones are unaffected. The reader and the admin keep native scroll,
 * so PDF pages, text selection and long tables behave exactly as before.
 */
const NATIVE_ROUTES = ['/read/', '/admin'];

export function SmoothScroll() {
  const { pathname } = useLocation();
  const enabled = !NATIVE_ROUTES.some((prefix) => pathname.startsWith(prefix));

  useEffect(() => {
    if (!enabled) return;

    const lenis = new Lenis({
      autoRaf: true,
      lerp: 0.1,
      wheelMultiplier: 1,
      anchors: true,
      allowNestedScroll: true,
      stopInertiaOnNavigate: true,
      // Lenis turns itself off for "reduce motion" by default; Bookeep wants the glide everywhere.
      respectReducedMotion: false,
    });
    setSmoothScroller(lenis);

    // Menus and dialogs lock the page with body overflow: hidden. Pause the engine while they are open.
    const syncLock = () => {
      if (document.body.style.overflow === 'hidden') lenis.stop();
      else lenis.start();
    };
    syncLock();
    const observer = new MutationObserver(syncLock);
    observer.observe(document.body, { attributes: true, attributeFilter: ['style'] });

    return () => {
      observer.disconnect();
      setSmoothScroller(null);
      lenis.destroy();
    };
  }, [enabled]);

  return null;
}
