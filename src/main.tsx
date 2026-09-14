import '@/polyfills';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { pdfjs } from 'react-pdf';
import pdfWorker from '@/pdf.worker-entry?worker&url';
import App from '@/App';
import '@/i18n';
import '@/index.css';

pdfjs.GlobalWorkerOptions.workerSrc = pdfWorker;

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
