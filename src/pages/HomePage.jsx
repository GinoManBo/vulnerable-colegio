import { useState, useEffect } from 'react';
import { ofertasAPI, perfilAPI, statsAPI } from '../api';
import JobCard from '../components/JobCard';
import ProfileSidebar from '../components/ProfileSidebar';
import './HomePage.css';

const MODALIDADES = ['todos', 'presencial', 'remoto', 'híbrido'];
const ESPECIALIDADES = ['Todas', 'Electricidad', 'Mecatrónica', 'Redes', 'Construcción', 'Automatización'];

function IcoFilter() { return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/></svg>; }
function IcoSort()   { return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="15" y2="12"/><line x1="3" y1="18" x2="9" y2="18"/></svg>; }
function IcoBriefcase() { return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="7" width="20" height="14" rx="2" ry="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></svg>; }
function IcoBuilding() { return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 21h18"/><path d="M5 21V7l8-4 8 4v14"/><path d="M9 21v-6h6v6"/></svg>; }
function IcoUsers() { return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>; }

export default function HomePage() {
  const [modalidad, setModalidad] = useState('todos');
  const [especialidad, setEspecialidad] = useState('Todas');
  const [ordenar, setOrdenar] = useState('reciente');
  const [cargando, setCargando] = useState(true);
  const [ofertas, setOfertas] = useState([]);
  const [misPostulacionesIds, setMisPostulacionesIds] = useState(new Set());
  const [estadoPostulaciones, setEstadoPostulaciones] = useState({});
  const [stats, setStats] = useState({ ofertasActivas: 0, empresasRegistradas: 0, estudiantesOnline: 0 });

  const usuarioJson = localStorage.getItem('usuario');
  const usuario = usuarioJson ? JSON.parse(usuarioJson) : null;

  useEffect(() => {
    async function cargarDatos() {
      try {
        const [datosOfertas, datosStats] = await Promise.all([
          ofertasAPI.listar(),
          statsAPI.obtener().catch(() => ({ ofertasActivas: 0, empresasRegistradas: 0, estudiantesOnline: 0 })),
        ]);
        setOfertas(datosOfertas.ofertas || datosOfertas || []);
        setStats(datosStats);
      } catch (err) {
        setOfertas([]);
      } finally {
        setCargando(false);
      }
    }
    cargarDatos();
  }, []);

  useEffect(() => {
    if (usuario?.rol !== 'estudiante') return;
    perfilAPI.misPostulaciones()
      .then(postulaciones => {
        const ids = new Set();
        const estados = {};
        (postulaciones || []).forEach(p => {
          const ofertaId = p.empleo_id?._id?.toString() || p.empleo_id?.toString();
          if (ofertaId) {
            ids.add(ofertaId);
            estados[ofertaId] = p.estado;
          }
        });
        setMisPostulacionesIds(ids);
        setEstadoPostulaciones(estados);
      })
      .catch(() => {});
  }, [usuario]);

  useEffect(() => {
    async function handleActualizar() {
      if (usuario?.rol !== 'estudiante') return;
      try {
        const postulaciones = await perfilAPI.misPostulaciones();
        const ids = new Set();
        const estados = {};
        (postulaciones || []).forEach(p => {
          const ofertaId = p.empleo_id?._id?.toString() || p.empleo_id?.toString();
          if (ofertaId) {
            ids.add(ofertaId);
            estados[ofertaId] = p.estado;
          }
        });
        setMisPostulacionesIds(ids);
        setEstadoPostulaciones(estados);
      } catch (err) {}
    }
    window.addEventListener('actualizar-postulaciones', handleActualizar);
    return () => window.removeEventListener('actualizar-postulaciones', handleActualizar);
  }, [usuario]);

  const ofertasFiltradas = ofertas
    .filter(o => modalidad === 'todos' || o.modalidad === modalidad)
    .filter(o => especialidad === 'Todas' || o.especialidades_requeridas?.includes(especialidad))
    .sort((a, b) => {
      if (ordenar === 'salario') return (b.salario_max ?? 0) - (a.salario_max ?? 0);
      return new Date(b.publicado_en) - new Date(a.publicado_en);
    });

  return (
    <div className="homepage">
      {/* Hero */}
      <div className="hp-hero">
        <div className="hp-hero-bg" />
        <div className="hp-hero-radial" />
        <div className="hp-hero-grid" />

        <div className="hp-container" style={{ animation: 'fadeInUp 0.6s ease both' }}>
          <div className="hp-hero-head">
            <div className="hp-badge">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275Z"/></svg>
              Plataforma de empleo técnico
            </div>

            <h1 className="hp-hero-title">
              Encuentra tu <span className="hp-gradient">primera oportunidad</span> laboral
            </h1>

            <p className="hp-hero-desc">
              Conectamos egresados técnicos del Bío-Bío con empresas que valoran tu formación. Tu futuro comienza aquí.
            </p>
          </div>

          {/* Stats */}
          <div className="hp-stats">
            <div className="hp-stat" style={{ animation: 'fadeInUp 0.5s ease 0.2s both' }}>
              <div className="hp-stat-ico"><IcoBriefcase /></div>
              <div>
                <div className="hp-stat-num">{stats.ofertasActivas}</div>
                <div className="hp-stat-label">Ofertas activas</div>
              </div>
            </div>
            <div className="hp-stat" style={{ animation: 'fadeInUp 0.5s ease 0.3s both' }}>
              <div className="hp-stat-ico"><IcoBuilding /></div>
              <div>
                <div className="hp-stat-num">{stats.empresasRegistradas}</div>
                <div className="hp-stat-label">Empresas registradas</div>
              </div>
            </div>
            <div className="hp-stat" style={{ animation: 'fadeInUp 0.5s ease 0.4s both' }}>
              <div className="hp-stat-ico"><IcoUsers /></div>
              <div>
                <div className="hp-stat-num">{stats.estudiantesOnline}</div>
                <div className="hp-stat-label">Estudiantes conectados</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="hp-container hp-content">
        <div className="hp-layout">
          {/* Feed */}
          <div className="hp-feed">
            {/* Toolbar sticky */}
            <div className="hp-toolbar" style={{ animation: 'fadeInUp 0.4s ease 0.4s both' }}>
              <div className="hp-toolbar-top">
                <div className="hp-toolbar-left">
                  <IcoFilter />
                  <span className="hp-count">{ofertasFiltradas.length} ofertas</span>
                </div>
                <div className="hp-toolbar-right">
                  <div className="hp-modalidad-chips">
                    {MODALIDADES.map(m => (
                      <button
                        key={m}
                        className={`hp-chip ${modalidad === m ? 'active' : ''}`}
                        onClick={() => setModalidad(m)}
                      >
                        {m.charAt(0).toUpperCase() + m.slice(1)}
                      </button>
                    ))}
                  </div>
                  <div className="hp-ordenar">
                    <IcoSort />
                    <select value={ordenar} onChange={e => setOrdenar(e.target.value)}>
                      <option value="reciente">Más reciente</option>
                      <option value="salario">Mayor salario</option>
                    </select>
                  </div>
                </div>
              </div>
              <div className="hp-especialidades">
                {ESPECIALIDADES.map(e => (
                  <button
                    key={e}
                    className={`hp-pill ${especialidad === e ? 'active' : ''}`}
                    onClick={() => setEspecialidad(e)}
                  >
                    {e}
                  </button>
                ))}
              </div>
            </div>

            {/* Lista */}
            <div className="hp-lista">
              {cargando ? (
                Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="hp-skeleton card" style={{ animationDelay: `${i * 0.1}s` }}>
                    <div className="hp-skel-header">
                      <div className="hp-skel-logo" />
                      <div className="hp-skel-lines">
                        <div className="hp-skel-line" style={{ width: '60%' }} />
                        <div className="hp-skel-line" style={{ width: '40%' }} />
                      </div>
                    </div>
                    <div className="hp-skel-line" style={{ width: '100%' }} />
                    <div className="hp-skel-line" style={{ width: '80%' }} />
                  </div>
                ))
              ) : ofertasFiltradas.length === 0 ? (
                <div className="hp-empty">
                  <div className="hp-empty-ico">
                    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
                  </div>
                  <p>No hay ofertas con los filtros seleccionados</p>
                  <button className="btn-secondary" onClick={() => { setModalidad('todos'); setEspecialidad('Todas'); }}>
                    Limpiar filtros
                  </button>
                </div>
              ) : (
                ofertasFiltradas.map((o, i) => (
                  <div key={o._id} style={{ animation: `fadeInUp 0.35s ease both`, animationDelay: `${i * 0.05}s` }}>
                    <JobCard oferta={o} destacada={o.destacada} usuario={usuario} yaPostulado={misPostulacionesIds.has(o._id?.toString())} estadoPostulacion={estadoPostulaciones[o._id?.toString()]} />
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div className="hp-sidebar" style={{ animation: 'fadeInUp 0.5s ease 0.5s both' }}>
            <ProfileSidebar onFiltrar={setEspecialidad} />
          </div>
        </div>
      </div>
    </div>
  );
}
