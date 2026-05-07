import { useState, useEffect } from 'react';
import { adminAPI, fetchAPI } from '../api';
import './PanelAdmin.css';

const TABS = [
  ['dashboard', 'Dashboard'],
  ['solicitudes-perfil', 'Solicitudes Perfil'],
  ['solicitudes-cv', 'Solicitudes CV'],
  ['auditoria', 'Auditoría'],
  ['usuarios', 'Usuarios'],
  ['ofertas', 'Ofertas'],
  ['estadisticas', 'Estadísticas'],
];

function IcoBan()   { return <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><line x1="4.93" y1="4.93" x2="19.07" y2="19.07"/></svg>; }
function IcoCheck() { return <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>; }
function IcoTrash() { return <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>; }
function IcoX()     { return <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>; }

function EmptyState({ msg }) {
  return <div style={{textAlign:'center',padding:'40px 20px',color:'var(--gris-2)',fontSize:14}}>{msg}</div>;
}

function ToggleSwitch({ activo, onChange, label }) {
  return (
    <div className="toggle-switch-wrap" onClick={() => onChange(!activo)}>
      <span className="toggle-label">{label}</span>
      <div className={`toggle-slider${activo ? ' on' : ''}`}>
        <div className="toggle-knob" />
      </div>
    </div>
  );
}

function RechazoModal({ onConfirm, onCancel }) {
  const [motivo, setMotivo] = useState('');
  const [mensaje, setMensaje] = useState('');
  return (
    <div className="rechazo-modal-overlay" onClick={onCancel}>
      <div className="rechazo-modal" onClick={e => e.stopPropagation()}>
        <h3>Motivo de rechazo</h3>
        <textarea placeholder="Indica el motivo del rechazo (requerido)..." value={motivo} onChange={e => setMotivo(e.target.value)} rows={2} autoFocus />
        <textarea placeholder="Mensaje adicional para el usuario (opcional)..." value={mensaje} onChange={e => setMensaje(e.target.value)} rows={2} style={{marginTop:8}} />
        <div className="rechazo-modal-btns">
          <button className="btn-secondary" onClick={onCancel}>Cancelar</button>
          <button className="btn-primary" onClick={() => onConfirm(motivo, mensaje)} disabled={!motivo.trim()}>Rechazar</button>
        </div>
      </div>
    </div>
  );
}

function EditarDatosModal({ solicitud, onConfirm, onCancel }) {
  const [datos, setDatos] = useState({ ...(solicitud?.datos_solicitados || {}) });
  const [mensaje, setMensaje] = useState('');
  if (!solicitud) return null;
  return (
    <div className="rechazo-modal-overlay" onClick={onCancel}>
      <div className="rechazo-modal editar-datos-modal" onClick={e => e.stopPropagation()}>
        <h3>Editar datos solicitados</h3>
        <p className="editar-datos-sub">Modifica los campos antes de aprobar. Los campos vacíos se eliminarán.</p>
        <div className="editar-datos-campos">
          {Object.entries(datos).map(([k, v]) => (
            <div key={k} className="editar-datos-campo">
              <label>{k.replace(/_/g, ' ')}</label>
              {typeof v === 'object' && !Array.isArray(v)
                ? <textarea value={JSON.stringify(v, null, 2)} onChange={e => { try { setDatos(p => ({...p, [k]: JSON.parse(e.target.value)})); } catch {} }} rows={3} />
                : Array.isArray(v)
                  ? <input value={v.join(', ')} onChange={e => setDatos(p => ({...p, [k]: e.target.value.split(',').map(x=>x.trim()).filter(Boolean)}))} />
                  : <input value={v ?? ''} onChange={e => setDatos(p => ({...p, [k]: e.target.value}))} />
              }
            </div>
          ))}
        </div>
        <textarea placeholder="Mensaje para el usuario (opcional)..." value={mensaje} onChange={e => setMensaje(e.target.value)} rows={2} style={{marginTop:12}} />
        <div className="rechazo-modal-btns">
          <button className="btn-secondary" onClick={onCancel}>Cancelar</button>
          <button className="btn-primary" onClick={() => onConfirm(datos, mensaje)}>Aprobar con cambios</button>
        </div>
      </div>
    </div>
  );
}

export default function PanelAdmin({ usuario }) {
  const [tab,      setTab]      = useState('dashboard');
  const [usuarios, setUsuarios] = useState([]);
  const [ofertas,  setOfertas]  = useState([]);
  const [stats,    setStats]    = useState(null);
  const [filtroRol,setFiltroRol]= useState('todos');
  const [busq,     setBusq]     = useState('');
  const [cargando, setCargando] = useState(true);
  const [error,    setError]    = useState('');

  // Solicitudes
  const [solicitudesPerfil, setSolicitudesPerfil] = useState([]);
  const [solicitudesCV, setSolicitudesCV] = useState([]);
  const [filtroSolicitud, setFiltroSolicitud] = useState('pendiente');
  const [cargSolicitudes, setCargSolicitudes] = useState(false);
  const [rechazoModal, setRechazoModal] = useState(null);
  const [editarDatosModal, setEditarDatosModal] = useState(null);
  const [mensajeModal, setMensajeModal] = useState(null);
  const [cvPreviewUrl, setCvPreviewUrl] = useState(null);
  const [enviandoMsgCv, setEnviandoMsgCv] = useState(false);

  // Auditoría
  const [auditoria, setAuditoria] = useState([]);
  const [cargAuditoria, setCargAuditoria] = useState(false);
  const [filtroAuditoria, setFiltroAuditoria] = useState('todas');

  // Config
  const [config, setConfig] = useState({ aprobacion_auto_perfiles: false, aprobacion_auto_cv: false });

  // Stats solicitudes
  const [statsSolicitudes, setStatsSolicitudes] = useState(null);

  // Bienvenida masiva
  const [enviandoBienvenida, setEnviandoBienvenida] = useState(false);
  const [bienvenidaResult, setBienvenidaResult] = useState(null);

  // Carga inicial
  useEffect(() => {
    setCargando(true);
    Promise.all([
      adminAPI.stats().catch(() => null),
      adminAPI.usuarios().catch(() => []),
      cargarConfig(),
      cargarStatsSolicitudes(),
    ])
      .then(([s, us, cfg, statsSol]) => {
        if (s) setStats(s);
        setUsuarios(us);
        setConfig(cfg);
        setStatsSolicitudes(statsSol);
      })
      .catch(e => {
        console.error('Error cargando admin:', e);
        setError(e.message);
      })
      .finally(() => setCargando(false));
  }, []);

  async function cargarConfig() {
    try {
      const data = await fetchAPI('/admin/config');
      return {
        aprobacion_auto_perfiles: data.aprobacionAutoPerfiles ?? false,
        aprobacion_auto_cv: data.aprobacionAutoCV ?? false,
      };
    } catch {
      return { aprobacion_auto_perfiles: false, aprobacion_auto_cv: false };
    }
  }

  async function cargarStatsSolicitudes() {
    try {
      return await fetchAPI('/admin/solicitudes-stats');
    } catch {
      return null;
    }
  }

  async function toggleConfig(clave, valor) {
    setConfig(p => ({ ...p, [clave]: valor }));
    try {
      await fetchAPI('/admin/config', { method: 'PATCH', body: JSON.stringify({ clave, valor }) });
    } catch (e) {
      setConfig(p => ({ ...p, [clave]: !valor }));
      setError(e.message);
    }
  }

  // Cargar ofertas cuando se abre el tab
  useEffect(() => {
    if (tab !== 'ofertas' || ofertas.length > 0) return;
    adminAPI.todasOfertas()
      .then(setOfertas)
      .catch(e => setError(e.message));
  }, [tab]);

  // Cargar auditoría cuando se abre el tab
  useEffect(() => {
    if (tab !== 'auditoria') return;
    setCargAuditoria(true);
    const filtros = {};
    if (filtroAuditoria !== 'todas') filtros.entidad = filtroAuditoria;
    adminAPI.auditoria(filtros)
      .then(setAuditoria)
      .catch(e => setError(e.message))
      .finally(() => setCargAuditoria(false));
  }, [tab, filtroAuditoria]);

  // Cargar solicitudes cuando se abre el tab
  useEffect(() => {
    if (tab !== 'solicitudes-perfil' && tab !== 'solicitudes-cv') return;
    setCargSolicitudes(true);
    const endpoint = tab === 'solicitudes-perfil' ? '/admin/solicitudes-perfil' : '/admin/solicitudes-cv';
    fetchAPI(`${endpoint}?estado=${filtroSolicitud}`)
      .then(data => {
        if (tab === 'solicitudes-perfil') setSolicitudesPerfil(data);
        else setSolicitudesCV(data);
      })
      .catch(e => setError(e.message))
      .finally(() => setCargSolicitudes(false));
  }, [tab, filtroSolicitud]);

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

  async function aprobarPerfil(id, datosEditados, mensaje) {
    try {
      const body = {};
      if (datosEditados) body.datos_editados = datosEditados;
      if (mensaje) body.mensaje = mensaje;
      await fetchAPI(`/admin/solicitudes-perfil/${id}/aprobar`, { method: 'PATCH', body: JSON.stringify(body) });
      setSolicitudesPerfil(p => p.filter(s => s._id !== id));
      setStatsSolicitudes(await cargarStatsSolicitudes());
    } catch(e) { setError(e.message); }
  }

  async function aprobarCV(id) {
    try {
      await fetchAPI(`/admin/solicitudes-cv/${id}/aprobar`, { method: 'PATCH' });
      setSolicitudesCV(p => p.filter(s => s._id !== id));
      setStatsSolicitudes(await cargarStatsSolicitudes());
    } catch(e) { setError(e.message); }
  }

  async function rechazarPerfil(id, motivo, mensaje) {
    try {
      const body = { motivo };
      if (mensaje) body.mensaje = mensaje;
      await fetchAPI(`/admin/solicitudes-perfil/${id}/rechazar`, { method: 'PATCH', body: JSON.stringify(body) });
      setSolicitudesPerfil(p => p.filter(s => s._id !== id));
      setRechazoModal(null);
      setStatsSolicitudes(await cargarStatsSolicitudes());
      // Notificar al frontend del estudiante para que recargue sus datos aprobados
      window.dispatchEvent(new Event('perfil-solicitud-rechazada'));
    } catch(e) { setError(e.message); }
  }

  async function rechazarCV(id, motivo) {
    try {
      await fetchAPI(`/admin/solicitudes-cv/${id}/rechazar`, { method: 'PATCH', body: JSON.stringify({ motivo }) });
      setSolicitudesCV(p => p.filter(s => s._id !== id));
      setRechazoModal(null);
      setStatsSolicitudes(await cargarStatsSolicitudes());
    } catch(e) { setError(e.message); }
  }

  async function enviarMensajeDesdeSolicitud(solicitud) {
    if (!solicitud?.usuario_id?._id || enviandoMsgCv) return;
    setEnviandoMsgCv(true);
    try {
      const { mensajesAPI } = await import('../api');
      const conv = await mensajesAPI.iniciar(solicitud.usuario_id._id);
      const msgTexto = `📋 Mensaje enviado desde: Solicitud CV\n\nHola ${solicitud.usuario_id?.nombre}, te contacto respecto a tu solicitud de currículum.`;
      await mensajesAPI.enviar(conv._id, { texto: msgTexto });
      window.dispatchEvent(new Event('recargar-mensajes-no-leidos'));
      window.dispatchEvent(new Event('recargar-conversaciones'));
      window.location.href = '/mensajes';
    } catch(e) {
      setError(e.message);
    } finally {
      setEnviandoMsgCv(false);
    }
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
            <p className="admin-sub">Bienvenido, {usuario?.nombre}. Gestiona usuarios, ofertas y solicitudes de la plataforma.</p>
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
            {statsSolicitudes && (
              <div className="admin-stat-card" style={{borderLeft:'3px solid var(--naranja)'}}>
                <span className="admin-stat-n" style={{color:'var(--naranja)'}}>{statsSolicitudes.perfilesPendientes + statsSolicitudes.cvsPendientes}</span>
                <span className="admin-stat-l">Solicitudes pendientes</span>
              </div>
            )}
          </div>
        )}

        <div className="admin-tabs">
          {TABS.map(([id,lbl])=>(
            <button key={id} className={`admin-tab ${tab===id?'active':''}`} onClick={()=>setTab(id)}>
              {lbl}
              {id === 'solicitudes-perfil' && statsSolicitudes?.perfilesPendientes > 0 && (
                <span className="admin-tab-badge">{statsSolicitudes.perfilesPendientes}</span>
              )}
              {id === 'solicitudes-cv' && statsSolicitudes?.cvsPendientes > 0 && (
                <span className="admin-tab-badge">{statsSolicitudes.cvsPendientes}</span>
              )}
            </button>
          ))}
        </div>

        {/* DASHBOARD */}
        {tab==='dashboard' && (
          <div className="admin-seccion">
            <div className="admin-dashboard-grid">
              <div className="card admin-dash-card">
                <h3>Solicitudes de perfil</h3>
                <div className="admin-dash-stats">
                  <div className="dash-stat pending">
                    <span className="dash-stat-num">{statsSolicitudes?.perfilesPendientes ?? 0}</span>
                    <span className="dash-stat-label">Pendientes</span>
                  </div>
                  <div className="dash-stat approved">
                    <span className="dash-stat-num">{statsSolicitudes?.perfilesAprobados ?? 0}</span>
                    <span className="dash-stat-label">Aprobadas</span>
                  </div>
                  <div className="dash-stat rejected">
                    <span className="dash-stat-num">{statsSolicitudes?.perfilesRechazados ?? 0}</span>
                    <span className="dash-stat-label">Rechazadas</span>
                  </div>
                </div>
                <button className="btn-secondary btn-dash-ir" onClick={() => setTab('solicitudes-perfil')}>Ver solicitudes →</button>
              </div>
              <div className="card admin-dash-card">
                <h3>Solicitudes de CV</h3>
                <div className="admin-dash-stats">
                  <div className="dash-stat pending">
                    <span className="dash-stat-num">{statsSolicitudes?.cvsPendientes ?? 0}</span>
                    <span className="dash-stat-label">Pendientes</span>
                  </div>
                  <div className="dash-stat approved">
                    <span className="dash-stat-num">{statsSolicitudes?.cvsAprobados ?? 0}</span>
                    <span className="dash-stat-label">Aprobados</span>
                  </div>
                  <div className="dash-stat rejected">
                    <span className="dash-stat-num">{statsSolicitudes?.cvsRechazados ?? 0}</span>
                    <span className="dash-stat-label">Rechazados</span>
                  </div>
                </div>
                <button className="btn-secondary btn-dash-ir" onClick={() => setTab('solicitudes-cv')}>Ver solicitudes →</button>
              </div>
              <div className="card admin-dash-card">
                <h3>Configuración rápida</h3>
                <div className="admin-dash-config">
                  <ToggleSwitch
                    label="Auto-aprobar perfiles"
                    activo={config.aprobacion_auto_perfiles}
                    onChange={v => toggleConfig('aprobacion_auto_perfiles', v)}
                  />
                  <ToggleSwitch
                    label="Auto-aprobar CV"
                    activo={config.aprobacion_auto_cv}
                    onChange={v => toggleConfig('aprobacion_auto_cv', v)}
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* SOLICITUDES DE PERFIL */}
        {tab==='solicitudes-perfil' && (
          <div className="admin-seccion">
            <div className="admin-toolbar">
              <span style={{fontSize:13,color:'var(--gris-2)'}}>Filtrar por estado:</span>
              <div className="admin-filter-chips">
                {[['pendiente','Pendientes'],['aprobada','Aprobadas'],['rechazada','Rechazadas'],['todas','Todas']].map(([v,l])=>(
                  <button key={v} className={`admin-chip ${filtroSolicitud===v?'on':''}`} onClick={()=>setFiltroSolicitud(v)}>{l}</button>
                ))}
              </div>
            </div>
            {cargSolicitudes && <EmptyState msg="Cargando solicitudes..." />}
            {!cargSolicitudes && solicitudesPerfil.length === 0 && <EmptyState msg="No hay solicitudes de perfil." />}
            {!cargSolicitudes && solicitudesPerfil.length > 0 && (
              <div className="solicitudes-grid">
                {solicitudesPerfil.map(s => (
                  <div key={s._id} className={`solicitud-card card ${s.estado}`}>
                    <div className="solicitud-header">
                      <div className="solicitud-user">
                        <div className="solicitud-avatar">{s.usuario_id?.nombre?.[0] ?? '?'}</div>
                        <div>
                          <p className="solicitud-nombre">{s.usuario_id?.nombre} {s.usuario_id?.apellido}</p>
                          <p className="solicitud-email">{s.usuario_id?.email}</p>
                        </div>
                      </div>
                      <span className={`badge ${s.estado==='pendiente'?'badge-naranja':s.estado==='aprobada'?'badge-verde':'badge-rojo'}`}>
                        {s.estado === 'pendiente' ? 'Pendiente' : s.estado === 'aprobada' ? 'Aprobada' : 'Rechazada'}
                      </span>
                    </div>
                    <div className="solicitud-body">
                      <p className="solicitud-tipo">{s.tipo === 'creacion' ? '🆕 Creación de perfil' : '✏️ Modificación de perfil'} · <span className="solicitud-rol">{s.rol}</span></p>
                      <div className="solicitud-datos">
                        {Object.entries(s.datos_solicitados || {}).map(([k, v]) => (
                          <div key={k} className="solicitud-dato">
                            <span className="solicitud-dato-label">{k}:</span>
                            <span className="solicitud-dato-val">{typeof v === 'object' ? JSON.stringify(v) : String(v)}</span>
                          </div>
                        ))}
                      </div>
                      {s.motivo_rechazo && (
                        <p className="solicitud-motivo">Motivo: {s.motivo_rechazo}</p>
                      )}
                      <p className="solicitud-fecha">Solicitado el {new Date(s.creado_en).toLocaleDateString('es-CL')}</p>
                    </div>
                    {s.estado === 'pendiente' && (
                      <div className="solicitud-acciones">
                        <button className="btn-aprobar" onClick={() => aprobarPerfil(s._id)}>
                          <IcoCheck /> Aprobar
                        </button>
                        <button className="btn-editar-datos" onClick={() => setEditarDatosModal({ tipo: 'perfil', id: s._id, solicitud: s })}>
                          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                          Editar y aprobar
                        </button>
                        <button className="btn-rechazar" onClick={() => setRechazoModal({ tipo: 'perfil', id: s._id })}>
                          <IcoX /> Rechazar
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* SOLICITUDES DE CV */}
        {tab==='solicitudes-cv' && (
          <div className="admin-seccion">
            <div className="admin-toolbar">
              <span style={{fontSize:13,color:'var(--gris-2)'}}>Filtrar por estado:</span>
              <div className="admin-filter-chips">
                {[['pendiente','Pendientes'],['aprobada','Aprobadas'],['rechazada','Rechazadas'],['todas','Todas']].map(([v,l])=>(
                  <button key={v} className={`admin-chip ${filtroSolicitud===v?'on':''}`} onClick={()=>setFiltroSolicitud(v)}>{l}</button>
                ))}
              </div>
            </div>
            {cargSolicitudes && <EmptyState msg="Cargando solicitudes..." />}
            {!cargSolicitudes && solicitudesCV.length === 0 && <EmptyState msg="No hay solicitudes de CV." />}
            {!cargSolicitudes && solicitudesCV.length > 0 && (
              <div className="solicitudes-grid">
                {solicitudesCV.map(s => (
                  <div key={s._id} className={`solicitud-card card ${s.estado}`}>
                    <div className="solicitud-header">
                      <div className="solicitud-user">
                        <div className="solicitud-avatar">{s.usuario_id?.nombre?.[0] ?? '?'}</div>
                        <div>
                          <p className="solicitud-nombre">{s.usuario_id?.nombre} {s.usuario_id?.apellido}</p>
                          <p className="solicitud-email">{s.usuario_id?.email}</p>
                        </div>
                      </div>
                      <span className={`badge ${s.estado==='pendiente'?'badge-naranja':s.estado==='aprobada'?'badge-verde':'badge-rojo'}`}>
                        {s.estado === 'pendiente' ? 'Pendiente' : s.estado === 'aprobada' ? 'Aprobado' : 'Rechazado'}
                      </span>
                    </div>
                    <div className="solicitud-body">
                      <p className="solicitud-tipo">📄 Curriculum Vitae</p>
                      {s.curriculum_url && (
                        <button className="solicitud-cv-link btn-ver-cv" onClick={() => setCvPreviewUrl(s.curriculum_url)}>
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
                          Ver CV
                        </button>
                      )}
                      {s.motivo_rechazo && (
                        <p className="solicitud-motivo">Motivo: {s.motivo_rechazo}</p>
                      )}
                      <p className="solicitud-fecha">Solicitado el {new Date(s.creado_en).toLocaleDateString('es-CL')}</p>
                    </div>
                    {s.estado === 'pendiente' && (
                      <div className="solicitud-acciones">
                        <button className="btn-aprobar" onClick={() => aprobarCV(s._id)}>
                          <IcoCheck /> Aprobar
                        </button>
                        <button className="btn-rechazar" onClick={() => setRechazoModal({ tipo: 'cv', id: s._id })}>
                          <IcoX /> Rechazar
                        </button>
                        <button className="btn-mensaje-solicitud" onClick={() => enviarMensajeDesdeSolicitud(s)} disabled={enviandoMsgCv}>
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
                          {enviandoMsgCv ? 'Enviando...' : 'Enviar mensaje'}
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* AUDITORÍA */}
        {tab==='auditoria' && (
          <div className="admin-seccion">
            <div className="admin-toolbar">
              <span style={{fontSize:13,color:'var(--gris-2)'}}>Filtrar por entidad:</span>
              <div className="admin-filter-chips">
                {[['todas','Todas'],['usuario','Usuarios'],['solicitud_perfil','Perfiles'],['solicitud_cv','CVs'],['config','Configuración']].map(([v,l])=>(
                  <button key={v} className={`admin-chip ${filtroAuditoria===v?'on':''}`} onClick={()=>setFiltroAuditoria(v)}>{l}</button>
                ))}
              </div>
            </div>
            {cargAuditoria && <EmptyState msg="Cargando registros..." />}
            {!cargAuditoria && auditoria.length === 0 && <EmptyState msg="No hay registros de auditoría." />}
            {!cargAuditoria && auditoria.length > 0 && (
              <div className="admin-tabla">
                <div className="admin-tabla-header">
                  <span>Fecha</span><span>Admin</span><span>Acción</span><span>Usuario</span><span>Cambios</span>
                </div>
                {auditoria.map(log => {
                  const esModPerfil = log.accion === 'modificar_perfil';
                  let textoCambios = log.detalles?.resumen || log.detalles?.motivo || log.entidad_id || '';
                  if (esModPerfil && log.detalles?.cambios && !log.detalles?.resumen) {
                    textoCambios = Object.entries(log.detalles.cambios)
                      .map(([campo, val]) => `${campo}: "${val.antes}" → "${val.despues}"`)
                      .join('; ');
                  }
                  return (
                    <div key={log._id} className="admin-tabla-fila">
                      <span className="admin-td-sm">{new Date(log.creado_en).toLocaleString('es-CL')}</span>
                      <span className="admin-user-nombre" style={{fontSize:13}}>{log.admin_id?.nombre} {log.admin_id?.apellido}</span>
                      <span className={`badge ${log.accion==='aprobar'||log.accion==='activar'?'badge-verde':log.accion==='rechazar'||log.accion==='eliminar'||log.accion==='desactivar'?'badge-rojo':esModPerfil?'badge-naranja':'badge-azul'}`}>
                        {esModPerfil ? 'Editar perfil' : log.accion.replace(/_/g, ' ')}
                      </span>
                      <span className="admin-td-sm" style={{fontSize:13}}>{log.detalles?.usuario || log.detalles?.clave || log.entidad_id}</span>
                      <span className="admin-td-sm" style={{maxWidth:400,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap',fontSize:12,color:'var(--texto-2)'}} title={textoCambios || JSON.stringify(log.detalles)}>
                        {textoCambios}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* USUARIOS */}
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

        {/* OFERTAS */}
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

        {/* ESTADÍSTICAS */}
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

      {rechazoModal && (
        <RechazoModal
          onConfirm={(motivo, mensaje) => {
            if (rechazoModal.tipo === 'perfil') rechazarPerfil(rechazoModal.id, motivo, mensaje);
            else rechazarCV(rechazoModal.id, motivo);
          }}
          onCancel={() => setRechazoModal(null)}
        />
      )}

      {editarDatosModal && (
        <EditarDatosModal
          solicitud={editarDatosModal.solicitud}
          onConfirm={(datosEditados, mensaje) => {
            aprobarPerfil(editarDatosModal.id, datosEditados, mensaje);
            setEditarDatosModal(null);
          }}
          onCancel={() => setEditarDatosModal(null)}
        />
      )}

      {cvPreviewUrl && (
        <div className="cv-fullscreen-overlay" onClick={() => setCvPreviewUrl(null)}>
          <div className="cv-fullscreen-content" onClick={e => e.stopPropagation()}>
            <div className="cv-fullscreen-header">
              <h3>Vista previa del Currículum</h3>
              <button className="cv-fullscreen-close" onClick={() => setCvPreviewUrl(null)}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
            </div>
            <div className="cv-fullscreen-body">
              <iframe src={`http://localhost:5000${cvPreviewUrl}`} title="Vista previa del CV" />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
