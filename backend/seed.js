/**
 * Script para inicializar la base de datos con datos de prueba
 * Uso: node seed.js
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { hashPassword } from './auth.js';
import {
  User,
  PerfilEstudiante,
  PerfilEmpresa,
  PublicacionEmpleo,
} from './models/index.js';

dotenv.config();

const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/vulnerable-colegio';

async function seed() {
  try {
    await mongoose.connect(mongoUri);
    console.log('✓ Conectado a MongoDB');

    // Limpiar colecciones existentes
    console.log('🗑️  Limpiando colecciones existentes...');
    await User.deleteMany({});
    await PerfilEstudiante.deleteMany({});
    await PerfilEmpresa.deleteMany({});
    await PublicacionEmpleo.deleteMany({});

    // Crear usuarios de prueba - ESTUDIANTES
    console.log('👤 Creando estudiantes...');
    const estudiante1 = await User.create({
      nombre: 'Juan',
      apellido: 'Gino',
      email: 'juan@example.com',
      password_hash: await hashPassword('123456'),
      rol: 'estudiante',
      activo: true,
    });

    const estudiante2 = await User.create({
      nombre: 'María',
      apellido: 'García',
      email: 'maria@example.com',
      password_hash: await hashPassword('123456'),
      rol: 'estudiante',
      activo: true,
    });

    const estudiante3 = await User.create({
      nombre: 'Carlos',
      apellido: 'López',
      email: 'carlos@example.com',
      password_hash: await hashPassword('123456'),
      rol: 'estudiante',
      activo: true,
    });

    // Crear perfiles de estudiantes
    await PerfilEstudiante.create({
      usuario_id: estudiante1._id,
      descripcion: 'Técnico en electricidad industrial con experiencia en PLC',
      intereses: ['Automatización', 'Industria minera'],
      puntuacion_promedio: null,
    });

    await PerfilEstudiante.create({
      usuario_id: estudiante2._id,
      descripcion: 'Mecatrónica, busco experiencia en producción',
      intereses: ['Mecatrónica', 'Manufactura'],
      puntuacion_promedio: null,
    });

    await PerfilEstudiante.create({
      usuario_id: estudiante3._id,
      descripcion: 'Técnico en redes y comunicaciones',
      intereses: ['Redes', 'Telecomunicaciones'],
      puntuacion_promedio: null,
    });

    // Crear usuarios - EMPRESAS
    console.log('🏢 Creando empresas...');
    const empresa1 = await User.create({
      nombre: 'Industrias CMPC',
      email: 'rrhh@cmpc.cl',
      password_hash: await hashPassword('123456'),
      rol: 'empresa',
      activo: true,
    });

    const empresa2 = await User.create({
      nombre: 'TechChile S.A.',
      email: 'contacto@techchile.cl',
      password_hash: await hashPassword('123456'),
      rol: 'empresa',
      activo: true,
    });

    const empresa3 = await User.create({
      nombre: 'Constructora Sur',
      email: 'info@constructorasur.cl',
      password_hash: await hashPassword('123456'),
      rol: 'empresa',
      activo: true,
    });

    // Crear perfiles de empresas
    const perfilEmpresa1 = await PerfilEmpresa.create({
      usuario_id: empresa1._id,
      nombre_empresa: 'Industrias CMPC',
      descripcion: 'Empresa líder en manufactura y producción',
      rubro: 'Manufactura',
      ciudad: 'Concepción',
      region: 'Bío-Bío',
    });

    const perfilEmpresa2 = await PerfilEmpresa.create({
      usuario_id: empresa2._id,
      nombre_empresa: 'TechChile S.A.',
      descripcion: 'Soluciones tecnológicas para empresas',
      rubro: 'Tecnología',
      ciudad: 'Concepción',
      region: 'Bío-Bío',
    });

    const perfilEmpresa3 = await PerfilEmpresa.create({
      usuario_id: empresa3._id,
      nombre_empresa: 'Constructora Sur',
      descripcion: 'Proyectos inmobiliarios y obra civil',
      rubro: 'Construcción',
      ciudad: 'Concepción',
      region: 'Bío-Bío',
    });

    // Crear ofertas de empleo
    console.log('💼 Creando ofertas de empleo...');
    await PublicacionEmpleo.create({
      empresa_id: perfilEmpresa1._id,
      titulo: 'Técnico electricista industrial',
      descripcion:
        'Buscamos técnico en electricidad industrial para mantenimiento preventivo y correctivo de maquinaria en planta.',
      ubicacion: 'Concepción, Bío-Bío',
      salario_min: 650000,
      salario_max: 850000,
      modalidad: 'presencial',
      especialidades_requeridas: ['Electricidad', 'PLC', 'Mantenimiento'],
      activo: true,
      cierre_en: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 días
    });

    await PublicacionEmpleo.create({
      empresa_id: perfilEmpresa1._id,
      titulo: 'Mecatrónico de producción',
      descripcion:
        'Empresa requiere mecatrónico para línea de producción automatizada. Trabajo en turnos.',
      ubicacion: 'Talcahuano, Bío-Bío',
      salario_min: 700000,
      salario_max: 950000,
      modalidad: 'presencial',
      especialidades_requeridas: ['Mecatrónica', 'Neumática', 'Automatización'],
      activo: true,
      cierre_en: new Date(Date.now() + 25 * 24 * 60 * 60 * 1000),
    });

    await PublicacionEmpleo.create({
      empresa_id: perfilEmpresa2._id,
      titulo: 'Soporte técnico en redes',
      descripcion:
        'Técnico en redes para instalación, configuración y soporte de infraestructura de red.',
      ubicacion: 'Los Ángeles, Bío-Bío',
      salario_min: 580000,
      salario_max: 750000,
      modalidad: 'híbrido',
      especialidades_requeridas: ['Redes', 'CCNA', 'Soporte TI'],
      activo: true,
      cierre_en: new Date(Date.now() + 20 * 24 * 60 * 60 * 1000),
    });

    await PublicacionEmpleo.create({
      empresa_id: perfilEmpresa3._id,
      titulo: 'Operario de construcción calificado',
      descripcion:
        'Constructora requiere operarios calificados para proyecto habitacional. Manejo de maquinaria pesada es un plus.',
      ubicacion: 'Concepción, Bío-Bío',
      salario_min: 600000,
      salario_max: 800000,
      modalidad: 'presencial',
      especialidades_requeridas: ['Construcción', 'Obra civil'],
      activo: true,
      cierre_en: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000),
    });

    await PublicacionEmpleo.create({
      empresa_id: perfilEmpresa2._id,
      titulo: 'Programador PLC - automatización',
      descripcion:
        'Técnico con experiencia en programación Siemens TIA Portal. Proyecto en industria minera.',
      ubicacion: 'Remoto / Antofagasta',
      salario_min: 900000,
      salario_max: 1300000,
      modalidad: 'remoto',
      especialidades_requeridas: ['PLC', 'Siemens', 'Automatización'],
      activo: true,
      cierre_en: new Date(Date.now() + 40 * 24 * 60 * 60 * 1000),
    });

    console.log('');
    console.log('════════════════════════════════════════════════');
    console.log('✅ Base de datos inicializada correctamente');
    console.log('════════════════════════════════════════════════');
    console.log('');
    console.log('📊 Datos creados:');
    console.log('   • 3 estudiantes de prueba');
    console.log('   • 3 empresas de prueba');
    console.log('   • 5 ofertas de empleo');
    console.log('');
    console.log('🔐 Credenciales de prueba:');
    console.log('   Usuario: juan@example.com | Contraseña: 123456');
    console.log('   Usuario: rrhh@cmpc.cl | Contraseña: 123456');
    console.log('');

    await mongoose.disconnect();
    console.log('✓ Desconectado de MongoDB');
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

seed();
