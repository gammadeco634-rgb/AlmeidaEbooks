import mongoose from 'mongoose';

const ebookSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true
  },
  author: {
    type: String,
    required: true,
    default: 'Fitness Team'
  },
  category: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category',
    required: true
  },
  coverImage: {
    type: String,
    required: true
  },
  pdfFile: {
    type: String,
    required: true
  },
  fileSize: {
    type: Number,
    default: 0
  },
  pages: {
    type: Number,
    default: 0
  },
  downloadCount: {
    type: Number,
    default: 0
  },
  rating: {
    type: Number,
    default: 0,
    min: 0,
    max: 5
  },
  tags: [{
    type: String,
    trim: true
  }],
  featured: {
    type: Boolean,
    default: false
  },
  isActive: {
    type: Boolean,
    default: true
  },
  uploadedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
});

// Índices para busca
ebookSchema.index({ title: 'text', description: 'text', tags: 'text' });

export default mongoose.model('Ebook', ebookSchema);
