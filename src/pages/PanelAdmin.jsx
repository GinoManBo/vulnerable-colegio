import { useState } from 'react';
import './PanelAdmin.css';

// No funcional datos pedidos a Chatgpt para rellenar mas adelante

const MOCK_USUARIOS = [
  { _id:'u1', nombre:'Valentina Mora',   email:'val.mora@gmail.com',    rol:'estudiante', activo:true,  creado:'2024-01-15', especialidad:'Electricidad' },
  { _id:'u2', nombre:'Diego Fuentes',    email:'d.fuentes@gmail.com',   rol:'estudiante', activo:true,  creado:'2024-01-20', especialidad:'Redes' },
  { _id:'u3', nombre:'TechChile S.A.',   email:'rrhh@techchile.cl',     rol:'empresa',    activo:true,  creado:'2024-01-10', especialidad:null },
  { _id:'u4', nombre:'Carlos Bravo',     email:'c.bravo@hotmail.com',   rol:'estudiante', activo:false, creado:'2024-02-01', especialidad:'Mecatrónica' },
  { _id:'u5', nombre:'Constructora Sur', email:'admin@constsur.cl',     rol:'empresa',    activo:true,  creado:'2024-01-08', especialidad:null },
  { _id:'u6', nombre:'Camila Torres',    email:'camila.t@gmail.com',    rol:'estudiante', activo:true,  creado:'2024-02-10', especialidad:'Automatización' },
];

const MOCK_REPORTES = [
  { _id:'r1', tipo:'oferta',   descripcion:'Oferta con información salarial falsa',         estado:'pendiente', fecha:'2024-03-12', autor:'Valentina Mora', target:'Oferta: Operario CNC' },
  { _id:'r2', tipo:'usuario',  descripcion:'Perfil de empresa con datos de contacto falsos', estado:'resuelto',  fecha:'2024-03-10', autor:'Diego Fuentes',  target:'Empresa: FalsaCorp' },
  { _id:'r3', tipo:'mensaje',  descripcion:'Mensaje inapropiado en conversación',            estado:'pendiente', fecha:'2024-03-11', autor:'Camila Torres',  target:'Usuario: Empresa X' },
];

const MOCK_OFERTAS_ADMIN = [
  { _id:'o1', titulo:'Técnico electricista',    empresa:'Industrias CMPC', activo:true,  postulantes:12, fecha:'2024-03-10' },
  { _id:'o2', titulo:'Mecatrónico producción',  empresa:'Carozzi S.A.',    activo:true,  postulantes:7,  fecha:'2024-03-08' },
  { _id:'o3', titulo:'Soporte técnico redes',   empresa:'TechChile S.A.',  activo:false, postulantes:3,  fecha:'2024-03-01' },
];

const STATS = [
  { n:534, l:'Estudiantes registrados', color:'var(--azul)',    delta:'+12 esta semana' },
  { n:89,  l:'Empresas registradas',    color:'var(--verde)',   delta:'+3 esta semana' },
  { n:142, l:'Ofertas activas',         color:'var(--naranja)', delta:'+8 esta semana' },
  { n:3,   l:'Reportes pendientes',     color:'var(--rojo)',    delta:'Requieren revisión' },
];

const TABS = [['usuarios','Usuarios'],['ofertas','Ofertas'],['reportes','Reportes'],['estadisticas','Estadísticas']];

function IcoBan()   { return <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><line x1="4.93" y1="4.93" x2="19.07" y2="19.07"/></svg>; }
function IcoCheck() { return <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>; }
function IcoTrash() { return <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>; }

export default function PanelAdmin({ usuario }) {
  const [tab, setTab]           = useState('usuarios');
  const [usuarios, setUsuarios] = useState(MOCK_USUARIOS);
  const [reportes, setReportes] = useState(MOCK_REPORTES);
  const [ofertas,  setOfertas]  = useState(MOCK_OFERTAS_ADMIN);
  const [filtroRol, setFiltroRol] = useState('todos');
  const [busq, setBusq]         = useState('');

  function toggleActivo(id){ setUsuarios(p=>p.map(u=>u._id===id?{...u,activo:!u.activo}:u)); }
  function eliminarUsuario(id){ setUsuarios(p=>p.filter(u=>u._id!==id)); }
  function resolverReporte(id){ setReportes(p=>p.map(r=>r._id===id?{...r,estado:'resuelto'}:r)); }
  function toggleOferta(id){ setOfertas(p=>p.map(o=>o._id===id?{...o,activo:!o.activo}:o)); }

  const usuariosFiltrados = usuarios
    .filter(u=>filtroRol==='todos'||u.rol===filtroRol)
    .filter(u=>u.nombre.toLowerCase().includes(busq.toLowerCase())||u.email.toLowerCase().includes(busq.toLowerCase()));

  return (
    <div className="admin-page">
      <div className="admin-inner">
        <div className="admin-top">
          <div>
            <div className="admin-badge-rol"><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg> Administrador</div>
            <h1 className="admin-titulo">Panel de administración</h1>
            <p className="admin-sub">Bienvenido, {usuario?.nombre ?? 'Admin'}. Gestiona usuarios, ofertas y reportes.</p>
          </div>
        </div>

        <div className="admin-stats">
          {STATS.map(s=>(
            <div key={s.l} className="admin-stat-card">
              <span className="admin-stat-n" style={{color:s.color}}>{s.n}</span>
              <span className="admin-stat-l">{s.l}</span>
              <span className="admin-stat-delta">{s.delta}</span>
            </div>
          ))}
        </div>

        <div className="admin-tabs">
          {TABS.map(([id,lbl])=>(
            <button key={id} className={`admin-tab ${tab===id?'active':''}`} onClick={()=>setTab(id)}>{lbl}</button>
          ))}
        </div>

        {tab==='usuarios' && (
          <div className="admin-seccion">
            <div className="admin-toolbar">
              <div className="admin-busq-wrap">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
                <input placeholder="Buscar por nombre o email..." value={busq} onChange={e=>setBusq(e.target.value)} />
              </div>
              <div className="admin-filter-chips">
                {[['todos','Todos'],['estudiante','Estudiantes'],['empresa','Empresas']].map(([v,l])=>(
                  <button key={v} className={`admin-chip ${filtroRol===v?'on':''}`} onClick={()=>setFiltroRol(v)}>{l}</button>
                ))}
              </div>
            </div>
            <div className="admin-tabla">
              <div className="admin-tabla-header">
                <span>Usuario</span><span>Rol</span><span>Especialidad</span><span>Registrado</span><span>Estado</span><span>Acciones</span>
              </div>
              {usuariosFiltrados.map(u=>(
                <div key={u._id} className={`admin-tabla-fila ${!u.activo?'inactiva':''}`}>
                  <div className="admin-user-cell">
                    <div className={`admin-av ${u.rol}`}>{u.nombre[0]}</div>
                    <div>
                      <p className="admin-user-nombre">{u.nombre}</p>
                      <p className="admin-user-email">{u.email}</p>
                    </div>
                  </div>
                  <span className={`badge ${u.rol==='empresa'?'badge-azul':u.rol==='admin'?'badge-naranja':'badge-verde'}`}>{u.rol}</span>
                  <span className="admin-td-sm">{u.especialidad ?? '—'}</span>
                  <span className="admin-td-sm">{u.creado}</span>
                  <span className={`badge ${u.activo?'badge-verde':'badge-rojo'}`}>{u.activo?'Activo':'Suspendido'}</span>
                  <div className="admin-fila-btns">
                    <button className={`adm-btn ${u.activo?'warn':''}`} title={u.activo?'Suspender':'Reactivar'} onClick={()=>toggleActivo(u._id)}>
                      {u.activo?<IcoBan/>:<IcoCheck/>}
                    </button>
                    <button className="adm-btn danger" title="Eliminar usuario" onClick={()=>eliminarUsuario(u._id)}><IcoTrash/></button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {tab==='ofertas' && (
          <div className="admin-seccion">
            <div className="admin-tabla">
              <div className="admin-tabla-header">
                <span>Oferta</span><span>Empresa</span><span>Postulantes</span><span>Publicada</span><span>Estado</span><span>Acciones</span>
              </div>
              {ofertas.map(o=>(
                <div key={o._id} className={`admin-tabla-fila ${!o.activo?'inactiva':''}`}>
                  <span className="admin-user-nombre" style={{fontSize:13.5}}>{o.titulo}</span>
                  <span className="admin-td-sm">{o.empresa}</span>
                  <span className="admin-td-sm">{o.postulantes}</span>
                  <span className="admin-td-sm">{o.fecha}</span>
                  <span className={`badge ${o.activo?'badge-verde':'badge-gris'}`}>{o.activo?'Activa':'Cerrada'}</span>
                  <div className="admin-fila-btns">
                    <button className={`adm-btn ${o.activo?'warn':''}`} title={o.activo?'Cerrar':'Reactivar'} onClick={()=>toggleOferta(o._id)}>
                      {o.activo?<IcoBan/>:<IcoCheck/>}
                    </button>
                    <button className="adm-btn danger" title="Eliminar oferta"><IcoTrash/></button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {tab==='reportes' && (
          <div className="admin-seccion">
            <div className="admin-reportes-lista">
              {reportes.map(r=>(
                <div key={r._id} className={`admin-reporte-card card ${r.estado==='resuelto'?'resuelto':''}`}>
                  <div className="rep-top">
                    <div className="rep-ico-wrap">
                      {r.tipo==='oferta' ? (
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></svg>
                      ) : r.tipo==='usuario' ? (
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                      ) : (
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
                      )}
                    </div>
                    <div className="rep-info">
                      <p className="rep-desc">{r.descripcion}</p>
                      <p className="rep-meta">{r.target} · Reportado por {r.autor} · {r.fecha}</p>
                    </div>
                    <div className="rep-acciones">
                      <span className={`badge ${r.estado==='pendiente'?'badge-naranja':'badge-verde'}`}>{r.estado==='pendiente'?'Pendiente':'Resuelto'}</span>
                      {r.estado==='pendiente' && (
                        <>
                          <button className="adm-btn green" title="Marcar como resuelto" onClick={()=>resolverReporte(r._id)}><IcoCheck/></button>
                          <button className="adm-btn danger" title="Eliminar contenido"><IcoTrash/></button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {tab==='estadisticas' && (
          <div className="admin-seccion">
            <div className="admin-stats-grid">
              <div className="card admin-chart-card">
                <h3 className="admin-chart-titulo">Registros por semana</h3>
                <div className="admin-bar-chart">
                  {[{l:'Sem 1',v:18},{l:'Sem 2',v:24},{l:'Sem 3',v:31},{l:'Sem 4',v:27},{l:'Sem 5',v:42},{l:'Sem 6',v:38}].map((b,i)=>(
                    <div key={i} className="admin-bar-col">
                      <div className="admin-bar-fill" style={{height:`${(b.v/42)*100}%`}} title={`${b.v} registros`}/>
                      <span className="admin-bar-label">{b.l}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="card admin-chart-card">
                <h3 className="admin-chart-titulo">Distribución por especialidad</h3>
                <div className="admin-dist-lista">
                  {[
                    {esp:'Electricidad',n:142,color:'var(--azul)'},
                    {esp:'Mecatrónica', n:98, color:'var(--verde)'},
                    {esp:'Redes',       n:76, color:'var(--naranja)'},
                    {esp:'Construcción',n:118,color:'var(--texto-2)'},
                    {esp:'Automatización',n:60,color:'var(--rojo)'},
                  ].map(d=>(
                    <div key={d.esp} className="admin-dist-row">
                      <span className="admin-dist-esp">{d.esp}</span>
                      <div className="admin-dist-bar-bg">
                        <div className="admin-dist-bar-fill" style={{width:`${(d.n/142)*100}%`,background:d.color}}/>
                      </div>
                      <span className="admin-dist-n">{d.n}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <div className="admin-acciones-rapidas card">
              <h3 className="admin-chart-titulo">Acciones de administrador</h3>
              <div className="admin-accs-grid">
                {[
                  {ico:'📢', label:'Enviar anuncio a todos los usuarios', action:'Enviar anuncio'},
                  {ico:'📁', label:'Exportar base de datos de usuarios',  action:'Exportar CSV'},
                  {ico:'🔄', label:'Sincronizar base de datos',            action:'Sincronizar'},
                  {ico:'🗑️', label:'Limpiar cuentas inactivas (+90 días)', action:'Limpiar cuentas'},
                ].map(a=>(
                  <div key={a.label} className="admin-acc-item">
                    <span className="admin-acc-ico">{a.ico}</span>
                    <p className="admin-acc-label">{a.label}</p>
                    <button className="btn-secondary" style={{fontSize:12,padding:'5px 14px'}}>{a.action}</button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
