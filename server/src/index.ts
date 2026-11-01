import cors from 'cors';
import express from 'express';
import helmet from 'helmet';
import { billingHealthHandler, checkoutHandler, planHandler, portalHandler, webhookHandler } from './billing.js';
import { explainHandler } from './explain.js';

const port = Number(process.env.PORT) || 4000;
const clientOrigin = process.env.CLIENT_ORIGIN ?? 'http://localhost:5173';

const app = express();

// Railway sits behind one proxy; req.ip must be the reader's address for the rate limit.
app.set('trust proxy', 1);

app.disable('x-powered-by');
app.use(helmet());
app.use(
  cors({
    origin: clientOrigin.split(',').map((value) => value.trim()),
  }),
);
// Stripe signs the exact bytes it sent, so this route reads the raw body (before express.json).
app.post('/api/stripe/webhook', express.raw({ type: 'application/json', limit: '1mb' }), (req, res) => {
  void webhookHandler(req, res);
});

app.use(express.json({ limit: '32kb' }));

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

// Explains a selected word or phrase from a book, in simple English or Finnish.
app.post('/api/explain', (req, res) => {
  void explainHandler(req, res);
});

// Subscription: Stripe Checkout (with the free trial) and Stripe's billing portal.
app.get('/api/billing/plan', (req, res) => {
  void planHandler(req, res);
});

app.get('/api/billing/health', billingHealthHandler);

app.post('/api/billing/checkout', (req, res) => {
  void checkoutHandler(req, res);
});

app.post('/api/billing/portal', (req, res) => {
  void portalHandler(req, res);
});

app.listen(port, '0.0.0.0', () => {
  console.log(`Bookeep server listening on ${port}`);
});
