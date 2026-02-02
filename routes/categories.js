import express from 'express';
import Category from '../models/Category.js';
import { protect, admin } from '../middleware/auth.js';

const router = express.Router();

// @route   GET /api/categories
// @desc    Listar todas as categorias
// @access  Public
router.get('/', async (req, res) => {
  try {
    const categories = await Category.find({ isActive: true }).sort({ name: 1 });
    res.json(categories);
  } catch (error) {
    res.status(500).json({ message: 'Erro ao buscar categorias', error: error.message });
  }
});

// @route   GET /api/categories/:id
// @desc    Obter detalhes de uma categoria
// @access  Public
router.get('/:id', async (req, res) => {
  try {
    const category = await Category.findById(req.params.id);
    
    if (!category) {
      return res.status(404).json({ message: 'Categoria não encontrada' });
    }

    res.json(category);
  } catch (error) {
    res.status(500).json({ message: 'Erro ao buscar categoria', error: error.message });
  }
});

// @route   POST /api/categories
// @desc    Criar nova categoria
// @access  Private/Admin
router.post('/', protect, admin, async (req, res) => {
  try {
    const { name, description, icon, color } = req.body;

    const category = await Category.create({
      name,
      description,
      icon,
      color
    });

    res.status(201).json(category);
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ message: 'Categoria já existe' });
    }
    res.status(500).json({ message: 'Erro ao criar categoria', error: error.message });
  }
});

// @route   PUT /api/categories/:id
// @desc    Atualizar categoria
// @access  Private/Admin
router.put('/:id', protect, admin, async (req, res) => {
  try {
    const { name, description, icon, color, isActive } = req.body;
    
    const category = await Category.findById(req.params.id);
    
    if (!category) {
      return res.status(404).json({ message: 'Categoria não encontrada' });
    }

    if (name) category.name = name;
    if (description) category.description = description;
    if (icon) category.icon = icon;
    if (color) category.color = color;
    if (isActive !== undefined) category.isActive = isActive;

    await category.save();

    res.json(category);
  } catch (error) {
    res.status(500).json({ message: 'Erro ao atualizar categoria', error: error.message });
  }
});

// @route   DELETE /api/categories/:id
// @desc    Deletar categoria
// @access  Private/Admin
router.delete('/:id', protect, admin, async (req, res) => {
  try {
    const category = await Category.findById(req.params.id);
    
    if (!category) {
      return res.status(404).json({ message: 'Categoria não encontrada' });
    }

    await category.deleteOne();

    res.json({ message: 'Categoria deletada com sucesso' });
  } catch (error) {
    res.status(500).json({ message: 'Erro ao deletar categoria', error: error.message });
  }
});

export default router;
