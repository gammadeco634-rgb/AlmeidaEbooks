import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import dns from 'node:dns/promises';
import { initGridFS, getGridFSBucket } from './config/gridfs.js';
import { GridFSBucket } from 'mongodb';

// Configurações
dotenv.config();

// Fix para DNS em Node.js v22+ no Windows (resolve querySrv ECONNREFUSED)
// Força o uso de servidores DNS públicos (Cloudflare e Google)
dns.setServers(['1.1.1.1', '8.8.8.8']);

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Importar rotas
import authRoutes from './routes/auth.js';
import ebookRoutes from './routes/ebooks.js';
import userRoutes from './routes/users.js';
import categoryRoutes from './routes/categories.js';
import favoriteRoutes from './routes/favorites.js';
import statsRoutes from './routes/stats.js';

const app = express();

// Middlewares
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Conectar ao MongoDB
const mongoOptions = {
  serverSelectionTimeoutMS: 5000,
  socketTimeoutMS: 45000
};

// Conexão MongoDB Atlas
const mongoURI = 'mongodb+srv://andremartins746_db_user:270881270881@ebooksalmeida.ufzwqgc.mongodb.net/ebooks_fitness?retryWrites=true&w=majority';

mongoose.connect(mongoURI, mongoOptions)
  .then(() => {
    console.log('✅ MongoDB conectado com sucesso!');
    initGridFS();
  })
  .catch((err) => {
    console.error('❌ Erro ao conectar ao MongoDB:', err.message);
    console.log('\n⚠️  Tentando com mongodb+srv...');
    // Fallback para srv
    mongoose.connect('mongodb+srv://andremartins746_db_user:270881270881@ebooksalmeida.ufzwqgc.mongodb.net/ebooks_fitness?retryWrites=true&w=majority', mongoOptions)
      .then(() => {
        console.log('✅ Conectado via SRV!');
        initGridFS();
      })
      .catch((e) => console.error('❌ Falha total:', e.message));
  });

// Rota para servir arquivos do GridFS
app.get('/files/:filename', async (req, res) => {
  try {
    const gfs = getGridFSBucket();
    const files = await gfs.find({ filename: req.params.filename }).toArray();
    
    if (!files || files.length === 0) {
      return res.status(404).json({ message: 'Arquivo não encontrado' });
    }
    
    const file = files[0];
    
    // Definir content type
    res.set('Content-Type', file.contentType);
    res.set('Content-Disposition', `inline; filename="${file.filename}"`);
    
    // Stream do arquivo
    const downloadStream = gfs.openDownloadStreamByName(req.params.filename);
    downloadStream.pipe(res);
  } catch (error) {
    console.error('Erro ao buscar arquivo:', error);
    res.status(500).json({ message: 'Erro ao buscar arquivo' });
  }
});

// Rotas
app.use('/api/auth', authRoutes);
app.use('/api/ebooks', ebookRoutes);
app.use('/api/users', userRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/favorites', favoriteRoutes);
app.use('/api/stats', statsRoutes);

// Rota inicial
app.get('/', (req, res) => {
  res.json({ 
    message: '📚 API de Ebooks Fitness',
    version: '1.0.0',
    endpoints: {
      auth: '/api/auth',
      ebooks: '/api/ebooks',
      users: '/api/users',
      categories: '/api/categories',
      favorites: '/api/favorites',
      stats: '/api/stats'
    }
  });
});

// Tratamento de erros
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({
    message: err.message || 'Erro interno do servidor',
    error: process.env.NODE_ENV === 'development' ? err : {}
  });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`🚀 Servidor rodando na porta ${PORT}`);
  console.log(`📍 http://localhost:${PORT}`);
});
