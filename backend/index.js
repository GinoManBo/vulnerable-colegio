import express from 'express';
import cors from 'cors';
import { connectDB } from './db.js';
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
} from './models/index.js';

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

connectDB();

// ─────────────────────────────────────────────
//  RUTAS DE AUTENTICACIÓN
// ─────────────────────────────────────────────
app.post('/api/auth/registro', async (req, res) => {
  try {
    const { nombre, email, password, rol } = req.body;
    
    // Verificar si el email ya existe
    const existente = await User.findOne({ email });
    if (existente) return res.status(400).json({ mensaje: 'El email ya existe' });
    
    // Crear usuario
    const usuario = new User({
      nombre,
      email,
      password_hash: password, // En producción: hashear contraseña
      rol: rol || 'estudiante',
    });
    
    await usuario.save();
    res.json({ _id: usuario._id, nombre: usuario.nombre, email: usuario.email, rol: usuario.rol });
  } catch (err) {
    res.status(500).json({ mensaje: err.message });
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const usuario = await User.findOne({ email });
    
    if (!usuario || usuario.password_hash !== password) {
      return res.status(401).json({ mensaje: 'Credenciales inválidas' });
    }
    
    if (!usuario.activo) {
      return res.status(403).json({ mensaje: 'Usuario desactivado' });
    }
    
    res.json({ _id: usuario._id, nombre: usuario.nombre, email: usuario.email, rol: usuario.rol });
  } catch (err) {
    res.status(500).json({ mensaje: err.message });
  }
});

app.get('/api/auth/me', (req, res) => {
  res.json({ autenticado: true });
});

app.post('/api/auth/logout', (req, res) => {
  res.json({ mensaje: 'Sesión cerrada' });
});

// ─────────────────────────────────────────────
//  RUTAS DE PERFIL
// ─────────────────────────────────────────────
app.get('/api/perfil/me', async (req, res) => {
  try {
    const usuarioId = req.query.usuarioId || '65a1b2c3d4e5f6g7h8i9j0k1'; // Mock: usar token en producción
    
    // Obtener usuario
    const usuario = await User.findById(usuarioId);
    if (!usuario) return res.status(404).json({ mensaje: 'Usuario no encontrado' });
    
    // Obtener perfil según rol
    let perfil = null;
    if (usuario.rol === 'estudiante') {
      perfil = await PerfilEstudiante.findOne({ usuario_id: usuarioId });
    } else if (usuario.rol === 'empresa') {
      perfil = await PerfilEmpresa.findOne({ usuario_id: usuarioId });
    }
    
    res.json({ usuario, perfil });
  } catch (err) {
    res.status(500).json({ mensaje: err.message });
  }
});

app.put('/api/perfil', async (req, res) => {
  try {
    const usuarioId = req.query.usuarioId || '65a1b2c3d4e5f6g7h8i9j0k1';
    const usuario = await User.findById(usuarioId);
    
    if (!usuario) return res.status(404).json({ mensaje: 'Usuario no encontrado' });
    
    // Actualizar usuario
    if (req.body.nombre) usuario.nombre = req.body.nombre;
    if (req.body.email) usuario.email = req.body.email;
    await usuario.save();
    
    // Actualizar perfil según rol
    if (usuario.rol === 'empresa') {
      let perfil = await PerfilEmpresa.findOne({ usuario_id: usuarioId });
      if (!perfil) {
        perfil = new PerfilEmpresa({ usuario_id: usuarioId });
      }
      Object.assign(perfil, req.body);
      await perfil.save();
    } else if (usuario.rol === 'estudiante') {
      let perfil = await PerfilEstudiante.findOne({ usuario_id: usuarioId });
      if (!perfil) {
        perfil = new PerfilEstudiante({ usuario_id: usuarioId });
      }
      Object.assign(perfil, req.body);
      await perfil.save();
    }
    
    res.json({ mensaje: 'Perfil actualizado' });
  } catch (err) {
    res.status(500).json({ mensaje: err.message });
  }
});

app.get('/api/perfil/usuario/:id', async (req, res) => {
  try {
    const usuario = await User.findById(req.params.id);
    if (!usuario) return res.status(404).json({ mensaje: 'Usuario no encontrado' });
    
    let perfil = null;
    if (usuario.rol === 'estudiante') {
      perfil = await PerfilEstudiante.findOne({ usuario_id: req.params.id });
    } else if (usuario.rol === 'empresa') {
      perfil = await PerfilEmpresa.findOne({ usuario_id: req.params.id });
    }
    
    res.json({ usuario, perfil });
  } catch (err) {
    res.status(500).json({ mensaje: err.message });
  }
});

// ─────────────────────────────────────────────
//  RUTAS DE OFERTAS (EMPLEOS)
// ─────────────────────────────────────────────
app.get('/api/ofertas', async (req, res) => {
  try {
    const ofertas = await PublicacionEmpleo.find({ activo: true })
      .populate('empresa_id')
      .sort({ publicado_en: -1 });
    res.json(ofertas);
  } catch (err) {
    res.status(500).json({ mensaje: err.message });
  }
});

app.get('/api/ofertas/mis-ofertas', async (req, res) => {
  try {
    const empresaId = req.query.empresaId || '65a1b2c3d4e5f6g7h8i9j0k1'; // Mock
    const ofertas = await PublicacionEmpleo.find({ empresa_id: empresaId })
      .sort({ publicado_en: -1 });
    res.json(ofertas);
  } catch (err) {
    res.status(500).json({ mensaje: err.message });
  }
});

app.get('/api/ofertas/:id', async (req, res) => {
  try {
    const oferta = await PublicacionEmpleo.findById(req.params.id)
      .populate('empresa_id');
    if (!oferta) return res.status(404).json({ mensaje: 'Oferta no encontrada' });
    res.json(oferta);
  } catch (err) {
    res.status(500).json({ mensaje: err.message });
  }
});

app.post('/api/ofertas', async (req, res) => {
  try {
    const empresaId = req.query.empresaId || '65a1b2c3d4e5f6g7h8i9j0k1'; // Mock
    const oferta = new PublicacionEmpleo({
      empresa_id: empresaId,
      ...req.body,
    });
    await oferta.save();
    res.status(201).json(oferta);
  } catch (err) {
    res.status(500).json({ mensaje: err.message });
  }
});

app.put('/api/ofertas/:id', async (req, res) => {
  try {
    const oferta = await PublicacionEmpleo.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );
    if (!oferta) return res.status(404).json({ mensaje: 'Oferta no encontrada' });
    res.json(oferta);
  } catch (err) {
    res.status(500).json({ mensaje: err.message });
  }
});

app.get('/api/ofertas/:id/postulantes', async (req, res) => {
  try {
    const postulantes = await Postulacion.find({ empleo_id: req.params.id })
      .populate('estudiante_id')
      .populate('empleo_id');
    res.json(postulantes);
  } catch (err) {
    res.status(500).json({ mensaje: err.message });
  }
});

app.post('/api/ofertas/:id/postularse', async (req, res) => {
  try {
    const estudianteId = req.query.estudianteId || '65a1b2c3d4e5f6g7h8i9j0k1';
    
    // Verificar que no se haya postulado ya
    const existe = await Postulacion.findOne({
      empleo_id: req.params.id,
      estudiante_id: estudianteId,
    });
    
    if (existe) {
      return res.status(400).json({ mensaje: 'Ya te has postulado a esta oferta' });
    }
    
    const postulacion = new Postulacion({
      empleo_id: req.params.id,
      estudiante_id: estudianteId,
      ...req.body,
    });
    
    await postulacion.save();
    res.status(201).json(postulacion);
  } catch (err) {
    res.status(500).json({ mensaje: err.message });
  }
});

// ─────────────────────────────────────────────
//  RUTAS DE POSTULACIONES
// ─────────────────────────────────────────────
app.patch('/api/postulaciones/:id/estado', async (req, res) => {
  try {
    const postulacion = await Postulacion.findByIdAndUpdate(
      req.params.id,
      { estado: req.body.estado },
      { new: true }
    );
    if (!postulacion) return res.status(404).json({ mensaje: 'Postulación no encontrada' });
    res.json(postulacion);
  } catch (err) {
    res.status(500).json({ mensaje: err.message });
  }
});

// ─────────────────────────────────────────────
//  RUTAS DE PREGUNTAS
// ─────────────────────────────────────────────
app.get('/api/ofertas/:id/preguntas', async (req, res) => {
  try {
    const preguntas = await PreguntaEmpleo.find({
      empleo_id: req.params.id,
      activo: true,
    })
      .populate('autor_id')
      .sort({ creado_en: -1 });
    res.json(preguntas);
  } catch (err) {
    res.status(500).json({ mensaje: err.message });
  }
});

app.post('/api/ofertas/:id/preguntas', async (req, res) => {
  try {
    const autorId = req.query.autorId || '65a1b2c3d4e5f6g7h8i9j0k1';
    const pregunta = new PreguntaEmpleo({
      empleo_id: req.params.id,
      autor_id: autorId,
      ...req.body,
    });
    await pregunta.save();
    res.status(201).json(pregunta);
  } catch (err) {
    res.status(500).json({ mensaje: err.message });
  }
});

app.post('/api/preguntas/:id/responder', async (req, res) => {
  try {
    const autorId = req.query.autorId || '65a1b2c3d4e5f6g7h8i9j0k1';
    const preguntaOriginal = await PreguntaEmpleo.findById(req.params.id);
    
    if (!preguntaOriginal) {
      return res.status(404).json({ mensaje: 'Pregunta no encontrada' });
    }
    
    const respuesta = new PreguntaEmpleo({
      empleo_id: preguntaOriginal.empleo_id,
      autor_id: autorId,
      respuesta_a_id: req.params.id,
      contenido: req.body.contenido,
    });
    
    await respuesta.save();
    res.status(201).json(respuesta);
  } catch (err) {
    res.status(500).json({ mensaje: err.message });
  }
});

app.delete('/api/preguntas/:id', async (req, res) => {
  try {
    const pregunta = await PreguntaEmpleo.findByIdAndUpdate(
      req.params.id,
      { activo: false },
      { new: true }
    );
    if (!pregunta) return res.status(404).json({ mensaje: 'Pregunta no encontrada' });
    res.json({ mensaje: 'Pregunta eliminada' });
  } catch (err) {
    res.status(500).json({ mensaje: err.message });
  }
});

// ─────────────────────────────────────────────
//  RUTAS DE MENSAJES
// ─────────────────────────────────────────────
app.get('/api/mensajes/conversaciones', async (req, res) => {
  try {
    const usuarioId = req.query.usuarioId || '65a1b2c3d4e5f6g7h8i9j0k1';
    const conversaciones = await Conversacion.find({
      participantes: usuarioId,
    })
      .populate('participantes')
      .sort({ ultimo_mensaje_en: -1 });
    res.json(conversaciones);
  } catch (err) {
    res.status(500).json({ mensaje: err.message });
  }
});

app.get('/api/mensajes/conversaciones/:id', async (req, res) => {
  try {
    const mensajes = await Mensaje.find({
      conversacion_id: req.params.id,
    })
      .populate('remitente_id')
      .sort({ enviado_en: 1 });
    res.json(mensajes);
  } catch (err) {
    res.status(500).json({ mensaje: err.message });
  }
});

app.post('/api/mensajes/conversaciones/:id', async (req, res) => {
  try {
    const remitenteId = req.query.remitenteId || '65a1b2c3d4e5f6g7h8i9j0k1';
    const mensaje = new Mensaje({
      conversacion_id: req.params.id,
      remitente_id: remitenteId,
      contenido: req.body.contenido,
    });
    await mensaje.save();
    
    // Actualizar último mensaje en conversación
    await Conversacion.findByIdAndUpdate(req.params.id, {
      ultimo_mensaje_en: new Date(),
      ultimo_mensaje_preview: req.body.contenido.substring(0, 100),
    });
    
    res.status(201).json(mensaje);
  } catch (err) {
    res.status(500).json({ mensaje: err.message });
  }
});

app.post('/api/mensajes/conversaciones', async (req, res) => {
  try {
    const usuarioId = req.query.usuarioId || '65a1b2c3d4e5f6g7h8i9j0k1';
    const { usuarioId: otroUsuarioId } = req.body;
    
    // Ordenar IDs para garantizar unicidad
    const participantes = [usuarioId, otroUsuarioId].sort();
    
    let conversacion = await Conversacion.findOne({
      participantes,
    });
    
    if (!conversacion) {
      conversacion = new Conversacion({ participantes });
      await conversacion.save();
    }
    
    res.status(201).json(conversacion);
  } catch (err) {
    res.status(500).json({ mensaje: err.message });
  }
});

app.patch('/api/mensajes/:id/leido', async (req, res) => {
  try {
    const mensaje = await Mensaje.findByIdAndUpdate(
      req.params.id,
      { leido: true, leido_en: new Date() },
      { new: true }
    );
    if (!mensaje) return res.status(404).json({ mensaje: 'Mensaje no encontrado' });
    res.json(mensaje);
  } catch (err) {
    res.status(500).json({ mensaje: err.message });
  }
});

// ─────────────────────────────────────────────
//  RUTAS DE ADMIN
// ─────────────────────────────────────────────
app.get('/api/admin/estadisticas', async (req, res) => {
  try {
    const usuarios = await User.countDocuments();
    const ofertas = await PublicacionEmpleo.countDocuments();
    const postulaciones = await Postulacion.countDocuments();
    
    res.json({
      usuarios,
      ofertas,
      postulaciones,
      empresas: await User.countDocuments({ rol: 'empresa' }),
      estudiantes: await User.countDocuments({ rol: 'estudiante' }),
    });
  } catch (err) {
    res.status(500).json({ mensaje: err.message });
  }
});

app.get('/api/admin/usuarios', async (req, res) => {
  try {
    const usuarios = await User.find().select('-password_hash');
    res.json(usuarios);
  } catch (err) {
    res.status(500).json({ mensaje: err.message });
  }
});

app.get('/api/admin/ofertas', async (req, res) => {
  try {
    const ofertas = await PublicacionEmpleo.find()
      .populate('empresa_id');
    res.json(ofertas);
  } catch (err) {
    res.status(500).json({ mensaje: err.message });
  }
});

app.patch('/api/admin/usuarios/:id/rol', async (req, res) => {
  try {
    const usuario = await User.findByIdAndUpdate(
      req.params.id,
      { rol: req.body.rol },
      { new: true }
    );
    if (!usuario) return res.status(404).json({ mensaje: 'Usuario no encontrado' });
    res.json(usuario);
  } catch (err) {
    res.status(500).json({ mensaje: err.message });
  }
});

app.patch('/api/admin/usuarios/:id/desactivar', async (req, res) => {
  try {
    const usuario = await User.findByIdAndUpdate(
      req.params.id,
      { activo: false },
      { new: true }
    );
    if (!usuario) return res.status(404).json({ mensaje: 'Usuario no encontrado' });
    res.json({ mensaje: 'Usuario desactivado' });
  } catch (err) {
    res.status(500).json({ mensaje: err.message });
  }
});

app.delete('/api/admin/ofertas/:id', async (req, res) => {
  try {
    await PublicacionEmpleo.findByIdAndDelete(req.params.id);
    res.json({ mensaje: 'Oferta eliminada' });
  } catch (err) {
    res.status(500).json({ mensaje: err.message });
  }
});

// ─────────────────────────────────────────────
//  RUTA RAÍZ
// ─────────────────────────────────────────────
app.get('/', (req, res) => {
  res.json({ mensaje: 'Servidor corriendo en puerto ' + PORT });
});

// ─────────────────────────────────────────────
//  INICIAR SERVIDOR
// ─────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`✓ Servidor corriendo en http://localhost:${PORT}`);
  console.log(`✓ API disponible en http://localhost:${PORT}/api`);
});