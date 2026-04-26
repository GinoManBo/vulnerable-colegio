import { useState, useRef, useEffect, useCallback } from 'react';
import { mensajesAPI } from '../api';
import './Mensajes.css';

function fmt(ts){ const d=(Date.now()-new Date(ts))/1000; if(d<60) return 'ahora'; if(d<3600) return `${Math.floor(d/60)}m`; if(d<86400) return new Date(ts).toLocaleTimeString('es-CL',{hour:'2-digit',minute:'2-digit'}); return new Date(ts).toLocaleDateString('es-CL',{day:'numeric',month:'short'}); }

export default function Mensajes({ usuario }) {
  const [convs,         setConvs]         = useState([]);
  const [activa,        setActiva]        = useState(null);
  const [msgs,          setMsgs]          = useState({});
  const [texto,         setTexto]         = useState('');
  const [busqueda,      setBusqueda]      = useState('');
  const [nuevaModal,    setNuevaModal]    = useState(false);
  const [busqNueva,     setBusqNueva]     = useState('');
  const [cargConvs,     setCargConvs]     = useState(true);
  const [cargMsgs,      setCargMsgs]      = useState(false);
  const [enviando,      setEnviando]      = useState(false);
  const [error,         setError]         = useState('');
  const bottomRef = useRef(null);
  const inputRef  = useRef(null);

  const convActiva = convs.find(c => c._id === activa);
  const mensajes   = msgs[activa] ?? [];

  // Cargar conversaciones al montar
  useEffect(() => {
    setCargConvs(true);
    mensajesAPI.conversaciones()
      .then(data => {
        setConvs(data);
        if (data.length > 0) seleccionar(data[0]._id);
      })
      .catch(e => setError(e.message))
      .finally(() => setCargConvs(false));
  }, []);

  // Scroll al final cuando llegan mensajes nuevos
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [activa, msgs]);

  async function seleccionar(id) {
    setActiva(id);
    setConvs(p => p.map(c => c._id===id ? {...c, noLeidos:0} : c));
    if (msgs[id]) return; // ya cargados
    setCargMsgs(true);
    try {
      const data = await mensajesAPI.obtenerMensajes(id);
      setMsgs(p => ({ ...p, [id]: data }));
    } catch(e) { setError(e.message); }
    finally { setCargMsgs(false); setTimeout(()=>inputRef.current?.focus(),100); }
  }

  async function enviar() {
    const t = texto.trim();
    if (!t || !activa || enviando) return;
    setEnviando(true);
    try {
      const m = await mensajesAPI.enviarMensaje(activa, t);
      setMsgs(p => ({ ...p, [activa]: [...(p[activa]??[]), m] }));
      setConvs(p => p.map(c => c._id===activa ? {...c, ultimo_mensaje_preview:t, ultimo_mensaje_en:new Date().toISOString()} : c));
      setTexto('');
    } catch(e) { setError(e.message); }
    finally { setEnviando(false); }
  }

  async function abrirNuevaConv(destinatarioId) {
    try {
      const conv = await mensajesAPI.abrirConversacion(destinatarioId);
      const existe = convs.find(c => c._id === conv._id);
      if (!existe) {
        setConvs(p => [{ _id: conv._id, participante: conv.participante, ultimo_mensaje_preview:'', ultimo_mensaje_en: null, noLeidos:0 }, ...p]);
      }
      setNuevaModal(false); setBusqNueva('');
      await seleccionar(conv._id);
    } catch(e) { setError(e.message); }
  }

  const convsFiltradas = convs.filter(c =>
    c.participante?.nombre?.toLowerCase().includes(busqueda.toLowerCase())
  );

  return (
    <div className="msgs-page">
      <div className="msgs-layout">

        <div className="msgs-sidebar">
          <div className="msgs-sidebar-header">
            <h2 className="msgs-titulo">Mensajes</h2>
            <button className="msgs-nuevo-btn" onClick={()=>setNuevaModal(true)} title="Nueva conversación">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            </button>
          </div>
          <div className="msgs-busq-wrap">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
            <input placeholder="Buscar conversación..." value={busqueda} onChange={e=>setBusqueda(e.target.value)}/>
          </div>
          <div className="msgs-conv-lista">
            {cargConvs && <p className="msgs-empty-list">Cargando...</p>}
            {!cargConvs && convsFiltradas.length===0 && (
              <p className="msgs-empty-list">Sin conversaciones aún.<br/>Pulsa + para empezar una.</p>
            )}
            {convsFiltradas.map(c=>(
              <button key={c._id} className={`msgs-conv-item ${activa===c._id?'activa':''}`} onClick={()=>seleccionar(c._id)}>
                <div className={`msgs-conv-av ${c.participante?.rol??'estudiante'}`}>{c.participante?.nombre?.[0]??'?'}</div>
                <div className="msgs-conv-info">
                  <div className="msgs-conv-top">
                    <span className="msgs-conv-nombre">{c.participante?.nombre}</span>
                    <span className="msgs-conv-tiempo">{c.ultimo_mensaje_en ? fmt(c.ultimo_mensaje_en) : ''}</span>
                  </div>
                  <div className="msgs-conv-bottom">
                    <span className="msgs-conv-ultimo">{c.ultimo_mensaje_preview || 'Iniciar conversación'}</span>
                    {c.noLeidos>0 && <span className="msgs-badge">{c.noLeidos}</span>}
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>

        <div className="msgs-chat">
          {!activa || !convActiva ? (
            <div className="msgs-chat-empty">
              <div className="msgs-chat-empty-ico">
                <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="var(--gris-2)" strokeWidth="1.5" strokeLinecap="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
              </div>
              <p>Selecciona una conversación</p>
            </div>
          ) : (
            <>
              <div className="msgs-chat-header">
                <div className={`msgs-conv-av ${convActiva.participante?.rol}`} style={{width:38,height:38,fontSize:15}}>
                  {convActiva.participante?.nombre?.[0]??'?'}
                </div>
                <div className="msgs-chat-header-info">
                  <p className="msgs-chat-nombre">{convActiva.participante?.nombre}</p>
                  <span className={`badge ${convActiva.participante?.rol==='empresa'?'badge-azul':'badge-verde'}`} style={{fontSize:10}}>
                    {convActiva.participante?.rol}
                  </span>
                </div>
              </div>

              <div className="msgs-chat-body">
                {cargMsgs && <p style={{textAlign:'center',fontSize:13,color:'var(--gris-2)',paddingTop:20}}>Cargando mensajes...</p>}
                {!cargMsgs && mensajes.length===0 && (
                  <p style={{textAlign:'center',fontSize:13,color:'var(--gris-2)',paddingTop:40}}>Sin mensajes aún. ¡Saluda!</p>
                )}
                {mensajes.map((m, i) => {
                  const esYo       = m.remitente_id?._id === usuario?._id || m.remitente_id === usuario?._id;
                  const tsActual   = new Date(m.enviado_en).toDateString();
                  const tsAnterior = i>0 ? new Date(mensajes[i-1].enviado_en).toDateString() : null;
                  return (
                    <div key={m._id}>
                      {tsActual !== tsAnterior && (
                        <div className="msgs-date-sep">
                          <span>{new Date(m.enviado_en).toLocaleDateString('es-CL',{weekday:'long',day:'numeric',month:'long'})}</span>
                        </div>
                      )}
                      <div className={`msgs-msg-row ${esYo?'yo':''}`}>
                        {!esYo && (
                          <div className={`msgs-msg-av ${convActiva.participante?.rol}`}>
                            {convActiva.participante?.nombre?.[0]??'?'}
                          </div>
                        )}
                        <div className={`msgs-burbuja ${esYo?'yo':''}`}>
                          <p>{m.contenido}</p>
                          <span className="msgs-ts">{fmt(m.enviado_en)}</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
                <div ref={bottomRef}/>
              </div>

              {error && <div style={{padding:'8px 16px',fontSize:12,color:'var(--rojo)',background:'var(--rojo-light)'}}>{error}</div>}

              <div className="msgs-input-bar">
                <textarea
                  ref={inputRef}
                  className="msgs-textarea"
                  placeholder="Escribe un mensaje..."
                  value={texto}
                  rows={1}
                  onChange={e=>setTexto(e.target.value)}
                  onKeyDown={e=>{ if(e.key==='Enter'&&!e.shiftKey){ e.preventDefault(); enviar(); } }}
                />
                <button className={`msgs-send-btn ${texto.trim()&&!enviando?'activo':''}`} onClick={enviar} disabled={!texto.trim()||enviando}>
                  {enviando
                    ? <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                    : <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
                  }
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {nuevaModal && (
        <div className="modal-overlay" onClick={()=>setNuevaModal(false)}>
          <div className="modal-box" onClick={e=>e.stopPropagation()} style={{maxWidth:360}}>
            <div className="modal-header">
              <h3>Nueva conversación</h3>
              <button className="fp-close" onClick={()=>setNuevaModal(false)}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
            </div>
            <p style={{fontSize:13,color:'var(--gris-2)',marginBottom:10}}>Para iniciar una conversación, ve al perfil de la empresa o estudiante y usa el botón "Enviar mensaje".</p>
            <p style={{fontSize:12,color:'var(--gris-2)'}}>También puedes chatear directamente desde las tarjetas de ofertas en el inicio.</p>
            <button className="btn-primary" style={{width:'100%',marginTop:14,justifyContent:'center'}} onClick={()=>setNuevaModal(false)}>Entendido</button>
          </div>
        </div>
      )}
    </div>
  );
}