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

app.listen(port, '0.0.0.0', () => {
  console.log(`Bookeep server listening on ${port}`);
});
