import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ofertasAPI, perfilAPI } from '../api';
import './VistaEmpresa.css';

const ESPECIALIDADES = ['Electricidad industrial','Mecatrónica','Redes y comunicaciones','Automatización y PLC','Construcción','Otro'];

const ESTADO_CFG = {
  pendiente:   { label:'Pendiente',   cls:'badge-gris'    },
  en_revision: { label:'En revisión', cls:'badge-naranja' },
  aceptada:    { label:'Aceptado',    cls:'badge-verde'   },
  rechazada:   { label:'Rechazado',   cls:'badge-rojo'    },
  contratado:  { label:'Contratado',  cls:'badge-verde'   },
};

function IcoPlus()  { return <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>; }
function IcoEdit()  { return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4z"/></svg>; }
function IcoOff()   { return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><line x1="4.93" y1="4.93" x2="19.07" y2="19.07"/></svg>; }
function IcoOn()    { return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>; }
function IcoUsers() { return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>; }

const FORM_INIT = { titulo:'', descripcion:'', ubicacion:'', salario_min:'', salario_max:'', modalidad:'presencial', especialidades:[], cierre_en:'' };

function Spinner() { return <span className="spinner" style={{display:'inline-block',width:15,height:15,border:'2px solid rgba(255,255,255,.3)',borderTopColor:'#fff',borderRadius:'50%',animation:'spin .7s linear infinite'}}/>; }

function FormPublicar({ onGuardar, onCancelar, inicial }) {
  const [form, setForm]     = useState(inicial ? {
    titulo:                   inicial.titulo ?? '',
    descripcion:              inicial.descripcion ?? '',
    ubicacion:                inicial.ubicacion ?? '',
    salario_min:              inicial.salario_min ?? '',
    salario_max:              inicial.salario_max ?? '',
    modalidad:                inicial.modalidad ?? 'presencial',
    especialidades:           inicial.especialidades_requeridas ?? [],
    cierre_en:                inicial.cierre_en ? inicial.cierre_en.slice(0,10) : '',
  } : FORM_INIT);
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [apiErr, setApiErr] = useState('');

  function upd(k,v){ setForm(p=>({...p,[k]:v})); setErrors(p=>({...p,[k]:''})); }
  function toggleEsp(e){ setForm(p=>({ ...p, especialidades: p.especialidades.includes(e) ? p.especialidades.filter(x=>x!==e) : [...p.especialidades,e] })); }

  function validar(){
    const e={};
    if(!form.titulo.trim())       e.titulo='Requerido';
    if(!form.descripcion.trim())  e.descripcion='Requerido';
    if(!form.ubicacion.trim())    e.ubicacion='Requerido';
    if(form.salario_min && form.salario_max && Number(form.salario_min)>Number(form.salario_max)) e.salario_max='Debe ser mayor al mínimo';
    setErrors(e); return !Object.keys(e).length;
  }

  async function handleSubmit(e){
    e.preventDefault(); if(!validar()) return;
    setSaving(true); setApiErr('');
    try {
      const payload = {
        titulo:                   form.titulo,
        descripcion:              form.descripcion,
        ubicacion:                form.ubicacion,
        modalidad:                form.modalidad,
        salario_min:              form.salario_min || undefined,
        salario_max:              form.salario_max || undefined,
        especialidades_requeridas:form.especialidades,
        cierre_en:                form.cierre_en || undefined,
      };
      await onGuardar(payload);
    } catch(err){ setApiErr(err.message); }
    finally{ setSaving(false); }
  }

  return (
    <div className="form-publicar-wrap">
      <div className="form-publicar-header">
        <h2>{inicial ? 'Editar oferta' : 'Publicar nueva oferta'}</h2>
        <button className="fp-close" onClick={onCancelar}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
        </button>
      </div>
      {apiErr && <div style={{margin:'0 0 12px',padding:'10px 14px',background:'var(--rojo-light)',color:'var(--rojo)',borderRadius:'var(--radius-md)',fontSize:13}}>{apiErr}</div>}
      <form onSubmit={handleSubmit} noValidate>
        <div className="fp-grid">
          <div className="fp-field full"><label>Título del cargo <span className="req">*</span></label><input placeholder="Ej: Técnico electricista industrial" value={form.titulo} onChange={e=>upd('titulo',e.target.value)} className={errors.titulo?'err':''}/>{errors.titulo&&<span className="ferr">{errors.titulo}</span>}</div>
          <div className="fp-field full"><label>Descripción <span className="req">*</span></label><textarea rows={4} placeholder="Describe el cargo, responsabilidades y requisitos..." value={form.descripcion} onChange={e=>upd('descripcion',e.target.value)} className={errors.descripcion?'err':''}/>{errors.descripcion&&<span className="ferr">{errors.descripcion}</span>}</div>
          <div className="fp-field"><label>Ubicación <span className="req">*</span></label><input placeholder="Ej: Concepción, Bío-Bío" value={form.ubicacion} onChange={e=>upd('ubicacion',e.target.value)} className={errors.ubicacion?'err':''}/>{errors.ubicacion&&<span className="ferr">{errors.ubicacion}</span>}</div>
          <div className="fp-field"><label>Modalidad</label><select value={form.modalidad} onChange={e=>upd('modalidad',e.target.value)}><option value="presencial">Presencial</option><option value="remoto">Remoto</option><option value="híbrido">Híbrido</option></select></div>
          <div className="fp-field"><label>Sueldo mínimo (CLP)</label><input type="number" placeholder="Ej: 600000" value={form.salario_min} onChange={e=>upd('salario_min',e.target.value)}/></div>
          <div className="fp-field"><label>Sueldo máximo (CLP)</label><input type="number" placeholder="Ej: 900000" value={form.salario_max} onChange={e=>upd('salario_max',e.target.value)} className={errors.salario_max?'err':''}/>{errors.salario_max&&<span className="ferr">{errors.salario_max}</span>}</div>
          <div className="fp-field"><label>Fecha de cierre</label><input type="date" value={form.cierre_en} onChange={e=>upd('cierre_en',e.target.value)}/></div>
        </div>
        <div className="fp-esp-section">
          <label>Especialidades requeridas</label>
          <div className="fp-esp-chips">{ESPECIALIDADES.map(e=><button type="button" key={e} className={`fp-esp-chip ${form.especialidades.includes(e)?'on':''}`} onClick={()=>toggleEsp(e)}>{e}</button>)}</div>
        </div>
        <div className="fp-actions">
          <button type="button" className="btn-secondary" onClick={onCancelar}>Cancelar</button>
          <button type="submit" className={`btn-primary ${saving?'loading':''}`} disabled={saving}>
            {saving?<><Spinner/>Guardando...</>:<><IcoPlus/>{inicial?'Guardar cambios':'Publicar oferta'}</>}
          </button>
        </div>
      </form>
    </div>
  );
}

export default function VistaEmpresa({ usuario }) {
  const [tab,          setTab]          = useState('dashboard');
  const [mostrarForm,  setMostrarForm]  = useState(false);
  const [editando,     setEditando]     = useState(null);
  const [ofertas,      setOfertas]      = useState([]);
  const [postulantes,  setPostulantes]  = useState([]);
  const [filtroOferta, setFiltroOferta] = useState('todas');
  const [perfil,       setPerfil]       = useState(null);
  const [cargando,     setCargando]     = useState(true);
  const [cargPost,     setCargPost]     = useState(false);
  const [stats,        setStats]        = useState({ activas:0, totalPost:0, aceptados:0, total:0 });
  const [error,        setError]        = useState('');

  useEffect(() => {
    setCargando(true);
    Promise.all([
      ofertasAPI.misOfertas(),
      perfilAPI.me(),
    ]).then(([ofs, me]) => {
      setOfertas(ofs);
      setPerfil(me.perfil ?? null);
      setStats({
        activas:  ofs.filter(o=>o.activo).length,
        total:    ofs.length,
        totalPost: 0,
        aceptados: 0,
      });
    }).catch(e => setError(e.message))
      .finally(() => setCargando(false));
  }, []);

  // Cargar postulantes cuando cambia el tab
  useEffect(() => {
    if (tab !== 'postulantes') return;
    setCargPost(true);
    // Cargar postulantes de todas las ofertas
    const fetchAll = async () => {
      const todos = [];
      for (const o of ofertas) {
        try {
          const ps = await ofertasAPI.postulantes(o._id);
          ps.forEach(p => todos.push({ ...p, _ofertaTitulo: o.titulo, _ofertaId: o._id }));
        } catch {}
      }
      setPostulantes(todos);
      setStats(prev => ({
        ...prev,
        totalPost:  todos.length,
        aceptados:  todos.filter(p=>p.estado==='aceptada').length,
      }));
      setCargPost(false);
    };
    fetchAll();
  }, [tab, ofertas]);

  async function publicar(payload) {
    const nueva = await ofertasAPI.crear(payload);
    setOfertas(p => [nueva, ...p]);
    setStats(prev => ({ ...prev, activas: prev.activas+1, total: prev.total+1 }));
    setMostrarForm(false);
  }

  async function guardarEdit(payload) {
    const actualizada = await ofertasAPI.editar(editando._id, payload);
    setOfertas(p => p.map(o => o._id === editando._id ? actualizada : o));
    setEditando(null);
  }

  async function toggleActivo(id, actual) {
    await ofertasAPI.editar(id, { activo: !actual });
    setOfertas(p => p.map(o => o._id===id ? {...o, activo:!actual} : o));
  }

  async function cambiarEstadoPost(postId, estado) {
    await ofertasAPI.cambiarEstado(postId, estado);
    setPostulantes(p => p.map(x => x._id===postId ? {...x, estado} : x));
  }

  const postFiltrados = filtroOferta==='todas'
    ? postulantes
    : postulantes.filter(p => p._ofertaId === filtroOferta);

  if (mostrarForm || editando) return (
    <div className="empresa-page"><div className="empresa-inner" style={{maxWidth:760}}>
      <FormPublicar
        onGuardar={editando ? guardarEdit : publicar}
        onCancelar={()=>{ setMostrarForm(false); setEditando(null); }}
        inicial={editando}
      />
    </div></div>
  );

  if (cargando) return (
    <div style={{display:'flex',alignItems:'center',justifyContent:'center',minHeight:'60vh'}}>
      <div style={{width:36,height:36,border:'3px solid var(--azul-light)',borderTopColor:'var(--azul)',borderRadius:'50%',animation:'spin .8s linear infinite'}}/>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );

  return (
    <div className="empresa-page">
      <div className="empresa-inner">
        <div className="empresa-top-bar">
          <div>
            <h1 className="empresa-titulo">Portal de empresa</h1>
            <p className="empresa-sub">{perfil?.nombre_empresa ?? usuario?.nombre} · Gestiona tus ofertas y postulantes</p>
          </div>
          <button className="btn-verde" onClick={()=>setMostrarForm(true)}><IcoPlus/> Publicar oferta</button>
        </div>

        {error && <div style={{padding:'12px 16px',background:'var(--rojo-light)',color:'var(--rojo)',borderRadius:'var(--radius-md)',marginBottom:16,fontSize:13}}>{error}</div>}

        <div className="empresa-stats">
          {[
            {n:stats.activas,   l:'Ofertas activas',     color:'var(--azul)'},
            {n:stats.totalPost, l:'Total postulantes',   color:'var(--naranja)'},
            {n:stats.aceptados, l:'Candidatos aceptados',color:'var(--verde)'},
            {n:stats.total,     l:'Ofertas publicadas',  color:'var(--texto)'},
          ].map(s=>(
            <div key={s.l} className="empresa-stat-card">
              <span className="empresa-stat-n" style={{color:s.color}}>{s.n}</span>
              <span className="empresa-stat-l">{s.l}</span>
            </div>
          ))}
        </div>

        <div className="empresa-tabs">
          {[['dashboard','Mis publicaciones'],['postulantes','Postulantes'],['perfil','Perfil empresa']].map(([id,lbl])=>(
            <button key={id} className={`empresa-tab ${tab===id?'active':''}`} onClick={()=>setTab(id)}>{lbl}</button>
          ))}
        </div>

        {tab==='dashboard' && (
          <div className="emp-ofertas-lista">
            {!cargando && ofertas.length===0 && (
              <div className="empty-state">
                <p>Aún no has publicado ninguna oferta.</p>
                <button className="btn-primary" onClick={()=>setMostrarForm(true)}><IcoPlus/> Publicar primera oferta</button>
              </div>
            )}
            {ofertas.map(o=>(
              <div key={o._id} className={`emp-oferta-card card ${!o.activo?'inactiva':''}`}>
                <div className="emp-oferta-top">
                  <div className="emp-oferta-info">
                    <div className="emp-oferta-titulo-row">
                      <h3>{o.titulo}</h3>
                      <span className={`badge ${o.activo?'badge-verde':'badge-gris'}`}>{o.activo?'Activa':'Cerrada'}</span>
                    </div>
                    <div className="emp-oferta-meta">
                      <span>{o.ubicacion}</span>·<span>{o.modalidad}</span>
                      {o.salario_min&&<>·<span>${Math.round(o.salario_min).toLocaleString('es-CL')} – ${Math.round(o.salario_max||0).toLocaleString('es-CL')}</span></>}
                      ·<span>{new Date(o.publicado_en).toLocaleDateString('es-CL')}</span>
                    </div>
                    <div className="emp-esp-chips">
                      {o.especialidades_requeridas?.map(e=><span key={e} className="badge badge-azul">{e}</span>)}
                    </div>
                  </div>
                  <div className="emp-oferta-acciones">
                    <div className="emp-oferta-btns">
                      <button className="emp-btn" title="Editar" onClick={()=>setEditando(o)}><IcoEdit/></button>
                      <button className={`emp-btn ${o.activo?'danger':''}`} title={o.activo?'Cerrar oferta':'Reactivar'} onClick={()=>toggleActivo(o._id,o.activo)}>{o.activo?<IcoOff/>:<IcoOn/>}</button>
                      <Link to={`/oferta/${o._id}`} className="emp-btn" title="Ver pública">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {tab==='postulantes' && (
          <div className="emp-post-section">
            <div className="emp-post-filtro">
              <label>Filtrar por oferta:</label>
              <select value={filtroOferta} onChange={e=>setFiltroOferta(e.target.value)}>
                <option value="todas">Todas las ofertas</option>
                {ofertas.map(o=><option key={o._id} value={o._id}>{o.titulo}</option>)}
              </select>
            </div>
            {cargPost && <p style={{fontSize:13,color:'var(--gris-2)',textAlign:'center',padding:'20px 0'}}>Cargando postulantes...</p>}
            {!cargPost && postFiltrados.length===0 && <div className="empty-state"><p>Sin postulantes para esta oferta.</p></div>}
            <div className="emp-post-tabla">
              {postFiltrados.map(p=>{
                const est = p.estudiante_id ?? {};
                const cfg = ESTADO_CFG[p.estado] ?? ESTADO_CFG.pendiente;
                return (
                  <div key={p._id} className="emp-post-fila card">
                    <div className="emp-post-av">{est.nombre?.[0]??'E'}</div>
                    <div className="emp-post-info">
                      <p className="emp-post-nombre">{est.nombre} {est.apellido}</p>
                      <p className="emp-post-sub">{est.email} · {p._ofertaTitulo}</p>
                    </div>
                    <span className={`badge ${cfg.cls}`}>{cfg.label}</span>
                    <div className="emp-post-actions">
                      <select value={p.estado} onChange={e=>cambiarEstadoPost(p._id,e.target.value)} className="estado-select">
                        {Object.entries(ESTADO_CFG).map(([v,{label}])=><option key={v} value={v}>{label}</option>)}
                      </select>
                      <Link to={`/perfil/${p.estudiante_id?._id}`} className="emp-btn">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {tab==='perfil' && (
          <div className="emp-perfil-section card">
            <div className="emp-perfil-header">
              <div className="emp-perfil-logo">{(perfil?.nombre_empresa ?? usuario?.nombre ?? 'E')[0]}</div>
              <div>
                <h2>{perfil?.nombre_empresa ?? usuario?.nombre}</h2>
                <p className="emp-perfil-rubro">{perfil?.rubro ?? 'Sin rubro definido'} · {perfil?.ciudad ?? 'Sin ciudad'}</p>
              </div>
            </div>
            <div className="emp-perfil-campos">
              {[
                {l:'Descripción',  v: perfil?.descripcion  || 'Sin descripción.'},
                {l:'Sitio web',    v: perfil?.sitio_web    || '—'},
                {l:'Teléfono',     v: perfil?.telefono     || '—'},
                {l:'Ciudad',       v: perfil?.ciudad       || '—'},
                {l:'Región',       v: perfil?.region       || '—'},
                {l:'Rubro',        v: perfil?.rubro        || '—'},
              ].map(c=>(
                <div key={c.l} className="emp-campo">
                  <span className="emp-campo-label">{c.l}</span>
                  <span className="emp-campo-val">{c.v}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}