import express from 'express';
import Ebook from '../models/Ebook.js';
import User from '../models/User.js';
import { protect, admin } from '../middleware/auth.js';
import { upload } from '../middleware/uploadSimple.js';
import { getGridFSBucket } from '../config/gridfs.js';
import { Readable } from 'stream';

const router = express.Router();

// Helper para fazer upload para GridFS
const uploadToGridFS = (buffer, filename, contentType) => {
  return new Promise((resolve, reject) => {
    const gfs = getGridFSBucket();
    const readableStream = Readable.from(buffer);
    
    const uploadStream = gfs.openUploadStream(filename, {
      contentType: contentType
    });
    
    uploadStream.on('error', reject);
    uploadStream.on('finish', () => resolve(uploadStream.id));
    
    readableStream.pipe(uploadStream);
  });
};

// @route   GET /api/ebooks
// @desc    Listar todos os ebooks
// @access  Public
router.get('/', async (req, res) => {
  try {
    const { search, category, featured, page = 1, limit = 12 } = req.query;
    
    let query = { isActive: true };
    
    // Filtros
    if (search) {
      query.$text = { $search: search };
    }
    if (category) {
      query.category = category;
    }
    if (featured === 'true') {
      query.featured = true;
    }

    const ebooks = await Ebook.find(query)
      .populate('category')
      .populate('uploadedBy', 'name email')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const count = await Ebook.countDocuments(query);

    res.json({
      ebooks,
      totalPages: Math.ceil(count / limit),
      currentPage: page,
      total: count
    });
  } catch (error) {
    res.status(500).json({ message: 'Erro ao buscar ebooks', error: error.message });
  }
});

// @route   GET /api/ebooks/:id
// @desc    Obter detalhes de um ebook
// @access  Public
router.get('/:id', async (req, res) => {
  try {
    const ebook = await Ebook.findById(req.params.id)
      .populate('category')
      .populate('uploadedBy', 'name email');
    
    if (!ebook) {
      return res.status(404).json({ message: 'Ebook não encontrado' });
    }

    res.json(ebook);
  } catch (error) {
    res.status(500).json({ message: 'Erro ao buscar ebook', error: error.message });
  }
});

// @route   POST /api/ebooks
// @desc    Criar novo ebook
// @access  Private/Admin
router.post('/', protect, admin, upload.fields([
  { name: 'pdfFile', maxCount: 1 },
  { name: 'coverImage', maxCount: 1 }
]), async (req, res) => {
  try {
    const { title, description, author, category, tags } = req.body;

    if (!req.files.pdfFile || !req.files.coverImage) {
      return res.status(400).json({ message: 'PDF e imagem de capa são obrigatórios' });
    }

    const pdfFile = req.files.pdfFile[0];
    const coverImage = req.files.coverImage[0];

    // Upload para GridFS
    const pdfFilename = `pdf-${Date.now()}-${pdfFile.originalname}`;
    const imageFilename = `img-${Date.now()}-${coverImage.originalname}`;

    await uploadToGridFS(pdfFile.buffer, pdfFilename, pdfFile.mimetype);
    await uploadToGridFS(coverImage.buffer, imageFilename, coverImage.mimetype);

    // Salvar no MongoDB com referências aos arquivos
    const ebook = await Ebook.create({
      title,
      description,
      author,
      category,
      coverImage: `/files/${imageFilename}`,
      pdfFile: `/files/${pdfFilename}`,
      fileSize: pdfFile.size,
      tags: tags ? JSON.parse(tags) : [],
      uploadedBy: req.user._id
    });

    const populatedEbook = await Ebook.findById(ebook._id)
      .populate('category')
      .populate('uploadedBy', 'name email');

    res.status(201).json(populatedEbook);
  } catch (error) {
    res.status(500).json({ message: 'Erro ao criar ebook', error: error.message });
  }
});

// @route   PUT /api/ebooks/:id
// @desc    Atualizar ebook
// @access  Private/Admin
router.put('/:id', protect, admin, upload.fields([
  { name: 'pdfFile', maxCount: 1 },
  { name: 'coverImage', maxCount: 1 }
]), async (req, res) => {
  try {
    const ebook = await Ebook.findById(req.params.id);
    
    if (!ebook) {
      return res.status(404).json({ message: 'Ebook não encontrado' });
    }

    const { title, description, author, category, tags, featured } = req.body;

    // Atualizar campos
    if (title) ebook.title = title;
    if (description) ebook.description = description;
    if (author) ebook.author = author;
    if (category) ebook.category = category;
    if (tags) ebook.tags = JSON.parse(tags);
    if (featured !== undefined) ebook.featured = featured;

    // Atualizar arquivos se fornecidos
    if (req.files) {
      if (req.files.coverImage) {
        const coverImage = req.files.coverImage[0];
        const imageFilename = `img-${Date.now()}-${coverImage.originalname}`;
        await uploadToGridFS(coverImage.buffer, imageFilename, coverImage.mimetype);
        ebook.coverImage = `/files/${imageFilename}`;
      }

      if (req.files.pdfFile) {
        const pdfFile = req.files.pdfFile[0];
        const pdfFilename = `pdf-${Date.now()}-${pdfFile.originalname}`;
        await uploadToGridFS(pdfFile.buffer, pdfFilename, pdfFile.mimetype);
        ebook.pdfFile = `/files/${pdfFilename}`;
        ebook.fileSize = pdfFile.size;
      }
    }

    await ebook.save();

    const updatedEbook = await Ebook.findById(ebook._id)
      .populate('category')
      .populate('uploadedBy', 'name email');

    res.json(updatedEbook);
  } catch (error) {
    res.status(500).json({ message: 'Erro ao atualizar ebook', error: error.message });
  }
});

// @route   DELETE /api/ebooks/:id
// @desc    Deletar ebook
// @access  Private/Admin
router.delete('/:id', protect, admin, async (req, res) => {
  try {
    const ebook = await Ebook.findById(req.params.id);
    
    if (!ebook) {
      return res.status(404).json({ message: 'Ebook não encontrado' });
    }

    // Com GridFS, os arquivos ficam no banco, não precisamos deletar separadamente
    // O MongoDB vai gerenciar isso automaticamente
    
    await ebook.deleteOne();

    res.json({ message: 'Ebook deletado com sucesso' });
  } catch (error) {
    res.status(500).json({ message: 'Erro ao deletar ebook', error: error.message });
  }
});

// @route   POST /api/ebooks/:id/download
// @desc    Registrar download de ebook
// @access  Private
router.post('/:id/download', protect, async (req, res) => {
  try {
    const ebook = await Ebook.findById(req.params.id);
    
    if (!ebook) {
      return res.status(404).json({ message: 'Ebook não encontrado' });
    }

    // Incrementar contador de downloads
    ebook.downloadCount += 1;
    await ebook.save();

    // Adicionar ao histórico do usuário
    const user = await User.findById(req.user._id);
    user.downloadHistory.unshift({
      ebook: ebook._id,
      downloadedAt: new Date()
    });
    
    // Manter apenas os últimos 50 downloads
    if (user.downloadHistory.length > 50) {
      user.downloadHistory = user.downloadHistory.slice(0, 50);
    }
    
    await user.save();

    res.json({ message: 'Download registrado', downloadCount: ebook.downloadCount });
  } catch (error) {
    res.status(500).json({ message: 'Erro ao registrar download', error: error.message });
  }
});

export default router;
