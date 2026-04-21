import { useState } from 'react';
import { Link } from 'react-router-dom';
import './VistaEmpresa.css';

// Más mockup de datos

const MOCK_OFERTAS_EMP = [
  { _id:'e1', titulo:'Técnico electricista industrial', postulantes:12, activo:true, publicado_en:'2024-03-10', salario_min:650000, salario_max:850000, modalidad:'presencial', ubicacion:'Concepción', especialidades_requeridas:['Electricidad','PLC'] },
  { _id:'e2', titulo:'Mecatrónico de producción',       postulantes:7,  activo:true, publicado_en:'2024-03-08', salario_min:700000, salario_max:950000, modalidad:'presencial', ubicacion:'Talcahuano', especialidades_requeridas:['Mecatrónica'] },
  { _id:'e3', titulo:'Soporte redes — proyecto CL',     postulantes:3,  activo:false,publicado_en:'2024-02-20', salario_min:580000, salario_max:750000, modalidad:'remoto',     ubicacion:'Remoto',     especialidades_requeridas:['Redes'] },
];
const MOCK_POSTULANTES = [
  { _id:'p1', oferta:'Técnico electricista industrial', nombre:'Valentina Mora',  especialidad:'Electricidad', puntuacion:6.2, estado:'pendiente' },
  { _id:'p2', oferta:'Técnico electricista industrial', nombre:'Diego Fuentes',   especialidad:'Electricidad', puntuacion:6.8, estado:'en_revision' },
  { _id:'p3', oferta:'Mecatrónico de producción',       nombre:'Carlos Bravo',    especialidad:'Mecatrónica',  puntuacion:5.9, estado:'pendiente' },
  { _id:'p4', oferta:'Técnico electricista industrial', nombre:'Camila Torres',   especialidad:'Electricidad', puntuacion:7.0, estado:'aceptada' },
];
const ESPECIALIDADES = ['Electricidad industrial','Mecatrónica','Redes y comunicaciones','Automatización y PLC','Construcción','Otro'];

const ESTADO_CFG = {
  pendiente:   { label:'Pendiente',    cls:'badge-gris'    },
  en_revision: { label:'En revisión',  cls:'badge-naranja' },
  aceptada:    { label:'Aceptado',     cls:'badge-verde'   },
  rechazada:   { label:'Rechazado',    cls:'badge-rojo'    },
  contratado:  { label:'Contratado',   cls:'badge-verde'   },
};

function IcoPlus()   { return <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>; }
function IcoEdit()   { return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4z"/></svg>; }
function IcoOff()    { return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><line x1="4.93" y1="4.93" x2="19.07" y2="19.07"/></svg>; }
function IcoUsers()  { return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>; }

const FORM_INIT = { titulo:'', descripcion:'', ubicacion:'', salario_min:'', salario_max:'', modalidad:'presencial', especialidades:[], cierre_en:'' };

function FormPublicar({ onGuardar, onCancelar, inicial }) {
  const [form, setForm] = useState(inicial ?? FORM_INIT);
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);

  function upd(k,v){ setForm(p=>({...p,[k]:v})); setErrors(p=>({...p,[k]:''})); }
  function toggleEsp(e){ setForm(p=>({ ...p, especialidades: p.especialidades.includes(e) ? p.especialidades.filter(x=>x!==e) : [...p.especialidades,e] })); }

  function validar(){
    const e={};
    if(!form.titulo.trim())       e.titulo='Requerido';
    if(!form.descripcion.trim())  e.descripcion='Requerido';
    if(!form.ubicacion.trim())    e.ubicacion='Requerido';
    if(form.salario_min && form.salario_max && Number(form.salario_min)>Number(form.salario_max)) e.salario_max='Debe ser mayor al mínimo';
    setErrors(e);
    return !Object.keys(e).length;
  }

  function handleSubmit(e){
    e.preventDefault();
    if(!validar()) return;
    setSaving(true);
    setTimeout(()=>{ setSaving(false); onGuardar(form); }, 700);
  }

  return (
    <div className="form-publicar-wrap">
      <div className="form-publicar-header">
        <h2>{inicial ? 'Editar oferta' : 'Publicar nueva oferta'}</h2>
        <button className="fp-close" onClick={onCancelar}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
        </button>
      </div>
      <form onSubmit={handleSubmit} noValidate>
        <div className="fp-grid">
          <div className="fp-field full">
            <label>Título del cargo <span className="req">*</span></label>
            <input placeholder="Ej: Técnico electricista industrial" value={form.titulo} onChange={e=>upd('titulo',e.target.value)} className={errors.titulo?'err':''} />
            {errors.titulo && <span className="ferr">{errors.titulo}</span>}
          </div>
          <div className="fp-field full">
            <label>Descripción <span className="req">*</span></label>
            <textarea rows={4} placeholder="Describe el cargo, responsabilidades y requisitos..." value={form.descripcion} onChange={e=>upd('descripcion',e.target.value)} className={errors.descripcion?'err':''} />
            {errors.descripcion && <span className="ferr">{errors.descripcion}</span>}
          </div>
          <div className="fp-field">
            <label>Ubicación <span className="req">*</span></label>
            <input placeholder="Ej: Concepción, Bío-Bío" value={form.ubicacion} onChange={e=>upd('ubicacion',e.target.value)} className={errors.ubicacion?'err':''} />
            {errors.ubicacion && <span className="ferr">{errors.ubicacion}</span>}
          </div>
          <div className="fp-field">
            <label>Modalidad</label>
            <select value={form.modalidad} onChange={e=>upd('modalidad',e.target.value)}>
              <option value="presencial">Presencial</option>
              <option value="remoto">Remoto</option>
              <option value="híbrido">Híbrido</option>
            </select>
          </div>
          <div className="fp-field">
            <label>Sueldo mínimo (CLP)</label>
            <input type="number" placeholder="Ej: 600000" value={form.salario_min} onChange={e=>upd('salario_min',e.target.value)} />
          </div>
          <div className="fp-field">
            <label>Sueldo máximo (CLP)</label>
            <input type="number" placeholder="Ej: 900000" value={form.salario_max} onChange={e=>upd('salario_max',e.target.value)} className={errors.salario_max?'err':''} />
            {errors.salario_max && <span className="ferr">{errors.salario_max}</span>}
          </div>
          <div className="fp-field">
            <label>Fecha de cierre</label>
            <input type="date" value={form.cierre_en} onChange={e=>upd('cierre_en',e.target.value)} />
          </div>
        </div>
        <div className="fp-esp-section">
          <label>Especialidades requeridas</label>
          <div className="fp-esp-chips">
            {ESPECIALIDADES.map(e=>(
              <button type="button" key={e} className={`fp-esp-chip ${form.especialidades.includes(e)?'on':''}`} onClick={()=>toggleEsp(e)}>{e}</button>
            ))}
          </div>
        </div>
        <div className="fp-actions">
          <button type="button" className="btn-secondary" onClick={onCancelar}>Cancelar</button>
          <button type="submit" className={`btn-primary ${saving?'loading':''}`} disabled={saving}>
            {saving ? <><span className="spinner" />Publicando...</> : <><IcoPlus />{inicial?'Guardar cambios':'Publicar oferta'}</>}
          </button>
        </div>
      </form>
    </div>
  );
}

export default function VistaEmpresa({ usuario }) {
  const [tab, setTab] = useState('dashboard');
  const [mostrarForm, setMostrarForm] = useState(false);
  const [editando, setEditando] = useState(null);
  const [ofertas, setOfertas] = useState(MOCK_OFERTAS_EMP);
  const [postulantes, setPostulantes] = useState(MOCK_POSTULANTES);
  const [filtroOferta, setFiltroOferta] = useState('todas');

  const totalPost = postulantes.length;
  const activas   = ofertas.filter(o=>o.activo).length;
  const aceptados = postulantes.filter(p=>p.estado==='aceptada').length;

  function publicar(form){
    const nueva = { ...form, _id:'e'+Date.now(), activo:true, postulantes:0, publicado_en:new Date().toISOString().slice(0,10) };
    setOfertas(p=>[nueva,...p]);
    setMostrarForm(false);
  }
  function guardarEdit(form){
    setOfertas(p=>p.map(o=>o._id===editando._id?{...o,...form}:o));
    setEditando(null);
  }
  function toggleActivo(id){ setOfertas(p=>p.map(o=>o._id===id?{...o,activo:!o.activo}:o)); }
  function cambiarEstado(id,estado){ setPostulantes(p=>p.map(x=>x._id===id?{...x,estado}:x)); }

  const postFiltrados = filtroOferta==='todas' ? postulantes : postulantes.filter(p=>p.oferta===filtroOferta);

  if(mostrarForm || editando) return (
    <div className="empresa-page">
      <div className="empresa-inner" style={{maxWidth:760}}>
        <FormPublicar
          onGuardar={editando ? guardarEdit : publicar}
          onCancelar={()=>{ setMostrarForm(false); setEditando(null); }}
          inicial={editando}
        />
      </div>
    </div>
  );

  return (
    <div className="empresa-page">
      <div className="empresa-inner">
        <div className="empresa-top-bar">
          <div>
            <h1 className="empresa-titulo">Portal de empresa</h1>
            <p className="empresa-sub">{usuario?.nombre ?? 'Mi empresa'} · Gestiona tus ofertas y postulantes</p>
          </div>
          <button className="btn-verde" onClick={()=>setMostrarForm(true)}>
            <IcoPlus /> Publicar oferta
          </button>
        </div>

        <div className="empresa-stats">
          {[
            { n: activas,    l:'Ofertas activas',          color:'var(--azul)' },
            { n: totalPost,  l:'Total postulantes',         color:'var(--naranja)' },
            { n: aceptados,  l:'Candidatos aceptados',      color:'var(--verde)' },
            { n: ofertas.length, l:'Ofertas publicadas',    color:'var(--texto)' },
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
            {ofertas.length===0 && (
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
                      <span>{o.ubicacion}</span>·
                      <span>{o.modalidad}</span>·
                      <span>${Math.round(o.salario_min).toLocaleString('es-CL')} – ${Math.round(o.salario_max).toLocaleString('es-CL')}</span>·
                      <span>Publicada: {o.publicado_en}</span>
                    </div>
                    <div className="emp-esp-chips">
                      {o.especialidades_requeridas?.map(e=><span key={e} className="badge badge-azul">{e}</span>)}
                    </div>
                  </div>
                  <div className="emp-oferta-acciones">
                    <div className="emp-post-count">
                      <IcoUsers/>
                      <span>{typeof o.postulantes==='number'?o.postulantes:postulantes.filter(p=>p.oferta===o.titulo).length} postulantes</span>
                    </div>
                    <div className="emp-oferta-btns">
                      <button className="emp-btn" title="Editar" onClick={()=>setEditando(o)}><IcoEdit/></button>
                      <button className={`emp-btn ${o.activo?'danger':''}`} title={o.activo?'Cerrar oferta':'Reactivar'} onClick={()=>toggleActivo(o._id)}><IcoOff/></button>
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
                {ofertas.map(o=><option key={o._id} value={o.titulo}>{o.titulo}</option>)}
              </select>
            </div>
            {postFiltrados.length===0 && <div className="empty-state"><p>Sin postulantes para esta oferta.</p></div>}
            <div className="emp-post-tabla">
              {postFiltrados.map(p=>(
                <div key={p._id} className="emp-post-fila card">
                  <div className="emp-post-av">{p.nombre[0]}</div>
                  <div className="emp-post-info">
                    <p className="emp-post-nombre">{p.nombre}</p>
                    <p className="emp-post-sub">{p.especialidad} · {p.oferta}</p>
                  </div>
                  <div className="emp-post-puntaje">
                    <div className="puntaje-bar-bg"><div className="puntaje-bar-fill" style={{width:`${(p.puntuacion/7)*100}%`}}/></div>
                    <span className="puntaje-val">{p.puntuacion.toFixed(1)}/7</span>
                  </div>
                  <span className={`badge ${ESTADO_CFG[p.estado]?.cls}`}>{ESTADO_CFG[p.estado]?.label}</span>
                  <div className="emp-post-actions">
                    <select value={p.estado} onChange={e=>cambiarEstado(p._id,e.target.value)} className="estado-select">
                      {Object.entries(ESTADO_CFG).map(([v,{label}])=><option key={v} value={v}>{label}</option>)}
                    </select>
                    <Link to={`/perfil/${p._id}`} className="emp-btn">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {tab==='perfil' && (
          <div className="emp-perfil-section card">
            <div className="emp-perfil-header">
              <div className="emp-perfil-logo">{(usuario?.nombre??'E')[0]}</div>
              <div>
                <h2>{usuario?.nombre ?? 'Mi empresa'}</h2>
                <p className="emp-perfil-rubro">Sector tecnológico · Concepción, Chile</p>
              </div>
              <button className="btn-secondary"><IcoEdit/> Editar perfil</button>
            </div>
            <div className="emp-perfil-campos">
              {[
                {l:'Descripción', v:'Empresa líder en soluciones tecnológicas para la región del Bío-Bío, enfocada en automatización industrial y soporte técnico.'},
                {l:'Sitio web', v:'www.techchile.cl'},
                {l:'Teléfono', v:'+56 41 234 5678'},
                {l:'Ciudad', v:'Concepción, Bío-Bío'},
                {l:'Rubro', v:'Tecnología / Automatización'},
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
