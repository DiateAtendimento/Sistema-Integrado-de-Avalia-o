const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');
const apiRoutes = require('./routes/publicRoutes');
const adminRoutes = require('./routes/adminRoutes');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;
const corsOrigin = process.env.CORS_ORIGIN || '*';

app.use(cors({ origin: corsOrigin, credentials: true }));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

app.use('/api', apiRoutes);
app.use('/api/admin', adminRoutes);

app.get('/health', (req, res) => {
  res.json({ status: 'ok', system: 'SIA - Sistema Integrado de Avaliação' });
});

app.use((err, req, res, next) => {
  console.error(err);
  res.status(err.status || 500).json({ error: err.message || 'Erro interno do servidor' });
});

app.listen(PORT, () => {
  console.log(`SIA backend rodando na porta ${PORT}`);
});
