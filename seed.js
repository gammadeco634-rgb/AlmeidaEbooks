import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from './models/User.js';
import Category from './models/Category.js';
import Ebook from './models/Ebook.js';
import dns from 'node:dns/promises';


dotenv.config();
// Fix para DNS em Node.js v22+ no Windows (resolve querySrv ECONNREFUSED)
// Força o uso de servidores DNS públicos (Cloudflare e Google)
dns.setServers(['1.1.1.1', '8.8.8.8']);


const categories = [
  { name: 'Musculação', description: 'Treinos e técnicas de musculação', icon: '💪', color: '#EF4444' },
  { name: 'Nutrição', description: 'Dietas e alimentação saudável', icon: '🥗', color: '#10B981' },
  { name: 'Cardio', description: 'Exercícios cardiovasculares', icon: '🏃', color: '#3B82F6' },
  { name: 'Yoga', description: 'Práticas de yoga e meditação', icon: '🧘', color: '#9333EA' },
  { name: 'Suplementação', description: 'Guias sobre suplementos', icon: '💊', color: '#F59E0B' },
  { name: 'Emagrecimento', description: 'Estratégias para perda de peso', icon: '🔥', color: '#EC4899' }
];

const users = [
  {
    name: 'Admin',
    email: 'admin@fitness.com',
    password: 'admin123',
    role: 'admin'
  },
  {
    name: 'Usuário Teste',
    email: 'user@fitness.com',
    password: 'user123',
    role: 'user'
  }
];

const seedDatabase = async () => {
  try {
    console.log('🌱 Conectando ao MongoDB...');
    const mongoOptions = {
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    };
    await mongoose.connect('mongodb+srv://andremartins746_db_user:270881270881@ebooksalmeida.ufzwqgc.mongodb.net/ebooks_fitness?retryWrites=true&w=majority', mongoOptions);
    console.log('✅ Conectado!');

    // Limpar dados existentes
    console.log('🗑️  Limpando dados antigos...');
    await User.deleteMany({});
    await Category.deleteMany({});
    await Ebook.deleteMany({});

    // Criar usuários
    console.log('👥 Criando usuários...');
    const createdUsers = await User.create(users);
    console.log(`✅ ${createdUsers.length} usuários criados!`);

    // Criar categorias
    console.log('📁 Criando categorias...');
    const createdCategories = await Category.create(categories);
    console.log(`✅ ${createdCategories.length} categorias criadas!`);

    console.log('\n✨ Banco de dados populado com sucesso!');
    console.log('\n📝 Credenciais de acesso:');
    console.log('Admin: admin@fitness.com / admin123');
    console.log('Usuário: user@fitness.com / user123');
    console.log('\n⚠️  IMPORTANTE: Adicione ebooks através do painel admin!');

    process.exit(0);
  } catch (error) {
    console.error('❌ Erro ao popular banco de dados:', error);
    process.exit(1);
  }
};

seedDatabase();
