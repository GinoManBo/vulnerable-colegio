import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ofertasAPI, mensajesAPI } from '../api';
import OnlineStatus from './OnlineStatus';
import './PostulantesModal.css';

const ESTADO_CFG = {
  pendiente:   { label: 'Pendiente',   cls: 'badge-gris' },
  en_revision: { label: 'En revisión', cls: 'badge-naranja' },
  aceptada:    { label: 'Aceptado',    cls: 'badge-verde' },
  rechazada:   { label: 'Rechazado',   cls: 'badge-rojo' },
  contratado:  { label: 'Contratado',  cls: 'badge-verde' },
};

export default function PostulantesModal({ ofertaId, ofertaTitulo, onClose }) {
  const [postulantes, setPostulantes] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');
  const [enviandoMsg, setEnviandoMsg] = useState({});
  const navigate = useNavigate();

  useEffect(() => {
    const cargar = async () => {
      try {
        const posts = await ofertasAPI.postulantes(ofertaId);
        setPostulantes(posts);
      } catch (err) {
        setError(err.message);
      } finally {
        setCargando(false);
      }
    };
    cargar();
  }, [ofertaId]);

  const handleCambiarEstado = async (postId, estado) => {
    try {
      await ofertasAPI.cambiarEstado(postId, estado);
      setPostulantes(p => p.map(x => x._id === postId ? { ...x, estado } : x));
    } catch (err) {
      alert(`Error: ${err.message}`);
    }
  };

  async function enviarMensaje(usuarioId) {
    if (!usuarioId || enviandoMsg[usuarioId]) return;
    setEnviandoMsg(p => ({ ...p, [usuarioId]: true }));
    try {
      await mensajesAPI.iniciar(usuarioId);
      window.dispatchEvent(new Event('recargar-mensajes-no-leidos'));
      window.dispatchEvent(new Event('recargar-conversaciones'));
      navigate('/mensajes');
    } catch (err) {
      alert(`Error: ${err.message}`);
    } finally {
      setEnviandoMsg(p => ({ ...p, [usuarioId]: false }));
    }
  }

  return (
    <div className="postulantes-modal-overlay" onClick={onClose}>
      <div className="postulantes-modal" onClick={e => e.stopPropagation()}>
        <div className="postulantes-modal-header">
          <div>
            <h2>Postulantes</h2>
            <p className="postulantes-subtitle">{ofertaTitulo}</p>
          </div>
          <button className="postulantes-close" onClick={onClose}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        <div className="postulantes-modal-body">
          {cargando && (
            <div style={{ textAlign: 'center', padding: '40px 20px' }}>
              <div style={{ width: 36, height: 36, border: '3px solid var(--azul-light)', borderTopColor: 'var(--azul)', borderRadius: '50%', margin: '0 auto', animation: 'spin .8s linear infinite' }} />
            </div>
          )}

          {error && (
            <div style={{ padding: '12px 16px', background: 'var(--rojo-light)', color: 'var(--rojo)', borderRadius: 'var(--radius-md)', margin: '16px', fontSize: 13 }}>
              {error}
            </div>
          )}

          {!cargando && postulantes.length === 0 && (
            <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--gris-2)' }}>
              <p>Sin postulantes para esta oferta</p>
            </div>
          )}

          {!cargando && postulantes.length > 0 && (
            <div className="postulantes-grid">
              {postulantes.map(p => {
                const est = p.estudiante_id ?? {};
                const usuario = est.usuario_id ?? {};
                const cfg = ESTADO_CFG[p.estado] ?? ESTADO_CFG.pendiente;
                const fotoUrl = est.foto_perfil_url;
                const especialidades = est.intereses ?? [];

                return (
                  <div key={p._id} className="postulante-card card">
                    <div className="postulante-card-header">
                      <Link to={`/perfil/${usuario._id}`} className="postulante-foto-link">
                        <div className="postulante-foto">
                          {fotoUrl ? (
                            <img src={fotoUrl} alt={usuario.nombre} />
                          ) : (
                            <span>{usuario.nombre?.[0] ?? 'E'}</span>
                          )}
                        </div>
                      </Link>
                      <span className={`badge ${cfg.cls}`}>{cfg.label}</span>
                    </div>

                    <Link to={`/perfil/${usuario._id}`} className="postulante-info-link">
                      <h3 className="postulante-nombre">
                        {usuario.nombre} {usuario.apellido}
                        <OnlineStatus usuarioId={usuario._id} size={10} />
                      </h3>
                      <p className="postulante-email">{usuario.email}</p>
                    </Link>

                    {especialidades.length > 0 && (
                      <div className="postulante-especialidades">
                        {especialidades.slice(0, 3).map(e => (
                          <span key={e} className="badge badge-azul">{e}</span>
                        ))}
                      </div>
                    )}

                    {est.descripcion && (
                      <p className="postulante-descripcion">{est.descripcion}</p>
                    )}

                    <div className="postulante-acciones">
                      <select 
                        value={p.estado} 
                        onChange={e => handleCambiarEstado(p._id, e.target.value)}
                        className="estado-select"
                      >
                        {Object.entries(ESTADO_CFG).map(([v, { label }]) => (
                          <option key={v} value={v}>{label}</option>
                        ))}
                      </select>
                      <button className="btn-mensaje-postulante" onClick={() => enviarMensaje(usuario._id)} disabled={enviandoMsg[usuario._id]}>
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
                        </svg>
                        {enviandoMsg[usuario._id] ? 'Abriendo...' : 'Mensaje'}
                      </button>
                      <Link to={`/perfil/${usuario._id}`} className="btn-secondary btn-sm">
                        Ver perfil
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
