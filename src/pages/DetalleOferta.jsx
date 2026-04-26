import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ofertasAPI, preguntasAPI } from '../api';
import './DetalleOferta.css';

function fmt(n){ return '$'+Math.round(n).toLocaleString('es-CL'); }
function rel(ts){ const d=(Date.now()-new Date(ts))/1000; if(d<3600) return `Hace ${Math.floor(d/60)} min`; if(d<86400) return `Hace ${Math.floor(d/3600)} h`; return `Hace ${Math.floor(d/86400)} días`; }

function Avatar({ nombre, rol, size=34 }) {
  const bg  = rol==='empresa'?'var(--azul-light)':'var(--verde-light)';
  const col = rol==='empresa'?'var(--azul)':'#0D6E47';
  return <div className="dof-av" style={{width:size,height:size,background:bg,color:col,fontSize:size*0.38}}>{nombre?.[0]??'?'}</div>;
}

export default function DetalleOferta({ usuario }) {
  const { id } = useParams();
  const [oferta,       setOferta]       = useState(null);
  const [preguntas,    setPreguntas]    = useState([]);
  const [nuevaPreg,    setNuevaPreg]    = useState('');
  const [respondiendo, setRespondiendo] = useState(null);
  const [respTexto,    setRespTexto]    = useState('');
  const [postulado,    setPostulado]    = useState(false);
  const [postulando,   setPostulando]   = useState(false);
  const [cargando,     setCargando]     = useState(true);
  const [error,        setError]        = useState('');

  useEffect(() => {
    setCargando(true);
    Promise.all([
      ofertasAPI.detalle(id),
      preguntasAPI.listar(id),
    ]).then(([of, preg]) => {
      setOferta(of);
      setPreguntas(preg);
    }).catch(e => setError(e.message))
      .finally(() => setCargando(false));
  }, [id]);

  async function enviarPregunta() {
    if (!nuevaPreg.trim()) return;
    try {
      const q = await preguntasAPI.crear(id, { contenido: nuevaPreg.trim() });
      setPreguntas(p => [...p, { ...q, respuestas: [] }]);
      setNuevaPreg('');
    } catch(e) { setError(e.message); }
  }

  async function enviarRespuesta(qid) {
    if (!respTexto.trim()) return;
    try {
      const r = await preguntasAPI.crear(id, { contenido: respTexto.trim(), respuesta_a_id: qid });
      setPreguntas(p => p.map(q => q._id===qid ? { ...q, respuestas:[...q.respuestas, r] } : q));
      setRespTexto(''); setRespondiendo(null);
    } catch(e) { setError(e.message); }
  }

  async function postular() {
    setPostulando(true);
    try {
      await ofertasAPI.postular(id);
      setPostulado(true);
    } catch(err) {
      if (err.message?.includes('Ya postulaste')) setPostulado(true);
      else setError(err.message);
    } finally { setPostulando(false); }
  }

  const esEmpresa = usuario?.rol === 'empresa';
  const esAdmin   = usuario?.rol === 'admin';

  if (cargando) return (
    <div style={{display:'flex',alignItems:'center',justifyContent:'center',minHeight:'60vh'}}>
      <div style={{width:36,height:36,border:'3px solid var(--azul-light)',borderTopColor:'var(--azul)',borderRadius:'50%',animation:'spin .8s linear infinite'}}/>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );

  if (error && !oferta) return (
    <div className="dof-page">
      <div style={{textAlign:'center',padding:'60px 20px'}}>
        <p style={{color:'var(--rojo)',marginBottom:12}}>{error}</p>
        <Link to="/" className="btn-secondary">Volver al inicio</Link>
      </div>
    </div>
  );

  if (!oferta) return null;

  const empresa = oferta.empresa_id ?? {};

  return (
    <div className="dof-page">
      <div className="dof-inner">
        <div className="dof-main">
          <Link to="/" className="dof-back">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="15 18 9 12 15 6"/></svg>
            Volver a ofertas
          </Link>

          {error && <div style={{padding:'10px 14px',background:'var(--rojo-light)',color:'var(--rojo)',borderRadius:'var(--radius-md)',fontSize:13,marginBottom:12}}>{error}</div>}

          <div className="card dof-card">
            <div className="dof-header">
              <div className="dof-logo">
                {empresa.logo_url
                  ? <img src={`http://localhost:5000${empresa.logo_url}`} alt="logo"/>
                  : <span>{empresa.nombre_empresa?.[0]??'E'}</span>
                }
              </div>
              <div className="dof-header-info">
                <h1 className="dof-titulo">{oferta.titulo}</h1>
                <p className="dof-empresa-link">{empresa.nombre_empresa}</p>
                <div className="dof-meta-chips">
                  <span className="dof-meta-item">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
                    {oferta.ubicacion}
                  </span>
                  {oferta.salario_min && (
                    <span className="dof-meta-item">
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
                      {fmt(oferta.salario_min)} – {fmt(oferta.salario_max)}
                    </span>
                  )}
                  <span className={`badge ${oferta.modalidad==='remoto'?'badge-verde':oferta.modalidad==='híbrido'?'badge-naranja':'badge-gris'}`}>{oferta.modalidad}</span>
                  {oferta.cierre_en && <span className="dof-meta-item">Cierra: {new Date(oferta.cierre_en).toLocaleDateString('es-CL')}</span>}
                </div>
              </div>
              <div className="dof-header-action">
                {!esEmpresa && !esAdmin && (
                  postulado
                    ? <div className="dof-postulado"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--verde)" strokeWidth="2.5" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>Postulado</div>
                    : <button className={`btn-verde dof-postular-btn ${postulando?'loading':''}`} disabled={postulando||!oferta.activo} onClick={postular}>
                        {postulando
                          ? <><span className="spinner" style={{width:14,height:14,border:'2px solid rgba(255,255,255,.3)',borderTopColor:'#fff',borderRadius:'50%',animation:'spin .7s linear infinite'}}/>Enviando...</>
                          : oferta.activo ? 'Postularme' : 'Oferta cerrada'
                        }
                      </button>
                )}
                {esEmpresa && <Link to="/empresa" className="btn-secondary" style={{fontSize:13}}>Gestionar oferta</Link>}
              </div>
            </div>

            <div className="dof-esp-chips">
              {oferta.especialidades_requeridas?.map(e=><span key={e} className="badge badge-azul">{e}</span>)}
            </div>

            <div className="dof-section">
              <h2 className="dof-section-titulo">Descripción del cargo</h2>
              <div className="dof-descripcion">
                {oferta.descripcion.split('\n').map((line,i)=>
                  line.trim() ? <p key={i}>{line}</p> : <br key={i}/>
                )}
              </div>
            </div>
          </div>

          <div className="card dof-card dof-preguntas-card">
            <h2 className="dof-section-titulo">
              Preguntas y respuestas
              <span className="dof-preg-count">{preguntas.length}</span>
            </h2>
            <p className="dof-preg-sub">¿Tienes dudas sobre esta oferta? La empresa podrá responderte aquí.</p>

            {!esEmpresa && !esAdmin && (
              <div className="dof-nueva-preg">
                <Avatar nombre={usuario?.nombre??'Tú'} rol={usuario?.rol??'estudiante'}/>
                <div className="dof-preg-input-wrap">
                  <textarea
                    placeholder="Escribe tu pregunta..."
                    value={nuevaPreg}
                    onChange={e=>setNuevaPreg(e.target.value)}
                    rows={2}
                    onKeyDown={e=>{ if(e.key==='Enter'&&!e.shiftKey){ e.preventDefault(); enviarPregunta(); } }}
                  />
                  <button className="btn-primary dof-preg-send" disabled={!nuevaPreg.trim()} onClick={enviarPregunta}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
                    Preguntar
                  </button>
                </div>
              </div>
            )}

            <div className="dof-preguntas-lista">
              {preguntas.length===0 && <p className="dof-preg-empty">Aún no hay preguntas. ¡Sé el primero!</p>}
              {preguntas.map(q=>(
                <div key={q._id} className="dof-preg-item">
                  <div className="dof-preg-q">
                    <Avatar nombre={q.autor_id?.nombre??'Usuario'} rol={q.autor_id?.rol??'estudiante'}/>
                    <div className="dof-msg-bubble estudiante">
                      <div className="dof-msg-meta">
                        <span className="dof-msg-autor">{q.autor_id?.nombre??'Usuario'}</span>
                        <span className="dof-msg-tiempo">{rel(q.creado_en)}</span>
                      </div>
                      <p>{q.contenido}</p>
                    </div>
                  </div>

                  {q.respuestas?.map(r=>(
                    <div key={r._id} className="dof-preg-r">
                      <Avatar nombre={r.autor_id?.nombre??empresa.nombre_empresa??'Empresa'} rol={r.autor_id?.rol??'empresa'}/>
                      <div className="dof-msg-bubble empresa">
                        <div className="dof-msg-meta">
                          <span className="dof-msg-autor">{r.autor_id?.nombre??empresa.nombre_empresa}</span>
                          <span className="badge badge-azul" style={{fontSize:10,padding:'1px 7px'}}>Empresa</span>
                          <span className="dof-msg-tiempo">{rel(r.creado_en)}</span>
                        </div>
                        <p>{r.contenido}</p>
                      </div>
                    </div>
                  ))}

                  {(esEmpresa||esAdmin) && (!q.respuestas||q.respuestas.length===0) && (
                    respondiendo===q._id ? (
                      <div className="dof-resp-form">
                        <Avatar nombre={usuario?.nombre??'Empresa'} rol={usuario?.rol??'empresa'}/>
                        <div className="dof-preg-input-wrap">
                          <textarea placeholder="Escribe tu respuesta..." value={respTexto} onChange={e=>setRespTexto(e.target.value)} rows={2}/>
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
              <div className="dof-emp-logo">{empresa.nombre_empresa?.[0]??'E'}</div>
              <p className="dof-emp-nombre">{empresa.nombre_empresa}</p>
              <p className="dof-emp-rubro">{empresa.rubro??''}{empresa.ciudad?` · ${empresa.ciudad}`:''}</p>
            </div>
          </div>
          <div className="card dof-aside-card">
            <h3 className="dof-aside-titulo">Detalles del cargo</h3>
            {[
              {l:'Publicada', v:new Date(oferta.publicado_en).toLocaleDateString('es-CL')},
              {l:'Cierre',    v:oferta.cierre_en?new Date(oferta.cierre_en).toLocaleDateString('es-CL'):'Sin fecha'},
              {l:'Modalidad', v:oferta.modalidad},
              {l:'Ubicación', v:oferta.ubicacion},
            ].map(d=>(
              <div key={d.l} className="dof-detalle-row">
                <span className="dof-detalle-label">{d.l}</span>
                <span className="dof-detalle-val">{d.v}</span>
              </div>
            ))}
          </div>
        </aside>
      </div>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}