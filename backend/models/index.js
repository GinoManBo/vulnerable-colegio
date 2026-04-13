const { Schema, model, Types } = require("mongoose");

// ─────────────────────────────────────────────
//  USERS  (estudiante | empresa | admin)
// ─────────────────────────────────────────────
const userSchema = new Schema(
  {
    nombre: { type: String, required: true, trim: true },
    apellido: { type: String, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true },
    password_hash: { type: String, required: true },
    rol: {
      type: String,
      enum: ["estudiante", "empresa", "admin"],
      required: true,
    },
    activo: { type: Boolean, default: true },
  },
  { timestamps: { createdAt: "creado_en", updatedAt: "actualizado_en" } }
);

const User = model("User", userSchema);

// ─────────────────────────────────────────────
//  PERFIL ESTUDIANTE
// ─────────────────────────────────────────────
const perfilEstudianteSchema = new Schema(
  {
    usuario_id: { type: Types.ObjectId, ref: "User", required: true, unique: true },
    foto_perfil_url: { type: String, default: null },
    curriculum_url: { type: String, default: null },
    descripcion: { type: String, maxlength: 600 },
    intereses: [{ type: String, trim: true }],            // ej: ["mecatrónica", "redes"]
    destrezas: [{ type: String, trim: true }],            // ej: ["AutoCAD", "Python"]
    // puntuación calculada a partir de calificaciones_trabajo
    puntuacion_promedio: { type: Number, min: 1, max: 7, default: null },
    total_calificaciones: { type: Number, default: 0 },
  },
  { timestamps: { createdAt: "creado_en", updatedAt: "actualizado_en" } }
);

const PerfilEstudiante = model("PerfilEstudiante", perfilEstudianteSchema);

// ─────────────────────────────────────────────
//  PERFIL EMPRESA
// ─────────────────────────────────────────────
const perfilEmpresaSchema = new Schema(
  {
    usuario_id: { type: Types.ObjectId, ref: "User", required: true, unique: true },
    nombre_empresa: { type: String, required: true, trim: true },
    logo_url: { type: String, default: null },
    descripcion: { type: String, maxlength: 800 },
    rubro: { type: String },                              // ej: "Construcción", "TI"
    sitio_web: { type: String },
    telefono: { type: String },
    ciudad: { type: String },
    region: { type: String },
  },
  { timestamps: { createdAt: "creado_en", updatedAt: "actualizado_en" } }
);

const PerfilEmpresa = model("PerfilEmpresa", perfilEmpresaSchema);

// ─────────────────────────────────────────────
//  PUBLICACIONES DE EMPLEO
// ─────────────────────────────────────────────
const publicacionEmpleoSchema = new Schema(
  {
    empresa_id: { type: Types.ObjectId, ref: "PerfilEmpresa", required: true },
    titulo: { type: String, required: true, trim: true },
    descripcion: { type: String, required: true },
    ubicacion: { type: String, required: true },
    salario_min: { type: Number, min: 0 },                // en CLP
    salario_max: { type: Number, min: 0 },
    modalidad: {
      type: String,
      enum: ["presencial", "remoto", "híbrido"],
      default: "presencial",
    },
    especialidades_requeridas: [{ type: String }],        // ej: ["electricidad", "mecánica"]
    activo: { type: Boolean, default: true },
    cierre_en: { type: Date, default: null },
  },
  { timestamps: { createdAt: "publicado_en", updatedAt: "actualizado_en" } }
);

const PublicacionEmpleo = model("PublicacionEmpleo", publicacionEmpleoSchema);

// ─────────────────────────────────────────────
//  POSTULACIONES
// ─────────────────────────────────────────────
const postulacionSchema = new Schema(
  {
    empleo_id: { type: Types.ObjectId, ref: "PublicacionEmpleo", required: true },
    estudiante_id: { type: Types.ObjectId, ref: "PerfilEstudiante", required: true },
    estado: {
      type: String,
      enum: ["pendiente", "en_revision", "aceptada", "rechazada", "contratado"],
      default: "pendiente",
    },
    carta_presentacion: { type: String, maxlength: 1000 },
  },
  { timestamps: { createdAt: "postulado_en", updatedAt: "actualizado_en" } }
);

// Un estudiante no puede postular dos veces al mismo empleo
postulacionSchema.index({ empleo_id: 1, estudiante_id: 1 }, { unique: true });

const Postulacion = model("Postulacion", postulacionSchema);

// ─────────────────────────────────────────────
//  PREGUNTAS / COMENTARIOS EN PUBLICACIONES
//  (flujo de preguntas tipo foro por oferta)
// ─────────────────────────────────────────────
const preguntaEmpleoSchema = new Schema(
  {
    empleo_id: { type: Types.ObjectId, ref: "PublicacionEmpleo", required: true },
    autor_id: { type: Types.ObjectId, ref: "User", required: true },
    contenido: { type: String, required: true, maxlength: 800 },
    // si es una respuesta a otra pregunta
    respuesta_a_id: { type: Types.ObjectId, ref: "PreguntaEmpleo", default: null },
    activo: { type: Boolean, default: true },
  },
  { timestamps: { createdAt: "creado_en", updatedAt: "actualizado_en" } }
);

const PreguntaEmpleo = model("PreguntaEmpleo", preguntaEmpleoSchema);

// ─────────────────────────────────────────────
//  CALIFICACIONES DE TRABAJO
//  (escala 1 – 7, registrada cuando un estudiante
//   fue contratado a través de la plataforma)
// ─────────────────────────────────────────────
const calificacionTrabajoSchema = new Schema(
  {
    postulacion_id: { type: Types.ObjectId, ref: "Postulacion", required: true, unique: true },
    estudiante_id: { type: Types.ObjectId, ref: "PerfilEstudiante", required: true },
    empresa_id: { type: Types.ObjectId, ref: "PerfilEmpresa", required: true },
    puntuacion: { type: Number, required: true, min: 1, max: 7 },
    comentario: { type: String, maxlength: 500 },
  },
  { timestamps: { createdAt: "creado_en" } }
);

const CalificacionTrabajo = model("CalificacionTrabajo", calificacionTrabajoSchema);

// ─────────────────────────────────────────────
//  CONVERSACIONES
//  (empresa↔estudiante, empresa↔empresa,
//   admin↔empresa, admin↔estudiante)
// ─────────────────────────────────────────────
const conversacionSchema = new Schema(
  {
    // Array de exactamente 2 usuarios participantes
    participantes: {
      type: [{ type: Types.ObjectId, ref: "User" }],
      validate: {
        validator: (v) => v.length === 2,
        message: "Una conversación debe tener exactamente 2 participantes.",
      },
    },
    ultimo_mensaje_en: { type: Date, default: null },
    ultimo_mensaje_preview: { type: String, maxlength: 100, default: null },
  },
  { timestamps: { createdAt: "creado_en" } }
);

// Garantiza que no se creen conversaciones duplicadas entre el mismo par
conversacionSchema.index(
  { "participantes.0": 1, "participantes.1": 1 },
  { unique: true }
);

const Conversacion = model("Conversacion", conversacionSchema);

// ─────────────────────────────────────────────
//  MENSAJES
// ─────────────────────────────────────────────
const mensajeSchema = new Schema(
  {
    conversacion_id: { type: Types.ObjectId, ref: "Conversacion", required: true },
    remitente_id: { type: Types.ObjectId, ref: "User", required: true },
    contenido: { type: String, required: true, maxlength: 2000 },
    leido: { type: Boolean, default: false },
    leido_en: { type: Date, default: null },
  },
  { timestamps: { createdAt: "enviado_en" } }
);

mensajeSchema.index({ conversacion_id: 1, enviado_en: -1 });

const Mensaje = model("Mensaje", mensajeSchema);

// ─────────────────────────────────────────────
//  EXPORTS
// ─────────────────────────────────────────────
module.exports = {
  User,
  PerfilEstudiante,
  PerfilEmpresa,
  PublicacionEmpleo,
  Postulacion,
  PreguntaEmpleo,
  CalificacionTrabajo,
  Conversacion,
  Mensaje,
};