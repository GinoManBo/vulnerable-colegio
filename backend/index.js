import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import jwt from 'jsonwebtoken';
import path from 'path';
import { fileURLToPath } from 'url';
import multer from 'multer';
import fs from 'fs';
import { connectDB } from './db.js';
import { hashPassword, comparePassword } from './auth.js';
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
  SolicitudPerfil,
  SolicitudCV,
  AppConfig,
  AuditLog,
  HistorialTrabajo,
} from './models/index.js';

dotenv.config();

const app  = express();
const PORT = process.env.PORT || 5000;

// Para resolver rutas en ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname  = path.dirname(__filename);

// Directorio de uploads para CVs
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });

// Configurar multer para subida de archivos
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadsDir),
  filename: (req, file, cb) => {
    const uniqueName = `${Date.now()}-${Math.round(Math.random() * 1E9)}-${file.originalname}`;
    cb(null, uniqueName);
  },
});
const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB max
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/pdf') cb(null, true);
    else cb(new Error('Solo se permiten archivos PDF'));
  },
});

const uploadImage = multer({
  storage,
  limits: { fileSize: 2 * 1024 * 1024 }, // 2MB max
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) cb(null, true);
    else cb(new Error('Solo se permiten archivos de imagen'));
  },
});

// CORS: permitir múltiples orígenes (desarrollo + producción)
const allowedOrigins = (process.env.CLIENT_URL || 'http://localhost:5173')
  .split(',')
  .map(o => o.trim());

app.use(cors({
  origin: (origin, callback) => {
    // Permitir requests sin origin (ej. Postman, mobile apps)
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) return callback(null, true);
    // En producción, si NODE_ENV no es development, permitir cualquier origin
    if (process.env.NODE_ENV === 'production') return callback(null, true);
    callback(new Error('No permitido por CORS'));
  },
  credentials: true,
}));
app.use(express.json());

// Servir archivos estáticos del frontend compilado (carpeta dist/)
const distPath = path.resolve(__dirname, '..', 'dist');
app.use(express.static(distPath));

// Servir archivos de uploads (CVs)
app.use('/uploads', express.static(uploadsDir));

connectDB();

// Helper para obtener foto de perfil de un usuario
async function getUserFoto(usuarioId, rol) {
  try {
    if (rol === 'estudiante') {
      const perfil = await PerfilEstudiante.findOne({ usuario_id: usuarioId }).select('foto_perfil_url');
      return perfil?.foto_perfil_url || null;
    } else if (rol === 'empresa') {
      const perfil = await PerfilEmpresa.findOne({ usuario_id: usuarioId }).select('logo_url');
      return perfil?.logo_url || null;
    }
    return null;
  } catch {
    return null;
  }
}

// ─────────────────────────────────────────────
//  HELPERS JWT
// ─────────────────────────────────────────────
function generarToken(id) {
  return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '7d' });
}

async function auth(req, res, next) {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer '))
    return res.status(401).json({ error: 'Token requerido' });
  try {
    const decoded = jwt.verify(header.split(' ')[1], process.env.JWT_SECRET);
    const usuario = await User.findById(decoded.id).select('-password_hash');
    if (!usuario || !usuario.activo)
      return res.status(401).json({ error: 'Usuario inválido o inactivo' });
    req.usuario = usuario;
    // Actualizar ultimaConexion (throttle: solo si pasaron > 60s)
    if (!usuario.ultimaConexion || (Date.now() - new Date(usuario.ultimaConexion).getTime()) > 60000) {
      usuario.ultimaConexion = new Date();
      await usuario.save({ validateBeforeSave: false });
    }
    next();
  } catch {
    return res.status(401).json({ error: 'Token inválido o expirado' });
  }
}

function soloRoles(...roles) {
  return (req, res, next) => {
    if (!roles.includes(req.usuario?.rol))
      return res.status(403).json({ error: 'Sin permisos' });
    next();
  };
}

// ─────────────────────────────────────────────
//  AUTH
// ─────────────────────────────────────────────

app.post('/api/auth/registro', async (req, res) => {
  try {
    const { nombre, apellido = '', email, password, rol, nombre_empresa, especialidad } = req.body;

    if (!nombre || !email || !password || !rol)
      return res.status(400).json({ error: 'Faltan campos requeridos' });
    if (!['estudiante', 'empresa'].includes(rol))
      return res.status(400).json({ error: 'Rol inválido' });
    if (password.length < 6)
      return res.status(400).json({ error: 'Contraseña mínimo 6 caracteres' });
    if (await User.findOne({ email }))
      return res.status(409).json({ error: 'El email ya está registrado' });

    const usuario = await User.create({
      nombre, apellido, email,
      password_hash: await hashPassword(password),
      rol, activo: true,
    });

    const aprobacionAuto = await getConfig('aprobacion_auto_perfiles', false);

    if (rol === 'estudiante') {
      const datosPerfil = { usuario_id: usuario._id, especialidad: especialidad || '' };
      if (aprobacionAuto) {
        await PerfilEstudiante.create(datosPerfil);
      } else {
        await SolicitudPerfil.create({
          usuario_id: usuario._id,
          tipo: 'creacion',
          rol: 'estudiante',
          datos_solicitados: datosPerfil,
        });
      }
    } else {
      if (!nombre_empresa)
        return res.status(400).json({ error: 'Nombre de empresa requerido' });
      const datosPerfil = { usuario_id: usuario._id, nombre_empresa: nombre_empresa.trim() };
      if (aprobacionAuto) {
        await PerfilEmpresa.create(datosPerfil);
      } else {
        await SolicitudPerfil.create({
          usuario_id: usuario._id,
          tipo: 'creacion',
          rol: 'empresa',
          datos_solicitados: datosPerfil,
        });
      }
    }

    res.status(201).json({
      token: generarToken(usuario._id),
      usuario: { _id: usuario._id, nombre: usuario.nombre, apellido: usuario.apellido, email: usuario.email, rol: usuario.rol },
      perfilPendiente: !aprobacionAuto,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password)
      return res.status(400).json({ error: 'Email y contraseña requeridos' });

    const usuario = await User.findOne({ email });
    if (!usuario) return res.status(401).json({ error: 'Credenciales inválidas' });
    if (!usuario.activo) return res.status(403).json({ error: 'Cuenta suspendida. Contacta al administrador.' });

    if (!(await comparePassword(password, usuario.password_hash)))
      return res.status(401).json({ error: 'Credenciales inválidas' });

    let perfil = null;
    if (usuario.rol === 'empresa')
      perfil = await PerfilEmpresa.findOne({ usuario_id: usuario._id }).select('nombre_empresa logo_url');
    else if (usuario.rol === 'estudiante')
      perfil = await PerfilEstudiante.findOne({ usuario_id: usuario._id }).select('foto_perfil_url especialidad');

    // Verificar si tiene solicitud pendiente
    let perfilPendiente = false;
    if (usuario.rol !== 'admin') {
      const solicitudPendiente = await SolicitudPerfil.findOne({ usuario_id: usuario._id, estado: 'pendiente' });
      perfilPendiente = !!solicitudPendiente;
    }

    res.json({
      token: generarToken(usuario._id),
      usuario: {
        _id: usuario._id, nombre: usuario.nombre, apellido: usuario.apellido,
        email: usuario.email, rol: usuario.rol,
        foto:          perfil?.foto_perfil_url ?? perfil?.logo_url ?? null,
        nombre_empresa:perfil?.nombre_empresa ?? null,
        perfilPendiente,
      },
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/auth/me — el frontend lo llama al recargar la página para verificar sesión
app.get('/api/auth/me', auth, async (req, res) => {
  try {
    const u = req.usuario;
    let perfil = null;
    if (u.rol === 'empresa')
      perfil = await PerfilEmpresa.findOne({ usuario_id: u._id }).select('nombre_empresa logo_url ciudad rubro');
    else if (u.rol === 'estudiante')
      perfil = await PerfilEstudiante.findOne({ usuario_id: u._id }).select('foto_perfil_url especialidad ciudad');

    // Verificar si tiene solicitud pendiente
    let perfilPendiente = false;
    if (u.rol !== 'admin') {
      const solicitudPendiente = await SolicitudPerfil.findOne({ usuario_id: u._id, estado: 'pendiente' });
      perfilPendiente = !!solicitudPendiente;
    }

    res.json({
      _id: u._id, nombre: u.nombre, apellido: u.apellido,
      email: u.email, rol: u.rol,
      foto:          perfil?.foto_perfil_url ?? perfil?.logo_url ?? null,
      nombre_empresa:perfil?.nombre_empresa ?? null,
      ciudad:        perfil?.ciudad ?? null,
      perfilPendiente,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─────────────────────────────────────────────
//  PERFIL
// ─────────────────────────────────────────────

app.get('/api/perfil/me', auth, async (req, res) => {
  try {
    let perfil = null;
    if (req.usuario.rol === 'estudiante')
      perfil = await PerfilEstudiante.findOne({ usuario_id: req.usuario._id });
    else if (req.usuario.rol === 'empresa')
      perfil = await PerfilEmpresa.findOne({ usuario_id: req.usuario._id });

    // Verificar si tiene solicitud pendiente
    let perfilPendiente = false;
    if (req.usuario.rol !== 'admin') {
      const solicitudPendiente = await SolicitudPerfil.findOne({ usuario_id: req.usuario._id, estado: 'pendiente' });
      perfilPendiente = !!solicitudPendiente;
    }

    res.json({ ...req.usuario.toObject(), perfil, perfilPendiente });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/perfil/usuario/:usuarioId', auth, async (req, res) => {
  try {
    const usuario = await User.findById(req.params.usuarioId).select('nombre apellido email rol activo');
    if (!usuario) return res.status(404).json({ error: 'Usuario no encontrado' });

    let perfil = null;
    if (usuario.rol === 'estudiante')
      perfil = await PerfilEstudiante.findOne({ usuario_id: usuario._id });
    else if (usuario.rol === 'empresa')
      perfil = await PerfilEmpresa.findOne({ usuario_id: usuario._id });

    res.json({ ...usuario.toObject(), perfil });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/perfil/usuario/:usuarioId/ofertas', auth, async (req, res) => {
  try {
    const perfil = await PerfilEmpresa.findOne({ usuario_id: req.params.usuarioId });
    if (!perfil) return res.status(404).json({ error: 'Perfil de empresa no encontrado' });

    const ofertas = await PublicacionEmpleo.find({ empresa_id: perfil._id, activo: true }).sort({ publicado_en: -1 });
    res.json(ofertas);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/perfil/mis-postulaciones', auth, soloRoles('estudiante'), async (req, res) => {
  try {
    const perfil = await PerfilEstudiante.findOne({ usuario_id: req.usuario._id });
    if (!perfil) return res.json([]);

    const posts = await Postulacion.find({ estudiante_id: perfil._id })
      .populate({
        path: 'empleo_id',
        select: 'titulo ubicacion modalidad salario_min salario_max empresa_id publicado_en activo',
        populate: { path: 'empresa_id', select: 'nombre_empresa logo_url' }
      })
      .sort({ postulado_en: -1 });

    res.json(posts);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/perfil/postulaciones/:postId/retirar', auth, soloRoles('estudiante'), async (req, res) => {
  try {
    const perfil = await PerfilEstudiante.findOne({ usuario_id: req.usuario._id });
    if (!perfil) return res.status(404).json({ error: 'Perfil no encontrado' });

    const post = await Postulacion.findOne({ _id: req.params.postId, estudiante_id: perfil._id });
    if (!post) return res.status(404).json({ error: 'Postulación no encontrada' });

    await Postulacion.deleteOne({ _id: req.params.postId });
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Heartbeat: actualizar ultimaConexion explícitamente
app.post('/api/auth/heartbeat', auth, async (req, res) => {
  try {
    req.usuario.ultimaConexion = new Date();
    await req.usuario.save({ validateBeforeSave: false });
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Logout: marcar como desconectado
app.post('/api/auth/logout', auth, async (req, res) => {
  try {
    req.usuario.ultimaConexion = new Date(0);
    await req.usuario.save({ validateBeforeSave: false });
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Obtener estado online de un usuario
app.get('/api/usuarios/:id/en-linea', auth, async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('ultimaConexion');
    if (!user) return res.status(404).json({ error: 'Usuario no encontrado' });
    res.json({ enLinea: user.enLinea, ultimaConexion: user.ultimaConexion });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Subir CV (PDF)
app.post('/api/perfil/cv', auth, soloRoles('estudiante'), upload.single('cv'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'Archivo PDF requerido' });

    const cvUrl = `/uploads/${req.file.filename}`;

    // Actualizar el perfil del estudiante con la URL del CV
    await PerfilEstudiante.findOneAndUpdate(
      { usuario_id: req.usuario._id },
      { curriculum_url: cvUrl },
      { upsert: true, returnDocument: 'after' }
    );

    // Si el usuario ya está verificado, crear solicitud de aprobación
    const solicitudAprobada = await SolicitudPerfil.findOne({ usuario_id: req.usuario._id, estado: 'aprobada' });
    const solicitudPendiente = await SolicitudPerfil.findOne({ usuario_id: req.usuario._id, estado: 'pendiente' });

    if (solicitudAprobada && !solicitudPendiente) {
      await SolicitudCV.create({
        usuario_id: req.usuario._id,
        curriculum_url: cvUrl,
        estado: 'pendiente',
      });

      await Notificacion.create({
        usuario_id: req.usuario._id,
        tipo: 'otra',
        titulo: 'CV enviado para revisión',
        texto: 'Tu currículum ha sido enviado al administrador para su revisión.',
        link: '/perfil',
      });

      const admins = await User.find({ rol: 'admin' }).select('_id');
      for (const admin of admins) {
        await Notificacion.create({
          usuario_id: admin._id,
          tipo: 'otra',
          titulo: 'Nuevo CV para revisar',
          texto: `${req.usuario.nombre} ${req.usuario.apellido} subió un nuevo currículum.`,
          link: '/admin',
        });
      }

      return res.json({ ok: true, cvUrl, pendiente: true });
    }

    res.json({ ok: true, cvUrl, pendiente: false });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/perfil/foto', auth, uploadImage.single('foto'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'Archivo de imagen requerido' });

    const fotoUrl = `/uploads/${req.file.filename}`;

    if (req.usuario.rol === 'estudiante') {
      await PerfilEstudiante.findOneAndUpdate(
        { usuario_id: req.usuario._id },
        { foto_perfil_url: fotoUrl },
        { upsert: true, returnDocument: 'after' }
      );
    } else if (req.usuario.rol === 'empresa') {
      await PerfilEmpresa.findOneAndUpdate(
        { usuario_id: req.usuario._id },
        { logo_url: fotoUrl },
        { upsert: true, returnDocument: 'after' }
      );
    }

    res.json({ ok: true, fotoUrl });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─────────────────────────────────────────────
//  OFERTAS (públicas y privadas)
//  IMPORTANTE: /mis-ofertas debe ir ANTES de /:id
// ─────────────────────────────────────────────

// Stats públicas (sin auth): ofertas activas, empresas, estudiantes online
app.get('/api/stats', async (req, res) => {
  try {
    const dosMinAtras = new Date(Date.now() - 120000);
    const [ofertasActivas, empresasRegistradas, estudiantesOnline] = await Promise.all([
      PublicacionEmpleo.countDocuments({ activo: true }),
      User.countDocuments({ rol: 'empresa', activo: true }),
      User.countDocuments({ rol: 'estudiante', activo: true, ultimaConexion: { $gte: dosMinAtras } }),
    ]);
    res.json({ ofertasActivas, empresasRegistradas, estudiantesOnline });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/ofertas', auth, async (req, res) => {
  try {
    const { modalidad, especialidad, orden = 'reciente', page = 1, limit = 20 } = req.query;
    const ahora = new Date();
    const filtro = {
      activo: true,
      $or: [
        { cierre_en: null },
        { cierre_en: { $exists: false } },
        { cierre_en: { $gte: ahora } }
      ]
    };
    if (modalidad && modalidad !== 'todos') filtro.modalidad = modalidad;
    if (especialidad && especialidad !== 'Todas') filtro.especialidades_requeridas = { $in: [especialidad] };

    const sort = orden === 'salario' ? { salario_max: -1 } : { publicado_en: -1 };
    const ofertas = await PublicacionEmpleo.find(filtro)
      .sort(sort).skip((page - 1) * limit).limit(Number(limit))
      .populate('empresa_id', 'nombre_empresa logo_url ciudad rubro usuario_id');

    const total = await PublicacionEmpleo.countDocuments(filtro);
    res.json({ ofertas, total, paginas: Math.ceil(total / limit) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/ofertas/mis-ofertas', auth, soloRoles('empresa', 'admin'), async (req, res) => {
  try {
    const perfil = await PerfilEmpresa.findOne({ usuario_id: req.usuario._id });
    if (!perfil) return res.status(404).json({ error: 'Perfil de empresa no encontrado' });
    const ofertas = await PublicacionEmpleo.find({ empresa_id: perfil._id }).sort({ publicado_en: -1 });
    res.json(ofertas);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// IMPORTANTE: esta ruta de postulaciones debe ir ANTES de /:id
app.patch('/api/ofertas/postulaciones/:postId/estado', auth, soloRoles('empresa', 'admin'), async (req, res) => {
  try {
    const { estado } = req.body;
    const validos = ['pendiente','en_revision','aceptada','rechazada','contratado','cerrado_por_fecha'];
    if (!validos.includes(estado)) return res.status(400).json({ error: 'Estado inválido' });

    const postAnterior = await Postulacion.findById(req.params.postId);
    const post = await Postulacion.findByIdAndUpdate(req.params.postId, { estado }, { returnDocument: 'after' })
      .populate('estudiante_id', 'usuario_id')
      .populate({ path: 'empleo_id', populate: { path: 'empresa_id' } });

    if ((estado === 'aceptada' || estado === 'rechazada') && post?.estudiante_id?.usuario_id && post?.empleo_id) {
      await Notificacion.create({
        usuario_id: post.estudiante_id.usuario_id,
        tipo:  estado === 'aceptada' ? 'aceptado' : 'rechazado',
        titulo:estado === 'aceptada' ? 'Postulación aceptada' : 'Postulación rechazada',
        texto: `Tu postulación a "${post.empleo_id.titulo}" fue ${estado}.`,
        link:  `/oferta/${post.empleo_id._id}`,
      });
    }

    // Si se acepta, agregar al estudiante al chat grupal de la oferta (crearlo si no existe)
    if (estado === 'aceptada' && post?.estudiante_id?.usuario_id && post?.empleo_id) {
      const empresaUsuarioId = post.empleo_id.empresa_id?.usuario_id;
      const estudianteUsuarioId = post.estudiante_id.usuario_id;
      const ofertaId = post.empleo_id._id;
      const ofertaTitulo = post.empleo_id.titulo;

      if (empresaUsuarioId && estudianteUsuarioId) {
        let grupo = await Conversacion.findOne({ oferta_id: ofertaId, tipo: 'grupal' });
        if (!grupo) {
          // Obtener logo de la empresa
          const perfilEmpresa = await PerfilEmpresa.findOne({ usuario_id: empresaUsuarioId }).select('logo_url');
          grupo = await Conversacion.create({
            participantes: [empresaUsuarioId, estudianteUsuarioId],
            tipo: 'grupal',
            nombre: ofertaTitulo,
            oferta_id: ofertaId,
            creador_id: empresaUsuarioId,
            foto_url: perfilEmpresa?.logo_url || null,
            ultimo_mensaje_preview: 'Bienvenido al grupo de la oferta',
          });
        } else {
          const yaEsta = grupo.participantes.some(p => p.toString() === estudianteUsuarioId.toString());
          if (!yaEsta) {
            grupo.participantes.push(estudianteUsuarioId);
            await grupo.save();
          }
        }
      }
    }

    // Si se contrata, crear entrada en historial de trabajo
    if (estado === 'contratado' && post?.estudiante_id && post?.empleo_id) {
      const yaExiste = await HistorialTrabajo.findOne({
        estudiante_id: post.estudiante_id._id,
        empleo_id: post.empleo_id._id,
      });
      if (!yaExiste) {
        await HistorialTrabajo.create({
          estudiante_id: post.estudiante_id._id,
          empresa_id: post.empleo_id.empresa_id,
          empleo_id: post.empleo_id._id,
          estado: 'activo',
          fecha_inicio: new Date(),
        });
      }
    }

    res.json(post);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/ofertas/:id', auth, async (req, res) => {
  try {
    const oferta = await PublicacionEmpleo.findById(req.params.id)
      .populate('empresa_id', 'nombre_empresa logo_url ciudad rubro sitio_web usuario_id');
    if (!oferta) return res.status(404).json({ error: 'Oferta no encontrada' });
    res.json(oferta);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/ofertas', auth, soloRoles('empresa'), async (req, res) => {
  try {
    const perfil = await PerfilEmpresa.findOne({ usuario_id: req.usuario._id });
    if (!perfil) return res.status(404).json({ error: 'Perfil de empresa no encontrado' });

    const { titulo, descripcion, ubicacion, salario_min, salario_max, modalidad, especialidades_requeridas, cierre_en, puestos_disponibles } = req.body;
    if (!titulo || !descripcion || !ubicacion)
      return res.status(400).json({ error: 'Título, descripción y ubicación son requeridos' });

    const oferta = await PublicacionEmpleo.create({
      empresa_id: perfil._id, titulo, descripcion, ubicacion,
      salario_min: salario_min ? Number(salario_min) : null,
      salario_max: salario_max ? Number(salario_max) : null,
      modalidad:   modalidad || 'presencial',
      especialidades_requeridas: especialidades_requeridas || [],
      cierre_en: cierre_en || null,
      puestos_disponibles: puestos_disponibles || 1,
    });
    res.status(201).json(oferta);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/ofertas/:id', auth, soloRoles('empresa', 'admin'), async (req, res) => {
  try {
    const campos = ['titulo','descripcion','ubicacion','salario_min','salario_max','modalidad','especialidades_requeridas','activo','cierre_en','motivo_cierre'];
    const update = {};
    campos.forEach(c => { if (req.body[c] !== undefined) update[c] = req.body[c]; });

    const ofertaAnterior = await PublicacionEmpleo.findById(req.params.id);
    if (!ofertaAnterior) return res.status(404).json({ error: 'Oferta no encontrada' });

    const oferta = await PublicacionEmpleo.findByIdAndUpdate(req.params.id, update, { returnDocument: 'after' });

    // Si la oferta se desactivó (cerró), notificar a postulantes
    if (ofertaAnterior.activo === true && oferta.activo === false) {
      console.log('Oferta cerrada, notificando postulantes:', oferta.titulo, oferta._id);
      await notificarCierreOferta(oferta._id, oferta.titulo, oferta.motivo_cierre);
    }

    res.json(oferta);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/ofertas/:id', auth, soloRoles('empresa', 'admin'), async (req, res) => {
  try {
    const oferta = await PublicacionEmpleo.findById(req.params.id);
    if (!oferta) return res.status(404).json({ error: 'Oferta no encontrada' });

    await PublicacionEmpleo.findByIdAndDelete(req.params.id);

    // Notificar a postulantes
    await notificarCierreOferta(oferta._id, oferta.titulo, null, true);

    res.json({ ok: true, mensaje: 'Oferta eliminada y postulantes notificados' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/ofertas/:id/postular', auth, soloRoles('estudiante'), async (req, res) => {
  try {
    const oferta = await PublicacionEmpleo.findById(req.params.id);
    if (!oferta || !oferta.activo) return res.status(404).json({ error: 'Oferta no disponible' });

    // Verificar si la oferta ya venció por fecha
    const ahora = new Date();
    if (oferta.cierre_en && new Date(oferta.cierre_en) < ahora) {
      return res.status(404).json({ error: 'Oferta cerrada por fecha límite' });
    }

    // Obtener el perfil del estudiante
    const perfilEstudiante = await PerfilEstudiante.findOne({ usuario_id: req.usuario._id });
    if (!perfilEstudiante) return res.status(404).json({ error: 'Perfil de estudiante no encontrado' });

    // Verificar si el perfil está pendiente de aprobación
    const solicitudPendiente = await SolicitudPerfil.findOne({ usuario_id: req.usuario._id, estado: 'pendiente' });
    if (solicitudPendiente) return res.status(403).json({ error: 'Tu perfil aún está pendiente de aprobación. No puedes postularte hasta que sea verificado.' });

    const ya = await Postulacion.findOne({ empleo_id: oferta._id, estudiante_id: perfilEstudiante._id });
    if (ya) return res.status(409).json({ error: 'Ya postulaste a esta oferta' });

    const post = await Postulacion.create({
      empleo_id:          oferta._id,
      estudiante_id:      perfilEstudiante._id,
      carta_presentacion: req.body.carta_presentacion || '',
    });

    await Notificacion.create({
      usuario_id: req.usuario._id,
      tipo: 'postulacion',
      titulo: 'Postulación enviada',
      texto:  `Tu postulación a "${oferta.titulo}" fue enviada correctamente.`,
      link:   `/oferta/${oferta._id}`,
    });

    // Notificar a la empresa que recibió una nueva postulación
    const perfilEmpresa = await PerfilEmpresa.findById(oferta.empresa_id);
    if (perfilEmpresa) {
      await Notificacion.create({
        usuario_id: perfilEmpresa.usuario_id,
        tipo: 'postulacion',
        titulo: 'Nueva postulación recibida',
        texto:  `Un estudiante ha postulado a tu oferta "${oferta.titulo}".`,
        link:   `/oferta/${oferta._id}`,
      });
    }

    res.status(201).json(post);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/ofertas/:id/postulaciones', auth, soloRoles('empresa', 'admin'), async (req, res) => {
  try {
    const posts = await Postulacion.find({ empleo_id: req.params.id })
      .populate({
        path: 'estudiante_id',
        select: 'foto_perfil_url intereses descripcion usuario_id',
        populate: { path: 'usuario_id', select: 'nombre apellido email' }
      })
      .sort({ postulado_en: -1 });
    res.json(posts);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─────────────────────────────────────────────
//  PREGUNTAS
// ─────────────────────────────────────────────

app.get('/api/preguntas/:empleoId', auth, async (req, res) => {
  try {
    const raiz = await PreguntaEmpleo.find({
      empleo_id: req.params.empleoId, respuesta_a_id: null, activo: true,
    }).populate('autor_id', 'nombre rol').sort({ creado_en: 1 });

    const resultado = await Promise.all(raiz.map(async q => {
      const respuestas = await PreguntaEmpleo.find({ respuesta_a_id: q._id, activo: true })
        .populate('autor_id', 'nombre rol').sort({ creado_en: 1 });
      return { ...q.toObject(), respuestas };
    }));

    res.json(resultado);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/preguntas/:empleoId', auth, async (req, res) => {
  try {
    const { contenido, respuesta_a_id } = req.body;
    if (!contenido?.trim()) return res.status(400).json({ error: 'Contenido requerido' });

    const pregunta = await PreguntaEmpleo.create({
      empleo_id:      req.params.empleoId,
      autor_id:       req.usuario._id,
      contenido:      contenido.trim(),
      respuesta_a_id: respuesta_a_id || null,
    });
    await pregunta.populate('autor_id', 'nombre rol');
    res.status(201).json(pregunta);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/preguntas/:id', auth, soloRoles('admin'), async (req, res) => {
  try {
    await PreguntaEmpleo.findByIdAndUpdate(req.params.id, { activo: false });
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─────────────────────────────────────────────
//  MENSAJES
// ─────────────────────────────────────────────

app.get('/api/mensajes', auth, async (req, res) => {
  try {
    let convs = await Conversacion.find({ participantes: req.usuario._id })
      .populate('participantes', 'nombre apellido rol')
      .sort({ ultimo_mensaje_en: -1 });

    // Si no tiene conversaciones, crear una con el admin automáticamente
    if (convs.length === 0 && req.usuario.rol !== 'admin') {
      const adminUser = await User.findOne({ rol: 'admin', activo: true }).select('_id');
      if (adminUser) {
        const existe = await Conversacion.findOne({
          participantes: { $all: [req.usuario._id, adminUser._id], $size: 2 },
        });
        if (!existe) {
          const nuevaConv = await Conversacion.create({ participantes: [req.usuario._id, adminUser._id], ultimo_mensaje_en: new Date() });
          // Enviar mensaje de bienvenida del admin
          await Mensaje.create({
            conversacion_id: nuevaConv._id,
            remitente_id: adminUser._id,
            contenido: '¡Hola! Si tienes alguna duda o necesitas ayuda con la plataforma, no dudes en escribirme.',
            enviado_en: new Date(),
          });
        }
        convs = await Conversacion.find({ participantes: req.usuario._id })
          .populate('participantes', 'nombre apellido rol')
          .sort({ ultimo_mensaje_en: -1 });
      }
    }

    const resultado = await Promise.all(convs.map(async c => {
      const noLeidos = await Mensaje.countDocuments({
        conversacion_id: c._id,
        remitente_id: { $ne: req.usuario._id },
        leido: false,
      });
      const otro = c.participantes.find(p => !p._id.equals(req.usuario._id));
      if (otro) {
        otro.foto = await getUserFoto(otro._id, otro.rol);
      }
      return {
        _id: c._id,
        tipo: c.tipo,
        nombre: c.nombre,
        oferta_id: c.oferta_id,
        foto_url: c.foto_url,
        participante: otro,
        participantes: c.participantes,
        ultimo_mensaje_preview: c.ultimo_mensaje_preview,
        ultimo_mensaje_en: c.ultimo_mensaje_en,
        noLeidos,
      };
    }));

    res.json(resultado);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/mensajes/no-leidos', auth, async (req, res) => {
  try {
    const convs = await Conversacion.find({ participantes: req.usuario._id });
    let totalNoLeidos = 0;
    for (const c of convs) {
      const count = await Mensaje.countDocuments({
        conversacion_id: c._id,
        remitente_id: { $ne: req.usuario._id },
        leido: false,
      });
      totalNoLeidos += count;
    }
    res.json({ totalNoLeidos });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/mensajes/conversacion', auth, async (req, res) => {
  try {
    const { destinatario_id } = req.body;
    if (!destinatario_id) return res.status(400).json({ error: 'destinatario_id requerido' });

    // Verificar si el remitente tiene perfil pendiente (excepto admin)
    if (req.usuario.rol !== 'admin') {
      const solicitudSender = await SolicitudPerfil.findOne({ usuario_id: req.usuario._id, estado: 'pendiente' });
      if (solicitudSender) return res.status(403).json({ error: 'Tu perfil aún está pendiente de aprobación. No puedes enviar mensajes hasta que sea verificado.' });
    }

    const dest = await User.findById(destinatario_id);
    if (!dest || !dest.activo) return res.status(404).json({ error: 'Usuario no encontrado' });

    // Verificar si el destinatario tiene perfil pendiente (excepto admin)
    if (dest.rol !== 'admin') {
      const solicitudDest = await SolicitudPerfil.findOne({ usuario_id: destinatario_id, estado: 'pendiente' });
      if (solicitudDest) return res.status(403).json({ error: 'Este usuario tiene su perfil pendiente de aprobación.' });
    }

    let conv = await Conversacion.findOne({
      participantes: { $all: [req.usuario._id, destinatario_id], $size: 2 },
    });
    if (!conv) {
      conv = await Conversacion.create({ participantes: [req.usuario._id, destinatario_id], ultimo_mensaje_en: new Date() });
    } else {
      conv.ultimo_mensaje_en = new Date();
      await conv.save();
    }

    await conv.populate('participantes', 'nombre apellido rol');
    const otro = conv.participantes.find(p => !p._id.equals(req.usuario._id));
    res.json({ _id: conv._id, participante: otro });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/mensajes/:convId', auth, async (req, res) => {
  try {
    const conv = await Conversacion.findById(req.params.convId);
    if (!conv) return res.status(404).json({ error: 'Conversación no encontrada' });
    if (!conv.participantes.some(p => p.equals(req.usuario._id)))
      return res.status(403).json({ error: 'Sin acceso' });

    const mensajes = await Mensaje.find({ conversacion_id: conv._id })
      .populate('remitente_id', 'nombre rol')
      .sort({ enviado_en: 1 });

    // Agregar foto a cada remitente
    const remitenteIds = [...new Set(mensajes.map(m => m.remitente_id?._id?.toString()).filter(Boolean))];
    const remitentesConFoto = {};
    await Promise.all(remitenteIds.map(async id => {
      const user = await User.findById(id).select('rol');
      if (user) {
        remitentesConFoto[id] = await getUserFoto(id, user.rol);
      }
    }));

    const mensajesConFoto = mensajes.map(m => {
      const obj = m.toObject();
      if (obj.remitente_id) {
        obj.remitente_id.foto = remitentesConFoto[obj.remitente_id._id.toString()] || null;
      }
      return obj;
    });

    await Mensaje.updateMany(
      { conversacion_id: conv._id, remitente_id: { $ne: req.usuario._id }, leido: false },
      { leido: true, leido_en: new Date() }
    );

    res.json(mensajesConFoto);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/mensajes/:convId', auth, async (req, res) => {
  try {
    const { contenido } = req.body;
    if (!contenido?.trim()) return res.status(400).json({ error: 'Mensaje vacío' });

    const conv = await Conversacion.findById(req.params.convId);
    if (!conv) return res.status(404).json({ error: 'Conversación no encontrada' });
    if (!conv.participantes.some(p => p.equals(req.usuario._id)))
      return res.status(403).json({ error: 'Sin acceso' });

    const msg = await Mensaje.create({
      conversacion_id: conv._id,
      remitente_id:    req.usuario._id,
      contenido:       contenido.trim(),
    });

    await Conversacion.findByIdAndUpdate(conv._id, {
      ultimo_mensaje_en:      new Date(),
      ultimo_mensaje_preview: contenido.slice(0, 100),
    });

    await msg.populate('remitente_id', 'nombre rol');
    res.status(201).json(msg);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.patch('/api/mensajes/:convId/leidos', auth, async (req, res) => {
  try {
    const conv = await Conversacion.findById(req.params.convId);
    if (!conv) return res.status(404).json({ error: 'Conversación no encontrada' });
    if (!conv.participantes.some(p => p.equals(req.usuario._id)))
      return res.status(403).json({ error: 'Sin acceso' });

    const result = await Mensaje.updateMany(
      { conversacion_id: conv._id, remitente_id: { $ne: req.usuario._id }, leido: false },
      { leido: true, leido_en: new Date() }
    );
    res.json({ ok: true, modificados: result.modifiedCount });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/mensajes/:convId/no-leidos', auth, async (req, res) => {
  try {
    const conv = await Conversacion.findById(req.params.convId);
    if (!conv) return res.status(404).json({ error: 'Conversación no encontrada' });
    if (!conv.participantes.some(p => p.equals(req.usuario._id)))
      return res.status(403).json({ error: 'Sin acceso' });

    const count = await Mensaje.countDocuments({
      conversacion_id: conv._id,
      remitente_id: { $ne: req.usuario._id },
      leido: false,
    });
    res.json({ noLeidos: count });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Obtener miembros de una conversación grupal
app.get('/api/mensajes/:convId/miembros', auth, async (req, res) => {
  try {
    const conv = await Conversacion.findById(req.params.convId).populate('participantes', 'nombre apellido rol');
    if (!conv) return res.status(404).json({ error: 'Conversación no encontrada' });
    if (!conv.participantes.some(p => p._id.equals(req.usuario._id)))
      return res.status(403).json({ error: 'Sin acceso' });

    const participantesConFoto = await Promise.all(conv.participantes.map(async p => {
      const foto = await getUserFoto(p._id, p.rol);
      return { ...p.toObject(), foto };
    }));

    res.json({
      _id: conv._id,
      nombre: conv.nombre,
      tipo: conv.tipo,
      participantes: participantesConFoto,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Salir de una conversación grupal
app.patch('/api/mensajes/:convId/salir', auth, async (req, res) => {
  try {
    const conv = await Conversacion.findById(req.params.convId);
    if (!conv) return res.status(404).json({ error: 'Conversación no encontrada' });
    if (conv.tipo !== 'grupal') return res.status(400).json({ error: 'Solo se puede salir de grupos' });
    if (!conv.participantes.some(p => p.equals(req.usuario._id)))
      return res.status(403).json({ error: 'No eres miembro de este grupo' });

    await Conversacion.findByIdAndUpdate(conv._id, {
      $pull: { participantes: req.usuario._id }
    });

    res.json({ ok: true, mensaje: 'Saliste del grupo' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Buscar o crear conversación grupal por oferta (para empresas)
app.get('/api/mensajes/grupo-oferta/:ofertaId', auth, soloRoles('empresa', 'admin'), async (req, res) => {
  try {
    const grupo = await Conversacion.findOne({ oferta_id: req.params.ofertaId, tipo: 'grupal' })
      .populate('participantes', 'nombre apellido rol');
    if (!grupo) return res.status(404).json({ error: 'Grupo no encontrado' });
    res.json(grupo);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─────────────────────────────────────────────
//  NOTIFICACIONES
// ─────────────────────────────────────────────

app.get('/api/notificaciones', auth, async (req, res) => {
  try {
    const notifs   = await Notificacion.find({ usuario_id: req.usuario._id }).sort({ creado_en: -1 }).limit(30);
    const noLeidas = await Notificacion.countDocuments({ usuario_id: req.usuario._id, leida: false });
    res.json({ notifs, noLeidas });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.patch('/api/notificaciones/leer-todas', auth, async (req, res) => {
  try {
    await Notificacion.updateMany({ usuario_id: req.usuario._id, leida: false }, { leida: true });
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.patch('/api/notificaciones/:notifId/leida', auth, async (req, res) => {
  try {
    const notif = await Notificacion.findOneAndUpdate(
      { _id: req.params.notifId, usuario_id: req.usuario._id },
      { leida: true },
      { returnDocument: 'after' }
    );
    if (!notif) return res.status(404).json({ error: 'Notificación no encontrada' });
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─────────────────────────────────────────────
//  ADMIN
// ─────────────────────────────────────────────

app.get('/api/admin/stats', auth, soloRoles('admin'), async (req, res) => {
  try {
    const [estudiantes, empresas, ofertas, postulaciones] = await Promise.all([
      User.countDocuments({ rol: 'estudiante', activo: true }),
      User.countDocuments({ rol: 'empresa',    activo: true }),
      PublicacionEmpleo.countDocuments({ activo: true }),
      Postulacion.countDocuments(),
    ]);
    res.json({ estudiantes, empresas, ofertas, postulaciones });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/admin/usuarios', auth, soloRoles('admin'), async (req, res) => {
  try {
    const { rol, busq } = req.query;
    const filtro = {};
    if (rol && rol !== 'todos') filtro.rol = rol;
    if (busq) filtro.$or = [
      { nombre: { $regex: busq, $options: 'i' } },
      { email:  { $regex: busq, $options: 'i' } },
    ];
    const usuarios = await User.find(filtro).select('-password_hash').sort({ creado_en: -1 });
    res.json(usuarios);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.patch('/api/admin/usuarios/:id/activo', auth, soloRoles('admin'), async (req, res) => {
  try {
    const u = await User.findByIdAndUpdate(req.params.id, { activo: req.body.activo }, { returnDocument: 'after' }).select('-password_hash');
    
    await AuditLog.create({
      admin_id: req.usuario._id,
      accion: req.body.activo ? 'activar' : 'desactivar',
      entidad: 'usuario',
      entidad_id: req.params.id,
      detalles: {
        usuario: `${u?.nombre} ${u?.apellido}`,
        email: u?.email,
        rol: u?.rol,
      },
    });
    
    res.json(u);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/admin/usuarios/:id', auth, soloRoles('admin'), async (req, res) => {
  try {
    const u = await User.findById(req.params.id);
    await User.findByIdAndDelete(req.params.id);
    
    await AuditLog.create({
      admin_id: req.usuario._id,
      accion: 'eliminar',
      entidad: 'usuario',
      entidad_id: req.params.id,
      detalles: {
        usuario: `${u?.nombre} ${u?.apellido}`,
        email: u?.email,
        rol: u?.rol,
      },
    });
    
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/admin/todas-ofertas', auth, soloRoles('admin'), async (req, res) => {
  try {
    const ofertas = await PublicacionEmpleo.find()
      .populate('empresa_id', 'nombre_empresa')
      .sort({ publicado_en: -1 });
    res.json(ofertas);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─────────────────────────────────────────────
//  ADMIN - SOLICITUDES DE PERFIL
// ─────────────────────────────────────────────

app.get('/api/admin/solicitudes-perfil', auth, soloRoles('admin'), async (req, res) => {
  try {
    const { estado } = req.query;
    const filtro = {};
    if (estado && estado !== 'todas') filtro.estado = estado;
    const solicitudes = await SolicitudPerfil.find(filtro)
      .populate('usuario_id', 'nombre apellido email rol')
      .populate('revisado_por', 'nombre')
      .sort({ creado_en: -1 });
    res.json(solicitudes);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.patch('/api/admin/solicitudes-perfil/:id/editar-datos', auth, soloRoles('admin'), async (req, res) => {
  try {
    const { datos } = req.body;
    if (!datos) return res.status(400).json({ error: 'Datos requeridos' });

    const solicitud = await SolicitudPerfil.findById(req.params.id);
    if (!solicitud) return res.status(404).json({ error: 'Solicitud no encontrada' });
    if (solicitud.estado !== 'pendiente') return res.status(400).json({ error: 'Solo se pueden editar solicitudes pendientes' });

    solicitud.datos_solicitados = datos;
    await solicitud.save();

    res.json({ ok: true, solicitud });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/admin/solicitudes-perfil/:id/perfil-actual', auth, soloRoles('admin'), async (req, res) => {
  try {
    const solicitud = await SolicitudPerfil.findById(req.params.id).populate('usuario_id');
    if (!solicitud) return res.status(404).json({ error: 'Solicitud no encontrada' });

    let perfilActual = null;
    if (solicitud.rol === 'estudiante') {
      perfilActual = await PerfilEstudiante.findOne({ usuario_id: solicitud.usuario_id._id });
    } else if (solicitud.rol === 'empresa') {
      perfilActual = await PerfilEmpresa.findOne({ usuario_id: solicitud.usuario_id._id });
    }

    res.json({ perfilActual, datosSolicitados: solicitud.datos_solicitados });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.patch('/api/admin/solicitudes-perfil/:id/aprobar', auth, soloRoles('admin'), async (req, res) => {
  try {
    const { mensaje, datos_editados } = req.body;
    const solicitud = await SolicitudPerfil.findById(req.params.id).populate('usuario_id');
    if (!solicitud) return res.status(404).json({ error: 'Solicitud no encontrada' });

    // Usar datos editados por el admin si los proporcionó, sino usar los originales
    const datosFinales = datos_editados || solicitud.datos_solicitados;

    solicitud.estado = 'aprobada';
    solicitud.revisado_por = req.usuario._id;
    solicitud.revisado_en = new Date();
    await solicitud.save();

    // Crear o actualizar el perfil del usuario con los datos (editados o originales)
    if (solicitud.rol === 'estudiante') {
      await PerfilEstudiante.findOneAndUpdate(
        { usuario_id: solicitud.usuario_id._id },
        { ...datosFinales, usuario_id: solicitud.usuario_id._id },
        { upsert: true, returnDocument: 'after' }
      );
    } else if (solicitud.rol === 'empresa') {
      await PerfilEmpresa.findOneAndUpdate(
        { usuario_id: solicitud.usuario_id._id },
        { ...datosFinales, usuario_id: solicitud.usuario_id._id },
        { upsert: true, returnDocument: 'after' }
      );
    }

    // Auditoría
    await AuditLog.create({
      admin_id: req.usuario._id,
      accion: 'aprobar',
      entidad: 'solicitud_perfil',
      entidad_id: solicitud._id,
      detalles: {
        usuario: `${solicitud.usuario_id?.nombre} ${solicitud.usuario_id?.apellido}`,
        tipo: solicitud.tipo,
        rol: solicitud.rol,
        datos_editados: datos_editados ? true : false,
      },
    });

    // Notificar al usuario
    let textoNotif;
    if (datos_editados) {
      textoNotif = `Tu solicitud de ${solicitud.tipo === 'creacion' ? 'creación' : 'modificación'} de perfil ha sido aprobada con ajustes por el administrador.`;
    } else {
      textoNotif = `Tu solicitud de ${solicitud.tipo === 'creacion' ? 'creación' : 'modificación'} de perfil ha sido aprobada. Ya puedes acceder a todas las funcionalidades.`;
    }
    if (mensaje) textoNotif += ` Mensaje del admin: ${mensaje}`;

    await Notificacion.create({
      usuario_id: solicitud.usuario_id._id,
      tipo: 'otra',
      titulo: datos_editados ? 'Perfil aprobado con ajustes' : 'Perfil aprobado',
      texto: textoNotif,
      link: solicitud.rol === 'estudiante' ? '/' : '/empresa',
    });

    res.json({ ok: true, solicitud });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.patch('/api/admin/solicitudes-perfil/:id/rechazar', auth, soloRoles('admin'), async (req, res) => {
  try {
    const { motivo, mensaje } = req.body;
    const solicitud = await SolicitudPerfil.findById(req.params.id).populate('usuario_id');
    if (!solicitud) return res.status(404).json({ error: 'Solicitud no encontrada' });

    solicitud.estado = 'rechazada';
    solicitud.motivo_rechazo = motivo || 'Sin motivo especificado';
    solicitud.revisado_por = req.usuario._id;
    solicitud.revisado_en = new Date();
    await solicitud.save();

    // Auditoría
    await AuditLog.create({
      admin_id: req.usuario._id,
      accion: 'rechazar',
      entidad: 'solicitud_perfil',
      entidad_id: solicitud._id,
      detalles: {
        usuario: `${solicitud.usuario_id?.nombre} ${solicitud.usuario_id?.apellido}`,
        tipo: solicitud.tipo,
        rol: solicitud.rol,
        motivo: solicitud.motivo_rechazo,
      },
    });

    // Notificar al usuario
    let textoNotif = `Tu solicitud de ${solicitud.tipo === 'creacion' ? 'creación' : 'modificación'} de perfil ha sido rechazada. Motivo: ${solicitud.motivo_rechazo}`;
    if (mensaje) textoNotif += ` — ${mensaje}`;

    await Notificacion.create({
      usuario_id: solicitud.usuario_id._id,
      tipo: 'otra',
      titulo: 'Perfil rechazado',
      texto: textoNotif,
      link: '/perfil',
    });

    res.json({ ok: true, solicitud });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─────────────────────────────────────────────
//  ADMIN - SOLICITUDES DE CV
// ─────────────────────────────────────────────

app.get('/api/admin/solicitudes-cv', auth, soloRoles('admin'), async (req, res) => {
  try {
    const { estado } = req.query;
    const filtro = {};
    if (estado && estado !== 'todas') filtro.estado = estado;
    const solicitudes = await SolicitudCV.find(filtro)
      .populate('usuario_id', 'nombre apellido email')
      .populate('revisado_por', 'nombre')
      .sort({ creado_en: -1 });
    res.json(solicitudes);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.patch('/api/admin/solicitudes-cv/:id/aprobar', auth, soloRoles('admin'), async (req, res) => {
  try {
    const solicitud = await SolicitudCV.findById(req.params.id).populate('usuario_id');
    if (!solicitud) return res.status(404).json({ error: 'Solicitud no encontrada' });

    solicitud.estado = 'aprobada';
    solicitud.revisado_por = req.usuario._id;
    solicitud.revisado_en = new Date();
    await solicitud.save();

    // Actualizar el CV del estudiante
    await PerfilEstudiante.findOneAndUpdate(
      { usuario_id: solicitud.usuario_id._id },
      { curriculum_url: solicitud.curriculum_url },
      { upsert: true }
    );

    // Auditoría
    await AuditLog.create({
      admin_id: req.usuario._id,
      accion: 'aprobar',
      entidad: 'solicitud_cv',
      entidad_id: solicitud._id,
      detalles: {
        usuario: `${solicitud.usuario_id?.nombre} ${solicitud.usuario_id?.apellido}`,
        cv_url: solicitud.curriculum_url,
      },
    });

    // Notificar al usuario
    await Notificacion.create({
      usuario_id: solicitud.usuario_id._id,
      tipo: 'otra',
      titulo: 'CV aprobado',
      texto: 'Tu currículum ha sido aprobado y ya está visible en tu perfil.',
      link: '/perfil',
    });

    res.json({ ok: true, solicitud });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.patch('/api/admin/solicitudes-cv/:id/rechazar', auth, soloRoles('admin'), async (req, res) => {
  try {
    const { motivo } = req.body;
    const solicitud = await SolicitudCV.findById(req.params.id).populate('usuario_id');
    if (!solicitud) return res.status(404).json({ error: 'Solicitud no encontrada' });

    solicitud.estado = 'rechazada';
    solicitud.motivo_rechazo = motivo || 'Sin motivo especificado';
    solicitud.revisado_por = req.usuario._id;
    solicitud.revisado_en = new Date();
    await solicitud.save();

    // Auditoría
    await AuditLog.create({
      admin_id: req.usuario._id,
      accion: 'rechazar',
      entidad: 'solicitud_cv',
      entidad_id: solicitud._id,
      detalles: {
        usuario: `${solicitud.usuario_id?.nombre} ${solicitud.usuario_id?.apellido}`,
        motivo: solicitud.motivo_rechazo,
      },
    });

    // Notificar al usuario
    await Notificacion.create({
      usuario_id: solicitud.usuario_id._id,
      tipo: 'otra',
      titulo: 'CV rechazado',
      texto: `Tu currículum ha sido rechazado. Motivo: ${solicitud.motivo_rechazo}`,
      link: '/perfil',
    });

    res.json({ ok: true, solicitud });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/admin/solicitudes-stats', auth, soloRoles('admin'), async (req, res) => {
  try {
    const [perfilesPendientes, cvsPendientes, perfilesAprobados, cvsAprobados, perfilesRechazados, cvsRechazados] = await Promise.all([
      SolicitudPerfil.countDocuments({ estado: 'pendiente' }),
      SolicitudCV.countDocuments({ estado: 'pendiente' }),
      SolicitudPerfil.countDocuments({ estado: 'aprobada' }),
      SolicitudCV.countDocuments({ estado: 'aprobada' }),
      SolicitudPerfil.countDocuments({ estado: 'rechazada' }),
      SolicitudCV.countDocuments({ estado: 'rechazada' }),
    ]);
    res.json({
      perfilesPendientes, cvsPendientes,
      perfilesAprobados, cvsAprobados,
      perfilesRechazados, cvsRechazados,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─────────────────────────────────────────────
//  ADMIN - ENVIAR BIENVENIDA A USUARIOS SIN CHAT
// ─────────────────────────────────────────────

app.post('/api/admin/enviar-bienvenida', auth, soloRoles('admin'), async (req, res) => {
  try {
    const adminUser = req.usuario;
    const usuariosSinChat = await User.find({ rol: { $in: ['estudiante', 'empresa'] }, activo: true }).select('_id nombre apellido email rol');

    // Obtener todas las conversaciones del admin
    const convsAdmin = await Conversacion.find({ participantes: adminUser._id }).select('participantes');
    const usuariosConChat = new Set();
    for (const c of convsAdmin) {
      for (const p of c.participantes) {
        if (!p.equals(adminUser._id)) {
          usuariosConChat.add(p.toString());
        }
      }
    }

    // Filtrar usuarios sin conversacion con admin
    const usuariosPendientes = usuariosSinChat.filter(u => !usuariosConChat.has(u._id.toString()));

    const resultados = [];
    for (const u of usuariosPendientes) {
      try {
        const existe = await Conversacion.findOne({
          participantes: { $all: [u._id, adminUser._id], $size: 2 },
        });
        if (!existe) {
          const nuevaConv = await Conversacion.create({
            participantes: [u._id, adminUser._id],
            ultimo_mensaje_en: new Date(),
          });
          await Mensaje.create({
            conversacion_id: nuevaConv._id,
            remitente_id: adminUser._id,
            contenido: '¡Hola! Bienvenido/a a la plataforma. Si tienes alguna duda o necesitas ayuda con tu perfil, postulaciones o cualquier tema, no dudes en escribirme. Estoy aquí para ayudarte.',
            enviado_en: new Date(),
          });
          resultados.push({ usuario: `${u.nombre} ${u.apellido}`, email: u.email, rol: u.rol, estado: 'enviado' });
        }
      } catch (err) {
        resultados.push({ usuario: `${u.nombre} ${u.apellido}`, email: u.email, rol: u.rol, estado: 'error', error: err.message });
      }
    }

    // Auditoria
    await AuditLog.create({
      admin_id: adminUser._id,
      accion: 'crear',
      entidad: 'usuario',
      entidad_id: null,
      detalles: {
        accion: 'enviar_bienvenida_masiva',
        total_usuarios: usuariosPendientes.length,
        enviados: resultados.filter(r => r.estado === 'enviado').length,
        errores: resultados.filter(r => r.estado === 'error').length,
      },
    });

    res.json({ ok: true, enviados: resultados.filter(r => r.estado === 'enviado').length, total: usuariosPendientes.length, detalles: resultados });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─────────────────────────────────────────────
//  ADMIN - MODIFICAR PERFIL DE USUARIO
//  (permiso privilegiado para editar perfiles)
// ─────────────────────────────────────────────

app.patch('/api/admin/perfil/:usuarioId', auth, soloRoles('admin'), async (req, res) => {
  try {
    const usuarioTarget = await User.findById(req.params.usuarioId);
    if (!usuarioTarget) return res.status(404).json({ error: 'Usuario no encontrado' });

    // Guardar estado ANTES de los cambios
    const antes = {
      nombre: usuarioTarget.nombre,
      apellido: usuarioTarget.apellido,
    };

    const { nombre, apellido, descripcion, especialidad, ciudad, telefono, linkedin, intereses, destrezas, nombre_empresa, rubro, sitio_web, region, eliminarCv } = req.body;

    // Actualizar campos de User
    const cambiosUser = {};
    if (nombre !== undefined) cambiosUser.nombre = nombre;
    if (apellido !== undefined) cambiosUser.apellido = apellido;
    if (Object.keys(cambiosUser).length > 0) {
      await User.findByIdAndUpdate(usuarioTarget._id, cambiosUser);
    }

    // Actualizar perfil según rol
    let perfilAntes = {};
    let perfilDespues = {};

    if (usuarioTarget.rol === 'estudiante') {
      const perfil = await PerfilEstudiante.findOne({ usuario_id: usuarioTarget._id });
      if (perfil) {
        perfilAntes = {
          descripcion: perfil.descripcion,
          especialidad: perfil.especialidad,
          ciudad: perfil.ciudad,
          telefono: perfil.telefono,
          linkedin: perfil.linkedin,
          intereses: perfil.intereses,
          destrezas: perfil.destrezas,
          curriculum_url: perfil.curriculum_url,
        };

        const camposPerfil = ['descripcion', 'especialidad', 'ciudad', 'telefono', 'linkedin'];
        camposPerfil.forEach(c => { if (req.body[c] !== undefined) perfil[c] = req.body[c]; });
        if (intereses !== undefined) perfil.intereses = typeof intereses === 'string' ? JSON.parse(intereses) : intereses;
        if (destrezas !== undefined) perfil.destrezas = typeof destrezas === 'string' ? JSON.parse(destrezas) : destrezas;
        if (eliminarCv === true || eliminarCv === 'true') {
          perfil.curriculum_url = '';
        }
        await perfil.save();

        perfilDespues = {
          descripcion: perfil.descripcion,
          especialidad: perfil.especialidad,
          ciudad: perfil.ciudad,
          telefono: perfil.telefono,
          linkedin: perfil.linkedin,
          intereses: perfil.intereses,
          destrezas: perfil.destrezas,
          curriculum_url: perfil.curriculum_url,
        };
      }
    } else if (usuarioTarget.rol === 'empresa') {
      const perfil = await PerfilEmpresa.findOne({ usuario_id: usuarioTarget._id });
      if (perfil) {
        perfilAntes = {
          nombre_empresa: perfil.nombre_empresa,
          descripcion: perfil.descripcion,
          rubro: perfil.rubro,
          sitio_web: perfil.sitio_web,
          telefono: perfil.telefono,
          ciudad: perfil.ciudad,
          region: perfil.region,
        };

        const camposPerfil = ['nombre_empresa', 'descripcion', 'rubro', 'sitio_web', 'telefono', 'ciudad', 'region'];
        camposPerfil.forEach(c => { if (req.body[c] !== undefined) perfil[c] = req.body[c]; });
        await perfil.save();

        perfilDespues = {
          nombre_empresa: perfil.nombre_empresa,
          descripcion: perfil.descripcion,
          rubro: perfil.rubro,
          sitio_web: perfil.sitio_web,
          telefono: perfil.telefono,
          ciudad: perfil.ciudad,
          region: perfil.region,
        };
      }
    }

    // Construir detalles de auditoría
    const despues = { ...antes, ...cambiosUser };
    const cambios = {};
    const resumenCambios = [];
    const norm = v => (v == null || v === '') ? '' : v;

    const etiquetasCampos = {
      nombre: 'Nombre', apellido: 'Apellido', descripcion: 'Descripción',
      especialidad: 'Especialidad', ciudad: 'Ciudad', telefono: 'Teléfono',
      linkedin: 'LinkedIn', intereses: 'Intereses', destrezas: 'Destrezas',
      nombre_empresa: 'Nombre empresa', rubro: 'Rubro', sitio_web: 'Sitio web',
      region: 'Región', curriculum_url: 'CV',
    };

    // Comparar campos de User
    Object.keys(antes).forEach(k => {
      const a = norm(antes[k]);
      const d = norm(despues[k]);
      if (a !== d) {
        cambios[k] = { antes: a || '(vacío)', despues: d || '(vacío)' };
        resumenCambios.push(`${etiquetasCampos[k] || k}: "${a || '(vacío)'}" → "${d || '(vacío)'}"`);
      }
    });

    // Comparar campos de perfil
    Object.keys(perfilAntes).forEach(k => {
      const valAntes = perfilAntes[k];
      const valDespues = perfilDespues[k];
      const strAntes = Array.isArray(valAntes) ? JSON.stringify(valAntes) : norm(valAntes);
      const strDespues = Array.isArray(valDespues) ? JSON.stringify(valDespues) : norm(valDespues);
      if (strAntes !== strDespues) {
        cambios[k] = { antes: strAntes || '(vacío)', despues: strDespues || '(vacío)' };
        const displayAntes = Array.isArray(valAntes) ? `[${valAntes.join(', ')}]` : (strAntes || '(vacío)');
        const displayDespues = Array.isArray(valDespues) ? `[${valDespues.join(', ')}]` : (strDespues || '(vacío)');
        resumenCambios.push(`${etiquetasCampos[k] || k}: "${displayAntes}" → "${displayDespues}"`);
      }
    });

    // Registrar en auditoría
    await AuditLog.create({
      admin_id: req.usuario._id,
      accion: 'modificar_perfil',
      entidad: usuarioTarget.rol === 'estudiante' ? 'perfil_estudiante' : 'perfil_empresa',
      entidad_id: usuarioTarget._id,
      detalles: {
        usuario: `${usuarioTarget.nombre} ${usuarioTarget.apellido}`,
        email: usuarioTarget.email,
        rol: usuarioTarget.rol,
        cambios,
        resumen: resumenCambios.length > 0 ? resumenCambios.join('; ') : 'Sin cambios detectados',
      },
    });

    // Notificar al usuario
    await Notificacion.create({
      usuario_id: usuarioTarget._id,
      tipo: 'otra',
      titulo: 'Perfil actualizado por administrador',
      texto: 'Un administrador ha actualizado la información de tu perfil.',
      link: '/perfil',
    });

    // Devolver usuario actualizado
    const usuarioActualizado = await User.findById(usuarioTarget._id).select('-password_hash');
    res.json({ ok: true, usuario: usuarioActualizado });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─────────────────────────────────────────────
//  ADMIN - CONFIGURACIÓN
// ─────────────────────────────────────────────

async function getConfig(clave, valorDefault) {
  let config = await AppConfig.findOne({ clave });
  if (!config) {
    config = await AppConfig.create({ clave, valor: valorDefault });
  }
  return config.valor;
}

app.get('/api/admin/config', auth, soloRoles('admin'), async (req, res) => {
  try {
    const [aprobacionAutoPerfiles, aprobacionAutoCV] = await Promise.all([
      getConfig('aprobacion_auto_perfiles', false),
      getConfig('aprobacion_auto_cv', false),
    ]);
    res.json({ aprobacionAutoPerfiles, aprobacionAutoCV });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.patch('/api/admin/config', auth, soloRoles('admin'), async (req, res) => {
  try {
    const { clave, valor } = req.body;
    if (!['aprobacion_auto_perfiles', 'aprobacion_auto_cv'].includes(clave)) {
      return res.status(400).json({ error: 'Clave no válida' });
    }
    const anterior = await AppConfig.findOne({ clave });
    const config = await AppConfig.findOneAndUpdate(
      { clave },
      { valor },
      { upsert: true, returnDocument: 'after' }
    );

    await AuditLog.create({
      admin_id: req.usuario._id,
      accion: 'cambiar_config',
      entidad: 'config',
      detalles: {
        clave,
        valor_anterior: anterior?.valor,
        valor_nuevo: valor,
      },
    });

    res.json({ ok: true, config });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─────────────────────────────────────────────
//  ADMIN - AUDITORÍA
// ─────────────────────────────────────────────

app.get('/api/admin/auditoria', auth, soloRoles('admin'), async (req, res) => {
  try {
    const { entidad, accion } = req.query;
    const filtro = {};
    if (entidad && entidad !== 'todas') filtro.entidad = entidad;
    if (accion && accion !== 'todas') filtro.accion = accion;
    const logs = await AuditLog.find(filtro)
      .populate('admin_id', 'nombre apellido email')
      .sort({ creado_en: -1 })
      .limit(200);
    res.json(logs);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─────────────────────────────────────────────
//  BÚSQUEDA GLOBAL
// ─────────────────────────────────────────────
app.get('/api/buscar', auth, async (req, res) => {
  try {
    const { q } = req.query;
    if (!q || q.trim().length < 2) return res.json({ empresas: [], usuarios: [] });

    const termino = q.trim();
    const regex = new RegExp(termino, 'i');

    // Obtener IDs de usuarios con solicitudes pendientes
    const solicitudesPendientes = await SolicitudPerfil.find({ estado: 'pendiente' }).distinct('usuario_id');
    const pendientesIds = new Set(solicitudesPendientes.map(id => id.toString()));

    // 1) Buscar usuarios por nombre/email
    const usuariosEncontrados = await User.find({
      $or: [
        { nombre: regex },
        { apellido: regex },
        { email: regex },
      ],
      rol: { $in: ['estudiante', 'empresa'] },
      activo: true,
    }).select('_id nombre apellido rol').limit(30);

    // 2) Buscar perfiles de estudiantes por campos de perfil
    const estudiantesPorPerfil = await PerfilEstudiante.find({
      $or: [
        { descripcion: regex },
        { especialidad: regex },
        { ciudad: regex },
      ]
    }).select('usuario_id').limit(30);
    const estudiantePerfilIds = estudiantesPorPerfil.map(e => e.usuario_id?.toString()).filter(Boolean);

    // 3) Buscar perfiles de empresas por campos de perfil
    const empresasPorPerfil = await PerfilEmpresa.find({
      $or: [
        { nombre_empresa: regex },
        { rubro: regex },
        { ciudad: regex },
      ]
    }).select('usuario_id').limit(30);
    const empresaPerfilIds = empresasPorPerfil.map(e => e.usuario_id?.toString()).filter(Boolean);

    // Combinar todos los IDs de estudiantes y empresas
    const todosEstudianteIds = new Set([
      ...usuariosEncontrados.filter(u => u.rol === 'estudiante').map(u => u._id.toString()),
      ...estudiantePerfilIds,
    ]);
    const todosEmpresaIds = new Set([
      ...usuariosEncontrados.filter(u => u.rol === 'empresa').map(u => u._id.toString()),
      ...empresaPerfilIds,
    ]);

    // Filtrar pendientes
    const estudianteIdsFinales = [...todosEstudianteIds].filter(id => !pendientesIds.has(id));
    const empresaIdsFinales = [...todosEmpresaIds].filter(id => !pendientesIds.has(id));

    // Obtener perfiles de estudiantes
    const estudiantes = await PerfilEstudiante.find({
      usuario_id: { $in: estudianteIdsFinales },
    }).select('foto_perfil_url especialidad ciudad descripcion usuario_id');

    // Obtener perfiles de empresas
    const empresas = await PerfilEmpresa.find({
      usuario_id: { $in: empresaIdsFinales },
    }).select('nombre_empresa logo_url rubro ciudad usuario_id');

    // Obtener datos de usuario para estudiantes
    const estudianteUsuarioIds = estudiantes.map(e => e.usuario_id).filter(Boolean);
    const estudiantesUsuariosData = await User.find({ _id: { $in: estudianteUsuarioIds } }).select('nombre apellido email');
    const estudianteUsuarioMap = {};
    estudiantesUsuariosData.forEach(u => { estudianteUsuarioMap[u._id.toString()] = u; });

    const resultadosUsuarios = estudiantes.map(e => {
      const u = estudianteUsuarioMap[e.usuario_id?.toString()];
      return {
        id: e.usuario_id,
        nombre: u ? `${u.nombre} ${u.apellido}` : 'Estudiante',
        especialidad: e.especialidad || '',
        ciudad: e.ciudad || '',
        foto: e.foto_perfil_url,
      };
    });

    // Obtener datos de usuario para empresas
    const empresaUsuarioIds = empresas.map(e => e.usuario_id).filter(Boolean);
    const empresaUsuariosData = await User.find({ _id: { $in: empresaUsuarioIds } }).select('nombre apellido email');
    const empresaUsuarioMap = {};
    empresaUsuariosData.forEach(u => { empresaUsuarioMap[u._id.toString()] = u; });

    const resultadosEmpresas = empresas.map(e => {
      const u = empresaUsuarioMap[e.usuario_id?.toString()];
      return {
        id: e.usuario_id,
        nombre: e.nombre_empresa,
        rubro: e.rubro || '',
        ciudad: e.ciudad || '',
        logo: e.logo_url,
      };
    });

    res.json({ empresas: resultadosEmpresas, usuarios: resultadosUsuarios });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─────────────────────────────────────────────
//  HEALTH + RAÍZ
// ─────────────────────────────────────────────
app.get('/api/health', (_, res) => res.json({ status: 'ok', ts: new Date() }));

// Catch-all: para cualquier ruta que NO sea /api, servir el frontend (SPA)
// Esto permite que React Router maneje rutas como /mis-postulaciones, /oferta/:id, etc.
// Usamos app.use() sin path porque Express 5 no acepta '*' en app.get()
app.use((req, res) => {
  if (req.path.startsWith('/api')) {
    return res.status(404).json({ error: 'Ruta API no encontrada' });
  }
  res.sendFile(path.resolve(distPath, 'index.html'));
});

app.listen(PORT, () => {
  console.log(`🚀 Servidor en http://localhost:${PORT}`);
  console.log(`📡 API en http://localhost:${PORT}/api`);
  console.log(`🎨 Frontend servido desde: ${distPath}`);
});