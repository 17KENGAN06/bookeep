import cors from 'cors';
import express from 'express';
import helmet from 'helmet';

const port = Number(process.env.PORT) || 4000;
const clientOrigin = process.env.CLIENT_ORIGIN ?? 'http://localhost:5173';

const app = express();

app.disable('x-powered-by');
app.use(helmet());
app.use(
  cors({
    origin: clientOrigin.split(',').map((value) => value.trim()),
  }),
);
app.use(express.json({ limit: '1mb' }));

app.get('/health', (_req, res) => {
  res.json({ ok: true, service: 'bookeep-server' });
});

app.get('/api/health', (_req, res) => {
  res.json({ ok: true, service: 'bookeep-server' });
});

// Public values only. The service role key must never be returned here.
app.get('/api/config', (_req, res) => {
  res.set('Cache-Control', 'public, max-age=300');
  res.json({
    supabaseUrl: process.env.SUPABASE_URL ?? '',
    supabasePublishableKey: process.env.SUPABASE_PUBLISHABLE_KEY ?? '',
  });
});

app.listen(port, '0.0.0.0', () => {
  console.log(`Bookeep server listening on ${port}`);
});
