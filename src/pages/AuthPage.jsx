import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './AuthPage.css';

const ROLES = [
  { id: 'estudiante', label: 'Estudiante egresado', desc: 'Busca oportunidades laborales', ico: 'M12 14l9-5-9-5-9 5 9 5z M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z' },
  { id: 'empresa',    label: 'Empresa',             desc: 'Publica ofertas y contrata',  ico: 'M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-2 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4' },
];

export default function AuthPage({ onLogin }) {
  const [modo, setModo] = useState('login');
  const [rol, setRol] = useState('estudiante');
  const [paso, setPaso] = useState(1);
  const [form, setForm] = useState({ nombre: '', apellido: '', email: '', password: '', confirmar: '', empresa: '', rubro: '' });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  function upd(k, v) {
    setForm(p => ({ ...p, [k]: v }));
    setErrors(p => ({ ...p, [k]: '' }));
  }

  function validarPaso1() {
    const e = {};
    if (!form.email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) e.email = 'Email inválido';
    if (form.password.length < 6) e.password = 'Mínimo 6 caracteres';
    if (modo === 'registro' && form.password !== form.confirmar) e.confirmar = 'Las contraseñas no coinciden';
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
    setTimeout(() => {
      setLoading(false);
      onLogin({ nombre: 'Gino Monsálvez', rol: 'estudiante', email: form.email });
      navigate('/');
    }, 900);
  }

  function handleSiguiente(e) {
    e.preventDefault();
    if (paso === 1 && validarPaso1()) setPaso(2);
    else if (paso === 2 && validarPaso2()) {
      setLoading(true);
      setTimeout(() => {
        setLoading(false);
        onLogin({ nombre: form.nombre, rol, email: form.email });
        navigate('/');
      }, 900);
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-left">
        <div className="auth-left-content">
          <div className="auth-logo">
            <div className="auth-logo-ico">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/>
                <path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
              </svg>
            </div>
            <span className="auth-logo-txt">Centro Educacional Cardenal José María Caro</span>
          </div>
          <h1 className="auth-left-titulo">La plataforma que conecta el talento técnico con el mundo laboral</h1>
          <p className="auth-left-sub">Diseñada para egresados del Institutos Tecnicos que permite vincularse con empresas que ofrecen ofertas de empleo.</p>
          <div className="auth-features">
            {[
              { ico: '🎓', txt: 'Perfil profesional con portafolio y calificaciones' },
              { ico: '💼', txt: 'Ofertas de empleo filtradas por tu especialidad' },
              { ico: '💬', txt: 'Mensajería directa con empresas' },
              { ico: '⭐', txt: 'Historial y puntuación de trabajos realizados' },
            ].map(f => (
              <div key={f.txt} className="auth-feature-item">
                <span className="auth-feature-ico">{f.ico}</span>
                <span>{f.txt}</span>
              </div>
            ))}
          </div>
          <div className="auth-left-stats">
            <div className="auth-stat"><span className="auth-stat-n">534</span><span className="auth-stat-l">Estudiantes</span></div>
            <div className="auth-stat"><span className="auth-stat-n">89</span><span className="auth-stat-l">Empresas</span></div>
            <div className="auth-stat"><span className="auth-stat-n">142</span><span className="auth-stat-l">Ofertas activas</span></div>
          </div>
        </div>
      </div>

      <div className="auth-right">
        <div className="auth-card">
          <div className="auth-tabs">
            <button className={`auth-tab ${modo === 'login' ? 'active' : ''}`} onClick={() => { setModo('login'); setPaso(1); setErrors({}); }}>
              Iniciar sesión
            </button>
            <button className={`auth-tab ${modo === 'registro' ? 'active' : ''}`} onClick={() => { setModo('registro'); setPaso(1); setErrors({}); }}>
              Crear cuenta
            </button>
          </div>

          {modo === 'login' ? (
            <form className="auth-form" onSubmit={handleSubmitLogin} noValidate>
              <h2 className="auth-form-titulo">Bienvenido de vuelta</h2>
              <p className="auth-form-sub">Ingresa tus credenciales para continuar</p>

              <div className="form-group">
                <label>Correo electrónico</label>
                <input type="email" placeholder="tu@correo.cl" value={form.email} onChange={e => upd('email', e.target.value)} className={errors.email ? 'error' : ''} />
                {errors.email && <span className="form-error">{errors.email}</span>}
              </div>
              <div className="form-group">
                <label>Contraseña</label>
                <input type="password" placeholder="••••••••" value={form.password} onChange={e => upd('password', e.target.value)} className={errors.password ? 'error' : ''} />
                {errors.password && <span className="form-error">{errors.password}</span>}
                <a href="#" className="form-link-right">¿Olvidaste tu contraseña?</a>
              </div>

              <button type="submit" className={`auth-submit ${loading ? 'loading' : ''}`} disabled={loading}>
                {loading ? <span className="spinner" /> : null}
                {loading ? 'Ingresando...' : 'Iniciar sesión'}
              </button>

              <div className="auth-divider"><span>o continúa con</span></div>
              <button type="button" className="auth-google">
                <svg width="18" height="18" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
                Continuar con Google
              </button>

              <p className="auth-switch">
                ¿No tienes cuenta?{' '}
                <button type="button" onClick={() => { setModo('registro'); setPaso(1); setErrors({}); }}>Regístrate aquí</button>
              </p>
            </form>
          ) : (
            <form className="auth-form" onSubmit={handleSiguiente} noValidate>
              <div className="auth-pasos">
                <div className={`auth-paso-dot ${paso >= 1 ? 'done' : ''}`}>1</div>
                <div className={`auth-paso-line ${paso >= 2 ? 'done' : ''}`} />
                <div className={`auth-paso-dot ${paso >= 2 ? 'done' : ''}`}>2</div>
              </div>
              <h2 className="auth-form-titulo">{paso === 1 ? 'Crea tu cuenta' : 'Tu información'}</h2>
              <p className="auth-form-sub">{paso === 1 ? 'Ingresa tu correo y una contraseña segura' : 'Cuéntanos un poco más sobre ti'}</p>

              {paso === 1 && (
                <>
                  <div className="form-group">
                    <label>Correo electrónico</label>
                    <input type="email" placeholder="tu@correo.cl" value={form.email} onChange={e => upd('email', e.target.value)} className={errors.email ? 'error' : ''} />
                    {errors.email && <span className="form-error">{errors.email}</span>}
                  </div>
                  <div className="form-group">
                    <label>Contraseña</label>
                    <input type="password" placeholder="Mínimo 6 caracteres" value={form.password} onChange={e => upd('password', e.target.value)} className={errors.password ? 'error' : ''} />
                    {errors.password && <span className="form-error">{errors.password}</span>}
                  </div>
                  <div className="form-group">
                    <label>Confirmar contraseña</label>
                    <input type="password" placeholder="Repite tu contraseña" value={form.confirmar} onChange={e => upd('confirmar', e.target.value)} className={errors.confirmar ? 'error' : ''} />
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
                      <input type="text" placeholder="Ej: Monsálvez" value={form.apellido} onChange={e => upd('apellido', e.target.value)} className={errors.apellido ? 'error' : ''} />
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
                      <label>Especialidad técnica</label>
                      <select value={form.rubro} onChange={e => upd('rubro', e.target.value)}>
                        <option value="">Selecciona tu especialidad</option>
                        <option>Electricidad industrial</option>
                        <option>Mecatrónica</option>
                        <option>Redes y comunicaciones</option>
                        <option>Automatización y PLC</option>
                        <option>Construcción</option>
                        <option>Otra</option>
                      </select>
                    </div>
                  )}
                </>
              )}

              <div className="auth-form-actions">
                {paso === 2 && (
                  <button type="button" className="auth-back" onClick={() => setPaso(1)}>
                    ← Volver
                  </button>
                )}
                <button type="submit" className={`auth-submit ${loading ? 'loading' : ''}`} disabled={loading}>
                  {loading ? <span className="spinner" /> : null}
                  {loading ? 'Creando cuenta...' : paso === 1 ? 'Continuar →' : 'Crear cuenta'}
                </button>
              </div>

              <p className="auth-switch">
                ¿Ya tienes cuenta?{' '}
                <button type="button" onClick={() => { setModo('login'); setPaso(1); setErrors({}); }}>Inicia sesión</button>
              </p>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
