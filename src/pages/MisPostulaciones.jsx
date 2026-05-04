import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { perfilAPI } from '../api';
import './MisPostulaciones.css';

function IcoCheck() {
  return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>;
}

function IcoX() {
  return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>;
}

function IcoClock() {
  return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>;
}

function IcoEye() {
  return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>;
}

function IcoStar() {
  return <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>;
}

function IcoChat() {
  return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>;
}

function IcoMessageSquare() {
  return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>;
}

function IcoTrash() {
  return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>;
}

function obtenerBadgeEstado(estado) {
  const estados = {
    pendiente: { clase: 'estado-pendiente', label: 'Pendiente', icono: IcoClock },
    en_revision: { clase: 'estado-revision', label: 'En revisión', icono: IcoEye },
    aceptada: { clase: 'estado-aceptada', label: 'Aceptada', icono: IcoCheck },
    rechazada: { clase: 'estado-rechazada', label: 'Rechazada', icono: IcoX },
    contratado: { clase: 'estado-contratado', label: 'Contratado', icono: IcoStar },
  };
  return estados[estado] || estados.pendiente;
}

export default function MisPostulaciones({ usuario }) {
  const [postulaciones, setPostulaciones] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [filtro, setFiltro] = useState('todas');
  const [retirandoId, setRetirandoId] = useState(null);

  useEffect(() => {
    async function cargarPostulaciones() {
      try {
        const datos = await perfilAPI.misPostulaciones();
        setPostulaciones(datos || []);
      } catch (err) {
        setPostulaciones([]);
      } finally {
        setCargando(false);
      }
    }
    cargarPostulaciones();
  }, []);

  const postulacionesFiltradas = postulaciones.filter(p => {
    if (filtro === 'todas') return true;
    return p.estado === filtro;
  });

  async function retirarPostulacion(postId) {
    setRetirandoId(postId);
    try {
      await perfilAPI.retirarPostulacion(postId);
      setPostulaciones(prev => prev.filter(p => String(p._id) !== String(postId)));
      window.dispatchEvent(new Event('actualizar-postulaciones'));
      window.dispatchEvent(new Event('recargar-notificaciones'));
      alert('Postulación retirada exitosamente');
    } catch (err) {
      alert(err.message || 'No se pudo retirar la postulación');
    } finally {
      setRetirandoId(null);
    }
  }

  const estadosCuenta = {
    aceptada: postulaciones.filter(p => p.estado === 'aceptada').length,
    rechazada: postulaciones.filter(p => p.estado === 'rechazada').length,
    pendiente: postulaciones.filter(p => p.estado === 'pendiente').length,
    en_revision: postulaciones.filter(p => p.estado === 'en_revision').length,
    contratado: postulaciones.filter(p => p.estado === 'contratado').length,
  };

  if (cargando) {
    return (
      <div className="mis-postulaciones">
        <div style={{ padding: '40px 24px', textAlign: 'center' }}>
          <p>Cargando tus postulaciones...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="mis-postulaciones">
      <div className="mis-postulaciones-header">
        <h1>Mis Postulaciones</h1>
        <p className="mis-postulaciones-subtitle">Aquí puedes ver todas tus postulaciones y su estado actual</p>
      </div>

      <div className="mis-postulaciones-stats">
        <div className="stat-card">
          <div className="stat-label">Total postulaciones</div>
          <div className="stat-number">{postulaciones.length}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Pendientes</div>
          <div className="stat-number">{estadosCuenta.pendiente}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Aceptadas</div>
          <div className="stat-number">{estadosCuenta.aceptada}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Rechazadas</div>
          <div className="stat-number">{estadosCuenta.rechazada}</div>
        </div>
      </div>

      <div className="mis-postulaciones-filtros">
        <button
          className={`filtro-btn ${filtro === 'todas' ? 'active' : ''}`}
          onClick={() => setFiltro('todas')}
        >
          <span className='Todas'>Todas</span> ({postulaciones.length})
        </button>
        <button
          className={`filtro-btn ${filtro === 'pendiente' ? 'active' : ''}`}
          onClick={() => setFiltro('pendiente')}
        >
          Pendiente ({estadosCuenta.pendiente})
        </button>
        <button
          className={`filtro-btn ${filtro === 'en_revision' ? 'active' : ''}`}
          onClick={() => setFiltro('en_revision')}
        >
          En revisión ({estadosCuenta.en_revision})
        </button>
        <button
          className={`filtro-btn ${filtro === 'aceptada' ? 'active' : ''}`}
          onClick={() => setFiltro('aceptada')}
        >
          Aceptada ({estadosCuenta.aceptada})
        </button>
        <button
          className={`filtro-btn ${filtro === 'rechazada' ? 'active' : ''}`}
          onClick={() => setFiltro('rechazada')}
        >
          Rechazada ({estadosCuenta.rechazada})
        </button>
        <button
          className={`filtro-btn ${filtro === 'contratado' ? 'active' : ''}`}
          onClick={() => setFiltro('contratado')}
        >
          Contratado ({estadosCuenta.contratado})
        </button>
      </div>

      <div className="mis-postulaciones-lista">
        {postulacionesFiltradas.length === 0 ? (
          <div className="empty-state">
            <p className="empty-title">No hay postulaciones en este estado</p>
            <p className="empty-subtitle">
              {postulaciones.length === 0
                ? 'Aún no te has postulado a ninguna oferta'
                : 'Intenta cambiar el filtro'}
            </p>
            <Link to="/" className="empty-action">
              Ver ofertas disponibles
            </Link>
          </div>
        ) : (
          postulacionesFiltradas.map(post => {
            const oferta = post.empleo_id;
            const empresa = oferta?.empresa_id || { nombre_empresa: 'Empresa' };
            const estadoInfo = obtenerBadgeEstado(post.estado);
            const IconoEstado = estadoInfo.icono;

            return (
              <div key={post._id} className="postulacion-card">
                <div className="postulacion-card-header">
                  <div className="postulacion-empresa">
                    <div className="empresa-logo">
                      {empresa?.logo_url ? (
                        <img src={empresa.logo_url} alt={empresa.nombre_empresa} />
                      ) : (
                        <div className="logo-placeholder">{empresa?.nombre_empresa?.[0] || 'E'}</div>
                      )}
                    </div>
                    <div className="empresa-info">
                      <h3 className="empresa-nombre">{empresa?.nombre_empresa || 'Empresa'}</h3>
                      <p className="oferta-titulo">{oferta?.titulo || 'Oferta'}</p>
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <button
                      className="btn-retirar"
                      onClick={(e) => {
                        e.stopPropagation();
                        retirarPostulacion(String(post._id));
                      }}
                      disabled={retirandoId === String(post._id)}
                      title="Retirar postulación"
                    >
                      <IcoTrash />
                      {retirandoId === String(post._id) ? 'Retirando...' : 'Retirar'}
                    </button>
                    <div className={`estado-badge ${estadoInfo.clase}`}>
                      <IconoEstado />
                      <span>{estadoInfo.label}</span>
                    </div>
                  </div>
                </div>

                <div className="postulacion-card-body">
                  <div className="oferta-detalles">
                    <div className="detalle-item">
                      <span className="detalle-label">Ubicación:</span>
                      <span className="detalle-valor">{oferta?.ubicacion || 'No especificada'}</span>
                    </div>
                    <div className="detalle-item">
                      <span className="detalle-label">Modalidad:</span>
                      <span className="detalle-valor capitalize">{oferta?.modalidad || 'No especificada'}</span>
                    </div>
                    {oferta?.salario_min || oferta?.salario_max ? (
                      <div className="detalle-item">
                        <span className="detalle-label">Salario:</span>
                        <span className="detalle-valor">
                          {oferta?.salario_min && oferta?.salario_max
                            ? `$${oferta.salario_min?.toLocaleString()} - $${oferta.salario_max?.toLocaleString()}`
                            : oferta?.salario_min
                            ? `Desde $${oferta.salario_min?.toLocaleString()}`
                            : 'A convenir'}
                        </span>
                      </div>
                    ) : null}
                  </div>

                  <div className="postulacion-timestamps">
                    <p className="timestamp">
                      <span className="label">Postulación:</span>
                      <span className="valor">{new Date(post.postulado_en).toLocaleDateString('es-CL')}</span>
                    </p>
                    {post.actualizado_en && (
                      <p className="timestamp">
                        <span className="label">Última actualización:</span>
                        <span className="valor">{new Date(post.actualizado_en).toLocaleDateString('es-CL')}</span>
                      </p>
                    )}
                  </div>
                </div>

                <div className="postulacion-card-footer">
                  <Link to={`/oferta/${oferta?._id}`} className="btn-ver-oferta">
                    Ver oferta completa
                  </Link>
                  <Link to={`/chat-oferta/${oferta?._id}`} className="btn-chat-oferta">
                    <IcoMessageSquare />
                    Chat de la oferta
                  </Link>
                  <Link to="/mensajes" className="btn-chat-empresa">
                    <IcoChat />
                    Chat con empresa
                  </Link>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
