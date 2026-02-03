import mongoose from 'mongoose';
import Ebook from './models/Ebook.js';
import Category from './models/Category.js';
import dotenv from 'dotenv';
import dns from 'node:dns/promises';

dotenv.config();

// Fix DNS
dns.setServers(['1.1.1.1', '8.8.8.8']);

const mongoURI = process.env.MONGODB_URI || 'mongodb+srv://andremartins746_db_user:270881270881@ebooksalmeida.ufzwqgc.mongodb.net/ebooks_fitness?retryWrites=true&w=majority&appName=ebooksalmeida';

const cleanOldEbooks = async () => {
  try {
    await mongoose.connect(mongoURI);
    console.log('✅ Conectado ao MongoDB');

    // Buscar ebooks com URLs antigas (que começam com /uploads/)
    const oldEbooks = await Ebook.find({
      $or: [
        { coverImage: { $regex: '^/uploads/' } },
        { pdfFile: { $regex: '^/uploads/' } }
      ]
    });

    console.log(`\n📋 Encontrados ${oldEbooks.length} ebooks com URLs antigas`);

    if (oldEbooks.length > 0) {
      console.log('\n🗑️  Deletando ebooks antigos...');
      
      for (const ebook of oldEbooks) {
        console.log(`   - Deletando: ${ebook.title}`);
        await Ebook.findByIdAndDelete(ebook._id);
      }

      console.log(`\n✅ ${oldEbooks.length} ebooks deletados com sucesso!`);
    } else {
      console.log('\n✅ Nenhum ebook antigo encontrado!');
    }

    // Mostrar estatísticas
    const totalEbooks = await Ebook.countDocuments();
    const totalCategories = await Category.countDocuments();

    console.log('\n📊 Estatísticas atuais:');
    console.log(`   - Total de ebooks: ${totalEbooks}`);
    console.log(`   - Total de categorias: ${totalCategories}`);

    console.log('\n✅ Limpeza concluída!');
    console.log('\n💡 Agora você pode adicionar novos ebooks pelo painel admin.');
    console.log('   Os novos uploads usarão GridFS e funcionarão corretamente.\n');

    process.exit(0);
  } catch (error) {
    console.error('❌ Erro:', error);
    process.exit(1);
  }
};

cleanOldEbooks();
