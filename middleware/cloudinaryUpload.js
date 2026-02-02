import multer from 'multer';
import { v2 as cloudinary } from 'cloudinary';
import { Readable } from 'stream';
import dotenv from 'dotenv';

dotenv.config();

// Configurar Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

// Usar memoryStorage para processar arquivos na memória
const storage = multer.memoryStorage();

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

export const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 50 * 1024 * 1024 // 50MB
  }
});

// Função helper para fazer upload de buffer para Cloudinary
const uploadToCloudinary = (buffer, options) => {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(options, (error, result) => {
      if (error) reject(error);
      else resolve(result);
    });
    
    Readable.from(buffer).pipe(stream);
  });
};

// Middleware para processar uploads após multer
export const processUploads = async (req, res, next) => {
  try {
    if (!req.files) {
      return next();
    }

    const uploadPromises = [];

    // Processar PDF
    if (req.files.pdfFile && req.files.pdfFile[0]) {
      const pdfFile = req.files.pdfFile[0];
      uploadPromises.push(
        uploadToCloudinary(pdfFile.buffer, {
          folder: 'ebooks/pdfs',
          resource_type: 'raw',
          format: 'pdf'
        }).then(result => {
          req.body.pdfFile = result.secure_url;
        })
      );
    }

    // Processar imagem
    if (req.files.coverImage && req.files.coverImage[0]) {
      const imageFile = req.files.coverImage[0];
      uploadPromises.push(
        uploadToCloudinary(imageFile.buffer, {
          folder: 'ebooks/images',
          resource_type: 'image',
          transformation: [
            { width: 500, height: 700, crop: 'limit' },
            { quality: 'auto' }
          ]
        }).then(result => {
          req.body.coverImage = result.secure_url;
        })
      );
    }

    await Promise.all(uploadPromises);
    next();
  } catch (error) {
    console.error('Erro ao fazer upload para Cloudinary:', error);
    res.status(500).json({ message: 'Erro ao fazer upload dos arquivos' });
  }
};

export { cloudinary };
