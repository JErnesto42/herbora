require('dotenv').config();
const express = require('express');
const cors = require('cors');
const pool = require('./db');
const authRoutes = require('./routes/auth');
const plantRoutes = require('./routes/plants');
const accountRoutes = require('./routes/account');

if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32) {
  throw new Error('Defina JWT_SECRET com pelo menos 32 caracteres no arquivo backend/.env.');
}

const app = express();
app.use(cors());
app.use(express.json({ limit: '16kb' }));

app.get('/api/health', async (req, res, next) => {
  try {
    await pool.query('SELECT 1');
    return res.json({ status: 'ok', database: 'connected' });
  } catch (error) {
    return next(error);
  }
});
app.use('/api/auth', authRoutes);
app.use('/api/account', accountRoutes);
app.use('/api/plants', plantRoutes);

app.use((req, res) => res.status(404).json({ message: 'Rota não encontrada.' }));
app.use((error, req, res, next) => {
  console.error('API error:', error);
  if (res.headersSent) return next(error);
  return res.status(500).json({ message: 'Erro interno. Tente novamente mais tarde.' });
});

const port = Number(process.env.PORT || 3000);
const server = app.listen(port, () => {
  console.log(`Herbora API listening on port ${port}`);
});

async function shutdown() {
  server.close(async () => {
    await pool.end();
    process.exit(0);
  });
}

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
