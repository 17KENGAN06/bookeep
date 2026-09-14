import { useCallback, useEffect, useState } from 'react';
import { PDF_PAPER_STORAGE_KEY } from '@/config/storage';

export type PdfPaper = 'light' | 'dark';

function readStoredPaper(): PdfPaper {
  try {
    return window.localStorage.getItem(PDF_PAPER_STORAGE_KEY) === 'dark' ? 'dark' : 'light';
  } catch {
    return 'light';
  }
}

export function usePdfPaper() {
  const [paper, setPaper] = useState<PdfPaper>(readStoredPaper);

  useEffect(() => {
    try {
      window.localStorage.setItem(PDF_PAPER_STORAGE_KEY, paper);
    } catch {
      // ignore quota / private mode
    }
  }, [paper]);

  const togglePaper = useCallback(() => {
    setPaper((current) => (current === 'dark' ? 'light' : 'dark'));
  }, []);

  return { paper, isDarkPaper: paper === 'dark', togglePaper };
}
