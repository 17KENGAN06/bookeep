import { useCallback, useEffect, useState } from 'react';
import { PDF_PAPER_STORAGE_KEY } from '@/config/storage';

export const PDF_PAPERS = ['light', 'sepia', 'night'] as const;
export type PdfPaper = (typeof PDF_PAPERS)[number];

function readStoredPaper(): PdfPaper {
  try {
    const saved = window.localStorage.getItem(PDF_PAPER_STORAGE_KEY);
    // 'dark' is what older versions stored for the night page.
    if (saved === 'dark' || saved === 'night') return 'night';
    if (saved === 'sepia') return 'sepia';
    return 'light';
  } catch {
    return 'light';
  }
}

export function usePdfPaper() {
  const [paper, setPaperState] = useState<PdfPaper>(readStoredPaper);

  useEffect(() => {
    try {
      window.localStorage.setItem(PDF_PAPER_STORAGE_KEY, paper);
    } catch {
      // ignore quota / private mode
    }
  }, [paper]);

  const setPaper = useCallback((next: PdfPaper) => setPaperState(next), []);

  return { paper, setPaper };
}
