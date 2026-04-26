import { useState, useEffect } from 'react';
import { adminAPI } from '../api';
import './PanelAdmin.css';

const TABS = [['usuarios','Usuarios'],['ofertas','Ofertas'],['estadisticas','Estadísticas']];

function IcoBan()   { return <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><line x1="4.93" y1="4.93" x2="19.07" y2="19.07"/></svg>; }
function IcoCheck() { return <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>; }
function IcoTrash() { return <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>; }

function EmptyState({ msg }) {
  return <div style={{textAlign:'center',padding:'40px 20px',color:'var(--gris-2)',fontSize:14}}>{msg}</div>;
}

export default function PanelAdmin({ usuario }) {
  const [tab,      setTab]      = useState('usuarios');
  const [usuarios, setUsuarios] = useState([]);
  const [ofertas,  setOfertas]  = useState([]);
  const [stats,    setStats]    = useState(null);
  const [filtroRol,setFiltroRol]= useState('todos');
  const [busq,     setBusq]     = useState('');
  const [cargando, setCargando] = useState(true);
  const [error,    setError]    = useState('');

  // Carga inicial: stats y usuarios
  useEffect(() => {
    setCargando(true);
    Promise.all([adminAPI.stats(), adminAPI.usuarios()])
      .then(([s, us]) => { setStats(s); setUsuarios(us); })
      .catch(e => setError(e.message))
      .finally(() => setCargando(false));
  }, []);

  // Cargar ofertas cuando se abre el tab
  useEffect(() => {
    if (tab !== 'ofertas' || ofertas.length > 0) return;
    adminAPI.todasOfertas()
      .then(setOfertas)
      .catch(e => setError(e.message));
  }, [tab]);

  async function buscarUsuarios() {
    const params = {};
    if (filtroRol !== 'todos') params.rol = filtroRol;
    if (busq.trim()) params.busq = busq.trim();
    const us = await adminAPI.usuarios(params);
    setUsuarios(us);
  }

  async function toggleActivo(id, actual) {
    try {
      const u = await adminAPI.toggleActivo(id, !actual);
      setUsuarios(p => p.map(x => x._id===id ? u : x));
    } catch(e) { setError(e.message); }
  }

  async function eliminarUsuario(id) {
    if (!confirm('¿Eliminar este usuario permanentemente?')) return;
    try {
      await adminAPI.eliminarUsuario(id);
      setUsuarios(p => p.filter(x => x._id !== id));
    } catch(e) { setError(e.message); }
  }

  async function toggleOferta(id, actual) {
    try {
      const { ofertasAPI } = await import('../api');
      await ofertasAPI.editar(id, { activo: !actual });
      setOfertas(p => p.map(o => o._id===id ? {...o, activo:!actual} : o));
    } catch(e) { setError(e.message); }
  }

  const usuariosFiltrados = usuarios
    .filter(u => filtroRol==='todos' || u.rol===filtroRol)
    .filter(u => !busq || u.nombre.toLowerCase().includes(busq.toLowerCase()) || u.email.toLowerCase().includes(busq.toLowerCase()));

  if (cargando) return (
    <div style={{display:'flex',alignItems:'center',justifyContent:'center',minHeight:'60vh'}}>
      <div style={{width:36,height:36,border:'3px solid var(--azul-light)',borderTopColor:'var(--azul)',borderRadius:'50%',animation:'spin .8s linear infinite'}}/>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );

  return (
    <div className="admin-page">
      <div className="admin-inner">
        <div className="admin-top">
          <div>
            <div className="admin-badge-rol">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
              Administrador
            </div>
            <h1 className="admin-titulo">Panel de administración</h1>
            <p className="admin-sub">Bienvenido, {usuario?.nombre}. Gestiona usuarios y ofertas de la plataforma.</p>
          </div>
        </div>

        {error && <div style={{padding:'10px 14px',background:'var(--rojo-light)',color:'var(--rojo)',borderRadius:'var(--radius-md)',marginBottom:16,fontSize:13}}>{error}</div>}

        {stats && (
          <div className="admin-stats">
            {[
              {n:stats.estudiantes,  l:'Estudiantes registrados', color:'var(--azul)'},
              {n:stats.empresas,     l:'Empresas registradas',    color:'var(--verde)'},
              {n:stats.ofertas,      l:'Ofertas activas',         color:'var(--naranja)'},
              {n:stats.postulaciones,l:'Total postulaciones',     color:'var(--texto)'},
            ].map(s=>(
              <div key={s.l} className="admin-stat-card">
                <span className="admin-stat-n" style={{color:s.color}}>{s.n}</span>
                <span className="admin-stat-l">{s.l}</span>
              </div>
            ))}
          </div>
        )}

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
                <input
                  placeholder="Buscar por nombre o email..."
                  value={busq}
                  onChange={e=>setBusq(e.target.value)}
                  onKeyDown={e=>e.key==='Enter'&&buscarUsuarios()}
                />
              </div>
              <div className="admin-filter-chips">
                {[['todos','Todos'],['estudiante','Estudiantes'],['empresa','Empresas']].map(([v,l])=>(
                  <button key={v} className={`admin-chip ${filtroRol===v?'on':''}`} onClick={()=>setFiltroRol(v)}>{l}</button>
                ))}
              </div>
              <button className="btn-secondary" style={{fontSize:12,padding:'6px 14px'}} onClick={buscarUsuarios}>Buscar</button>
            </div>
            {usuariosFiltrados.length===0 ? <EmptyState msg="No se encontraron usuarios con estos filtros."/> : (
              <div className="admin-tabla">
                <div className="admin-tabla-header">
                  <span>Usuario</span><span>Rol</span><span>Registrado</span><span>Estado</span><span>Acciones</span>
                </div>
                {usuariosFiltrados.map(u=>(
                  <div key={u._id} className={`admin-tabla-fila ${!u.activo?'inactiva':''}`}>
                    <div className="admin-user-cell">
                      <div className={`admin-av ${u.rol}`}>{u.nombre[0]}</div>
                      <div>
                        <p className="admin-user-nombre">{u.nombre} {u.apellido}</p>
                        <p className="admin-user-email">{u.email}</p>
                      </div>
                    </div>
                    <span className={`badge ${u.rol==='empresa'?'badge-azul':u.rol==='admin'?'badge-naranja':'badge-verde'}`}>{u.rol}</span>
                    <span className="admin-td-sm">{new Date(u.creado_en).toLocaleDateString('es-CL')}</span>
                    <span className={`badge ${u.activo?'badge-verde':'badge-rojo'}`}>{u.activo?'Activo':'Suspendido'}</span>
                    <div className="admin-fila-btns">
                      <button className={`adm-btn ${u.activo?'warn':''}`} title={u.activo?'Suspender':'Reactivar'} onClick={()=>toggleActivo(u._id,u.activo)}>
                        {u.activo?<IcoBan/>:<IcoCheck/>}
                      </button>
                      <button className="adm-btn danger" title="Eliminar usuario" onClick={()=>eliminarUsuario(u._id)}><IcoTrash/></button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {tab==='ofertas' && (
          <div className="admin-seccion">
            {ofertas.length===0 ? <EmptyState msg="No hay ofertas publicadas aún."/> : (
              <div className="admin-tabla">
                <div className="admin-tabla-header">
                  <span>Oferta</span><span>Empresa</span><span>Publicada</span><span>Estado</span><span>Acciones</span>
                </div>
                {ofertas.map(o=>(
                  <div key={o._id} className={`admin-tabla-fila ${!o.activo?'inactiva':''}`}>
                    <span className="admin-user-nombre" style={{fontSize:13.5}}>{o.titulo}</span>
                    <span className="admin-td-sm">{o.empresa_id?.nombre_empresa??'—'}</span>
                    <span className="admin-td-sm">{new Date(o.publicado_en).toLocaleDateString('es-CL')}</span>
                    <span className={`badge ${o.activo?'badge-verde':'badge-gris'}`}>{o.activo?'Activa':'Cerrada'}</span>
                    <div className="admin-fila-btns">
                      <button className={`adm-btn ${o.activo?'warn':''}`} title={o.activo?'Cerrar':'Reactivar'} onClick={()=>toggleOferta(o._id,o.activo)}>
                        {o.activo?<IcoBan/>:<IcoCheck/>}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {tab==='estadisticas' && stats && (
          <div className="admin-seccion">
            <div className="admin-stats-grid">
              <div className="card admin-chart-card">
                <h3 className="admin-chart-titulo">Distribución de usuarios</h3>
                <div className="admin-dist-lista">
                  {[
                    {esp:'Estudiantes', n:stats.estudiantes, color:'var(--azul)'},
                    {esp:'Empresas',    n:stats.empresas,    color:'var(--verde)'},
                  ].map(d=>{
                    const total = stats.estudiantes + stats.empresas || 1;
                    return (
                      <div key={d.esp} className="admin-dist-row">
                        <span className="admin-dist-esp">{d.esp}</span>
                        <div className="admin-dist-bar-bg">
                          <div className="admin-dist-bar-fill" style={{width:`${(d.n/total)*100}%`,background:d.color}}/>
                        </div>
                        <span className="admin-dist-n">{d.n}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
              <div className="card admin-chart-card">
                <h3 className="admin-chart-titulo">Resumen de actividad</h3>
                <div className="admin-dist-lista">
                  {[
                    {esp:'Ofertas activas',   n:stats.ofertas,      color:'var(--naranja)'},
                    {esp:'Total postulaciones',n:stats.postulaciones,color:'var(--azul)'},
                  ].map(d=>(
                    <div key={d.esp} className="admin-dist-row">
                      <span className="admin-dist-esp">{d.esp}</span>
                      <span className="admin-dist-n" style={{color:d.color,fontWeight:600,fontSize:18,fontFamily:'var(--font-display)'}}>{d.n}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <div className="admin-acciones-rapidas card">
              <h3 className="admin-chart-titulo">Acciones de administrador</h3>
              <div className="admin-accs-grid">
                {[
                  {ico:'📢', label:'Enviar anuncio a todos los usuarios',  action:'Próximamente'},
                  {ico:'📁', label:'Exportar base de datos de usuarios',   action:'Próximamente'},
                  {ico:'🔄', label:'Sincronizar base de datos',             action:'Próximamente'},
                  {ico:'🗑️', label:'Limpiar cuentas inactivas (+90 días)', action:'Próximamente'},
                ].map(a=>(
                  <div key={a.label} className="admin-acc-item">
                    <span className="admin-acc-ico">{a.ico}</span>
                    <p className="admin-acc-label">{a.label}</p>
                    <button className="btn-secondary" style={{fontSize:12,padding:'5px 14px'}} disabled>{a.action}</button>
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