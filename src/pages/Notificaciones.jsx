import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { notificacionesAPI } from '../api';
import './Notificaciones.css';

function rel(ts) {
  const d = (Date.now() - new Date(ts)) / 1000;
  if (d < 60) return 'ahora';
  if (d < 3600) return `Hace ${Math.floor(d / 60)} min`;
  if (d < 86400) return `Hace ${Math.floor(d / 3600)} h`;
  return `Hace ${Math.floor(d / 86400)} días`;
}

function tipoCls(tipo) {
  if (tipo === 'aceptado') return 'badge-verde';
  if (tipo === 'rechazado') return 'badge-rojo';
  if (tipo === 'postulacion') return 'badge-azul';
  if (tipo === 'calificacion') return 'badge-naranja';
  if (tipo === 'mensaje') return 'badge-gris';
  return 'badge-gris';
}

function tipoLabel(tipo) {
  if (tipo === 'aceptado') return 'Aceptado';
  if (tipo === 'rechazado') return 'Rechazado';
  if (tipo === 'postulacion') return 'Postulación';
  if (tipo === 'calificacion') return 'Calificación';
  if (tipo === 'mensaje') return 'Mensaje';
  return 'Información';
}

export default function Notificaciones() {
  const [notifs, setNotifs] = useState([]);
  const [cargando, setCargando] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    notificacionesAPI.listar()
      .then(data => {
        setNotifs(data.notifs || []);
      })
      .catch(() => setNotifs([]))
      .finally(() => setCargando(false));
  }, []);

  async function marcarLeida(id) {
    try {
      await notificacionesAPI.marcarLeida(id);
      setNotifs(p => p.map(n => n._id === id ? { ...n, leida: true } : n));
    } catch {}
  }

  async function marcarTodasLeidas() {
    try {
      await notificacionesAPI.marcarTodasLeidas();
      setNotifs(p => p.map(n => ({ ...n, leida: true })));
    } catch {}
  }

  function irA(link) {
    navigate(link);
  }

  const noLeidas = notifs.filter(n => !n.leida).length;

  return (
    <div className="notifs-page">
      <div className="notifs-page-inner">
        <div className="notifs-page-header">
          <div>
            <h1 className="notifs-page-title">Notificaciones</h1>
            <p className="notifs-page-sub">
              {noLeidas > 0 ? `${noLeidas} sin leer` : 'Todo al día'}
            </p>
          </div>
          {noLeidas > 0 && (
            <button className="notifs-mark-all-btn" onClick={marcarTodasLeidas}>
              Marcar todas como leídas
            </button>
          )}
        </div>

        {cargando && (
          <div className="notifs-loading">
            <div className="notifs-loading-spinner" />
            <span>Cargando notificaciones...</span>
          </div>
        )}

        {!cargando && notifs.length === 0 && (
          <div className="notifs-empty">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="var(--gris-2)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
              <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
            </svg>
            <p>No tienes notificaciones</p>
          </div>
        )}

        {!cargando && notifs.length > 0 && (
          <div className="notifs-lista">
            {notifs.map(n => (
              <div key={n._id} className={`notifs-item card ${!n.leida ? 'no-leida' : ''}`}>
                <div className="notifs-item-content">
                  {!n.leida && <div className="notifs-item-dot" />}
                  <div className="notifs-item-body">
                    <span className={`badge ${tipoCls(n.tipo)}`}>{tipoLabel(n.tipo)}</span>
                    <p className="notifs-item-titulo">{n.titulo}</p>
                    <p className="notifs-item-texto">{n.texto}</p>
                    <span className="notifs-item-tiempo">{rel(n.creado_en)}</span>
                  </div>
                </div>
                {n.link && (
                  <div className="notifs-item-actions">
                    <button className="notifs-ir-btn" onClick={() => irA(n.link)}>
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>
                        <polyline points="15 3 21 3 21 9"/>
                        <line x1="10" y1="14" x2="21" y2="3"/>
                      </svg>
                      Ir
                    </button>
                    {!n.leida && (
                      <button className="notifs-marcar-btn" onClick={() => marcarLeida(n._id)}>
                        Marcar leída
                      </button>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
