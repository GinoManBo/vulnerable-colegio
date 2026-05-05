import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import jwt from 'jsonwebtoken';
import path from 'path';
import { fileURLToPath } from 'url';
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
} from './models/index.js';

dotenv.config();

const app  = express();
const PORT = process.env.PORT || 5000;

// Para resolver rutas en ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname  = path.dirname(__filename);

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

connectDB();

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

    if (rol === 'estudiante') {
      await PerfilEstudiante.create({ usuario_id: usuario._id, especialidad: especialidad || '' });
    } else {
      if (!nombre_empresa)
        return res.status(400).json({ error: 'Nombre de empresa requerido' });
      await PerfilEmpresa.create({ usuario_id: usuario._id, nombre_empresa: nombre_empresa.trim() });
    }

    res.status(201).json({
      token: generarToken(usuario._id),
      usuario: { _id: usuario._id, nombre: usuario.nombre, apellido: usuario.apellido, email: usuario.email, rol: usuario.rol },
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

    res.json({
      token: generarToken(usuario._id),
      usuario: {
        _id: usuario._id, nombre: usuario.nombre, apellido: usuario.apellido,
        email: usuario.email, rol: usuario.rol,
        foto:          perfil?.foto_perfil_url ?? perfil?.logo_url ?? null,
        nombre_empresa:perfil?.nombre_empresa ?? null,
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

    res.json({
      _id: u._id, nombre: u.nombre, apellido: u.apellido,
      email: u.email, rol: u.rol,
      foto:          perfil?.foto_perfil_url ?? perfil?.logo_url ?? null,
      nombre_empresa:perfil?.nombre_empresa ?? null,
      ciudad:        perfil?.ciudad ?? null,
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
    res.json({ ...req.usuario.toObject(), perfil });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/perfil', auth, async (req, res) => {
  try {
    const { nombre, apellido, descripcion, especialidad, ciudad, telefono, linkedin, intereses, destrezas, nombre_empresa, rubro, sitio_web, region } = req.body;
    
    // Actualizar usuario
    if (nombre || apellido) {
      await User.findByIdAndUpdate(req.usuario._id, { 
        ...(nombre && { nombre }), 
        ...(apellido && { apellido }) 
      });
    }

    let perfil;
    
    // Actualizar según rol
    if (req.usuario.rol === 'estudiante') {
      perfil = await PerfilEstudiante.findOneAndUpdate(
        { usuario_id: req.usuario._id },
        {
          descripcion, especialidad, ciudad, telefono, linkedin,
          ...(intereses && { intereses: JSON.parse(intereses) }),
          ...(destrezas && { destrezas: JSON.parse(destrezas) }),
        },
        { returnDocument: 'after', upsert: true }
      );
    } else if (req.usuario.rol === 'empresa') {
      perfil = await PerfilEmpresa.findOneAndUpdate(
        { usuario_id: req.usuario._id },
        { nombre_empresa, descripcion, rubro, sitio_web, telefono, ciudad, region },
        { returnDocument: 'after', upsert: true }
      );
    }
    
    res.json(perfil);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/perfil/estudiante', auth, soloRoles('estudiante'), async (req, res) => {
  try {
    const { nombre, apellido, descripcion, especialidad, ciudad, telefono, linkedin, intereses, destrezas } = req.body;
    if (nombre || apellido)
      await User.findByIdAndUpdate(req.usuario._id, { ...(nombre && { nombre }), ...(apellido && { apellido }) });

    const perfil = await PerfilEstudiante.findOneAndUpdate(
      { usuario_id: req.usuario._id },
      {
        descripcion, especialidad, ciudad, telefono, linkedin,
        ...(intereses && { intereses: JSON.parse(intereses) }),
        ...(destrezas && { destrezas: JSON.parse(destrezas) }),
      },
      { returnDocument: 'after', upsert: true }
    );
    res.json(perfil);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/perfil/empresa', auth, soloRoles('empresa'), async (req, res) => {
  try {
    const { nombre, apellido, nombre_empresa, descripcion, rubro, sitio_web, telefono, ciudad, region } = req.body;
    if (nombre || apellido)
      await User.findByIdAndUpdate(req.usuario._id, { ...(nombre && { nombre }), ...(apellido && { apellido }) });

    const perfil = await PerfilEmpresa.findOneAndUpdate(
      { usuario_id: req.usuario._id },
      { nombre_empresa, descripcion, rubro, sitio_web, telefono, ciudad, region },
      { returnDocument: 'after', upsert: true }
    );
    res.json(perfil);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Obtener perfil público de un usuario por su ID
app.get('/api/perfil/usuario/:usuarioId', auth, async (req, res) => {
  try {
    const usuario = await User.findById(req.params.usuarioId).select('-password_hash');
    if (!usuario) return res.status(404).json({ error: 'Usuario no encontrado' });

    let perfil = null;
    if (usuario.rol === 'estudiante') {
      perfil = await PerfilEstudiante.findOne({ usuario_id: usuario._id })
        .select('foto_perfil_url especialidad descripcion intereses destrezas ciudad linkedin');
    } else if (usuario.rol === 'empresa') {
      perfil = await PerfilEmpresa.findOne({ usuario_id: usuario._id })
        .select('nombre_empresa logo_url descripcion rubro sitio_web telefono ciudad region');
    }

    res.json({
      _id: usuario._id,
      nombre: usuario.nombre,
      apellido: usuario.apellido,
      email: usuario.email,
      rol: usuario.rol,
      perfil,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Obtener ofertas activas de una empresa por usuario_id
app.get('/api/perfil/usuario/:usuarioId/ofertas', auth, async (req, res) => {
  try {
    const usuario = await User.findById(req.params.usuarioId).select('rol');
    if (!usuario || usuario.rol !== 'empresa') return res.json([]);

    const perfil = await PerfilEmpresa.findOne({ usuario_id: usuario._id });
    if (!perfil) return res.json([]);

    const ofertas = await PublicacionEmpleo.find({ empresa_id: perfil._id, activo: true })
      .sort({ publicado_en: -1 });

    res.json(ofertas);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/perfil/mis-postulaciones', auth, soloRoles('estudiante'), async (req, res) => {
  try {
    const perfilEstudiante = await PerfilEstudiante.findOne({ usuario_id: req.usuario._id });
    if (!perfilEstudiante) return res.status(404).json({ error: 'Perfil de estudiante no encontrado' });
    
    const posts = await Postulacion.find({ estudiante_id: perfilEstudiante._id })
      .populate({
        path: 'empleo_id',
        select: 'titulo ubicacion modalidad salario_min salario_max activo',
        populate: { path: 'empresa_id', select: 'nombre_empresa logo_url' },
      })
      .sort({ postulado_en: -1 });
    res.json(posts);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/perfil/postulaciones/:postId/retirar', auth, soloRoles('estudiante'), async (req, res) => {
  try {
    const perfilEstudiante = await PerfilEstudiante.findOne({ usuario_id: req.usuario._id });
    if (!perfilEstudiante) {
      return res.status(404).json({ error: 'Perfil de estudiante no encontrado' });
    }
    
    const { Types } = await import('mongoose');
    let postIdObj;
    try {
      postIdObj = new Types.ObjectId(req.params.postId);
    } catch (e) {
      return res.status(400).json({ error: 'ID de postulación inválido' });
    }
    
    const post = await Postulacion.findOneAndDelete({ _id: postIdObj, estudiante_id: perfilEstudiante._id });
    if (!post) {
      return res.status(404).json({ error: 'Postulación no encontrada' });
    }

    await Notificacion.create({
      usuario_id: req.usuario._id,
      tipo: 'otra',
      titulo: 'Postulación retirada',
      texto: 'Has retirado tu postulación exitosamente.',
      link: '/mis-postulaciones',
    });

    res.json({ ok: true, mensaje: 'Postulación retirada' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/perfil/mis-calificaciones', auth, soloRoles('estudiante'), async (req, res) => {
  try {
    const perfilEstudiante = await PerfilEstudiante.findOne({ usuario_id: req.usuario._id });
    if (!perfilEstudiante) return res.status(404).json({ error: 'Perfil de estudiante no encontrado' });
    
    const califs = await CalificacionTrabajo.find({ estudiante_id: perfilEstudiante._id })
      .populate('empresa_id', 'nombre_empresa')
      .populate('postulacion_id')
      .sort({ creado_en: -1 });
    res.json(califs);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Helper: notificar a postulantes cuando una oferta se cierra/elimina
async function notificarCierreOferta(empleoId, tituloOferta, motivoCierre = null, eliminada = false) {
  try {
    const postulaciones = await Postulacion.find({ empleo_id: empleoId });
    console.log('notificarCierreOferta: empleoId=', empleoId, 'postulaciones encontradas=', postulaciones.length);
    if (!postulaciones.length) return;

    // Obtener perfiles de estudiantes para tener sus usuario_id
    const estudianteIds = postulaciones.map(p => p.estudiante_id);
    const perfiles = await PerfilEstudiante.find({ _id: { $in: estudianteIds } }).select('usuario_id');

    const accion = eliminada ? 'eliminada' : 'cerrada';
    let texto = `La oferta "${tituloOferta}" fue ${accion} por la empresa.`;
    if (motivoCierre) {
      texto += ` Motivo: ${motivoCierre}`;
    }

    const notificaciones = perfiles.map(perfil => ({
      usuario_id: perfil.usuario_id,
      tipo: 'otra',
      titulo: eliminada ? 'Oferta eliminada' : 'Oferta cerrada',
      texto,
      link: `/mis-postulaciones`,
    }));

    if (notificaciones.length) {
      await Notificacion.insertMany(notificaciones);
    }

    // Actualizar postulaciones a estado rechazada
    await Postulacion.updateMany(
      { empleo_id: empleoId },
      { estado: 'rechazada' }
    );
  } catch (err) {
    // Silenciar error de notificación
  }
}

// ─────────────────────────────────────────────
//  OFERTAS
//  IMPORTANTE: /mis-ofertas debe ir ANTES de /:id
// ─────────────────────────────────────────────

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

    const post = await Postulacion.findByIdAndUpdate(req.params.postId, { estado }, { returnDocument: 'after' })
      .populate('estudiante_id', 'usuario_id')
      .populate('empleo_id', 'titulo');

    if ((estado === 'aceptada' || estado === 'rechazada') && post?.estudiante_id?.usuario_id && post?.empleo_id) {
      await Notificacion.create({
        usuario_id: post.estudiante_id.usuario_id,
        tipo:  estado === 'aceptada' ? 'aceptado' : 'rechazado',
        titulo:estado === 'aceptada' ? 'Postulación aceptada' : 'Postulación rechazada',
        texto: `Tu postulación a "${post.empleo_id.titulo}" fue ${estado}.`,
        link:  `/oferta/${post.empleo_id._id}`,
      });
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

    const { titulo, descripcion, ubicacion, salario_min, salario_max, modalidad, especialidades_requeridas, cierre_en } = req.body;
    if (!titulo || !descripcion || !ubicacion)
      return res.status(400).json({ error: 'Título, descripción y ubicación son requeridos' });

    const oferta = await PublicacionEmpleo.create({
      empresa_id: perfil._id, titulo, descripcion, ubicacion,
      salario_min: salario_min ? Number(salario_min) : null,
      salario_max: salario_max ? Number(salario_max) : null,
      modalidad:   modalidad || 'presencial',
      especialidades_requeridas: especialidades_requeridas || [],
      cierre_en: cierre_en || null,
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
    const convs = await Conversacion.find({ participantes: req.usuario._id })
      .populate('participantes', 'nombre apellido rol')
      .sort({ ultimo_mensaje_en: -1 });

    const resultado = await Promise.all(convs.map(async c => {
      const noLeidos = await Mensaje.countDocuments({
        conversacion_id: c._id,
        remitente_id: { $ne: req.usuario._id },
        leido: false,
      });
      const otro = c.participantes.find(p => !p._id.equals(req.usuario._id));
      return { _id: c._id, participante: otro, ultimo_mensaje_preview: c.ultimo_mensaje_preview, ultimo_mensaje_en: c.ultimo_mensaje_en, noLeidos };
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

    const dest = await User.findById(destinatario_id);
    if (!dest || !dest.activo) return res.status(404).json({ error: 'Usuario no encontrado' });

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

    await Mensaje.updateMany(
      { conversacion_id: conv._id, remitente_id: { $ne: req.usuario._id }, leido: false },
      { leido: true, leido_en: new Date() }
    );

    res.json(mensajes);
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
      { new: true }
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
    res.json(u);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/admin/usuarios/:id', auth, soloRoles('admin'), async (req, res) => {
  try {
    await User.findByIdAndDelete(req.params.id);
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
//  BÚSQUEDA GLOBAL
// ─────────────────────────────────────────────
app.get('/api/buscar', auth, async (req, res) => {
  try {
    const { q } = req.query;
    if (!q || q.trim().length < 2) return res.json({ empresas: [], usuarios: [] });

    const termino = q.trim();
    const regex = new RegExp(termino, 'i');

    // Buscar empresas
    const empresas = await PerfilEmpresa.find({
      $or: [
        { nombre_empresa: regex },
        { rubro: regex },
        { ciudad: regex },
      ]
    }).select('nombre_empresa rubro ciudad logo_url usuario_id').limit(10);

    // Buscar estudiantes
    const estudiantes = await PerfilEstudiante.find({
      $or: [
        { descripcion: regex },
        { especialidad: regex },
        { ciudad: regex },
      ]
    }).select('foto_perfil_url especialidad ciudad descripcion usuario_id').limit(10);

    // Obtener datos de usuario para los estudiantes
    const usuarioIds = estudiantes.map(e => e.usuario_id).filter(Boolean);
    const usuariosData = await User.find({ _id: { $in: usuarioIds } }).select('nombre apellido email');
    const usuarioMap = {};
    usuariosData.forEach(u => { usuarioMap[u._id.toString()] = u; });

    const resultadosUsuarios = estudiantes.map(e => {
      const u = usuarioMap[e.usuario_id?.toString()];
      return {
        id: e.usuario_id,
        nombre: u ? `${u.nombre} ${u.apellido}` : 'Estudiante',
        especialidad: e.especialidad || '',
        ciudad: e.ciudad || '',
        foto: e.foto_perfil_url,
      };
    });

    // Obtener datos de usuario para las empresas
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