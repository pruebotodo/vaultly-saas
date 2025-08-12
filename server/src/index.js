import 'dotenv/config';
import express from 'express';
import cors from 'cors';

const app = express();

// Middlewares
app.use(cors());
app.use(express.json());

// Healthcheck
app.get('/api/health', (req, res) => {
  res.status(200).json({ ok: true, ts: new Date().toISOString() });
});

// Raíz opcional
app.get('/', (req, res) => {
  res.status(200).send('Vaultly API activo');
});

// Puerto (Render usa PORT)
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor escuchando en puerto ${PORT}`);
});
