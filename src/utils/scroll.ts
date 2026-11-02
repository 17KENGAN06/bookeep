import type Lenis from 'lenis';

/** The active smooth-scroll engine, if one is running on this page (desktop, motion allowed). */
let lenis: Lenis | null = null;

export function setSmoothScroller(instance: Lenis | null) {
  lenis = instance;
}

export function scrollToPageTop(behavior: ScrollBehavior = 'smooth') {
  if (lenis) {
    lenis.scrollTo(0, { immediate: behavior !== 'smooth', force: true });
    return;
  }
  window.scrollTo({ top: 0, left: 0, behavior });
}
