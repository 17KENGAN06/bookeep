import { lazy, type ComponentType } from 'react';

const RELOAD_KEY = 'bookeep_chunk_reload';

function reloadOnce() {
  try {
    if (sessionStorage.getItem(RELOAD_KEY)) return false;
    sessionStorage.setItem(RELOAD_KEY, '1');
  } catch {
    return false;
  }
  window.location.reload();
  return true;
}

// A tab opened before a deploy still points at chunks Hostinger has since removed.
export function lazyPage(load: () => Promise<ComponentType>) {
  return lazy(async () => {
    try {
      const page = await load();
      try {
        sessionStorage.removeItem(RELOAD_KEY);
      } catch {
        // Private mode: nothing was stored.
      }
      return { default: page };
    } catch (error) {
      if (reloadOnce()) return new Promise<never>(() => {});
      throw error;
    }
  });
}

export const loadReaderPage = () => import('@/pages/ReaderPage').then((module) => module.ReaderPage);
