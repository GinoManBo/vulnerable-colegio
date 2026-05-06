import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { perfilAPI, mensajesAPI } from '../api';
import './MiPerfil.css';

export default function PerfilPublico({ usuario }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const [datos, setDatos] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');
  const [ofertasActivas, setOfertasActivas] = useState([]);
  const [enviandoMsg, setEnviandoMsg] = useState(false);
  const [verificado, setVerificado] = useState(true);

  useEffect(() => {
    async function cargarPerfil() {
      try {
        const res = await perfilAPI.obtener(id);
        const perfil = res.perfil || {};
        setVerificado(res.verificado ?? true);
        setDatos({
          nombre: res.nombre || '',
          apellido: res.apellido || '',
          email: res.email || '',
          rol: res.rol,
          especialidad: perfil.especialidad || '',
          descripcion: perfil.descripcion || '',
          ciudad: perfil.ciudad || '',
          telefono: perfil.telefono || '',
          linkedin: perfil.linkedin || '',
          nombre_empresa: perfil.nombre_empresa || '',
          rubro: perfil.rubro || '',
          sitio_web: perfil.sitio_web || '',
          region: perfil.region || '',
          foto: perfil.foto_perfil_url || perfil.logo_url || null,
          destrezas: perfil.destrezas || [],
          intereses: perfil.intereses || [],
          usuario_id: res._id,
        });

        // Si es empresa, cargar ofertas activas
        if (res.rol === 'empresa') {
          const ofertas = await perfilAPI.ofertasEmpresa(id);
          setOfertasActivas(ofertas || []);
        }
      } catch (err) {
        setError(err.message);
      } finally {
        setCargando(false);
      }
    }
    cargarPerfil();
  }, [id]);

  async function enviarMensaje() {
    if (!datos?.usuario_id || enviandoMsg) return;
    setEnviandoMsg(true);
    try {
      const conv = await mensajesAPI.iniciar(datos.usuario_id);
      window.dispatchEvent(new Event('recargar-mensajes-no-leidos'));
      window.dispatchEvent(new Event('recargar-conversaciones'));
      navigate('/mensajes', { state: { convId: conv._id } });
    } catch (err) {
      setError(err.message);
    } finally {
      setEnviandoMsg(false);
    }
  }

  if (cargando) return (
    <div style={{display:'flex',alignItems:'center',justifyContent:'center',minHeight:'60vh'}}>
      <div style={{width:36,height:36,border:'3px solid var(--azul-light)',borderTopColor:'var(--azul)',borderRadius:'50%',animation:'spin .8s linear infinite'}}/>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );

  if (error || !datos) return (
    <div className="miperfil-page">
      <div style={{textAlign:'center',padding:'60px 20px'}}>
        <p style={{color:'var(--rojo)',marginBottom:12}}>{error || 'Perfil no encontrado'}</p>
        <Link to="/" className="btn-secondary">Volver al inicio</Link>
      </div>
    </div>
  );

  const esEmpresa = datos.rol === 'empresa';
  const itemsCompletitud = esEmpresa
    ? [
        { label: 'Logo de empresa', done: !!datos.foto },
        { label: 'Descripción', done: !!datos.descripcion },
        { label: 'Rubro', done: !!datos.rubro },
        { label: 'Teléfono', done: !!datos.telefono },
        { label: 'Ciudad', done: !!datos.ciudad },
        { label: 'Sitio web', done: !!datos.sitio_web },
      ]
    : [
        { label: 'Foto de perfil', done: !!datos.foto },
        { label: 'Descripción', done: !!datos.descripcion },
        { label: 'Al menos 3 destrezas', done: datos.destrezas.length >= 3 },
        { label: 'Intereses laborales', done: datos.intereses.length > 0 },
      ];

  const completitudPct = Math.round(
    (itemsCompletitud.filter(i => i.done).length / itemsCompletitud.length) * 100
  );

  return (
    <div className="miperfil-page">
      <div className="miperfil-inner">
        <div className="miperfil-main">
          <div className="card miperfil-header-card">
            <div className="miperfil-cover" />
            <div className="miperfil-header-body">
              <div className="miperfil-avatar-wrap">
                <div className="miperfil-avatar">
                  {datos.foto
                    ? <img src={datos.foto} alt="foto perfil" />
                    : <span>{esEmpresa ? datos.nombre_empresa[0] : `${datos.nombre[0]}${datos.apellido[0]}`}</span>
                  }
                </div>
              </div>
              <div className="miperfil-header-info">
                <div className="miperfil-nombre-wrap">
                  <h1 className="miperfil-nombre">{esEmpresa ? datos.nombre_empresa : `${datos.nombre} ${datos.apellido}`}</h1>
                  <span className="badge badge-verde">{esEmpresa ? 'Empresa' : 'Estudiante'}</span>
                  {verificado
                    ? <span className="badge badge-verif"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>Verificado</span>
                    : <span className="badge badge-pendiente"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>No verificado</span>
                  }
                </div>
                <p className="miperfil-especialidad">{esEmpresa ? (datos.rubro || datos.nombre_empresa) : datos.especialidad}</p>
                <div className="miperfil-meta">
                  {datos.ciudad && <span><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>{datos.ciudad}</span>}
                  {datos.email && <span><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>{datos.email}</span>}
                </div>
                {verificado && (
                  <button className="btn-mensaje" onClick={enviarMensaje} disabled={enviandoMsg}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
                    </svg>
                    {enviandoMsg ? 'Abriendo chat...' : 'Enviar mensaje'}
                  </button>
                )}
                {!verificado && (
                  <p className="perfil-pendiente-aviso">Este perfil está pendiente de verificación.</p>
                )}
              </div>
            </div>
          </div>

          <div className="card edit-card">
            <h2 className="section-title">{esEmpresa ? 'Sobre la empresa' : 'Sobre mí'}</h2>
            <p className="sobre-mi-txt">{datos.descripcion || 'Sin descripción'}</p>
            {esEmpresa ? (
              <div className="contacto-grid">
                {datos.telefono && <div className="contacto-item"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--gris-2)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12a19.5 19.5 0 0 1-3.07-8.67A2 2 0 0 1 3.56 1h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 8.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/></svg><span>{datos.telefono}</span></div>}
                {datos.email && <div className="contacto-item"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--gris-2)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg><span>{datos.email}</span></div>}
                {datos.sitio_web && <div className="contacto-item"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--gris-2)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg><span>{datos.sitio_web}</span></div>}
              </div>
            ) : (
              <div className="contacto-grid">
                {datos.telefono && <div className="contacto-item"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--gris-2)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12a19.5 19.5 0 0 1-3.07-8.67A2 2 0 0 1 3.56 1h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 8.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/></svg><span>{datos.telefono}</span></div>}
                {datos.email && <div className="contacto-item"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--gris-2)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg><span>{datos.email}</span></div>}
                {datos.linkedin && <div className="contacto-item"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--gris-2)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"/><rect x="2" y="9" width="4" height="12"/><circle cx="4" cy="4" r="2"/></svg><span>{datos.linkedin}</span></div>}
              </div>
            )}
          </div>

          {!esEmpresa && datos.destrezas.length > 0 && (
            <div className="card edit-card">
              <h2 className="section-title">Destrezas técnicas</h2>
              <div className="tags-wrap">
                {datos.destrezas.map(d => (
                  <span key={d} className="tag-editable">{d}</span>
                ))}
              </div>
            </div>
          )}

          {!esEmpresa && datos.intereses.length > 0 && (
            <div className="card edit-card">
              <h2 className="section-title">Intereses laborales</h2>
              <div className="tags-wrap">
                {datos.intereses.map(i => (
                  <span key={i} className="tag-editable interes">{i}</span>
                ))}
              </div>
            </div>
          )}

          {esEmpresa && ofertasActivas.length > 0 && (
            <div className="card edit-card">
              <h2 className="section-title">Convocatorias vigentes</h2>
              <p className="section-subtitle">Ofertas activas disponibles para postulación</p>
              <div className="historial-lista">
                {ofertasActivas.map(o => (
                  <div key={o._id} className="historial-item">
                    <div className="historial-item-top">
                      <div>
                        <p className="historial-titulo">{o.titulo}</p>
                        <p className="historial-empresa">{o.ubicacion} · {o.modalidad} · Publicada el {new Date(o.publicado_en || o.creado_en).toLocaleDateString('es-CL')}</p>
                      </div>
                      <span className="badge badge-verde">Activa</span>
                    </div>
                    <p className="historial-comentario">{o.descripcion?.substring(0, 150)}{o.descripcion?.length > 150 ? '...' : ''}</p>
                    <div style={{ marginTop: '8px' }}>
                      <Link to={`/oferta/${o._id}`} className="btn-ir-a">Ver oferta</Link>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <aside className="miperfil-aside">
          <div className="card aside-card">
            <h3 className="aside-title">Resumen</h3>
            <div className="aside-stat-list">
              {esEmpresa ? (
                <>
                  <div className="aside-stat">
                    <span className="aside-stat-n">{datos.rubro || '—'}</span>
                    <span className="aside-stat-l">Rubro</span>
                  </div>
                  <div className="aside-stat">
                    <span className="aside-stat-n">{datos.ciudad || '—'}</span>
                    <span className="aside-stat-l">Ubicación</span>
                  </div>
                  <div className="aside-stat">
                    <span className="aside-stat-n">{datos.sitio_web || '—'}</span>
                    <span className="aside-stat-l">Sitio web</span>
                  </div>
                </>
              ) : (
                <>
                  <div className="aside-stat">
                    <span className="aside-stat-n">{datos.especialidad || '—'}</span>
                    <span className="aside-stat-l">Especialidad</span>
                  </div>
                  <div className="aside-stat">
                    <span className="aside-stat-n">{datos.ciudad || '—'}</span>
                    <span className="aside-stat-l">Ubicación</span>
                  </div>
                  <div className="aside-stat">
                    <span className="aside-stat-n">{datos.destrezas.length}</span>
                    <span className="aside-stat-l">Destrezas registradas</span>
                  </div>
                </>
              )}
            </div>
          </div>
          {datos.usuario_id === usuario?._id && (
            <div className="card aside-card">
              <h3 className="aside-title">Completitud del perfil</h3>
              <div className="completitud-wrap">
                <div className="completitud-bar-bg">
                  <div className="completitud-bar-fill" style={{ width: `${completitudPct}%` }} />
                </div>
                <span className="completitud-pct">{completitudPct}%</span>
              </div>
              <ul className="completitud-items">
                {itemsCompletitud.map(i => (
                  <li key={i.label} className={`compl-item ${i.done ? 'done' : ''}`}>
                    {i.done
                      ? <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="var(--verde)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                      : <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="var(--gris-2)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/></svg>
                    }
                    {i.label}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}
