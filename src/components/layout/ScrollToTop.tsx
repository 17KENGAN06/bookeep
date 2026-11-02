import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { scrollToPageTop } from '@/utils/scroll';

export function ScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    scrollToPageTop('auto');
  }, [pathname]);

  return null;
}
