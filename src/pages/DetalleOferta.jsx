import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import './DetalleOferta.css';

const MOCK_OFERTA = {
  _id:'e1', titulo:'Técnico electricista industrial',
  descripcion:`Buscamos técnico en electricidad industrial para mantenimiento preventivo y correctivo de maquinaria en planta de producción. El candidato será responsable de:\n\n• Mantenimiento preventivo y correctivo de equipos eléctricos industriales\n• Instalación y conexionado de tableros de control\n• Diagnóstico de fallas en sistemas eléctricos trifásicos\n• Documentación técnica de intervenciones\n\nSe requiere disponibilidad para trabajar en turnos rotativos (mañana/tarde).`,
  ubicacion:'Concepción, Bío-Bío', salario_min:650000, salario_max:850000,
  modalidad:'presencial', publicado_en:'2024-03-10', cierre_en:'2024-04-10',
  especialidades_requeridas:['Electricidad','PLC','Mantenimiento'],
  empresa_id:{ nombre_empresa:'Industrias CMPC', logo_url:null, ciudad:'Concepción', rubro:'Manufactura' },
};

const MOCK_PREGUNTAS_INIT = [
  { _id:'q1', autor:'Valentina Mora', rol:'estudiante', contenido:'¿El cargo requiere movilización propia para trasladarse entre plantas?', creado_en:new Date(Date.now()-7200000).toISOString(), respuestas:[
    { _id:'r1', autor:'Industrias CMPC', rol:'empresa', contenido:'Hola Valentina, no es necesario, contamos con movilización de acercamiento desde el centro de Concepción.', creado_en:new Date(Date.now()-3600000).toISOString() }
  ]},
  { _id:'q2', autor:'Diego Fuentes', rol:'estudiante', contenido:'¿Se considera experiencia en prácticas profesionales o solo trabajo formal previo?', creado_en:new Date(Date.now()-86400000).toISOString(), respuestas:[] },
];

function fmt(n){ return '$'+Math.round(n).toLocaleString('es-CL'); }
function rel(ts){ const d=(Date.now()-new Date(ts))/1000; if(d<3600) return `Hace ${Math.floor(d/60)} min`; if(d<86400) return `Hace ${Math.floor(d/3600)} h`; return `Hace ${Math.floor(d/86400)} días`; }

function Avatar({nombre,rol,size=34}){
  const bg  = rol==='empresa' ? 'var(--azul-light)' : 'var(--verde-light)';
  const col = rol==='empresa' ? 'var(--azul)'       : '#0D6E47';
  return <div className="dof-av" style={{width:size,height:size,background:bg,color:col,fontSize:size*0.38}}>{nombre[0]}</div>;
}

export default function DetalleOferta({ usuario }) {
  const { id } = useParams();
  const oferta = MOCK_OFERTA;
  const [preguntas, setPreguntas] = useState(MOCK_PREGUNTAS_INIT);
  const [nuevaPregunta, setNuevaPregunta] = useState('');
  const [respondiendo, setRespondiendo] = useState(null);
  const [respTexto, setRespTexto] = useState('');
  const [postulado, setPostulado] = useState(false);
  const [postulando, setPostulando] = useState(false);

  const esEmpresa = usuario?.rol === 'empresa';
  const esAdmin   = usuario?.rol === 'admin';

  function enviarPregunta(){
    if(!nuevaPregunta.trim()) return;
    const q = { _id:'q'+Date.now(), autor:usuario?.nombre??'Tú', rol:usuario?.rol??'estudiante', contenido:nuevaPregunta.trim(), creado_en:new Date().toISOString(), respuestas:[] };
    setPreguntas(p=>[...p, q]);
    setNuevaPregunta('');
  }

  function enviarRespuesta(qid){
    if(!respTexto.trim()) return;
    const r = { _id:'r'+Date.now(), autor:usuario?.nombre??'Tú', rol:usuario?.rol??'empresa', contenido:respTexto.trim(), creado_en:new Date().toISOString() };
    setPreguntas(p=>p.map(q=>q._id===qid ? {...q, respuestas:[...q.respuestas, r]} : q));
    setRespTexto(''); setRespondiendo(null);
  }

  function postular(){
    setPostulando(true);
    setTimeout(()=>{ setPostulando(false); setPostulado(true); }, 900);
  }

  return (
    <div className="dof-page">
      <div className="dof-inner">
        <div className="dof-main">
          <Link to="/" className="dof-back">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="15 18 9 12 15 6"/></svg>
            Volver a ofertas
          </Link>

          <div className="card dof-card">
            <div className="dof-header">
              <div className="dof-logo">
                {oferta.empresa_id.logo_url
                  ? <img src={oferta.empresa_id.logo_url} alt="logo"/>
                  : <span>{oferta.empresa_id.nombre_empresa[0]}</span>
                }
              </div>
              <div className="dof-header-info">
                <h1 className="dof-titulo">{oferta.titulo}</h1>
                <Link to="/empresa/1" className="dof-empresa-link">{oferta.empresa_id.nombre_empresa}</Link>
                <div className="dof-meta-chips">
                  <span className="dof-meta-item">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
                    {oferta.ubicacion}
                  </span>
                  <span className="dof-meta-item">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
                    {fmt(oferta.salario_min)} – {fmt(oferta.salario_max)}
                  </span>
                  <span className={`badge ${oferta.modalidad==='remoto'?'badge-verde':oferta.modalidad==='híbrido'?'badge-naranja':'badge-gris'}`}>{oferta.modalidad}</span>
                  <span className="dof-meta-item">Cierra: {oferta.cierre_en}</span>
                </div>
              </div>
              <div className="dof-header-action">
                {!esEmpresa && !esAdmin && (
                  postulado
                    ? <div className="dof-postulado"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--verde)" strokeWidth="2.5" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg> Postulado</div>
                    : <button className={`btn-verde dof-postular-btn ${postulando?'loading':''}`} disabled={postulando} onClick={postular}>
                        {postulando?<><span className="spinner"/>Enviando...</>:<>Postularme</>}
                      </button>
                )}
                {esEmpresa && <Link to="/empresa/dashboard" className="btn-secondary" style={{fontSize:13}}>Gestionar oferta</Link>}
              </div>
            </div>

            <div className="dof-esp-chips">
              {oferta.especialidades_requeridas.map(e=><span key={e} className="badge badge-azul">{e}</span>)}
            </div>

            <div className="dof-section">
              <h2 className="dof-section-titulo">Descripción del cargo</h2>
              <div className="dof-descripcion">
                {oferta.descripcion.split('\n').map((line,i)=>(
                  line.trim() ? <p key={i}>{line}</p> : <br key={i}/>
                ))}
              </div>
            </div>
          </div>

          <div className="card dof-card dof-preguntas-card">
            <h2 className="dof-section-titulo">
              Preguntas y respuestas
              <span className="dof-preg-count">{preguntas.length}</span>
            </h2>
            <p className="dof-preg-sub">¿Tienes dudas sobre esta oferta? Escribe tu pregunta y la empresa podrá responderte.</p>

            {!esEmpresa && !esAdmin && (
              <div className="dof-nueva-preg">
                <Avatar nombre={usuario?.nombre??'Tú'} rol={usuario?.rol??'estudiante'} />
                <div className="dof-preg-input-wrap">
                  <textarea
                    placeholder="Escribe tu pregunta sobre esta oferta..."
                    value={nuevaPregunta}
                    onChange={e=>setNuevaPregunta(e.target.value)}
                    rows={2}
                    onKeyDown={e=>{ if(e.key==='Enter' && !e.shiftKey){ e.preventDefault(); enviarPregunta(); } }}
                  />
                  <button className="btn-primary dof-preg-send" disabled={!nuevaPregunta.trim()} onClick={enviarPregunta}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
                    Preguntar
                  </button>
                </div>
              </div>
            )}

            <div className="dof-preguntas-lista">
              {preguntas.length===0 && <p className="dof-preg-empty">Aún no hay preguntas. ¡Sé el primero en preguntar!</p>}
              {preguntas.map(q=>(
                <div key={q._id} className="dof-preg-item">
                  <div className="dof-preg-q">
                    <Avatar nombre={q.autor} rol={q.rol} />
                    <div className="dof-msg-bubble estudiante">
                      <div className="dof-msg-meta">
                        <span className="dof-msg-autor">{q.autor}</span>
                        <span className="dof-msg-tiempo">{rel(q.creado_en)}</span>
                      </div>
                      <p>{q.contenido}</p>
                    </div>
                  </div>

                  {q.respuestas.map(r=>(
                    <div key={r._id} className="dof-preg-r">
                      <Avatar nombre={r.autor} rol={r.rol} />
                      <div className="dof-msg-bubble empresa">
                        <div className="dof-msg-meta">
                          <span className="dof-msg-autor">{r.autor}</span>
                          <span className="badge badge-azul" style={{fontSize:10,padding:'1px 7px'}}>Empresa</span>
                          <span className="dof-msg-tiempo">{rel(r.creado_en)}</span>
                        </div>
                        <p>{r.contenido}</p>
                      </div>
                    </div>
                  ))}

                  {(esEmpresa || esAdmin) && q.respuestas.length===0 && (
                    respondiendo===q._id ? (
                      <div className="dof-resp-form">
                        <Avatar nombre={usuario?.nombre??'Empresa'} rol={usuario?.rol} />
                        <div className="dof-preg-input-wrap">
                          <textarea placeholder="Escribe tu respuesta..." value={respTexto} onChange={e=>setRespTexto(e.target.value)} rows={2} />
                          <div style={{display:'flex',gap:8}}>
                            <button className="btn-secondary" style={{fontSize:12,padding:'6px 14px'}} onClick={()=>setRespondiendo(null)}>Cancelar</button>
                            <button className="btn-primary" style={{fontSize:12,padding:'6px 14px'}} disabled={!respTexto.trim()} onClick={()=>enviarRespuesta(q._id)}>Responder</button>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <button className="dof-resp-btn" onClick={()=>setRespondiendo(q._id)}>
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polyline points="9 14 4 9 9 4"/><path d="M20 20v-7a4 4 0 0 0-4-4H4"/></svg>
                        Responder esta pregunta
                      </button>
                    )
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        <aside className="dof-aside">
          <div className="card dof-aside-card">
            <h3 className="dof-aside-titulo">Sobre la empresa</h3>
            <div className="dof-emp-info">
              <div className="dof-emp-logo">{oferta.empresa_id.nombre_empresa[0]}</div>
              <p className="dof-emp-nombre">{oferta.empresa_id.nombre_empresa}</p>
              <p className="dof-emp-rubro">{oferta.empresa_id.rubro} · {oferta.empresa_id.ciudad}</p>
            </div>
            <Link to="/empresa/1" className="btn-secondary" style={{width:'100%',justifyContent:'center',fontSize:13,marginTop:12}}>Ver perfil completo</Link>
          </div>
          <div className="card dof-aside-card">
            <h3 className="dof-aside-titulo">Detalles del cargo</h3>
            {[
              {l:'Publicada',  v:oferta.publicado_en},
              {l:'Cierre',     v:oferta.cierre_en},
              {l:'Modalidad',  v:oferta.modalidad},
              {l:'Ubicación',  v:oferta.ubicacion},
            ].map(d=>(
              <div key={d.l} className="dof-detalle-row">
                <span className="dof-detalle-label">{d.l}</span>
                <span className="dof-detalle-val">{d.v}</span>
              </div>
            ))}
          </div>
        </aside>
      </div>
    </div>
  );
}
