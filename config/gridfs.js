import mongoose from 'mongoose';
import { GridFSBucket } from 'mongodb';

let gridfsBucket;

export const initGridFS = () => {
  const conn = mongoose.connection;
  
  // Se já está conectado, inicializa imediatamente
  if (conn.readyState === 1) {
    gridfsBucket = new GridFSBucket(conn.db, {
      bucketName: 'uploads'
    });
    console.log('✅ GridFS inicializado');
  } else {
    // Senão, aguarda a conexão
    conn.once('open', () => {
      gridfsBucket = new GridFSBucket(conn.db, {
        bucketName: 'uploads'
      });
      console.log('✅ GridFS inicializado');
    });
  }
};

export const getGridFSBucket = () => {
  if (!gridfsBucket) {
    throw new Error('GridFS não foi inicializado');
  }
  return gridfsBucket;
};

export default { initGridFS, getGridFSBucket };
