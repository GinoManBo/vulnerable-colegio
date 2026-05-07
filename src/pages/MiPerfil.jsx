import { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { perfilAPI, ofertasAPI, fetchAPI, historialAPI } from '../api.js';
import OnlineStatus from '../components/OnlineStatus';
import './MiPerfil.css';

const DESTREZAS_SUGERIDAS = ['AutoCAD', 'Arduino', 'Python', 'Linux', 'Neumática', 'Hidráulica', 'Mantenimiento preventivo', 'Lectura de planos'];

function EstrellaFill({ valor }) {
  const pct = ((valor / 7) * 100).toFixed(1);
  const color = valor >= 6 ? '#1DB67A' : valor >= 4 ? '#F97316' : '#EF4444';
  return (
    <div className="perfil-stars" title={`${valor.toFixed(1)} / 7`}>
      <div className="stars-track"><div className="stars-fill" style={{ width: `${pct}%`, background: color }} /></div>
      <span className="stars-val" style={{ color }}>{valor.toFixed(1)}<span className="stars-de">/7</span></span>
    </div>
  );
}

export default function MiPerfil({ usuario }) {
  const esEmpresa = usuario?.rol === 'empresa';
  const [editando, setEditando] = useState(false);
  const [foto, setFoto] = useState(null);
  const [fotoPreview, setFotoPreview] = useState(null);
  const [loading, setLoading] = useState(true);
  const fileRef = useRef(null);
  const cvRef = useRef(null);

  const [datos, setDatos] = useState({
    nombre: usuario?.nombre || '',
    apellido: usuario?.apellido || '',
    especialidad: '',
    descripcion: '',
    ciudad: '',
    telefono: '',
    email: usuario?.email || '',
    linkedin: '',
    nombre_empresa: '',
    rubro: '',
    sitio_web: '',
    region: '',
  });
  const [tmp, setTmp] = useState({ ...datos });
  const [datosAprobados, setDatosAprobados] = useState(null);

  const [destrezas, setDestrezas] = useState([]);
  const [intereses, setIntereses] = useState([]);
  const [nuevaDestreza, setNuevaDestreza] = useState('');
  const [nuevoInteres, setNuevoInteres] = useState('');
  const [curriculum, setCurriculum] = useState(null);
  const [cvUrl, setCvUrl] = useState(null);
  const [cvPreview, setCvPreview] = useState(null);
  const [perfilPendiente, setPerfilPendiente] = useState(false);
  const [solicitudPendiente, setSolicitudPendiente] = useState(null);
  const [solicitudRechazada, setSolicitudRechazada] = useState(null);
  const [subiendoCv, setSubiendoCv] = useState(false);
  const [eliminarCv, setEliminarCv] = useState(false);
  const [destrezasOrig, setDestrezasOrig] = useState([]);
  const [interesesOrig, setInteresesOrig] = useState([]);

  const [historialTrabajo, setHistorialTrabajo] = useState([]);
  const [cargandoHistorial, setCargandoHistorial] = useState(false);

  const promedioCalif = historialTrabajo.length > 0
    ? historialTrabajo.reduce((sum, h) => sum + (h.nota_empresa || 0), 0) / historialTrabajo.length
    : 0;

  // Estados para empresa
  const [ofertasEmpresa, setOfertasEmpresa] = useState([]);
  const [ofertasActivas, setOfertasActivas] = useState([]);
  const [cargandoOfertas, setCargandoOfertas] = useState(false);
  const [mostrarTodas, setMostrarTodas] = useState(false);

  // Cargar ofertas si es empresa
  useEffect(() => {
    if (!esEmpresa || !usuario) return;
    cargarOfertasEmpresa();
  }, [esEmpresa, usuario]);

  function cargarOfertasEmpresa() {
    setCargandoOfertas(true);
    ofertasAPI.misOfertas()
      .then(ofertas => {
        const todas = ofertas || [];
        setOfertasEmpresa(todas);
        const activas = todas.filter(o => o.activo !== false);
        setOfertasActivas(activas);
      })
      .catch(() => {})
      .finally(() => setCargandoOfertas(false));
  }

  // Escuchar evento para recargar ofertas
  useEffect(() => {
    function handleRecargar() {
      cargarOfertasEmpresa();
    }
    window.addEventListener('actualizar-ofertas-empresa', handleRecargar);
    return () => window.removeEventListener('actualizar-ofertas-empresa', handleRecargar);
  });

  // Cargar datos del perfil desde la API
  useEffect(() => {
    if (!usuario) return;
    
    perfilAPI.me()
      .then(res => {
        const perfil = res.perfil || {};
        const datosCompletos = {
          nombre: res.nombre || usuario.nombre,
          apellido: res.apellido || usuario.apellido,
          especialidad: perfil.especialidad || '',
          descripcion: perfil.descripcion || '',
          ciudad: perfil.ciudad || '',
          telefono: perfil.telefono || '',
          email: res.email || usuario.email,
          linkedin: perfil.linkedin || '',
          nombre_empresa: perfil.nombre_empresa || '',
          rubro: perfil.rubro || '',
          sitio_web: perfil.sitio_web || '',
          region: perfil.region || '',
        };
        setDatos(datosCompletos);
        setDatosAprobados(datosCompletos);
        setTmp(datosCompletos);
        setDestrezas(perfil.destrezas || []);
        setIntereses(perfil.intereses || []);
        setFotoPreview(perfil.foto_perfil_url || perfil.logo_url || null);
        if (perfil.curriculum_url) {
          setCvUrl(perfil.curriculum_url);
          setCvPreview(`http://localhost:5000${perfil.curriculum_url}`);
          setCurriculum('curriculum.pdf');
        }
        setPerfilPendiente(res.perfilPendiente || false);
        setLoading(false);
      })
      .catch(err => {
        setLoading(false);
      });
  }, [usuario]);

  // Cargar historial de trabajo para estudiantes
  useEffect(() => {
    if (esEmpresa || !usuario) return;
    setCargandoHistorial(true);
    perfilAPI.historialTrabajo(usuario._id)
      .then(h => setHistorialTrabajo(h || []))
      .catch(() => {})
      .finally(() => setCargandoHistorial(false));
  }, [usuario, esEmpresa]);

  // Escuchar cuando el admin rechaza una solicitud de perfil → recargar datos aprobados
  useEffect(() => {
    function handleRechazo() {
      if (!usuario) return;
      perfilAPI.me()
        .then(res => {
          const perfil = res.perfil || {};
          const datosCompletos = {
            nombre: res.nombre || usuario.nombre,
            apellido: res.apellido || usuario.apellido,
            especialidad: perfil.especialidad || '',
            descripcion: perfil.descripcion || '',
            ciudad: perfil.ciudad || '',
            telefono: perfil.telefono || '',
            email: res.email || usuario.email,
            linkedin: perfil.linkedin || '',
            nombre_empresa: perfil.nombre_empresa || '',
            rubro: perfil.rubro || '',
            sitio_web: perfil.sitio_web || '',
            region: perfil.region || '',
          };
          setDatos(datosCompletos);
          setDatosAprobados(datosCompletos);
          setTmp(datosCompletos);
          setDestrezas(perfil.destrezas || []);
          setIntereses(perfil.intereses || []);
          setFotoPreview(perfil.foto_perfil_url || perfil.logo_url || null);
          setPerfilPendiente(false);
        })
        .catch(() => {});
    }
    window.addEventListener('perfil-solicitud-rechazada', handleRechazo);
    return () => window.removeEventListener('perfil-solicitud-rechazada', handleRechazo);
  }, [usuario]);

  // Calcular porcentaje de completitud según el rol
  const itemsCompletitud = esEmpresa
    ? [
        { label: 'Logo de empresa', done: !!fotoPreview },
        { label: 'Descripción', done: !!datos.descripcion },
        { label: 'Rubro', done: !!datos.rubro },
        { label: 'Teléfono', done: !!datos.telefono },
        { label: 'Ciudad', done: !!datos.ciudad },
        { label: 'Sitio web', done: !!datos.sitio_web },
      ]
    : [
        { label: 'Foto de perfil', done: !!fotoPreview },
        { label: 'Descripción', done: !!datos.descripcion },
        { label: 'Currículum subido', done: !!curriculum },
        { label: 'Al menos 3 destrezas', done: destrezas.length >= 3 },
        { label: 'Intereses laborales', done: intereses.length > 0 },
      ];

  const completitudPct = Math.round(
    (itemsCompletitud.filter(i => i.done).length / itemsCompletitud.length) * 100
  );

  function handleFoto(e) {
    const file = e.target.files[0];
    if (!file) return;
    setFoto(file);
    setFotoPreview(URL.createObjectURL(file));
  }

  function handleCurriculum(e) {
    const file = e.target.files[0];
    if (!file) return;
    if (file.type !== 'application/pdf') {
      alert('Solo se permiten archivos PDF');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      alert('El archivo no debe superar los 5 MB');
      return;
    }
    setSubiendoCv(true);
    const formData = new FormData();
    formData.append('cv', file);

    fetch('http://localhost:5000/api/perfil/cv', {
      method: 'POST',
      headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      body: formData,
    })
      .then(res => res.json())
      .then(data => {
        if (data.ok) {
          setCvUrl(data.cvUrl);
          setCvPreview(`http://localhost:5000${data.cvUrl}`);
          setCurriculum(file.name);
          if (data.pendiente) setPerfilPendiente(true);
        } else {
          alert(data.error || 'Error al subir el CV');
        }
      })
      .catch(() => alert('Error al subir el CV'))
      .finally(() => setSubiendoCv(false));
  }

  function guardar() {
    if (!usuario) return;

    const camposTexto = esEmpresa
      ? ['nombre_empresa','descripcion','rubro','ciudad','region','telefono','sitio_web']
      : ['nombre','apellido','descripcion','especialidad','ciudad','telefono','linkedin'];

    const hayCambiosTexto = camposTexto.some(k => tmp[k] !== datos[k]);
    const hayCambiosDestrezas = JSON.stringify(destrezas) !== JSON.stringify(destrezasOrig);
    const hayCambiosIntereses = JSON.stringify(intereses) !== JSON.stringify(interesesOrig);
    const hayCambiosCv = eliminarCv && curriculum;

    if (!hayCambiosTexto && !hayCambiosDestrezas && !hayCambiosIntereses && !hayCambiosCv) {
      setEditando(false);
      setTmp({ ...datos });
      setDestrezas([...destrezasOrig]);
      setIntereses([...interesesOrig]);
      setEliminarCv(false);
      return;
    }

    const payload = esEmpresa
      ? {
          nombre_empresa: tmp.nombre_empresa,
          descripcion: tmp.descripcion,
          rubro: tmp.rubro,
          ciudad: tmp.ciudad,
          region: tmp.region,
          telefono: tmp.telefono,
          sitio_web: tmp.sitio_web,
        }
      : {
          nombre: tmp.nombre,
          apellido: tmp.apellido,
          descripcion: tmp.descripcion,
          especialidad: tmp.especialidad,
          ciudad: tmp.ciudad,
          telefono: tmp.telefono,
          linkedin: tmp.linkedin,
          ...(destrezas.length && { destrezas: JSON.stringify(destrezas) }),
          ...(intereses.length && { intereses: JSON.stringify(intereses) }),
        };

    setLoading(true);

    if (eliminarCv && curriculum) {
      perfilAPI.eliminarCv()
        .then(() => {
          setCvUrl(null);
          setCvPreview(null);
          setCurriculum(null);
          setEliminarCv(false);
          continuarGuardado(payload);
        })
        .catch(() => continuarGuardado(payload));
    } else {
      continuarGuardado(payload);
    }
  }

  function continuarGuardado(payload) {
    perfilAPI.actualizar(payload)
      .then((res) => {
        setEditando(false);
        setLoading(false);
        if (res?.pendiente) {
          setPerfilPendiente(true);
          if (datosAprobados) {
            setDatos(datosAprobados);
            setTmp(datosAprobados);
          }
        } else {
          setDatos({ ...tmp });
          setDatosAprobados({ ...tmp });
        }
      })
      .catch(err => {
        setLoading(false);
      });
  }

  function addDestreza(val) {
    const v = (val ?? nuevaDestreza).trim();
    if (v && !destrezas.includes(v)) setDestrezas(p => [...p, v]);
    setNuevaDestreza('');
  }

  function addInteres() {
    const v = nuevoInteres.trim();
    if (v && !intereses.includes(v)) setIntereses(p => [...p, v]);
    setNuevoInteres('');
  }

  // Preset o Premade 

  return (
    <div className="miperfil-page">
      {loading ? (
        <div style={{ padding: '40px 24px', textAlign: 'center' }}>Cargando perfil...</div>
      ) : (
      <div className="miperfil-inner">

        <div className="miperfil-main">

          {perfilPendiente && (
            <div className="perfil-pendiente-banner">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--naranja)" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
              <div>
                <p className="perfil-pendiente-banner-title">Perfil pendiente de verificación</p>
                <p className="perfil-pendiente-banner-text">Tu perfil está siendo revisado por un administrador. Los cambios no serán visibles públicamente hasta que sea aprobado.</p>
              </div>
            </div>
          )}

          {solicitudRechazada && (
            <div className="perfil-rechazado-banner">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--rojo)" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>
              <div>
                <p className="perfil-rechazado-banner-title">Solicitud de modificación rechazada</p>
                <p className="perfil-rechazado-banner-text">Tu última solicitud de cambio fue rechazada. Motivo: {solicitudRechazada.motivo_rechazo}</p>
                <p className="perfil-rechazado-banner-text">Tu perfil se mantiene con los datos aprobados anteriormente.</p>
              </div>
              <button className="btn-cerrar-banner" onClick={() => setSolicitudRechazada(null)}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
            </div>
          )}

          <div className="card miperfil-header-card">
            <div className="miperfil-cover" />
            <div className="miperfil-header-body">
              <div className="miperfil-avatar-wrap">
                <div className="miperfil-avatar">
                  {fotoPreview
                    ? <img src={fotoPreview} alt="foto perfil" />
                    : <span>{esEmpresa ? datos.nombre_empresa[0] : `${datos.nombre[0]}${datos.apellido[0]}`}</span>
                  }
                </div>
                {editando && (
                  <>
                    <button className="avatar-upload-btn" onClick={() => fileRef.current?.click()} title="Cambiar foto">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></svg>
                    </button>
                    <input ref={fileRef} type="file" accept="image/*" style={{ position: 'absolute', width: 0, height: 0, opacity: 0, pointerEvents: 'none' }} onChange={handleFoto} />
                  </>
                )}
              </div>
              <div className="miperfil-header-info">
                <div className="miperfil-nombre-wrap">
                  <h1 className="miperfil-nombre">{esEmpresa ? datos.nombre_empresa : `${datos.nombre} ${datos.apellido}`}</h1>
                  <span className="badge badge-verde">{esEmpresa ? 'Empresa' : usuario?.rol === 'admin' ? 'Administrador' : 'Estudiante'}</span>
                </div>
                <p className="miperfil-especialidad">{esEmpresa ? (datos.rubro || datos.nombre_empresa) : datos.especialidad}</p>
                <div className="miperfil-meta">
                  <span><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>{datos.ciudad}</span>
                  <span><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>{datos.email}</span>
                </div>
              </div>
              <div className="miperfil-header-actions">
                {editando ? (
                  <>
                    <button className="btn-primary" onClick={guardar}>Guardar cambios</button>
                    <button className="btn-secondary" onClick={() => { setEditando(false); setTmp({ ...datos }); setDestrezas(destrezasOrig); setIntereses(interesesOrig); setEliminarCv(false); }}>Cancelar</button>
                  </>
                ) : (
                  <button className="btn-secondary" onClick={() => { setEditando(true); setDestrezasOrig([...destrezas]); setInteresesOrig([...intereses]); setEliminarCv(false); }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                    Editar perfil
                  </button>
                )}
              </div>
            </div>
          </div>

          {editando ? (
            <div className="card edit-card">
              <h2 className="section-title">{esEmpresa ? 'Información de la empresa' : 'Información personal'}</h2>
              <div className="edit-grid">
                {esEmpresa ? (
                  <>
                    <div className="form-group">
                      <label>Nombre de la empresa</label>
                      <input value={tmp.nombre_empresa} onChange={e => setTmp(p => ({ ...p, nombre_empresa: e.target.value }))} />
                    </div>
                    <div className="form-group">
                      <label>Rubro</label>
                      <input value={tmp.rubro} onChange={e => setTmp(p => ({ ...p, rubro: e.target.value }))} placeholder="Ej: Construcción, TI, Minería" />
                    </div>
                    <div className="form-group">
                      <label>Ciudad</label>
                      <input value={tmp.ciudad} onChange={e => setTmp(p => ({ ...p, ciudad: e.target.value }))} />
                    </div>
                    <div className="form-group">
                      <label>Región</label>
                      <input value={tmp.region} onChange={e => setTmp(p => ({ ...p, region: e.target.value }))} />
                    </div>
                    <div className="form-group">
                      <label>Teléfono</label>
                      <input value={tmp.telefono} onChange={e => setTmp(p => ({ ...p, telefono: e.target.value }))} />
                    </div>
                    <div className="form-group">
                      <label>Sitio web</label>
                      <input value={tmp.sitio_web} onChange={e => setTmp(p => ({ ...p, sitio_web: e.target.value }))} placeholder="https://..." />
                    </div>
                    <div className="form-group full">
                      <label>Descripción de la empresa</label>
                      <textarea rows={4} value={tmp.descripcion} onChange={e => setTmp(p => ({ ...p, descripcion: e.target.value }))} />
                    </div>
                  </>
                ) : (
                  <>
                    <div className="form-group">
                      <label>Nombre</label>
                      <input value={tmp.nombre} onChange={e => setTmp(p => ({ ...p, nombre: e.target.value }))} />
                    </div>
                    <div className="form-group">
                      <label>Apellido</label>
                      <input value={tmp.apellido} onChange={e => setTmp(p => ({ ...p, apellido: e.target.value }))} />
                    </div>
                    <div className="form-group">
                      <label>Especialidad</label>
                      <select value={tmp.especialidad} onChange={e => setTmp(p => ({ ...p, especialidad: e.target.value }))}>
                        <option>Electricidad industrial</option>
                        <option>Mecatrónica</option>
                        <option>Redes y comunicaciones</option>
                        <option>Automatización y PLC</option>
                        <option>Construcción</option>
                      </select>
                    </div>
                    <div className="form-group">
                      <label>Ciudad</label>
                      <input value={tmp.ciudad} onChange={e => setTmp(p => ({ ...p, ciudad: e.target.value }))} />
                    </div>
                    <div className="form-group">
                      <label>Teléfono</label>
                      <input value={tmp.telefono} onChange={e => setTmp(p => ({ ...p, telefono: e.target.value }))} />
                    </div>
                    <div className="form-group">
                      <label>LinkedIn</label>
                      <input value={tmp.linkedin} onChange={e => setTmp(p => ({ ...p, linkedin: e.target.value }))} />
                    </div>
                    <div className="form-group full">
                      <label>Descripción / sobre mí</label>
                      <textarea rows={4} value={tmp.descripcion} onChange={e => setTmp(p => ({ ...p, descripcion: e.target.value }))} />
                    </div>
                  </>
                )}
              </div>
              {!esEmpresa && (
                <div className="curriculum-upload">
                  <label>Currículum (PDF)</label>
                  <div className="cv-drop" onClick={() => cvRef.current?.click()}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--gris-2)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
                    <span>{curriculum ? curriculum : 'Haz clic para subir tu CV'}</span>
                    <span className="cv-hint">PDF, máx. 5 MB</span>
                  </div>
                  <input ref={cvRef} type="file" accept=".pdf" style={{ position: 'absolute', width: 0, height: 0, opacity: 0, pointerEvents: 'none' }} onChange={handleCurriculum} />
                  {curriculum && !eliminarCv && (
                    <label className="cv-delete-check">
                      <input type="checkbox" checked={eliminarCv} onChange={e => setEliminarCv(e.target.checked)} />
                      <span>Eliminar currículum actual</span>
                    </label>
                  )}
                </div>
              )}
            </div>
          ) : (
            <div className="card edit-card">
              <h2 className="section-title">{esEmpresa ? 'Sobre la empresa' : 'Sobre mí'}</h2>
              <p className="sobre-mi-txt">{datos.descripcion || (esEmpresa ? 'Sin descripción' : 'Sin descripción')}</p>
              {esEmpresa ? (
                <div className="contacto-grid">
                  {datos.telefono && <div className="contacto-item"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--gris-2)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12a19.5 19.5 0 0 1-3.07-8.67A2 2 0 0 1 3.56 1h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 8.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/></svg><span>{datos.telefono}</span></div>}
                  {datos.email && <div className="contacto-item"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--gris-2)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg><span>{datos.email}</span></div>}
                  {datos.sitio_web && <div className="contacto-item"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--gris-2)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg><span>{datos.sitio_web}</span></div>}
                </div>
              ) : (
                <div className="contacto-grid">
                  <div className="contacto-item"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--gris-2)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12a19.5 19.5 0 0 1-3.07-8.67A2 2 0 0 1 3.56 1h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 8.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/></svg><span>{datos.telefono}</span></div>
                  <div className="contacto-item"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--gris-2)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg><span>{datos.email}</span></div>
                  <div className="contacto-item"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--gris-2)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"/><rect x="2" y="9" width="4" height="12"/><circle cx="4" cy="4" r="2"/></svg><span>{datos.linkedin}</span></div>
                </div>
              )}
              {!esEmpresa && curriculum && (
                <div className="cv-chip">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
                  {curriculum}
                </div>
              )}
              {!esEmpresa && cvPreview && (
                <div className="cv-preview-wrap">
                  <h3 className="cv-preview-title">Vista previa del currículum</h3>
                  <div className="cv-pdf-container">
                    <iframe src={cvPreview} className="cv-pdf-frame" title="Vista previa del CV" />
                  </div>
                </div>
              )}
            </div>
          )}

          {!esEmpresa && (
          <div className="card edit-card">
            <h2 className="section-title">Destrezas técnicas</h2>
            <div className="tags-wrap">
              {destrezas.map(d => (
                <span key={d} className="tag-editable">
                  {d}
                  {editando && <button onClick={() => setDestrezas(p => p.filter(x => x !== d))}>×</button>}
                </span>
              ))}
            </div>
            {editando && (
              <>
                <div className="tag-input-row">
                  <input placeholder="Agregar destreza..." value={nuevaDestreza} onChange={e => setNuevaDestreza(e.target.value)} onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addDestreza())} />
                  <button className="btn-primary" onClick={() => addDestreza()}>Agregar</button>
                </div>
                <div className="sugeridas-wrap">
                  <p className="sugeridas-label">Sugeridas:</p>
                  <div className="sugeridas-chips">
                    {DESTREZAS_SUGERIDAS.filter(s => !destrezas.includes(s)).slice(0, 6).map(s => (
                      <button key={s} className="sugerida-chip" onClick={() => addDestreza(s)}>+ {s}</button>
                    ))}
                  </div>
                </div>
              </>
            )}
            <div className="section-sep" />
            <h2 className="section-title">Intereses laborales</h2>
            <div className="tags-wrap">
              {intereses.map(i => (
                <span key={i} className="tag-editable interes">
                  {i}
                  {editando && <button onClick={() => setIntereses(p => p.filter(x => x !== i))}>×</button>}
                </span>
              ))}
            </div>
            {editando && (
              <div className="tag-input-row">
                <input placeholder="Agregar interés laboral..." value={nuevoInteres} onChange={e => setNuevoInteres(e.target.value)} onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addInteres())} />
                <button className="btn-primary" onClick={addInteres}>Agregar</button>
              </div>
            )}
          </div>
          )}

          {!esEmpresa && (
          <div className="card edit-card">
            <div className="historial-header">
              <h2 className="section-title">Historial de trabajos</h2>
              <div className="promedio-chip">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--verde)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
                Promedio {promedioCalif.toFixed(1)}/7
              </div>
            </div>
            <div className="historial-lista">
              {cargandoHistorial ? (
                <p className="empty-state">Cargando historial...</p>
              ) : historialTrabajo.length === 0 ? (
                <p className="empty-state">Aún no tienes trabajos completados</p>
              ) : historialTrabajo.map(h => (
                <div key={h._id} className="historial-item">
                  <div className="historial-item-top">
                    <div>
                      <p className="historial-titulo">{h.empleo_id?.titulo || 'Trabajo'}</p>
                      <p className="historial-empresa">{h.empresa_id?.nombre_empresa || 'Empresa'} · {h.fecha_fin ? new Date(h.fecha_fin).toLocaleDateString('es-CL') : 'En curso'}</p>
                    </div>
                    {h.nota_empresa ? <EstrellaFill valor={h.nota_empresa} /> : <span className="badge badge-gris">Sin valoración</span>}
                  </div>
                  {h.feedback_empresa && <p className="historial-comentario">"{h.feedback_empresa}"</p>}
                </div>
              ))}
            </div>
          </div>
          )}

          {esEmpresa && (
          <>
          <div className="card edit-card">
            <h2 className="section-title">Convocatorias vigentes</h2>
            <p className="section-subtitle">Ofertas activas disponibles para postulación</p>
            {cargandoOfertas ? (
              <p className="empty-state">Cargando...</p>
            ) : ofertasActivas.length === 0 ? (
              <p className="empty-state">No hay ofertas activas actualmente</p>
            ) : (
              <>
                <div className="historial-lista">
                  {(mostrarTodas ? ofertasActivas : ofertasActivas.slice(0, 3)).map(o => (
                    <div key={o._id} className="historial-item">
                      <div className="historial-item-top">
                        <div>
                          <p className="historial-titulo">{o.titulo}</p>
                          <p className="historial-empresa">{o.ubicacion} · {o.modalidad} · Publicada el {new Date(o.publicado_en || o.creado_en).toLocaleDateString('es-CL')}</p>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '6px' }}>
                          <span className="badge badge-verde">Activa</span>
                          <Link to={`/oferta/${o._id}`} className="btn-ir-a">Ir a</Link>
                        </div>
                      </div>
                      <p className="historial-comentario">{o.descripcion?.substring(0, 150)}{o.descripcion?.length > 150 ? '...' : ''}</p>
                    </div>
                  ))}
                </div>
                {ofertasActivas.length > 3 && (
                  <button className="btn-mostrar-mas" onClick={() => setMostrarTodas(prev => !prev)}>
                    {mostrarTodas ? 'Mostrar menos' : `Mostrar más (${ofertasActivas.length - 3} adicionales)`}
                  </button>
                )}
              </>
            )}
          </div>
          </>
          )}

        </div>

        <aside className="miperfil-aside">
          <div className="card aside-card">
            <h3 className="aside-title">Resumen</h3>
            <div className="aside-stat-list">
              {esEmpresa ? (
                <>
                  <div className="aside-stat">
                    <span className="aside-stat-n">{ofertasEmpresa.length}</span>
                    <span className="aside-stat-l">Ofertas publicadas</span>
                  </div>
                  <div className="aside-stat">
                    <span className="aside-stat-n" style={{ color: 'var(--verde)' }}>{ofertasActivas.length}</span>
                    <span className="aside-stat-l">Convocatorias vigentes</span>
                  </div>
                </>
              ) : (
                <>
                  <div className="aside-stat">
                    <span className="aside-stat-n">{historialTrabajo.filter(h => h.estado === 'completado').length}</span>
                    <span className="aside-stat-l">Trabajos completados</span>
                  </div>
                  <div className="aside-stat">
                    <span className="aside-stat-n" style={{ color: 'var(--verde)' }}>{promedioCalif.toFixed(1)}</span>
                    <span className="aside-stat-l">Calificación promedio</span>
                  </div>
                  <div className="aside-stat">
                    <span className="aside-stat-n">{destrezas.length}</span>
                    <span className="aside-stat-l">Destrezas registradas</span>
                  </div>
                </>
              )}
            </div>
          </div>
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
          <div className="card aside-card">
            <h3 className="aside-title">Accesos rápidos</h3>
            <div className="accesos-lista">
              <Link to="/" className="acceso-item">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></svg>
                Ver ofertas de trabajo
              </Link>
              <Link to="/mensajes" className="acceso-item">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
                Mis mensajes
              </Link>
              <Link to="/configuracion" className="acceso-item">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06-.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>
                Configuración
              </Link>
            </div>
          </div>
        </aside>
      </div>
      )}
    </div>
  );
}
