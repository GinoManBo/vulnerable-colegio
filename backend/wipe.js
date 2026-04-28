import mongoose from 'mongoose';
import dotenv from 'dotenv';
import {
  User,
  PerfilEstudiante,
  PerfilEmpresa,
  PublicacionEmpleo,
  Postulacion,
  PreguntaEmpleo,
  CalificacionTrabajo,
  Conversacion,
  Mensaje,
  Notificacion,
} from './models/index.js';

dotenv.config();

const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/vulnerable-colegio';

async function wipe() {
  try {
    await mongoose.connect(mongoUri);
    console.log('✓ Conectado a MongoDB');

    console.log('🗑️  Eliminando todos los datos...');
    await User.deleteMany({});
    await PerfilEstudiante.deleteMany({});
    await PerfilEmpresa.deleteMany({});
    await PublicacionEmpleo.deleteMany({});
    await Postulacion.deleteMany({});
    await PreguntaEmpleo.deleteMany({});
    await CalificacionTrabajo.deleteMany({});
    await Conversacion.deleteMany({});
    await Mensaje.deleteMany({});
    await Notificacion.deleteMany({});

    console.log('✅ Base de datos limpiada correctamente');
    console.log('La aplicación está lista para usar sin datos');

    await mongoose.connection.close();
  } catch (error) {
    console.error('❌ Error limpiando la base de datos:', error.message);
    process.exit(1);
  }
}

wipe();
