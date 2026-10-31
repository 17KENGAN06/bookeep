import '@/polyfills';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from '@/App';
import { loadRuntimeConfig } from '@/config/env';
import '@/i18n';
import '@/index.css';

void loadRuntimeConfig().then(() => {
  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <App />
    </StrictMode>,
  );
});
