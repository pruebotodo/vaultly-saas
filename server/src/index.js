import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { authMiddleware } from './services/auth.js';
import ingestRoutes from './routes/ingest.js';
import itemsRoutes from './routes/items.js';
import billingRoutes from './routes/billing.js';

const app = express();
app.use(cors());

app.get('/api/health', (_req, res) => res.json({ ok: true }));

// Webhook con body "raw"
app.use('/api', billingRoutes);

// JSON normal
app.use(express.json({ limit: '25mb' }));

// Protegidas
app.use('/api', authMiddleware, ingestRoutes);
app.use('/api', authMiddleware, itemsRoutes);

// Raíz
app.get('/', (_req, res) => res.send('Vaultly API activa'));

const PORT = process.env.PORT || 7070;
app.listen(PORT, () => console.log('API on :' + PORT));
