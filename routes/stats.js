import express from 'express';
import User from '../models/User.js';
import Ebook from '../models/Ebook.js';
import Category from '../models/Category.js';
import { protect, admin } from '../middleware/auth.js';

const router = express.Router();

// @route   GET /api/stats/dashboard
// @desc    Obter estatísticas do dashboard (admin)
// @access  Private/Admin
router.get('/dashboard', protect, admin, async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const totalEbooks = await Ebook.countDocuments();
    const totalCategories = await Category.countDocuments();
    
    // Total de downloads
    const ebooks = await Ebook.find();
    const totalDownloads = ebooks.reduce((sum, ebook) => sum + ebook.downloadCount, 0);

    // Ebooks mais baixados
    const topEbooks = await Ebook.find()
      .sort({ downloadCount: -1 })
      .limit(5)
      .populate('category');

    // Novos usuários (últimos 30 dias)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const newUsers = await User.countDocuments({ 
      createdAt: { $gte: thirtyDaysAgo } 
    });

    // Ebooks por categoria
    const ebooksByCategory = await Ebook.aggregate([
      {
        $group: {
          _id: '$category',
          count: { $sum: 1 }
        }
      },
      {
        $lookup: {
          from: 'categories',
          localField: '_id',
          foreignField: '_id',
          as: 'category'
        }
      },
      {
        $unwind: '$category'
      },
      {
        $project: {
          name: '$category.name',
          count: 1,
          _id: 0
        }
      }
    ]);

    res.json({
      totalUsers,
      totalEbooks,
      totalCategories,
      totalDownloads,
      newUsers,
      topEbooks,
      ebooksByCategory
    });
  } catch (error) {
    res.status(500).json({ message: 'Erro ao buscar estatísticas', error: error.message });
  }
});

// @route   GET /api/stats/user
// @desc    Obter estatísticas do usuário
// @access  Private
router.get('/user', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id)
      .populate({
        path: 'downloadHistory.ebook',
        populate: { path: 'category' }
      });

    const totalDownloads = user.downloadHistory.length;
    const totalFavorites = user.favorites.length;
    
    // Últimos downloads (10)
    const recentDownloads = user.downloadHistory.slice(0, 10);

    res.json({
      totalDownloads,
      totalFavorites,
      recentDownloads
    });
  } catch (error) {
    res.status(500).json({ message: 'Erro ao buscar estatísticas do usuário', error: error.message });
  }
});

export default router;
