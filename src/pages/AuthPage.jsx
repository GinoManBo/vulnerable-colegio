import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { authAPI, statsAPI } from '../api.js';
import './AuthPage.css';

const ROLES = [
  { id: 'estudiante', label: 'Estudiante egresado', desc: 'Busca oportunidades laborales', ico: 'M12 14l9-5-9-5-9 5 9 5z M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z' },
  { id: 'empresa',    label: 'Empresa',             desc: 'Publica ofertas y contrata',  ico: 'M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-2 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4' },
];

const FEATURES = [
  { ico: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c0 2 2 3 6 3s6-1 6-3v-5"/></svg>, txt: 'Perfil profesional con portafolio y calificaciones' },
  { ico: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="7" width="20" height="14" rx="2" ry="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></svg>, txt: 'Ofertas de empleo filtradas por tu especialidad' },
  { ico: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>, txt: 'Mensajeria directa con empresas' },
  { ico: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>, txt: 'Historial y puntuacion de trabajos realizados' },
];

export default function AuthPage({ onLogin }) {
  const [modo, setModo] = useState('login');
  const [rol, setRol] = useState('estudiante');
  const [paso, setPaso] = useState(1);
  const [form, setForm] = useState({ nombre: '', apellido: '', email: '', password: '', confirmar: '', empresa: '', rubro: '' });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState({ ofertasActivas: 0, empresasRegistradas: 0, estudiantesOnline: 0 });
  const navigate = useNavigate();

  useEffect(() => {
    statsAPI.obtener()
      .then(s => setStats(s))
      .catch(() => {});
  }, []);

  function upd(k, v) {
    setForm(p => ({ ...p, [k]: v }));
    setErrors(p => ({ ...p, [k]: '' }));
  }

  function validarPaso1() {
    const e = {};
    if (!form.email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) e.email = 'Email invalido';
    if (form.password.length < 6) e.password = 'Minimo 6 caracteres';
    if (modo === 'registro' && form.password !== form.confirmar) e.confirmar = 'Las contrasenas no coinciden';
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  function validarPaso2() {
    const e = {};
    if (!form.nombre.trim()) e.nombre = 'Requerido';
    if (rol === 'empresa' && !form.empresa.trim()) e.empresa = 'Requerido';
    setErrors(e);
    return Object.keys(e).length === 0;  
  }

  function handleSubmitLogin(e) {
    e.preventDefault();
    if (!validarPaso1()) return;
    setLoading(true);
    authAPI.login(form.email, form.password)
      .then(res => {
        setLoading(false);
        localStorage.setItem('token', res.token);
        localStorage.setItem('usuario', JSON.stringify(res.usuario));
        onLogin(res.usuario);
        navigate('/');
      })
      .catch(err => {
        setLoading(false);
        setErrors({ submit: err.message || 'Error al iniciar sesion' });
      });
  }

  function handleSiguiente(e) {
    e.preventDefault();
    if (paso === 1 && validarPaso1()) {
      setPaso(2);
    } else if (paso === 2 && validarPaso2()) {
      setLoading(true);
      const payload = {
        email: form.email,
        password: form.password,
        nombre: form.nombre,
        apellido: form.apellido,
        rol: rol,
        ...(rol === 'empresa' ? { nombre_empresa: form.empresa } : { especialidad: form.rubro }),
      };
      authAPI.registro(payload)
        .then(res => {
          setLoading(false);
          localStorage.setItem('token', res.token);
          localStorage.setItem('usuario', JSON.stringify(res.usuario));
          onLogin(res.usuario);
          navigate('/');
        })
        .catch(err => {
          setLoading(false);
          setErrors({ submit: err.message || 'Error al crear la cuenta' });
        });
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-left">
        <div className="auth-left-content">
          <div className="auth-logo">
            <div className="auth-logo-ico">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#818CF8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 3L1 9l4 2.18v6L12 21l7-3.82v-6L21 9 12 3z"/>
                <path d="M12 12L7.5 9.82M12 12l4.5-2.18M12 12v9"/>
              </svg>
            </div>
            <span className="auth-logo-txt">Centro Educacional Cardenal Jose Maria Caro</span>
          </div>
          <h1 className="auth-left-titulo">La plataforma que conecta el talento tecnico con el mundo laboral</h1>
          <p className="auth-left-sub">Disenada para egresados del Institutos Tecnicos que permite vincularse con empresas que ofrecen ofertas de empleo.</p>
          <div className="auth-features">
            {FEATURES.map(f => (
              <div key={f.txt} className="auth-feature-item">
                <span className="auth-feature-ico">{f.ico}</span>
                <span>{f.txt}</span>
              </div>
            ))}
          </div>
          <div className="auth-left-stats">
            <div className="auth-stat"><span className="auth-stat-n">{stats.estudiantesOnline}</span><span className="auth-stat-l">Estudiantes conectados</span></div>
            <div className="auth-stat"><span className="auth-stat-n">{stats.empresasRegistradas}</span><span className="auth-stat-l">Empresas</span></div>
            <div className="auth-stat"><span className="auth-stat-n">{stats.ofertasActivas}</span><span className="auth-stat-l">Ofertas activas</span></div>
          </div>
        </div>
      </div>

      <div className="auth-right">
        <div className="auth-card">
          <div className="auth-tabs">
            <button className={`auth-tab ${modo === 'login' ? 'active' : ''}`} onClick={() => { setModo('login'); setPaso(1); setErrors({}); }}>
              Iniciar sesion
            </button>
            <button className={`auth-tab ${modo === 'registro' ? 'active' : ''}`} onClick={() => { setModo('registro'); setPaso(1); setErrors({}); }}>
              Crear cuenta
            </button>
          </div>

          {modo === 'login' ? (
            <form className="auth-form" onSubmit={handleSubmitLogin} noValidate>
              <h2 className="auth-form-titulo">Bienvenido de vuelta</h2>
              <p className="auth-form-sub">Ingresa tus credenciales para continuar</p>

              {errors.submit && <div style={{ color: '#ef4444', marginBottom: '1rem', fontSize: '0.875rem' }}>{errors.submit}</div>}

              <div className="form-group">
                <label>Correo electronico</label>
                <input type="email" placeholder="tu@correo.cl" value={form.email} onChange={e => upd('email', e.target.value)} className={errors.email ? 'error' : ''} />
                {errors.email && <span className="form-error">{errors.email}</span>}
              </div>
              <div className="form-group">
                <label>Contrasena</label>
                <input type="password" placeholder="******" value={form.password} onChange={e => upd('password', e.target.value)} className={errors.password ? 'error' : ''} />
                {errors.password && <span className="form-error">{errors.password}</span>}
                <a href="#" className="form-link-right">Olvidaste tu contrasena?</a>
              </div>

              <button type="submit" className={`auth-submit ${loading ? 'loading' : ''}`} disabled={loading}>
                {loading ? <span className="spinner" /> : null}
                {loading ? 'Ingresando...' : 'Iniciar sesion'}
              </button>

              <p className="auth-switch">
                No tienes cuenta?{' '}
                <button type="button" onClick={() => { setModo('registro'); setPaso(1); setErrors({}); }}>Registrate aqui</button>
              </p>
            </form>
          ) : (
            <form className="auth-form" onSubmit={handleSiguiente} noValidate>
              <div className="auth-pasos">
                <div className={`auth-paso-dot ${paso >= 1 ? 'done' : ''}`}>1</div>
                <div className={`auth-paso-line ${paso >= 2 ? 'done' : ''}`} />
                <div className={`auth-paso-dot ${paso >= 2 ? 'done' : ''}`}>2</div>
              </div>
              <h2 className="auth-form-titulo">{paso === 1 ? 'Crea tu cuenta' : 'Tu informacion'}</h2>
              <p className="auth-form-sub">{paso === 1 ? 'Ingresa tu correo y una contrasena segura' : 'Cuentanos un poco mas sobre ti'}</p>

              {errors.submit && <div style={{ color: '#ef4444', marginBottom: '1rem', fontSize: '0.875rem' }}>{errors.submit}</div>}

              {paso === 1 && (
                <>
                  <div className="form-group">
                    <label>Correo electronico</label>
                    <input type="email" placeholder="tu@correo.cl" value={form.email} onChange={e => upd('email', e.target.value)} className={errors.email ? 'error' : ''} />
                    {errors.email && <span className="form-error">{errors.email}</span>}
                  </div>
                  <div className="form-group">
                    <label>Contrasena</label>
                    <input type="password" placeholder="Minimo 6 caracteres" value={form.password} onChange={e => upd('password', e.target.value)} className={errors.password ? 'error' : ''} />
                    {errors.password && <span className="form-error">{errors.password}</span>}
                  </div>
                  <div className="form-group">
                    <label>Confirmar contrasena</label>
                    <input type="password" placeholder="Repite tu contrasena" value={form.confirmar} onChange={e => upd('confirmar', e.target.value)} className={errors.confirmar ? 'error' : ''} />
                    {errors.confirmar && <span className="form-error">{errors.confirmar}</span>}
                  </div>
                </>
              )}

              {paso === 2 && (
                <>
                  <div className="rol-selector">
                    {ROLES.map(r => (
                      <button type="button" key={r.id} className={`rol-card ${rol === r.id ? 'active' : ''}`} onClick={() => setRol(r.id)}>
                        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                          <path d={r.ico} />
                        </svg>
                        <span className="rol-label">{r.label}</span>
                        <span className="rol-desc">{r.desc}</span>
                      </button>
                    ))}
                  </div>
                  <div className="form-row">
                    <div className="form-group">
                      <label>Nombre</label>
                      <input type="text" placeholder="Ej: Gino" value={form.nombre} onChange={e => upd('nombre', e.target.value)} className={errors.nombre ? 'error' : ''} />
                      {errors.nombre && <span className="form-error">{errors.nombre}</span>}
                    </div>
                    <div className="form-group">
                      <label>Apellido</label>
                      <input type="text" placeholder="Ej: Monsalvez" value={form.apellido} onChange={e => upd('apellido', e.target.value)} className={errors.apellido ? 'error' : ''} />
                      {errors.apellido && <span className="form-error">{errors.apellido}</span>}
                    </div>
                  </div>
                  {rol === 'empresa' && (
                    <div className="form-group">
                      <label>Nombre de la empresa</label>
                      <input type="text" placeholder="Ej: TechChile S.A." value={form.empresa} onChange={e => upd('empresa', e.target.value)} className={errors.empresa ? 'error' : ''} />
                      {errors.empresa && <span className="form-error">{errors.empresa}</span>}
                    </div>
                  )}
                  {rol === 'estudiante' && (
                    <div className="form-group">
                      <label>Especialidad tecnica</label>
                      <select value={form.rubro} onChange={e => upd('rubro', e.target.value)}>
                        <option value="">Selecciona tu especialidad</option>
                        <option>Electricidad industrial</option>
                        <option>Mecatronica</option>
                        <option>Redes y comunicaciones</option>
                        <option>Automatizacion y PLC</option>
                        <option>Construccion</option>
                        <option>Otra</option>
                      </select>
                    </div>
                  )}
                </>
              )}

              <div className="auth-form-actions">
                {paso === 2 && (
                  <button type="button" className="auth-back" onClick={() => setPaso(1)}>
                    Volver
                  </button>
                )}
                <button type="submit" className={`auth-submit ${loading ? 'loading' : ''}`} disabled={loading}>
                  {loading ? <span className="spinner" /> : null}
                  {loading ? 'Creando cuenta...' : paso === 1 ? 'Continuar' : 'Crear cuenta'}
                </button>
              </div>

              <p className="auth-switch">
                Ya tienes cuenta?{' '}
                <button type="button" onClick={() => { setModo('login'); setPaso(1); setErrors({}); }}>Inicia sesion</button>
              </p>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
