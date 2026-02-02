import multer from 'multer';
import { v2 as cloudinary } from 'cloudinary';
import { CloudinaryStorage } from 'multer-storage-cloudinary';
import dotenv from 'dotenv';

dotenv.config();

// Configurar Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME || 'your_cloud_name',
  api_key: process.env.CLOUDINARY_API_KEY || 'your_api_key',
  api_secret: process.env.CLOUDINARY_API_SECRET || 'your_api_secret'
});

// Configuração de armazenamento para PDFs
const pdfStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'ebooks/pdfs',
    allowed_formats: ['pdf'],
    resource_type: 'raw'
  }
});

// Configuração de armazenamento para imagens
const imageStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'ebooks/images',
    allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
    transformation: [{ width: 500, height: 700, crop: 'limit' }]
  }
});

// Filtro de arquivos
const fileFilter = (req, file, cb) => {
  if (file.fieldname === 'pdfFile') {
    if (file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(new Error('Apenas arquivos PDF são permitidos!'), false);
    }
  } else if (file.fieldname === 'coverImage') {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Apenas imagens são permitidas!'), false);
    }
  } else {
    cb(null, true);
  }
};

// Criar diferentes uploaders para PDFs e imagens
export const uploadPdf = multer({
  storage: pdfStorage,
  fileFilter,
  limits: {
    fileSize: 50 * 1024 * 1024 // 50MB
  }
});

export const uploadImage = multer({
  storage: imageStorage,
  fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB
  }
});

// Upload misto (PDF + imagem)
export const upload = multer({
  storage: multer.memoryStorage(), // Temporário, decidiremos no controller
  fileFilter,
  limits: {
    fileSize: 50 * 1024 * 1024
  }
});

export { cloudinary };
