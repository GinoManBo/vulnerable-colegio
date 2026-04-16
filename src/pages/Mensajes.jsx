import { useState, useRef, useEffect } from 'react';
import './Mensajes.css';

const MOCK_CONVS = [
  { _id:'c1', participante:{ nombre:'TechChile S.A.',   rol:'empresa',    id:'emp1' }, ultimo:'¿Cuándo podrías iniciar?',              tiempo:'10:24', noLeidos:2, activo:true },
  { _id:'c2', participante:{ nombre:'Valentina Mora',   rol:'estudiante', id:'est1' }, ultimo:'Gracias por la información',            tiempo:'Ayer',  noLeidos:0, activo:false },
  { _id:'c3', participante:{ nombre:'Constructora Sur', rol:'empresa',    id:'emp2' }, ultimo:'Revisaremos tu postulación esta semana', tiempo:'Lun',   noLeidos:1, activo:false },
  { _id:'c4', participante:{ nombre:'Diego Fuentes',    rol:'estudiante', id:'est2' }, ultimo:'Muchas gracias por el contacto',        tiempo:'Dom',   noLeidos:0, activo:false },
];

const MOCK_MENSAJES = {
  c1:[
    { _id:'m1', de:'empresa',    texto:'Hola, revisamos tu postulación para el cargo de Técnico Electricista y nos interesa conocerte mejor.', ts: new Date(Date.now()-7200000).toISOString() },
    { _id:'m2', de:'yo',         texto:'¡Buenas tardes! Muchas gracias, estoy muy interesada en la oportunidad. ¿Qué pasos siguen en el proceso?', ts: new Date(Date.now()-5400000).toISOString() },
    { _id:'m3', de:'empresa',    texto:'Nos gustaría agendar una entrevista técnica. Tenemos disponibilidad esta semana el miércoles o viernes en la mañana.', ts: new Date(Date.now()-3600000).toISOString() },
    { _id:'m4', de:'empresa',    texto:'¿Cuándo podrías iniciar?', ts: new Date(Date.now()-600000).toISOString() },
  ],
  c2:[
    { _id:'m1', de:'yo',         texto:'Hola Valentina, vi que postulaste a nuestra oferta. ¿Tienes experiencia con tableros de baja tensión?', ts: new Date(Date.now()-172800000).toISOString() },
    { _id:'m2', de:'estudiante', texto:'Sí, durante mi práctica trabajé con tableros de BT en la empresa X. Aprendí conexionado y mantenimiento preventivo básico.', ts: new Date(Date.now()-169200000).toISOString() },
    { _id:'m3', de:'yo',         texto:'Perfecto, te contactaremos para agendar una entrevista la próxima semana.', ts: new Date(Date.now()-86400000).toISOString() },
    { _id:'m4', de:'estudiante', texto:'Gracias por la información', ts: new Date(Date.now()-82800000).toISOString() },
  ],
  c3:[
    { _id:'m1', de:'empresa',    texto:'Revisaremos tu postulación esta semana y te daremos una respuesta.', ts: new Date(Date.now()-259200000).toISOString() },
  ],
  c4:[
    { _id:'m1', de:'estudiante', texto:'Muchas gracias por el contacto', ts: new Date(Date.now()-345600000).toISOString() },
  ],
};

function fmt(ts){ const d=(Date.now()-new Date(ts))/1000; if(d<60) return 'ahora'; if(d<3600) return `${Math.floor(d/60)}m`; if(d<86400) return new Date(ts).toLocaleTimeString('es-CL',{hour:'2-digit',minute:'2-digit'}); return new Date(ts).toLocaleDateString('es-CL',{day:'numeric',month:'short'}); }

export default function Mensajes({ usuario }) {
  const [convs, setConvs]           = useState(MOCK_CONVS);
  const [activa, setActiva]         = useState('c1');
  const [msgs, setMsgs]             = useState(MOCK_MENSAJES);
  const [texto, setTexto]           = useState('');
  const [busqueda, setBusqueda]     = useState('');
  const [nuevaConvModal, setNueva]  = useState(false);
  const [busqNueva, setBusqNueva]   = useState('');
  const bottomRef = useRef(null);
  const inputRef  = useRef(null);

  const convActiva = convs.find(c=>c._id===activa);
  const mensajes   = msgs[activa] ?? [];

  useEffect(()=>{ bottomRef.current?.scrollIntoView({behavior:'smooth'}); }, [activa, msgs]);

  function seleccionar(id){
    setActiva(id);
    setConvs(p=>p.map(c=>c._id===id?{...c,noLeidos:0}:c));
    setTimeout(()=>inputRef.current?.focus(), 100);
  }

  function enviar(){
    const t=texto.trim();
    if(!t) return;
    const nuevo={ _id:'m'+Date.now(), de:'yo', texto:t, ts:new Date().toISOString() };
    setMsgs(p=>({...p,[activa]:[...(p[activa]??[]),nuevo]}));
    setConvs(p=>p.map(c=>c._id===activa?{...c,ultimo:t,tiempo:'ahora'}:c));
    setTexto('');
    setTimeout(()=>bottomRef.current?.scrollIntoView({behavior:'smooth'}),50);
  }

  const convsFiltradas = convs.filter(c=>c.participante.nombre.toLowerCase().includes(busqueda.toLowerCase()));

  return (
    <div className="msgs-page">
      <div className="msgs-layout">
        <div className="msgs-sidebar">
          <div className="msgs-sidebar-header">
            <h2 className="msgs-titulo">Mensajes</h2>
            <button className="msgs-nuevo-btn" onClick={()=>setNueva(true)} title="Nueva conversación">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            </button>
          </div>
          <div className="msgs-busq-wrap">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
            <input placeholder="Buscar conversación..." value={busqueda} onChange={e=>setBusqueda(e.target.value)} />
          </div>
          <div className="msgs-conv-lista">
            {convsFiltradas.length===0 && <p className="msgs-empty-list">Sin resultados</p>}
            {convsFiltradas.map(c=>(
              <button key={c._id} className={`msgs-conv-item ${activa===c._id?'activa':''}`} onClick={()=>seleccionar(c._id)}>
                <div className={`msgs-conv-av ${c.participante.rol}`}>{c.participante.nombre[0]}</div>
                <div className="msgs-conv-info">
                  <div className="msgs-conv-top">
                    <span className="msgs-conv-nombre">{c.participante.nombre}</span>
                    <span className="msgs-conv-tiempo">{c.tiempo}</span>
                  </div>
                  <div className="msgs-conv-bottom">
                    <span className="msgs-conv-ultimo">{c.ultimo}</span>
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
                <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="var(--gris-2)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
              </div>
              <p>Selecciona una conversación para ver los mensajes</p>
            </div>
          ) : (
            <>
              <div className="msgs-chat-header">
                <div className={`msgs-conv-av ${convActiva.participante.rol}`} style={{width:38,height:38,fontSize:15}}>
                  {convActiva.participante.nombre[0]}
                </div>
                <div className="msgs-chat-header-info">
                  <p className="msgs-chat-nombre">{convActiva.participante.nombre}</p>
                  <span className={`badge ${convActiva.participante.rol==='empresa'?'badge-azul':'badge-verde'}`} style={{fontSize:10}}>
                    {convActiva.participante.rol}
                  </span>
                </div>
                <div className="msgs-chat-actions">
                  <button className="msgs-act-btn" title="Ver perfil">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                  </button>
                  <button className="msgs-act-btn" title="Más opciones">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="5" r="1"/><circle cx="12" cy="12" r="1"/><circle cx="12" cy="19" r="1"/></svg>
                  </button>
                </div>
              </div>

              <div className="msgs-chat-body">
                {mensajes.map((m,i)=>{
                  const prevDate = i>0 ? new Date(mensajes[i-1].ts).toDateString() : null;
                  const currDate = new Date(m.ts).toDateString();
                  const showDate = currDate !== prevDate;
                  return (
                    <div key={m._id}>
                      {showDate && (
                        <div className="msgs-date-sep">
                          <span>{new Date(m.ts).toLocaleDateString('es-CL',{weekday:'long',day:'numeric',month:'long'})}</span>
                        </div>
                      )}
                      <div className={`msgs-msg-row ${m.de==='yo'?'yo':''}`}>
                        {m.de!=='yo' && (
                          <div className={`msgs-msg-av ${convActiva.participante.rol}`}>{convActiva.participante.nombre[0]}</div>
                        )}
                        <div className={`msgs-burbuja ${m.de==='yo'?'yo':''}`}>
                          <p>{m.texto}</p>
                          <span className="msgs-ts">{fmt(m.ts)}</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
                <div ref={bottomRef}/>
              </div>

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
                <button className={`msgs-send-btn ${texto.trim()?'activo':''}`} onClick={enviar} disabled={!texto.trim()}>
                  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {nuevaConvModal && (
        <div className="modal-overlay" onClick={()=>setNueva(false)}>
          <div className="modal-box" onClick={e=>e.stopPropagation()} style={{maxWidth:380}}>
            <div className="modal-header">
              <h3>Nueva conversación</h3>
              <button className="fp-close" onClick={()=>setNueva(false)}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
            </div>
            <div className="msgs-busq-wrap" style={{margin:'12px 0'}}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
              <input autoFocus placeholder="Buscar empresa o estudiante..." value={busqNueva} onChange={e=>setBusqNueva(e.target.value)} />
            </div>
            {[
              {id:'new1',nombre:'TechChile S.A.',   rol:'empresa',    sub:'Tecnología'},
              {id:'new2',nombre:'Carlos Bravo',     rol:'estudiante', sub:'Mecatrónica'},
              {id:'new3',nombre:'AutomaTec Ltda.',  rol:'empresa',    sub:'Automatización'},
            ].filter(u=>u.nombre.toLowerCase().includes(busqNueva.toLowerCase())).map(u=>(
              <button key={u.id} className="msgs-nuevo-item" onClick={()=>{
                const id='c'+Date.now();
                setConvs(p=>[{_id:id,participante:{nombre:u.nombre,rol:u.rol,id:u.id},ultimo:'',tiempo:'ahora',noLeidos:0,activo:true},...p]);
                setMsgs(p=>({...p,[id]:[]}));
                setActiva(id); setNueva(false); setBusqNueva('');
              }}>
                <div className={`msgs-conv-av ${u.rol}`}>{u.nombre[0]}</div>
                <div><p className="msgs-conv-nombre" style={{fontSize:13,fontWeight:500}}>{u.nombre}</p><p style={{fontSize:12,color:'var(--gris-2)'}}>{u.sub}</p></div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
