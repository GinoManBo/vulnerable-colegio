import { useState, useRef, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import './navbar.css';

const MOCK_NOTIFS = [
  { id: 1, tipo: 'aceptado',  texto: 'TechChile S.A. aceptó tu postulación', sub: 'Técnico de Redes', tiempo: '5 min', leida: false },
  { id: 2, tipo: 'nueva',     texto: 'Nueva oferta que podría interesarte', sub: 'Operario CNC — Concepción', tiempo: '1 h', leida: false },
  { id: 3, tipo: 'rechazado', texto: 'Constructora Bío-Bío revisó tu solicitud', sub: 'Ayudante de obra', tiempo: '3 h', leida: true },
  { id: 4, tipo: 'nueva',     texto: 'Empresa Sodimac publicó una nueva oferta', sub: 'Electricista residencial', tiempo: 'Ayer', leida: true },
];

const MOCK_RESULTADOS = {
  empresas: [
    { id: 1, nombre: 'TechChile S.A.',      tipo: 'empresa', rubro: 'Tecnología' },
    { id: 2, nombre: 'Constructora Sur',    tipo: 'empresa', rubro: 'Construcción' },
  ],
  usuarios: [
    { id: 3, nombre: 'Valentina Mora',  tipo: 'estudiante', especialidad: 'Mecatrónica' },
    { id: 4, nombre: 'Diego Fuentes',   tipo: 'estudiante', especialidad: 'Electricidad' },
  ],
};

function IcoHome()   { return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>; }
function IcoBell()   { return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>; }
function IcoUser()   { return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>; }
function IcoSearch() { return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>; }
function IcoChevron(){ return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"/></svg>; }

function tipoNotifColor(tipo) {
  if (tipo === 'aceptado')  return 'badge-verde';
  if (tipo === 'rechazado') return 'badge-rojo';
  return 'badge-azul';
}
function tipoNotifLabel(tipo) {
  if (tipo === 'aceptado')  return 'Aceptado';
  if (tipo === 'rechazado') return 'Rechazado';
  return 'Nueva oferta';
}

export default function NavBar({ usuario }) {
  const [busqueda, setBusqueda] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const [showNotifs, setShowNotifs] = useState(false);
  const [showPerfil, setShowPerfil] = useState(false);
  const [notifs, setNotifs] = useState(MOCK_NOTIFS);
  const searchRef = useRef(null);
  const notifsRef = useRef(null);
  const perfilRef = useRef(null);
  const location = useLocation();

  const noLeidas = notifs.filter(n => !n.leida).length;

  useEffect(() => {
    function handleClick(e) {
      if (searchRef.current && !searchRef.current.contains(e.target)) setShowSearch(false);
      if (notifsRef.current && !notifsRef.current.contains(e.target)) setShowNotifs(false);
      if (perfilRef.current && !perfilRef.current.contains(e.target)) setShowPerfil(false);
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  function marcarTodasLeidas() {
    setNotifs(prev => prev.map(n => ({ ...n, leida: true })));
  }

  const resultadosFiltrados = busqueda.length > 1 ? {
    empresas: MOCK_RESULTADOS.empresas.filter(e => e.nombre.toLowerCase().includes(busqueda.toLowerCase())),
    usuarios: MOCK_RESULTADOS.usuarios.filter(u => u.nombre.toLowerCase().includes(busqueda.toLowerCase())),
  } : null;

  const hayResultados = resultadosFiltrados && (resultadosFiltrados.empresas.length > 0 || resultadosFiltrados.usuarios.length > 0);

  return (
    <nav className="navbar">
      <div className="navbar-inner">

        <Link to="/" className="navbar-logo">
          <div className="logo-icon">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/>
              <path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
            </svg>
          </div>
          <span className="logo-text">Centro Educacional Cardenal José María Caro</span>
        </Link>

        <div className="navbar-search-wrap" ref={searchRef}>
          <div className={`navbar-search ${showSearch ? 'focused' : ''}`}>
            <IcoSearch />
            <input
              type="text"
              placeholder="Buscar empresas o estudiantes..."
              value={busqueda}
              onChange={e => { setBusqueda(e.target.value); setShowSearch(true); }}
              onFocus={() => setShowSearch(true)}
            />
            {busqueda && (
              <button className="search-clear" onClick={() => { setBusqueda(''); setShowSearch(false); }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
            )}
          </div>
          {showSearch && busqueda.length > 1 && (
            <div className="search-dropdown">
              {!hayResultados && (
                <p className="search-empty">Sin resultados para "{busqueda}"</p>
              )}
              {resultadosFiltrados?.empresas.length > 0 && (
                <div className="search-section">
                  <p className="search-section-label">Empresas</p>
                  {resultadosFiltrados.empresas.map(e => (
                    <Link key={e.id} to={`/empresa/${e.id}`} className="search-item" onClick={() => setShowSearch(false)}>
                      <div className="search-item-avatar empresa">{e.nombre[0]}</div>
                      <div>
                        <p className="search-item-nombre">{e.nombre}</p>
                        <p className="search-item-sub">{e.rubro}</p>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
              {resultadosFiltrados?.usuarios.length > 0 && (
                <div className="search-section">
                  <p className="search-section-label">Estudiantes</p>
                  {resultadosFiltrados.usuarios.map(u => (
                    <Link key={u.id} to={`/perfil/${u.id}`} className="search-item" onClick={() => setShowSearch(false)}>
                      <div className="search-item-avatar estudiante">{u.nombre[0]}</div>
                      <div>
                        <p className="search-item-nombre">{u.nombre}</p>
                        <p className="search-item-sub">{u.especialidad}</p>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        <div className="navbar-actions">
          <Link to="/" className={`nav-icon-btn icon-only ${location.pathname === '/' ? 'active' : ''}`} title="Inicio">
            <IcoHome />
          </Link>

          <div className="nav-icon-wrap" ref={notifsRef}>
            <button
              className={`nav-icon-btn ${showNotifs ? 'active' : ''}`}
              onClick={() => { setShowNotifs(p => !p); setShowPerfil(false); }}
              title="Notificaciones"
            >
              <IcoBell />
              {noLeidas > 0 && <span className="notif-badge">{noLeidas}</span>}
            </button>
            {showNotifs && (
              <div className="dropdown notifs-dropdown">
                <div className="dropdown-header">
                  <span>Notificaciones</span>
                  {noLeidas > 0 && (
                    <button className="mark-read-btn" onClick={marcarTodasLeidas}>Marcar como leídas</button>
                  )}
                </div>
                <div className="notifs-list">
                  {notifs.map(n => (
                    <div key={n.id} className={`notif-item ${!n.leida ? 'no-leida' : ''}`}>
                      {!n.leida && <div className="notif-dot" />}
                      <div className="notif-content">
                        <span className={`badge ${tipoNotifColor(n.tipo)}`}>{tipoNotifLabel(n.tipo)}</span>
                        <p className="notif-texto">{n.texto}</p>
                        <p className="notif-sub">{n.sub} · {n.tiempo}</p>
                      </div>
                    </div>
                  ))}
                </div>
                <Link to="/notificaciones" className="dropdown-footer" onClick={() => setShowNotifs(false)}>
                  Ver todas las notificaciones
                </Link>
              </div>
            )}
          </div>

          <div className="nav-icon-wrap" ref={perfilRef}>
            <button
              className={`nav-perfil-btn ${showPerfil ? 'active' : ''}`}
              onClick={() => { setShowPerfil(p => !p); setShowNotifs(false); }}
            >
              <div className="avatar" style={{ width: 34, height: 34, fontSize: 14 }}>
                {usuario?.foto ? (
                  <img src={usuario.foto} alt="perfil" style={{ width: 34, height: 34, borderRadius: '50%', objectFit: 'cover' }} />
                ) : (
                  <span>{usuario?.nombre?.[0] ?? 'U'}</span>
                )}
              </div>
              <span className="perfil-nombre">{usuario?.nombre ?? 'Mi perfil'}</span>
              <IcoChevron />
            </button>
            {showPerfil && (
              <div className="dropdown perfil-dropdown">
                <div className="dropdown-header">
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div className="avatar" style={{ width: 40, height: 40, fontSize: 16 }}>
                      {usuario?.nombre?.[0] ?? 'U'}
                    </div>
                    <div>
                      <p style={{ fontWeight: 500, fontSize: 14 }}>{usuario?.nombre ?? 'Usuario'}</p>
                      <p style={{ fontSize: 12, color: 'var(--gris-2)' }}>{usuario?.rol ?? 'Estudiante'}</p>
                    </div>
                  </div>
                </div>
                <div className="perfil-menu">
                  <Link to="/perfil" className="perfil-menu-item" onClick={() => setShowPerfil(false)}>
                    <IcoUser /> Mi perfil
                  </Link>
                  <Link to="/configuracion" className="perfil-menu-item" onClick={() => setShowPerfil(false)}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>
                    Configuración
                  </Link>
                </div>
                <div className="perfil-menu-footer">
                  <button className="perfil-menu-item logout">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
                    Cerrar sesión
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
