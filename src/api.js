const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// Helper para hacer fetch
async function fetchAPI(url, options = {}) {
  const response = await fetch(`${API_URL}${url}`, {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    credentials: 'include',
    ...options,
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.mensaje || `HTTP ${response.status}`);
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
  postulantes: (ofertaId) => fetchAPI(`/ofertas/${ofertaId}/postulantes`),

  // Cambiar estado de una postulación
  cambiarEstado: (postulacionId, estado) => fetchAPI(`/postulaciones/${postulacionId}/estado`, {
    method: 'PATCH',
    body: JSON.stringify({ estado }),
  }),

  // Postularse a una oferta (estudiante)
  postularse: (ofertaId, payload) => fetchAPI(`/ofertas/${ofertaId}/postularse`, {
    method: 'POST',
    body: JSON.stringify(payload),
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
};

// ─────────────────────────────────────────────
//  PREGUNTAS (PARA OFERTAS)
// ─────────────────────────────────────────────
export const preguntasAPI = {
  // Obtener preguntas de una oferta
  listar: (ofertaId) => fetchAPI(`/ofertas/${ofertaId}/preguntas`),

  // Crear pregunta
  crear: (ofertaId, payload) => fetchAPI(`/ofertas/${ofertaId}/preguntas`, {
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
  conversaciones: () => fetchAPI('/mensajes/conversaciones'),

  // Obtener mensajes de una conversación
  obtener: (conversacionId) => fetchAPI(`/mensajes/conversaciones/${conversacionId}`),

  // Enviar mensaje
  enviar: (conversacionId, payload) => fetchAPI(`/mensajes/conversaciones/${conversacionId}`, {
    method: 'POST',
    body: JSON.stringify(payload),
  }),

  // Crear conversación con otro usuario
  iniciar: (usuarioId) => fetchAPI('/mensajes/conversaciones', {
    method: 'POST',
    body: JSON.stringify({ usuarioId }),
  }),

  // Marcar mensaje como leído
  marcarLeido: (mensajeId) => fetchAPI(`/mensajes/${mensajeId}/leido`, {
    method: 'PATCH',
  }),
};

// ─────────────────────────────────────────────
//  ADMIN
// ─────────────────────────────────────────────
export const adminAPI = {
  // Obtener estadísticas
  estadisticas: () => fetchAPI('/admin/estadisticas'),

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

  // Cambiar rol de usuario
  cambiarRol: (usuarioId, rol) => fetchAPI(`/admin/usuarios/${usuarioId}/rol`, {
    method: 'PATCH',
    body: JSON.stringify({ rol }),
  }),

  // Desactivar usuario
  desactivarUsuario: (usuarioId) => fetchAPI(`/admin/usuarios/${usuarioId}/desactivar`, {
    method: 'PATCH',
  }),

  // Eliminar oferta
  eliminarOferta: (ofertaId) => fetchAPI(`/admin/ofertas/${ofertaId}`, {
    method: 'DELETE',
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
