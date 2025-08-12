import express from 'express';
import cors from 'cors';
import 'dotenv/config';

const app = express();

// Middlewares
app.use(cors());
app.use(express.json());

// Healthcheck
app.get('/api/health', (req, res) => {
  res.status(200).json({ ok: true });
});

// Ejemplo de raíz (puedes quitarla si no la quieres)
app.get('/', (req, res) => {
  res.type('text').send('Vaultly API activo');
});

// Render usa PORT en producción; local: 3000
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor escuchando en puerto ${PORT}`);
});
