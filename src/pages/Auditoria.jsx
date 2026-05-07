import { useState, useEffect } from 'react';
import { adminAPI } from '../api';
import './Auditoria.css';

function IcoClipboard() { return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><rect x="8" y="2" width="8" height="4" rx="1" ry="1"/></svg>; }

function accionLabel(accion) {
  const map = {
    crear: 'Crear', modificar: 'Modificar', eliminar: 'Eliminar',
    aprobar: 'Aprobar', rechazar: 'Rechazar', activar: 'Activar',
    desactivar: 'Desactivar', cambiar_config: 'Cambiar config',
  };
  return map[accion] || accion;
}

function accionColor(accion) {
  if (['aprobar', 'activar'].includes(accion)) return 'verde';
  if (['rechazar', 'eliminar', 'desactivar'].includes(accion)) return 'rojo';
  if (accion === 'cambiar_config') return 'naranja';
  return 'azul';
}

function entidadLabel(entidad) {
  const map = {
    usuario: 'Usuario', perfil_estudiante: 'Perfil Estudiante',
    perfil_empresa: 'Perfil Empresa', oferta: 'Oferta',
    solicitud_perfil: 'Solicitud Perfil', solicitud_cv: 'Solicitud CV',
    config: 'Configuración',
  };
  return map[entidad] || entidad;
}

function renderDetalles(log) {
  const etiquetas = {
    nombre:'Nombre', apellido:'Apellido', descripcion:'Descripción',
    especialidad:'Especialidad', ciudad:'Ciudad', telefono:'Teléfono',
    linkedin:'LinkedIn', intereses:'Intereses', destrezas:'Destrezas',
    nombre_empresa:'Nombre empresa', rubro:'Rubro', sitio_web:'Sitio web',
    region:'Región',
  };
  const d = log.detalles || {};
  if (d.cambios && Object.keys(d.cambios).length > 0) {
    return (
      <div className="auditoria-cambios-lista">
        {Object.entries(d.cambios)
          .filter(([_, val]) => String(val.antes) !== String(val.despues))
          .map(([campo, val]) => (
          <div key={campo} className="auditoria-cambio-item">
            <span className="auditoria-campo-label">{etiquetas[campo] || campo}</span>
            <span className="auditoria-cambio-valor">
              <span className="auditoria-antes">{val.antes}</span>
              <span className="auditoria-flecha">→</span>
              <span className="auditoria-despues">{val.despues}</span>
            </span>
          </div>
        ))}
      </div>
    );
  }
  if (d.usuario && d.resumen) return <span><strong>{d.usuario}</strong> — {d.resumen}</span>;
  if (d.usuario) return <span>{d.usuario}</span>;
  if (d.resumen) return <span>{d.resumen}</span>;
  if (d.clave) return <span>{d.clave}: {JSON.stringify(d.valor_nuevo)}</span>;
  if (d.email) return <span>{d.email}</span>;
  return <span>ID: {log.entidad_id?.slice(-6)}</span>;
}

export default function Auditoria({ usuario }) {
  const [logs, setLogs] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [filtroEntidad, setFiltroEntidad] = useState('todas');
  const [filtroAccion, setFiltroAccion] = useState('todas');

  useEffect(() => {
    cargarLogs();
  }, [filtroEntidad, filtroAccion]);

  async function cargarLogs() {
    setCargando(true);
    try {
      const filtros = {};
      if (filtroEntidad !== 'todas') filtros.entidad = filtroEntidad;
      if (filtroAccion !== 'todas') filtros.accion = filtroAccion;
      const data = await adminAPI.auditoria(filtros);
      setLogs(data);
    } catch {
      setLogs([]);
    } finally {
      setCargando(false);
    }
  }

  const entidades = ['todas', 'usuario', 'perfil_estudiante', 'perfil_empresa', 'oferta', 'solicitud_perfil', 'solicitud_cv', 'config'];
  const acciones = ['todas', 'crear', 'modificar', 'eliminar', 'aprobar', 'rechazar', 'activar', 'desactivar', 'cambiar_config'];

  if (cargando) return (
    <div style={{display:'flex',alignItems:'center',justifyContent:'center',minHeight:'60vh'}}>
      <div style={{width:36,height:36,border:'3px solid var(--azul-light)',borderTopColor:'var(--azul)',borderRadius:'50%',animation:'spin .8s linear infinite'}}/>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );

  return (
    <div className="auditoria-page">
      <div className="auditoria-inner">
        <div className="auditoria-top">
          <div className="auditoria-ico">
            <IcoClipboard />
          </div>
          <div>
            <h1 className="auditoria-titulo">Registro de auditoría</h1>
            <p className="auditoria-sub">Historial de acciones realizadas por administradores en la plataforma.</p>
          </div>
        </div>

        <div className="auditoria-filtros">
          <div className="auditoria-filtro-grupo">
            <span className="auditoria-filtro-label">Entidad:</span>
            <div className="auditoria-chips">
              {entidades.map(v => (
                <button key={v} className={`auditoria-chip ${filtroEntidad===v?'on':''}`} onClick={()=>setFiltroEntidad(v)}>
                  {entidadLabel(v)}
                </button>
              ))}
            </div>
          </div>
          <div className="auditoria-filtro-grupo">
            <span className="auditoria-filtro-label">Acción:</span>
            <div className="auditoria-chips">
              {acciones.map(v => (
                <button key={v} className={`auditoria-chip ${filtroAccion===v?'on':''}`} onClick={()=>setFiltroAccion(v)}>
                  {accionLabel(v)}
                </button>
              ))}
            </div>
          </div>
        </div>

        {logs.length === 0 ? (
          <div className="auditoria-vacio">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="var(--gris-borde)" strokeWidth="1.5" strokeLinecap="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
            <p>No se encontraron registros</p>
          </div>
        ) : (
          <div className="auditoria-timeline">
            {logs.map(log => (
              <div key={log._id} className="auditoria-card">
                <div className="auditoria-card-line" />
                <div className="auditoria-card-dot" />
                <div className="auditoria-card-body">
                  <div className="auditoria-card-header">
                    <span className={`auditoria-badge auditoria-badge-${accionColor(log.accion)}`}>
                      {accionLabel(log.accion)}
                    </span>
                    <span className="auditoria-entidad">{entidadLabel(log.entidad)}</span>
                  </div>
                  <div className="auditoria-card-info">
                    <div className="auditoria-admin">
                      <div className="auditoria-admin-avatar">
                        {log.admin_id?.nombre?.[0] ?? '?'}
                      </div>
                      <div>
                        <p className="auditoria-admin-nombre">{log.admin_id?.nombre} {log.admin_id?.apellido}</p>
                        <p className="auditoria-admin-email">{log.admin_id?.email}</p>
                      </div>
                    </div>
                    <div className="auditoria-detalles">
                      {renderDetalles(log)}
                    </div>
                  </div>
                  <p className="auditoria-fecha">{new Date(log.creado_en).toLocaleString('es-CL')}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
