import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { hashPassword } from './auth.js';
import {
  User,
  PerfilEstudiante,
  PerfilEmpresa,
  PublicacionEmpleo,
  Postulacion,
  SolicitudPerfil,
} from './models/index.js';

dotenv.config();

const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/vulnerable-colegio';

const ESPECIALIDADES = [
  'Electricidad industrial',
  'Mecatrónica',
  'Redes y comunicaciones',
  'Automatización y PLC',
  'Construcción',
];

const DESTREZAS_POOL = [
  'AutoCAD', 'Arduino', 'Python', 'Linux', 'Neumática', 'Hidráulica',
  'Mantenimiento preventivo', 'Lectura de planos', 'PLC Siemens', 'TIA Portal',
  'CCNA', 'Soldadura', 'Instrumentación', 'Variadores de frecuencia',
  'SCADA', 'HMI', 'Motores eléctricos', 'Tableros eléctricos',
  'Redes TCP/IP', 'Fibra óptica', 'Domótica', 'Robótica',
  'CNC', 'Mecanizado', 'Metrología', 'Diseño 3D',
];

const INTERESES_POOL = [
  'Automatización', 'Industria minera', 'Energías renovables', 'Manufactura',
  'Redes', 'Telecomunicaciones', 'Mecatrónica', 'Construcción',
  'Mantenimiento industrial', 'Programación', 'Robótica', 'IoT',
  'Eficiencia energética', 'Domótica', 'Control de procesos',
];

const CIUDADES = [
  { ciudad: 'Concepción', region: 'Bío-Bío' },
  { ciudad: 'Talcahuano', region: 'Bío-Bío' },
  { ciudad: 'Los Ángeles', region: 'Bío-Bío' },
  { ciudad: 'Chillán', region: 'Ñuble' },
  { ciudad: 'Temuco', region: 'Araucanía' },
  { ciudad: 'Santiago', region: 'Metropolitana' },
];

const RUBROS = [
  'Manufactura', 'Tecnología', 'Construcción', 'Minería',
  'Energía', 'Telecomunicaciones', 'Automatización', 'Logística',
];

const ESTUDIANTES = [
  { nombre: 'Juan', apellido: 'Gino', especialidad: 'Electricidad industrial' },
  { nombre: 'María', apellido: 'García', especialidad: 'Mecatrónica' },
  { nombre: 'Carlos', apellido: 'López', especialidad: 'Redes y comunicaciones' },
  { nombre: 'Ana', apellido: 'Martínez', especialidad: 'Automatización y PLC' },
  { nombre: 'Pedro', apellido: 'Sánchez', especialidad: 'Construcción' },
  { nombre: 'Laura', apellido: 'Rodríguez', especialidad: 'Electricidad industrial' },
  { nombre: 'Diego', apellido: 'Torres', especialidad: 'Mecatrónica' },
  { nombre: 'Valentina', apellido: 'Muñoz', especialidad: 'Redes y comunicaciones' },
  { nombre: 'Felipe', apellido: 'Hernández', especialidad: 'Automatización y PLC' },
  { nombre: 'Camila', apellido: 'Díaz', especialidad: 'Construcción' },
  { nombre: 'Andrés', apellido: 'Morales', especialidad: 'Electricidad industrial' },
  { nombre: 'Sofía', apellido: 'Vargas', especialidad: 'Mecatrónica' },
  { nombre: 'Matías', apellido: 'Castillo', especialidad: 'Redes y comunicaciones' },
  { nombre: 'Isidora', apellido: 'Rojas', especialidad: 'Automatización y PLC' },
  { nombre: 'Joaquín', apellido: 'Silva', especialidad: 'Construcción' },
  { nombre: 'Fernanda', apellido: 'Cortés', especialidad: 'Electricidad industrial' },
  { nombre: 'Sebastián', apellido: 'Fuentes', especialidad: 'Mecatrónica' },
  { nombre: 'Catalina', apellido: 'Espinoza', especialidad: 'Redes y comunicaciones' },
  { nombre: 'Tomás', apellido: 'Guzmán', especialidad: 'Automatización y PLC' },
  { nombre: 'Josefa', apellido: 'Ríos', especialidad: 'Construcción' },
];

const EMPRESAS = [
  { nombre: 'Industrias CMPC', rubro: 'Manufactura', ciudad: 'Concepción', region: 'Bío-Bío', sitio_web: 'https://www.cmpc.cl', telefono: '+56 41 234 5678' },
  { nombre: 'TechChile S.A.', rubro: 'Tecnología', ciudad: 'Concepción', region: 'Bío-Bío', sitio_web: 'https://www.techchile.cl', telefono: '+56 41 345 6789' },
  { nombre: 'Constructora Sur', rubro: 'Construcción', ciudad: 'Talcahuano', region: 'Bío-Bío', sitio_web: 'https://www.constructorasur.cl', telefono: '+56 41 456 7890' },
  { nombre: 'Minera Collahuasi', rubro: 'Minería', ciudad: 'Chillán', region: 'Ñuble', sitio_web: 'https://www.collahuasi.cl', telefono: '+56 42 567 8901' },
  { nombre: 'Enel Green Power', rubro: 'Energía', ciudad: 'Los Ángeles', region: 'Bío-Bío', sitio_web: 'https://www.enel.cl', telefono: '+56 43 678 9012' },
  { nombre: 'Entel Chile', rubro: 'Telecomunicaciones', ciudad: 'Concepción', region: 'Bío-Bío', sitio_web: 'https://www.entel.cl', telefono: '+56 41 789 0123' },
  { nombre: 'Siemens Chile', rubro: 'Automatización', ciudad: 'Santiago', region: 'Metropolitana', sitio_web: 'https://www.siemens.cl', telefono: '+56 2 2890 1234' },
  { nombre: 'Falabella Logística', rubro: 'Logística', ciudad: 'Temuco', region: 'Araucanía', sitio_web: 'https://www.falabella.cl', telefono: '+56 45 901 2345' },
  { nombre: 'Arauco S.A.', rubro: 'Manufactura', ciudad: 'Concepción', region: 'Bío-Bío', sitio_web: 'https://www.arauco.cl', telefono: '+56 41 012 3456' },
  { nombre: 'Codelco División Bio-Bío', rubro: 'Minería', ciudad: 'Los Ángeles', region: 'Bío-Bío', sitio_web: 'https://www.codelco.cl', telefono: '+56 43 123 4567' },
];

function pickRandom(arr, min, max) {
  const count = min + Math.floor(Math.random() * (max - min + 1));
  const shuffled = [...arr].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count);
}

function pickOne(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

const DESCRIPCIONES_EST = [
  'Técnico con sólida formación en mi especialidad, buscando mi primera experiencia laboral profesional. Responsable, proactivo y con ganas de aprender.',
  'Egresado con prácticas en empresas del sector. Manejo herramientas especializadas y estoy disponible para trabajar de inmediato.',
  'Profesional técnico comprometido con la excelencia. He realizado proyectos académicos destacados y busco crecer profesionalmente.',
  'Técnico con enfoque en seguridad industrial y trabajo en equipo. Disponible para turnos rotativos y desplazamiento.',
  'Egresado destacado con certificaciones complementarias. Busco aportar mis conocimientos técnicos en un entorno desafiante.',
  'Profesional técnico con experiencia en mantenimiento preventivo y correctivo. Orientado a resultados y mejora continua.',
  'Técnico con habilidades en diagnóstico y resolución de problemas. Capacidad de adaptación y aprendizaje rápido.',
  'Egresado con dominio de software especializado y herramientas de última generación. Comprometido con la calidad.',
];

const DESCRIPCIONES_EMP = [
  'Empresa líder en el sector con más de 20 años de trayectoria. Ofrecemos estabilidad laboral, beneficios competitivos y oportunidades de crecimiento.',
  'Compañía innovadora que busca talento joven para integrar equipos de trabajo dinámicos. Ambiente laboral colaborativo y tecnología de punta.',
  'Organización con presencia nacional, comprometida con el desarrollo profesional de sus colaboradores. Capacitación continua y buen clima laboral.',
  'Empresa en expansión que valora la proactividad y el compromiso. Ofrecemos proyectos desafiantes y desarrollo de carrera.',
  'Corporación con estándares internacionales de calidad. Buscamos profesionales técnicos que quieran crecer con nosotros.',
  'Empresa con foco en sustentabilidad y responsabilidad social. Ofrecemos condiciones laborales óptimas y estabilidad.',
];

async function seed() {
  try {
    await mongoose.connect(mongoUri);
    console.log('✓ Conectado a MongoDB');

    // Limpiar colecciones
    console.log('🗑️  Limpiando colecciones existentes...');
    await User.deleteMany({});
    await PerfilEstudiante.deleteMany({});
    await PerfilEmpresa.deleteMany({});
    await PublicacionEmpleo.deleteMany({});
    await Postulacion.deleteMany({});
    await SolicitudPerfil.deleteMany({});

    // ── ADMIN ──
    console.log('🛡️  Creando administrador...');
    const admin = await User.create({
      nombre: 'Admin',
      apellido: 'Sistema',
      email: 'admin@admin.com',
      password_hash: await hashPassword('123456'),
      rol: 'admin',
      activo: true,
    });

    // ── EMPRESAS ──
    console.log('🏢 Creando empresas...');
    const perfilesEmpresa = [];
    for (const emp of EMPRESAS) {
      const email = emp.nombre.toLowerCase()
        .replace(/[.]/g, '')
        .replace(/\s+/g, '')
        .replace(/[áàäâ]/g, 'a')
        .replace(/[éèëê]/g, 'e')
        .replace(/[íìïî]/g, 'i')
        .replace(/[óòöô]/g, 'o')
        .replace(/[úùüû]/g, 'u') + '@gmail.com';

      const user = await User.create({
        nombre: emp.nombre,
        apellido: '',
        email,
        password_hash: await hashPassword('123456'),
        rol: 'empresa',
        activo: true,
      });

      const perfil = await PerfilEmpresa.create({
        usuario_id: user._id,
        nombre_empresa: emp.nombre,
        descripcion: pickOne(DESCRIPCIONES_EMP),
        rubro: emp.rubro,
        sitio_web: emp.sitio_web,
        telefono: emp.telefono,
        ciudad: emp.ciudad,
        region: emp.region,
      });

      // Crear solicitud aprobada para verificar
      await SolicitudPerfil.create({
        usuario_id: user._id,
        tipo: 'creacion',
        rol: 'empresa',
        datos_solicitados: {
          nombre_empresa: emp.nombre,
          descripcion: perfil.descripcion,
          rubro: emp.rubro,
          sitio_web: emp.sitio_web,
          telefono: emp.telefono,
          ciudad: emp.ciudad,
          region: emp.region,
        },
        estado: 'aprobada',
        revisado_por: admin._id,
        revisado_en: new Date(),
      });

      perfilesEmpresa.push(perfil);
    }

    // ── ESTUDIANTES ──
    console.log('👤 Creando estudiantes...');
    const perfilesEstudiante = [];
    for (const est of ESTUDIANTES) {
      const email = `${est.nombre.toLowerCase().replace(/[áàäâ]/g,'a').replace(/[éèëê]/g,'e').replace(/[íìïî]/g,'i').replace(/[óòöô]/g,'o').replace(/[úùüû]/g,'u')}${est.apellido.toLowerCase().replace(/[áàäâ]/g,'a').replace(/[éèëê]/g,'e').replace(/[íìïî]/g,'i').replace(/[óòöô]/g,'o').replace(/[úùüû]/g,'u')}@gmail.com`;

      const user = await User.create({
        nombre: est.nombre,
        apellido: est.apellido,
        email,
        password_hash: await hashPassword('123456'),
        rol: 'estudiante',
        activo: true,
      });

      const ciudadInfo = pickOne(CIUDADES);
      const destrezas = pickRandom(DESTREZAS_POOL, 4, 8);
      const intereses = pickRandom(INTERESES_POOL, 2, 4);

      const perfil = await PerfilEstudiante.create({
        usuario_id: user._id,
        descripcion: pickOne(DESCRIPCIONES_EST),
        especialidad: est.especialidad,
        ciudad: ciudadInfo.ciudad,
        telefono: `+56 9 ${Math.floor(1000 + Math.random() * 9000)} ${Math.floor(1000 + Math.random() * 9000)}`,
        linkedin: `https://linkedin.com/in/${est.nombre.toLowerCase()}-${est.apellido.toLowerCase()}`,
        intereses,
        destrezas,
      });

      // Crear solicitud aprobada para verificar
      await SolicitudPerfil.create({
        usuario_id: user._id,
        tipo: 'creacion',
        rol: 'estudiante',
        datos_solicitados: {
          descripcion: perfil.descripcion,
          especialidad: est.especialidad,
          ciudad: ciudadInfo.ciudad,
          telefono: perfil.telefono,
          linkedin: perfil.linkedin,
          intereses,
          destrezas,
        },
        estado: 'aprobada',
        revisado_por: admin._id,
        revisado_en: new Date(),
      });

      perfilesEstudiante.push(perfil);
    }

    // ── OFERTAS DE EMPLEO ──
    console.log('💼 Creando ofertas de empleo...');
    const ofertasData = [
      { titulo: 'Técnico electricista industrial', desc: 'Buscamos técnico en electricidad industrial para mantenimiento preventivo y correctivo de maquinaria en planta. Experiencia en tableros eléctricos y motores de media tensión.', esp: ['Electricidad industrial'], salMin: 650000, salMax: 850000, mod: 'presencial' },
      { titulo: 'Mecatrónico de producción', desc: 'Empresa requiere mecatrónico para línea de producción automatizada. Trabajo en turnos rotativos. Se valora experiencia en PLC y neumática.', esp: ['Mecatrónica'], salMin: 700000, salMax: 950000, mod: 'presencial' },
      { titulo: 'Soporte técnico en redes', desc: 'Técnico en redes para instalación, configuración y soporte de infraestructura de red corporativa. Certificación CCNA deseable.', esp: ['Redes y comunicaciones'], salMin: 580000, salMax: 750000, mod: 'híbrido' },
      { titulo: 'Operario de construcción calificado', desc: 'Constructora requiere operarios calificados para proyecto habitacional. Manejo de maquinaria pesada es un plus.', esp: ['Construcción'], salMin: 600000, salMax: 800000, mod: 'presencial' },
      { titulo: 'Programador PLC - automatización', desc: 'Técnico con experiencia en programación Siemens TIA Portal. Proyecto en industria minera. Disponibilidad para viajar.', esp: ['Automatización y PLC'], salMin: 900000, salMax: 1300000, mod: 'remoto' },
      { titulo: 'Técnico en mantenimiento eléctrico', desc: 'Mantenimiento preventivo y correctivo de sistemas eléctricos en planta industrial. Conocimientos en instrumentación.', esp: ['Electricidad industrial'], salMin: 720000, salMax: 920000, mod: 'presencial' },
      { titulo: 'Analista de redes y telecomunicaciones', desc: 'Administración de red corporativa, configuración de equipos Cisco, soporte nivel 2. Experiencia en fibra óptica.', esp: ['Redes y comunicaciones'], salMin: 680000, salMax: 880000, mod: 'presencial' },
      { titulo: 'Técnico en automatización industrial', desc: 'Programación y mantenimiento de sistemas SCADA, HMI y PLC. Experiencia en Siemens o Allen Bradley.', esp: ['Automatización y PLC'], salMin: 850000, salMax: 1100000, mod: 'presencial' },
      { titulo: 'Mecánico de mantenimiento', desc: 'Mantenimiento de equipos mecánicos en planta. Conocimientos en soldadura, mecanizado y lectura de planos.', esp: ['Mecatrónica'], salMin: 650000, salMax: 820000, mod: 'presencial' },
      { titulo: 'Supervisor de obra', desc: 'Supervisión de avance de obra civil, control de calidad y gestión de equipos. Experiencia mínima 2 años.', esp: ['Construcción'], salMin: 900000, salMax: 1200000, mod: 'presencial' },
      { titulo: 'Técnico en energías renovables', desc: 'Instalación y mantenimiento de sistemas fotovoltaicos. Conocimientos en electricidad industrial y normativa SEC.', esp: ['Electricidad industrial'], salMin: 750000, salMax: 980000, mod: 'presencial' },
      { titulo: 'Especialista en domótica', desc: 'Diseño e instalación de sistemas de automatización residencial. Manejo de protocolos KNX, Zigbee y Z-Wave.', esp: ['Automatización y PLC'], salMin: 700000, salMax: 950000, mod: 'híbrido' },
      { titulo: 'Técnico en instrumentación', desc: 'Calibración y mantenimiento de instrumentos de medición industrial. Conocimientos en lazos de control.', esp: ['Mecatrónica'], salMin: 780000, salMax: 1000000, mod: 'presencial' },
      { titulo: 'Administrador de redes Linux', desc: 'Administración de servidores Linux, scripting en Python, monitoreo con Nagios/Zabbix. Disponibilidad turno.', esp: ['Redes y comunicaciones'], salMin: 800000, salMax: 1050000, mod: 'remoto' },
      { titulo: 'Técnico en soldadura industrial', desc: 'Soldadura MIG/TIG en acero al carbono e inoxidable. Lectura de planos y normas AWS.', esp: ['Construcción'], salMin: 620000, salMax: 850000, mod: 'presencial' },
      { titulo: 'Técnico en robótica industrial', desc: 'Programación y mantenimiento de robots industriales ABB/KUKA. Experiencia en celdas robotizadas.', esp: ['Mecatrónica', 'Automatización y PLC'], salMin: 950000, salMax: 1300000, mod: 'presencial' },
      { titulo: 'Electricista de edificaciones', desc: 'Instalación eléctrica en proyectos habitacionales. Conocimiento de normativa eléctrica NCH Elec 4/2003.', esp: ['Electricidad industrial'], salMin: 550000, salMax: 720000, mod: 'presencial' },
      { titulo: 'Técnico en telecomunicaciones', desc: 'Instalación de redes de fibra óptica, cableado estructurado y sistemas de CCTV. Disponibilidad para terreno.', esp: ['Redes y comunicaciones'], salMin: 600000, salMax: 780000, mod: 'presencial' },
      { titulo: 'Operador de planta CNC', desc: 'Operación y programación de tornos y fresadoras CNC. Experiencia en Fanuc o Siemens.', esp: ['Mecatrónica'], salMin: 700000, salMax: 900000, mod: 'presencial' },
      { titulo: 'Técnico en climatización', desc: 'Instalación y mantenimiento de sistemas HVAC. Conocimientos en electricidad y refrigeración.', esp: ['Electricidad industrial'], salMin: 580000, salMax: 750000, mod: 'presencial' },
    ];

    const ofertasCreadas = [];
    for (const oferta of ofertasData) {
      const empresa = pickOne(perfilesEmpresa);
      const ciudadInfo = pickOne(CIUDADES);
      const diasCierre = 10 + Math.floor(Math.random() * 40);
      const publicadoEn = new Date(Date.now() - Math.random() * 15 * 24 * 60 * 60 * 1000);

      const pub = await PublicacionEmpleo.create({
        empresa_id: empresa._id,
        titulo: oferta.titulo,
        descripcion: oferta.desc,
        ubicacion: `${ciudadInfo.ciudad}, ${ciudadInfo.region}`,
        salario_min: oferta.salMin,
        salario_max: oferta.salMax,
        modalidad: oferta.mod,
        especialidades_requeridas: oferta.esp,
        activo: true,
        cierre_en: new Date(Date.now() + diasCierre * 24 * 60 * 60 * 1000),
        publicado_en: publicadoEn,
        puestos_disponibles: 1 + Math.floor(Math.random() * 5),
      });
      ofertasCreadas.push(pub);
    }

    // ── POSTULACIONES ──
    console.log('📝 Creando postulaciones...');
    const estados = ['pendiente', 'en_revision', 'aceptada', 'contratado', 'rechazada'];
    for (const perfil of perfilesEstudiante.slice(0, 12)) {
      const numPostulaciones = 1 + Math.floor(Math.random() * 4);
      const ofertasRandom = [...ofertasCreadas].sort(() => 0.5 - Math.random()).slice(0, numPostulaciones);
      for (const oferta of ofertasRandom) {
        await Postulacion.create({
          empleo_id: oferta._id,
          estudiante_id: perfil._id,
          estado: pickOne(estados),
          carta_presentacion: `Me interesa esta oportunidad porque mi formación en ${perfil.especialidad} se ajusta a los requisitos. Soy responsable y tengo disponibilidad inmediata.`,
        });
      }
    }

    // ── RESUMEN ──
    console.log('');
    console.log('═══════════════════════════════════════════════════════════');
    console.log('✅ Base de datos inicializada correctamente');
    console.log('═══════════════════════════════════════════════════════════');
    console.log('');
    console.log(`📊 Datos creados:`);
    console.log(`   • 1 administrador`);
    console.log(`   • ${ESTUDIANTES.length} estudiantes verificados`);
    console.log(`   ${EMPRESAS.length} empresas verificadas`);
    console.log(`   • ${ofertasCreadas.length} ofertas de empleo`);
    console.log(`   • Postulaciones aleatorias creadas`);
    console.log('');
    console.log('🔐 Credenciales (contraseña: 123456 para todos):');
    console.log('   Admin:   admin@admin.com');
    console.log('   Estudiantes: {nombre}{apellido}@gmail.com');
    console.log('   Empresas:  {nombreempresa}@gmail.com');
    console.log('');
    console.log('💡 Ejemplos de login:');
    console.log('   juangino@gmail.com');
    console.log('   mariagarcia@gmail.com');
    console.log('   industriascmpc@gmail.com');
    console.log('');

    await mongoose.disconnect();
    console.log('✓ Desconectado de MongoDB');
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

seed();
