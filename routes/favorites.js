import express from 'express';
import User from '../models/User.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

// @route   GET /api/favorites
// @desc    Obter favoritos do usuário
// @access  Private
router.get('/', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id)
      .populate({
        path: 'favorites',
        populate: { path: 'category' }
      });
    
    res.json(user.favorites);
  } catch (error) {
    res.status(500).json({ message: 'Erro ao buscar favoritos', error: error.message });
  }
});

// @route   POST /api/favorites/:ebookId
// @desc    Adicionar ebook aos favoritos
// @access  Private
router.post('/:ebookId', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    
    // Verificar se já está nos favoritos
    if (user.favorites.includes(req.params.ebookId)) {
      return res.status(400).json({ message: 'Ebook já está nos favoritos' });
    }

    user.favorites.push(req.params.ebookId);
    await user.save();

    const updatedUser = await User.findById(req.user._id)
      .populate({
        path: 'favorites',
        populate: { path: 'category' }
      });

    res.json(updatedUser.favorites);
  } catch (error) {
    res.status(500).json({ message: 'Erro ao adicionar favorito', error: error.message });
  }
});

// @route   DELETE /api/favorites/:ebookId
// @desc    Remover ebook dos favoritos
// @access  Private
router.delete('/:ebookId', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    
    user.favorites = user.favorites.filter(
      id => id.toString() !== req.params.ebookId
    );
    
    await user.save();

    const updatedUser = await User.findById(req.user._id)
      .populate({
        path: 'favorites',
        populate: { path: 'category' }
      });

    res.json(updatedUser.favorites);
  } catch (error) {
    res.status(500).json({ message: 'Erro ao remover favorito', error: error.message });
  }
});

// @route   GET /api/favorites/check/:ebookId
// @desc    Verificar se ebook está nos favoritos
// @access  Private
router.get('/check/:ebookId', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    const isFavorite = user.favorites.includes(req.params.ebookId);
    
    res.json({ isFavorite });
  } catch (error) {
    res.status(500).json({ message: 'Erro ao verificar favorito', error: error.message });
  }
});

export default router;
