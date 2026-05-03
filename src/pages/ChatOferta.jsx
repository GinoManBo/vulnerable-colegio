import { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ofertasAPI, mensajesAPI } from '../api';
import './ChatOferta.css';

function fmt(n) { return '$' + Math.round(n).toLocaleString('es-CL'); }
function rel(ts) { const d = (Date.now() - new Date(ts)) / 1000; if (d < 3600) return `Hace ${Math.floor(d / 60)} min`; if (d < 86400) return `Hace ${Math.floor(d / 3600)} h`; return `Hace ${Math.floor(d / 86400)} días`; }
function fmt_msg(ts) { const d = (Date.now() - new Date(ts)) / 1000; if (d < 60) return 'ahora'; if (d < 3600) return `${Math.floor(d / 60)}m`; if (d < 86400) return new Date(ts).toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' }); return new Date(ts).toLocaleDateString('es-CL', { day: 'numeric', month: 'short' }); }

function Avatar({ nombre, size = 34 }) {
  return <div className="chat-av" style={{ width: size, height: size, fontSize: size * 0.38 }}>{nombre?.[0] ?? '?'}</div>;
}

export default function ChatOferta({ usuario }) {
  const { id } = useParams();
  const [oferta, setOferta] = useState(null);
  const [mensajes, setMensajes] = useState([]);
  const [conversacion, setConversacion] = useState(null);
  const [texto, setTexto] = useState('');
  const [cargando, setCargando] = useState(true);
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState('');
  const bottomRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    async function cargar() {
      try {
        setCargando(true);
        // Obtener oferta
        const of = await ofertasAPI.obtener(id);
        setOferta(of);

        // Obtener o crear conversación con la empresa
        const empresa_user_id = of.empresa_id?.usuario_id;
        if (empresa_user_id) {
          const conv = await mensajesAPI.iniciar(empresa_user_id);
          setConversacion(conv);
          // Cargar mensajes
          const msgs = await mensajesAPI.obtener(conv._id);
          setMensajes(msgs);
        }
      } catch (err) {
        setError(err.message);
      } finally {
        setCargando(false);
      }
    }
    cargar();
  }, [id]);

  // Scroll al final
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [mensajes]);

  async function enviarMensaje() {
    const t = texto.trim();
    if (!t || !conversacion || enviando) return;

    setEnviando(true);
    try {
      const m = await mensajesAPI.enviar(conversacion._id, { contenido: t });
      setMensajes(p => [...p, m]);
      setTexto('');
      inputRef.current?.focus();
    } catch (err) {
      setError(err.message);
    } finally {
      setEnviando(false);
    }
  }

  if (cargando) {
    return (
      <div className="chat-oferta-page">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
          <div style={{ width: 36, height: 36, border: '3px solid var(--azul-light)', borderTopColor: 'var(--azul)', borderRadius: '50%', animation: 'spin .8s linear infinite' }} />
          <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
        </div>
      </div>
    );
  }

  if (error && !oferta) {
    return (
      <div className="chat-oferta-page">
        <div style={{ textAlign: 'center', padding: '60px 20px' }}>
          <p style={{ color: 'var(--rojo)', marginBottom: 12 }}>{error}</p>
          <Link to="/mis-postulaciones" className="btn-secondary">Volver</Link>
        </div>
      </div>
    );
  }

  if (!oferta) return null;

  const empresa = oferta.empresa_id ?? {};

  return (
    <div className="chat-oferta-page">
      <div className="chat-oferta-inner">
        {/* Oferta estática en el top */}
        <div className="chat-oferta-header">
          <Link to="/mis-postulaciones" className="chat-back">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="15 18 9 12 15 6" /></svg>
            Volver
          </Link>

          <div className="card chat-oferta-card">
            <div className="chat-oferta-info">
              <div className="chat-oferta-logo">
                {empresa.logo_url
                  ? <img src={`http://localhost:5000${empresa.logo_url}`} alt="logo" />
                  : <span>{empresa.nombre_empresa?.[0] ?? 'E'}</span>
                }
              </div>
              <div className="chat-oferta-texto">
                <h2 className="chat-oferta-titulo">{oferta.titulo}</h2>
                <p className="chat-oferta-empresa">{empresa.nombre_empresa}</p>
                <div className="chat-oferta-meta">
                  <span className="chat-meta-item">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" /><circle cx="12" cy="10" r="3" /></svg>
                    {oferta.ubicacion}
                  </span>
                  {oferta.salario_min && (
                    <span className="chat-meta-item">
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="12" y1="1" x2="12" y2="23" /><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" /></svg>
                      {fmt(oferta.salario_min)} – {fmt(oferta.salario_max)}
                    </span>
                  )}
                  <span className={`badge ${oferta.modalidad === 'remoto' ? 'badge-verde' : oferta.modalidad === 'híbrido' ? 'badge-naranja' : 'badge-gris'}`}>{oferta.modalidad}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Chat privado en el bottom */}
        <div className="chat-oferta-body">
          <div className="card chat-oferta-mensajes-card">
            <h3 className="chat-oferta-chat-titulo">Chat con {empresa.nombre_empresa}</h3>
            <p className="chat-oferta-chat-sub">Comunícate directamente con la empresa sobre esta oferta</p>

            <div className="chat-oferta-mensajes-list">
              {mensajes.length === 0 && (
                <div className="chat-oferta-empty">
                  <p>Aún no hay mensajes. ¡Sé el primero en escribir!</p>
                </div>
              )}
              {mensajes.map((m, i) => {
                const esYo = m.autor_id?._id === usuario?._id || m.remitente_id === usuario?._id;
                return (
                  <div key={m._id || i} className={`chat-oferta-msg ${esYo ? 'mio' : 'otro'}`}>
                    {!esYo && <Avatar nombre={m.autor_id?.nombre ?? empresa.nombre_empresa} size={28} />}
                    <div className="chat-oferta-msg-bubble">
                      <p>{m.contenido}</p>
                      <span className="chat-oferta-msg-tiempo">{fmt_msg(m.creado_en || m.timestamp)}</span>
                    </div>
                  </div>
                );
              })}
              <div ref={bottomRef} />
            </div>

            <div className="chat-oferta-input-area">
              <textarea
                ref={inputRef}
                placeholder="Escribe tu mensaje..."
                value={texto}
                onChange={e => setTexto(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    enviarMensaje();
                  }
                }}
                rows={2}
              />
              <button
                className="chat-oferta-send-btn"
                disabled={!texto.trim() || enviando}
                onClick={enviarMensaje}
              >
                {enviando ? (
                  <>
                    <span className="spinner" />
                    Enviando...
                  </>
                ) : (
                  <>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="22" y1="2" x2="11" y2="13" /><polygon points="22 2 15 22 11 13 2 9 22 2" /></svg>
                    Enviar
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
