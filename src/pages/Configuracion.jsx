import { useState } from 'react';
import './Configuracion.css';

const SECCIONES = [
  { id: 'cuenta',          label: 'Cuenta',           ico: 'M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2 M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z' },
  { id: 'notificaciones',  label: 'Notificaciones',   ico: 'M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9 M13.73 21a2 2 0 0 1-3.46 0' },
  { id: 'privacidad',      label: 'Privacidad',        ico: 'M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z' },
  { id: 'seguridad',       label: 'Seguridad',         ico: 'M12 1l3.09 6.26L22 8.27l-5 4.87 1.18 6.88L12 16.77l-6.18 3.25L7 13.14 2 8.27l6.91-1.01L12 1z' },
  { id: 'apariencia',      label: 'Apariencia',        ico: 'M12 20h9 M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z' },
  { id: 'cuenta-peligro',  label: 'Zona de peligro',   ico: 'M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z M12 9v4 M12 17h.01' },
];

function Toggle({ value, onChange }) {
  return (
    <button
      className={`toggle ${value ? 'on' : ''}`}
      onClick={() => onChange(!value)}
      role="switch"
      aria-checked={value}
    >
      <span className="toggle-thumb" />
    </button>
  );
}

function SeccionCuenta() {
  const [form, setForm] = useState({ nombre: 'Gino', apellido: 'Monsálvez', email: 'ginomonsalvez@gmail.com', telefono: '+56 9 8165 1087' });
  const [saved, setSaved] = useState(false);
  function guardar(e) { e.preventDefault(); setSaved(true); setTimeout(() => setSaved(false), 2000); }
  return (
    <div className="config-seccion">
      <div className="config-sec-header">
        <h2>Información de la cuenta</h2>
        <p>Actualiza tus datos personales básicos</p>
      </div>
      <form onSubmit={guardar}>
        <div className="config-grid">
          <div className="config-field">
            <label>Nombre</label>
            <input value={form.nombre} onChange={e => setForm(p => ({ ...p, nombre: e.target.value }))} />
          </div>
          <div className="config-field">
            <label>Apellido</label>
            <input value={form.apellido} onChange={e => setForm(p => ({ ...p, apellido: e.target.value }))} />
          </div>
          <div className="config-field">
            <label>Correo electrónico</label>
            <input type="email" value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))} />
          </div>
          <div className="config-field">
            <label>Teléfono</label>
            <input value={form.telefono} onChange={e => setForm(p => ({ ...p, telefono: e.target.value }))} />
          </div>
        </div>
        <div className="config-actions">
          <button type="submit" className={`btn-primary ${saved ? 'saved' : ''}`}>
            {saved ? (
              <><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg> Guardado</>
            ) : 'Guardar cambios'}
          </button>
        </div>
      </form>
    </div>
  );
}

function SeccionNotificaciones() {
  const [cfg, setCfg] = useState({
    nuevas_ofertas:    true,
    mensajes:          true,
    postulaciones:     true,
    recordatorios:     false,
    novedades:         false,
    email_resumen:     true,
    email_mensajes:    true,
    email_marketing:   false,
  });
  const upd = (k) => setCfg(p => ({ ...p, [k]: !p[k] }));
  const Row = ({ k, label, sub }) => (
    <div className="notif-row">
      <div>
        <p className="notif-row-label">{label}</p>
        {sub && <p className="notif-row-sub">{sub}</p>}
      </div>
      <Toggle value={cfg[k]} onChange={() => upd(k)} />
    </div>
  );
  return (
    <div className="config-seccion">
      <div className="config-sec-header"><h2>Notificaciones</h2><p>Controla qué notificaciones recibes en la plataforma y por correo</p></div>
      <div className="config-grupo">
        <p className="config-grupo-label">En la plataforma</p>
        <Row k="nuevas_ofertas" label="Nuevas ofertas de trabajo" sub="Cuando se publiquen ofertas que coincidan con tu perfil" />
        <Row k="mensajes" label="Mensajes nuevos" sub="Cuando alguien te envíe un mensaje directo" />
        <Row k="postulaciones" label="Cambios en postulaciones" sub="Aceptaciones, rechazos y actualizaciones de estado" />
        <Row k="recordatorios" label="Recordatorios" sub="Cuando una oferta esté por vencer" />
        <Row k="novedades" label="Novedades de la plataforma" sub="Nuevas funcionalidades y anuncios" />
      </div>
      <div className="config-grupo">
        <p className="config-grupo-label">Por correo electrónico</p>
        <Row k="email_resumen" label="Resumen semanal" sub="Ofertas y actividad resumida cada semana" />
        <Row k="email_mensajes" label="Mensajes no leídos" sub="Si tienes mensajes sin leer por más de 24 horas" />
        <Row k="email_marketing" label="Comunicaciones promocionales" sub="Noticias y campañas de ConectaTec" />
      </div>
    </div>
  );
}

function SeccionPrivacidad() {
  const [cfg, setCfg] = useState({ perfil_publico: true, mostrar_email: false, mostrar_telefono: false, busqueda_google: false, compartir_estadisticas: true });
  const upd = k => setCfg(p => ({ ...p, [k]: !p[k] }));
  const Row = ({ k, label, sub }) => (
    <div className="notif-row">
      <div>
        <p className="notif-row-label">{label}</p>
        {sub && <p className="notif-row-sub">{sub}</p>}
      </div>
      <Toggle value={cfg[k]} onChange={() => upd(k)} />
    </div>
  );
  return (
    <div className="config-seccion">
      <div className="config-sec-header"><h2>Privacidad</h2><p>Controla quién puede ver tu información y cómo apareces en la plataforma</p></div>
      <div className="config-grupo">
        <p className="config-grupo-label">Visibilidad del perfil</p>
        <Row k="perfil_publico" label="Perfil público" sub="Las empresas y otros usuarios pueden ver tu perfil" />
        <Row k="mostrar_email" label="Mostrar correo electrónico" sub="Visible para empresas con las que interactúas" />
        <Row k="mostrar_telefono" label="Mostrar número de teléfono" sub="Solo para empresas que aceptaron tu postulación" />
        <Row k="busqueda_google" label="Aparecer en búsquedas externas" sub="Tu perfil puede indexarse en Google u otros motores" />
        <Row k="compartir_estadisticas" label="Compartir estadísticas anónimas" sub="Ayuda a mejorar la plataforma" />
      </div>
      <div className="config-grupo">
        <p className="config-grupo-label">Tus datos</p>
        <div className="config-accion-row">
          <div>
            <p className="notif-row-label">Descargar mis datos</p>
            <p className="notif-row-sub">Exporta toda tu información en formato JSON</p>
          </div>
          <button className="btn-secondary" style={{ fontSize: 13, padding: '7px 16px' }}>Exportar</button>
        </div>
      </div>
    </div>
  );
}

function SeccionSeguridad() {
  const [form, setForm] = useState({ actual: '', nueva: '', confirmar: '' });
  const [errors, setErrors] = useState({});
  const [ok, setOk] = useState(false);
  function cambiar(e) {
    e.preventDefault();
    const err = {};
    if (!form.actual)   err.actual = 'Requerido';
    if (form.nueva.length < 6) err.nueva = 'Mínimo 6 caracteres';
    if (form.nueva !== form.confirmar) err.confirmar = 'No coinciden';
    setErrors(err);
    if (!Object.keys(err).length) { setOk(true); setForm({ actual: '', nueva: '', confirmar: '' }); setTimeout(() => setOk(false), 2500); }
  }
  return (
    <div className="config-seccion">
      <div className="config-sec-header"><h2>Seguridad</h2><p>Cambia tu contraseña y protege tu cuenta</p></div>
      <form onSubmit={cambiar} style={{ maxWidth: 380 }}>
        <div className="config-grupo">
          <p className="config-grupo-label">Cambiar contraseña</p>
          {[
            { k: 'actual',   lbl: 'Contraseña actual',   ph: '••••••••' },
            { k: 'nueva',    lbl: 'Nueva contraseña',     ph: 'Mínimo 6 caracteres' },
            { k: 'confirmar',lbl: 'Confirmar contraseña', ph: 'Repite la nueva contraseña' },
          ].map(f => (
            <div key={f.k} className="config-field" style={{ marginBottom: 12 }}>
              <label>{f.lbl}</label>
              <input type="password" placeholder={f.ph} value={form[f.k]} onChange={e => { setForm(p => ({ ...p, [f.k]: e.target.value })); setErrors(p => ({ ...p, [f.k]: '' })); }} className={errors[f.k] ? 'field-error' : ''} />
              {errors[f.k] && <span className="field-error-msg">{errors[f.k]}</span>}
            </div>
          ))}
          {ok && <div className="ok-msg"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg> Contraseña actualizada</div>}
          <button type="submit" className="btn-primary" style={{ marginTop: 4 }}>Cambiar contraseña</button>
        </div>
      </form>
      <div className="config-grupo" style={{ marginTop: 24 }}>
        <p className="config-grupo-label">Sesiones activas</p>
        <div className="sesion-item">
          <div>
            <p className="notif-row-label">Chrome · Concepción, Chile</p>
            <p className="notif-row-sub">Este dispositivo · Hace 2 min</p>
          </div>
          <span className="badge badge-verde">Activa</span>
        </div>
        <div className="sesion-item">
          <div>
            <p className="notif-row-label">Safari · iPhone</p>
            <p className="notif-row-sub">Hace 3 días</p>
          </div>
          <button className="btn-danger-sm">Cerrar</button>
        </div>
      </div>
    </div>
  );
}

function SeccionApariencia() {
  const [idioma, setIdioma] = useState('es');
  const [tamanio, setTamanio] = useState('normal');
  return (
    <div className="config-seccion">
      <div className="config-sec-header"><h2>Apariencia</h2><p>Personaliza cómo se ve la plataforma</p></div>
      <div className="config-grupo">
        <p className="config-grupo-label">Idioma</p>
        <div className="config-field" style={{ maxWidth: 260 }}>
          <label>Idioma de la plataforma</label>
          <select value={idioma} onChange={e => setIdioma(e.target.value)}>
            <option value="es">Español (Chile)</option>
            <option value="en">English</option>
          </select>
        </div>
      </div>
      <div className="config-grupo">
        <p className="config-grupo-label">Tamaño de texto</p>
        <div className="tamanio-options">
          {[{v:'pequeño',l:'Pequeño'},{v:'normal',l:'Normal'},{v:'grande',l:'Grande'}].map(t=>(
            <button key={t.v} className={`tamanio-btn ${tamanio===t.v?'on':''}`} onClick={()=>setTamanio(t.v)}>{t.l}</button>
          ))}
        </div>
      </div>
    </div>
  );
}

function SeccionPeligro() {
  const [confirm, setConfirm] = useState('');
  const [open, setOpen] = useState(false);
  return (
    <div className="config-seccion">
      <div className="config-sec-header"><h2>Zona de peligro</h2><p>Acciones irreversibles sobre tu cuenta</p></div>
      <div className="config-grupo peligro-grupo">
        <div className="peligro-item">
          <div>
            <p className="notif-row-label">Desactivar cuenta temporalmente</p>
            <p className="notif-row-sub">Tu perfil quedará oculto pero podrás reactivarlo cuando quieras</p>
          </div>
          <button className="btn-danger-sm">Desactivar</button>
        </div>
        <div className="peligro-item">
          <div>
            <p className="notif-row-label" style={{ color: 'var(--rojo)' }}>Eliminar cuenta permanentemente</p>
            <p className="notif-row-sub">Se borrarán todos tus datos, postulaciones y mensajes. Esta acción no se puede deshacer.</p>
          </div>
          <button className="btn-danger" onClick={() => setOpen(true)}>Eliminar</button>
        </div>
      </div>
      {open && (
        <div className="modal-overlay" onClick={() => setOpen(false)}>
          <div className="modal-box" onClick={e => e.stopPropagation()}>
            <div className="modal-ico">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--rojo)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>
            </div>
            <h3>¿Eliminar tu cuenta?</h3>
            <p>Esta acción borrará permanentemente todos tus datos. Escribe <strong>eliminar</strong> para confirmar.</p>
            <input placeholder='Escribe "eliminar"' value={confirm} onChange={e => setConfirm(e.target.value)} />
            <div className="modal-actions">
              <button className="btn-secondary" onClick={() => setOpen(false)}>Cancelar</button>
              <button className="btn-danger" disabled={confirm !== 'eliminar'}>Eliminar cuenta</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const MAPA = { cuenta: SeccionCuenta, notificaciones: SeccionNotificaciones, privacidad: SeccionPrivacidad, seguridad: SeccionSeguridad, apariencia: SeccionApariencia, 'cuenta-peligro': SeccionPeligro };

export default function Configuracion() {
  const [activa, setActiva] = useState('cuenta');
  const Comp = MAPA[activa];
  return (
    <div className="config-page">
      <div className="config-inner">
        <aside className="config-nav">
          <p className="config-nav-titulo">Configuración</p>
          {SECCIONES.map(s => (
            <button key={s.id} className={`config-nav-item ${activa === s.id ? 'activo' : ''} ${s.id === 'cuenta-peligro' ? 'peligro' : ''}`} onClick={() => setActiva(s.id)}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                {s.ico.split(' ').length > 1
                  ? s.ico.split(' M').map((d, i) => <path key={i} d={i === 0 ? d : 'M' + d} />)
                  : <path d={s.ico} />
                }
              </svg>
              {s.label}
            </button>
          ))}
        </aside>
        <div className="config-content">
          {Comp && <Comp />}
        </div>
      </div>
    </div>
  );
}
