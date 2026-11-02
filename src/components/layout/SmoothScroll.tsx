import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import Lenis from 'lenis';
import 'lenis/dist/lenis.css';
import { setSmoothScroller } from '@/utils/scroll';

/*
 * Inertial wheel scrolling for the site pages. Only on mouse/trackpad devices with motion allowed:
 * touch screens already scroll smoothly on their own. The reader and the admin keep native scroll,
 * so PDF pages, text selection and long tables behave exactly as before.
 */
const NATIVE_ROUTES = ['/read/', '/admin'];

function useMediaQuery(query: string) {
  const [matches, setMatches] = useState(() => typeof window !== 'undefined' && window.matchMedia(query).matches);

  useEffect(() => {
    const media = window.matchMedia(query);
    const onChange = () => setMatches(media.matches);
    onChange();
    media.addEventListener('change', onChange);
    return () => media.removeEventListener('change', onChange);
  }, [query]);

  return matches;
}

export function SmoothScroll() {
  const { pathname } = useLocation();
  const finePointer = useMediaQuery('(hover: hover) and (pointer: fine)');
  const reducedMotion = useMediaQuery('(prefers-reduced-motion: reduce)');
  const nativeRoute = NATIVE_ROUTES.some((prefix) => pathname.startsWith(prefix));
  const enabled = finePointer && !reducedMotion && !nativeRoute;

  useEffect(() => {
    if (!enabled) return;

    const lenis = new Lenis({
      autoRaf: true,
      lerp: 0.1,
      wheelMultiplier: 1,
      anchors: true,
      allowNestedScroll: true,
      stopInertiaOnNavigate: true,
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
