import mongoose from 'mongoose';

export async function connectDB() {
  try {
    const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/vulnerable-colegio';
    
    await mongoose.connect(mongoUri);
    
    console.log('✓ MongoDB conectado correctamente');
    return mongoose.connection;
  } catch (error) {
    console.error('✗ Error conectando a MongoDB:', error.message);
    process.exit(1);
  }
}

export default mongoose;
