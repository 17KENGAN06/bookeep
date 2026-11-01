import { getFullPdfUrl } from '@/services/access';
import { demoPageCount } from '@/services/demoPages';
import { DEMO_BUCKET, getSupabaseClient } from '@/services/supabase';

/** Copies the first pages of a PDF into a new, smaller PDF. Runs in the admin's browser. */
export async function buildDemoPdf(source: ArrayBuffer, requestedPages: number) {
  // pdf-lib is large and only the admin needs it.
  const { PDFDocument } = await import('pdf-lib');
  const full = await PDFDocument.load(source, { ignoreEncryption: true, updateMetadata: false });
  const totalPages = full.getPageCount();
  const pages = demoPageCount(requestedPages, totalPages);

  const demo = await PDFDocument.create();
  const copied = await demo.copyPages(
    full,
    Array.from({ length: pages }, (_, index) => index),
  );
  for (const page of copied) demo.addPage(page);
  demo.setTitle(full.getTitle() ?? '');
  demo.setProducer('Bookeep demo');

  const bytes = await demo.save({ useObjectStreams: true });
  return { file: new Blob([bytes as BlobPart], { type: 'application/pdf' }), pages, totalPages };
}

export async function uploadDemo(bookId: string, file: Blob) {
  const supabase = getSupabaseClient();
  if (!supabase) throw new Error('Supabase is not configured');
  const path = `${bookId}/demo-${crypto.randomUUID()}.pdf`;
  const { error } = await supabase.storage.from(DEMO_BUCKET).upload(path, file, {
    cacheControl: '31536000',
    contentType: 'application/pdf',
    upsert: false,
  });
  if (error) throw error;
  return path;
}

/** Downloads a stored full PDF (admins can read the private bucket). */
export async function downloadFullPdf(pdfPath: string) {
  const url = await getFullPdfUrl(pdfPath);
  const response = await fetch(url);
  if (!response.ok) throw new Error(`PDF download failed (${response.status})`);
  return response.arrayBuffer();
}
