// Detecta automáticamente la URL del API según el entorno
function getApiUrl() {
  // Si hay una variable de entorno explícita, usarla
  if (import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL;
  }
  // Si NO estamos en localhost, asumir que el backend está en el mismo dominio
  if (!window.location.hostname.includes('localhost')) {
    return '/api';
  }
  // Desarrollo local
  return 'http://localhost:5000/api';
}

const API_URL = getApiUrl();

// Helper para obtener URL absoluta de imágenes/archivos subidos
export function getMediaUrl(url) {
  if (!url) return null;
  if (url.startsWith('http')) return url;
  const base = API_URL.replace('/api', '');
  return `${base}${url}`;
}

// Helper para hacer fetch
export async function fetchAPI(url, options = {}) {
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  // Agregar token al header si existe
  const token = localStorage.getItem('token');
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_URL}${url}`, {
    headers,
    credentials: 'include',
    ...options,
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.mensaje || err.error || `HTTP ${response.status}`);
  }

  return response.json();
}

// ─────────────────────────────────────────────
//  OFERTAS (EMPLEOS)
// ─────────────────────────────────────────────
export const ofertasAPI = {
  // Obtener mis ofertas (para empresa)
  misOfertas: () => fetchAPI('/ofertas/mis-ofertas'),

  // Obtener todas las ofertas activas (para estudiante)
  listar: () => fetchAPI('/ofertas'),

  // Obtener una oferta específica
  obtener: (id) => fetchAPI(`/ofertas/${id}`),

  // Alias para obtener detalles de una oferta
  detalle: (id) => fetchAPI(`/ofertas/${id}`),

  // Crear nueva oferta (empresa)
  crear: (payload) => fetchAPI('/ofertas', {
    method: 'POST',
    body: JSON.stringify(payload),
  }),

  // Editar oferta (empresa)
  editar: (id, payload) => fetchAPI(`/ofertas/${id}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  }),

  // Obtener postulantes de una oferta
  postulantes: (ofertaId) => fetchAPI(`/ofertas/${ofertaId}/postulaciones`),

  // Cambiar estado de una postulación
  cambiarEstado: (postulacionId, estado) => fetchAPI(`/ofertas/postulaciones/${postulacionId}/estado`, {
    method: 'PATCH',
    body: JSON.stringify({ estado }),
  }),

  // Postularse a una oferta (estudiante)
  postularse: (ofertaId, payload) => fetchAPI(`/ofertas/${ofertaId}/postular`, {
    method: 'POST',
    body: JSON.stringify(payload),
  }),

  // Obtener o postular a una oferta
  postular: (ofertaId) => fetchAPI(`/ofertas/${ofertaId}/postular`, {
    method: 'POST',
    body: JSON.stringify({}),
  }),

  // Eliminar oferta (empresa)
  eliminar: (ofertaId) => fetchAPI(`/ofertas/${ofertaId}`, {
    method: 'DELETE',
  }),
};

// ─────────────────────────────────────────────
//  PERFIL
// ─────────────────────────────────────────────
export const perfilAPI = {
  // Obtener mi perfil actual
  me: () => fetchAPI('/perfil/me'),

  // Actualizar mi perfil
  actualizar: (payload) => fetchAPI('/perfil', {
    method: 'PUT',
    body: JSON.stringify(payload),
  }),

  // Obtener perfil de un usuario
  obtener: (usuarioId) => fetchAPI(`/perfil/usuario/${usuarioId}`),

  // Obtener ofertas activas de una empresa
  ofertasEmpresa: (usuarioId) => fetchAPI(`/perfil/usuario/${usuarioId}/ofertas`),

  // Obtener mis postulaciones
  misPostulaciones: () => fetchAPI('/perfil/mis-postulaciones'),

  // Retirar una postulación
  retirarPostulacion: (postId) => fetchAPI(`/perfil/postulaciones/${postId}/retirar`, {
    method: 'DELETE',
  }),

  // Obtener mis calificaciones
  misCalificaciones: () => fetchAPI('/perfil/mis-calificaciones'),

  // Eliminar CV
  eliminarCv: () => fetchAPI('/perfil/cv', { method: 'DELETE' }),

  // Obtener historial de trabajo de un estudiante
  historialTrabajo: (usuarioId) => fetchAPI(`/perfil/historial-trabajo/${usuarioId}`),
};

// ─────────────────────────────────────────────
//  HISTORIAL DE TRABAJO
// ─────────────────────────────────────────────
export const historialAPI = {
  // Obtener estudiantes contratados por oferta
  contratadosPorOferta: (ofertaId) => fetchAPI(`/ofertas/${ofertaId}/contratados`),

  // Enviar feedback y nota a estudiante
  enviarFeedback: (id, payload) => fetchAPI(`/historial-trabajo/${id}/feedback`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  }),
};

// ─────────────────────────────────────────────
//  BÚSQUEDA
// ─────────────────────────────────────────────
export const busquedaAPI = {
  buscar: (q) => fetchAPI(`/buscar?q=${encodeURIComponent(q)}`),
};

// ─────────────────────────────────────────────
//  STATS PÚBLICAS
// ─────────────────────────────────────────────
export const statsAPI = {
  obtener: () => fetchAPI('/stats'),
};

// ─────────────────────────────────────────────
//  PREGUNTAS (PARA OFERTAS)
// ─────────────────────────────────────────────
export const preguntasAPI = {
  // Obtener preguntas de una oferta
  listar: (ofertaId) => fetchAPI(`/preguntas/${ofertaId}`),

  // Crear pregunta
  crear: (ofertaId, payload) => fetchAPI(`/preguntas/${ofertaId}`, {
    method: 'POST',
    body: JSON.stringify(payload),
  }),

  // Responder pregunta
  responder: (preguntaId, payload) => fetchAPI(`/preguntas/${preguntaId}/responder`, {
    method: 'POST',
    body: JSON.stringify(payload),
  }),

  // Eliminar pregunta
  eliminar: (preguntaId) => fetchAPI(`/preguntas/${preguntaId}`, {
    method: 'DELETE',
  }),
};

// ─────────────────────────────────────────────
//  MENSAJES
// ─────────────────────────────────────────────
export const mensajesAPI = {
  // Obtener conversaciones del usuario
  conversaciones: () => fetchAPI('/mensajes'),

  // Obtener total de mensajes no leídos
  noLeidos: () => fetchAPI('/mensajes/no-leidos'),

  // Obtener mensajes de una conversación
  obtener: (conversacionId) => fetchAPI(`/mensajes/${conversacionId}`),

  // Enviar mensaje
  enviar: (conversacionId, payload) => fetchAPI(`/mensajes/${conversacionId}`, {
    method: 'POST',
    body: JSON.stringify(payload),
  }),

  // Crear conversación con otro usuario
  iniciar: (usuarioId) => fetchAPI('/mensajes/conversacion', {
    method: 'POST',
    body: JSON.stringify({ destinatario_id: usuarioId }),
  }),

  // Marcar todos los mensajes de una conversación como leídos
  marcarLeidos: (conversacionId) => fetchAPI(`/mensajes/${conversacionId}/leidos`, {
    method: 'PATCH',
  }),

  // Obtener cantidad de mensajes no leídos en una conversación
  noLeidosConv: (conversacionId) => fetchAPI(`/mensajes/${conversacionId}/no-leidos`),

  // Marcar mensaje como leído
  marcarLeido: (mensajeId) => fetchAPI(`/mensajes/${mensajeId}/leido`, {
    method: 'PATCH',
  }),

  // Obtener miembros de una conversación grupal
  miembros: (conversacionId) => fetchAPI(`/mensajes/${conversacionId}/miembros`),

  // Obtener conversación grupal de una oferta
  grupoOferta: (ofertaId) => fetchAPI(`/mensajes/grupo-oferta/${ofertaId}`),

  // Salir de una conversación grupal
  salirDelGrupo: (conversacionId) => fetchAPI(`/mensajes/${conversacionId}/salir`, {
    method: 'PATCH',
  }),
};

// ─────────────────────────────────────────────
//  ADMIN
// ─────────────────────────────────────────────
export const adminAPI = {
  // Obtener estadísticas
  estadisticas: () => fetchAPI('/admin/estadisticas'),
  stats: () => fetchAPI('/admin/stats'),

  // Obtener usuarios
  usuarios: (filtros = {}) => {
    const params = new URLSearchParams(filtros);
    return fetchAPI(`/admin/usuarios?${params}`);
  },

  // Obtener ofertas (admin)
  ofertas: (filtros = {}) => {
    const params = new URLSearchParams(filtros);
    return fetchAPI(`/admin/ofertas?${params}`);
  },
  todasOfertas: () => fetchAPI('/admin/todas-ofertas'),

  // Cambiar rol de usuario
  cambiarRol: (usuarioId, rol) => fetchAPI(`/admin/usuarios/${usuarioId}/rol`, {
    method: 'PATCH',
    body: JSON.stringify({ rol }),
  }),

  // Activar/desactivar usuario
  toggleActivo: (usuarioId, activo) => fetchAPI(`/admin/usuarios/${usuarioId}/activo`, {
    method: 'PATCH',
    body: JSON.stringify({ activo }),
  }),

  // Desactivar usuario
  desactivarUsuario: (usuarioId) => fetchAPI(`/admin/usuarios/${usuarioId}/desactivar`, {
    method: 'PATCH',
  }),

  // Eliminar usuario
  eliminarUsuario: (usuarioId) => fetchAPI(`/admin/usuarios/${usuarioId}`, {
    method: 'DELETE',
  }),

  // Eliminar oferta
  eliminarOferta: (ofertaId) => fetchAPI(`/admin/ofertas/${ofertaId}`, {
    method: 'DELETE',
  }),

  // Obtener logs de auditoría
  auditoria: (filtros = {}) => {
    const params = new URLSearchParams(filtros);
    return fetchAPI(`/admin/auditoria?${params}`);
  },

  // Modificar perfil de usuario (admin privilegiado)
  modificarPerfil: (usuarioId, payload) => fetchAPI(`/admin/perfil/${usuarioId}`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  }),
};

// ─────────────────────────────────────────────
//  AUTENTICACIÓN
// ─────────────────────────────────────────────
export const authAPI = {
  // Login
  login: (email, password) => fetchAPI('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  }),

  // Registro
  registro: (payload) => fetchAPI('/auth/registro', {
    method: 'POST',
    body: JSON.stringify(payload),
  }),

  // Logout
  logout: () => fetchAPI('/auth/logout', {
    method: 'POST',
  }),

  // Verificar sesión
  verificar: () => fetchAPI('/auth/me').catch(() => null),
};

// ─────────────────────────────────────────────
//  NOTIFICACIONES
// ─────────────────────────────────────────────
export const notificacionesAPI = {
  // Obtener notificaciones
  listar: () => fetchAPI('/notificaciones'),

  // Marcar todas como leídas
  marcarTodasLeidas: () => fetchAPI('/notificaciones/leer-todas', {
    method: 'PATCH',
  }),

  // Marcar una notificación como leída
  marcarLeida: (notifId) => fetchAPI(`/notificaciones/${notifId}/leida`, {
    method: 'PATCH',
  }),
};
