import { useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import './MiPerfil.css';

const MOCK_TRABAJOS = [
  { id: 1, titulo: 'Técnico electricista', empresa: 'Industrias CMPC', fecha: 'Mar 2024 – Jun 2024', puntuacion: 6.5, comentario: 'Excelente trabajo, muy puntual y responsable. Se recomienda sin dudas.' },
  { id: 2, titulo: 'Soporte eléctrico', empresa: 'Constructora Sur', fecha: 'Ago 2023 – Oct 2023', puntuacion: 6.0, comentario: 'Buen desempeño, cumplió con todas las tareas asignadas en el tiempo esperado.' },
  { id: 3, titulo: 'Práctica profesional', empresa: 'TechChile S.A.',  fecha: 'Ene 2023 – Mar 2023', puntuacion: 7.0, comentario: 'Destacado. Superó las expectativas del equipo técnico. Se adaptó muy rápido.' },
];

const DESTREZAS_SUGERIDAS = ['AutoCAD', 'SolidWorks', 'PLC Siemens', 'PLC Schneider', 'Arduino', 'Python', 'CCNA', 'Linux', 'Neumática', 'Hidráulica', 'Mantenimiento preventivo', 'Lectura de planos'];

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

export default function MiPerfil() {
  const [editando, setEditando] = useState(false);
  const [foto, setFoto] = useState(null);
  const [fotoPreview, setFotoPreview] = useState(null);
  const fileRef = useRef(null);

  const [datos, setDatos] = useState({
    nombre: 'Juan Manuel Gino',
    apellido: 'Monsálvez',
    especialidad: 'Electricidad industrial',
    descripcion: 'Egresada del Instituto Técnico Bío-Bío, especialidad eléctrica. Busco mi primera experiencia laboral formal en el área industrial. Me apasiona la automatización y el mantenimiento preventivo.',
    ciudad: 'Concepción',
    telefono: '+56 9 8165 1087',
    email: 'ginomonsalvez@gmail.com',
    linkedin: 'linkedin.com/in/ginomonsalvez',
  });
  const [tmp, setTmp] = useState({ ...datos });

  const [destrezas, setDestrezas] = useState(['Electricidad', 'PLC Siemens', 'AutoCAD', 'Mantenimiento preventivo']);
  const [intereses, setIntereses] = useState(['Automatización', 'Industria minera', 'Energía renovable']);
  const [nuevaDestreza, setNuevaDestreza] = useState('');
  const [nuevoInteres, setNuevoInteres] = useState('');
  const [curriculum, setCurriculum] = useState(null);

  const promedioCalif = MOCK_TRABAJOS.reduce((s, t) => s + t.puntuacion, 0) / MOCK_TRABAJOS.length;

  function handleFoto(e) {
    const file = e.target.files[0];
    if (!file) return;
    setFoto(file);
    setFotoPreview(URL.createObjectURL(file));
  }

  function handleCurriculum(e) {
    const file = e.target.files[0];
    if (file) setCurriculum(file.name);
  }

  function guardar() {
    setDatos({ ...tmp });
    setEditando(false);
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

  return (
    <div className="miperfil-page">
      <div className="miperfil-inner">

        <div className="miperfil-main">

          <div className="card miperfil-header-card">
            <div className="miperfil-cover" />
            <div className="miperfil-header-body">
              <div className="miperfil-avatar-wrap">
                <div className="miperfil-avatar">
                  {fotoPreview
                    ? <img src={fotoPreview} alt="foto perfil" />
                    : <span>{datos.nombre[0]}{datos.apellido[0]}</span>
                  }
                </div>
                {editando && (
                  <>
                    <button className="avatar-upload-btn" onClick={() => fileRef.current.click()} title="Cambiar foto">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></svg>
                    </button>
                    <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleFoto} />
                  </>
                )}
              </div>
              <div className="miperfil-header-info">
                <div className="miperfil-nombre-wrap">
                  <h1 className="miperfil-nombre">{datos.nombre} {datos.apellido}</h1>
                  <span className="badge badge-verde">Estudiante</span>
                </div>
                <p className="miperfil-especialidad">{datos.especialidad}</p>
                <div className="miperfil-meta">
                  <span><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>{datos.ciudad}</span>
                  <span><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>{datos.email}</span>
                </div>
              </div>
              <div className="miperfil-header-actions">
                {editando ? (
                  <>
                    <button className="btn-primary" onClick={guardar}>Guardar cambios</button>
                    <button className="btn-secondary" onClick={() => { setEditando(false); setTmp({ ...datos }); }}>Cancelar</button>
                  </>
                ) : (
                  <button className="btn-secondary" onClick={() => setEditando(true)}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                    Editar perfil
                  </button>
                )}
              </div>
            </div>
          </div>

          {editando ? (
            <div className="card edit-card">
              <h2 className="section-title">Información personal</h2>
              <div className="edit-grid">
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
              </div>
              <div className="curriculum-upload">
                <label>Currículum (PDF)</label>
                <div className="cv-drop" onClick={() => document.getElementById('cv-input').click()}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--gris-2)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
                  <span>{curriculum ? curriculum : 'Haz clic para subir tu CV'}</span>
                  <span className="cv-hint">PDF, máx. 5 MB</span>
                  <input id="cv-input" type="file" accept=".pdf" style={{ display: 'none' }} onChange={handleCurriculum} />
                </div>
              </div>
            </div>
          ) : (
            <div className="card edit-card">
              <h2 className="section-title">Sobre mí</h2>
              <p className="sobre-mi-txt">{datos.descripcion}</p>
              <div className="contacto-grid">
                <div className="contacto-item"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--gris-2)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.56 1h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 8.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/></svg><span>{datos.telefono}</span></div>
                <div className="contacto-item"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--gris-2)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg><span>{datos.email}</span></div>
                <div className="contacto-item"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--gris-2)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"/><rect x="2" y="9" width="4" height="12"/><circle cx="4" cy="4" r="2"/></svg><span>{datos.linkedin}</span></div>
              </div>
              {curriculum && (
                <div className="cv-chip">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
                  {curriculum}
                </div>
              )}
            </div>
          )}

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

          <div className="card edit-card">
            <div className="historial-header">
              <h2 className="section-title">Historial de trabajos</h2>
              <div className="promedio-chip">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--verde)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
                Promedio {promedioCalif.toFixed(1)}/7
              </div>
            </div>
            <div className="historial-lista">
              {MOCK_TRABAJOS.map(t => (
                <div key={t.id} className="historial-item">
                  <div className="historial-item-top">
                    <div>
                      <p className="historial-titulo">{t.titulo}</p>
                      <p className="historial-empresa">{t.empresa} · {t.fecha}</p>
                    </div>
                    <EstrellaFill valor={t.puntuacion} />
                  </div>
                  <p className="historial-comentario">"{t.comentario}"</p>
                </div>
              ))}
            </div>
          </div>

        </div>

        <aside className="miperfil-aside">
          <div className="card aside-card">
            <h3 className="aside-title">Resumen</h3>
            <div className="aside-stat-list">
              <div className="aside-stat">
                <span className="aside-stat-n">{MOCK_TRABAJOS.length}</span>
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
            </div>
          </div>
          <div className="card aside-card">
            <h3 className="aside-title">Completitud del perfil</h3>
            <div className="completitud-wrap">
              <div className="completitud-bar-bg">
                <div className="completitud-bar-fill" style={{ width: '78%' }} />
              </div>
              <span className="completitud-pct">78%</span>
            </div>
            <ul className="completitud-items">
              {[
                { label: 'Foto de perfil', done: !!fotoPreview },
                { label: 'Descripción', done: !!datos.descripcion },
                { label: 'Currículum subido', done: !!curriculum },
                { label: 'Al menos 3 destrezas', done: destrezas.length >= 3 },
                { label: 'Intereses laborales', done: intereses.length > 0 },
              ].map(i => (
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
    </div>
  );
}
