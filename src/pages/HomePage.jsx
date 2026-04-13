import { useState, useEffect } from 'react';
import JobCard from '../components/JobCard';
import ProfileSidebar from '../components/ProfileSidebar';
import './HomePage.css';

const MODALIDADES = ['todos', 'presencial', 'remoto', 'híbrido'];
const ESPECIALIDADES = ['Todas', 'Electricidad', 'Mecatrónica', 'Redes', 'Construcción', 'Automatización'];

const MOCK_OFERTAS = [
  {
    _id: '1', titulo: 'Técnico electricista industrial',
    descripcion: 'Buscamos técnico en electricidad industrial para mantenimiento preventivo y correctivo de maquinaria en planta. Experiencia mínima 1 año, manejo de tableros eléctricos y sistemas trifásicos.',
    ubicacion: 'Concepción, Bío-Bío', salario_min: 650000, salario_max: 850000,
    modalidad: 'presencial', publicado_en: new Date(Date.now() - 1800000).toISOString(),
    especialidades_requeridas: ['Electricidad', 'PLC', 'Mantenimiento'],
    empresa_id: { nombre_empresa: 'Industrias CMPC', logo_url: null }, destacada: true,
  },
  {
    _id: '2', titulo: 'Mecatrónico de producción',
    descripcion: 'Empresa del rubro alimentario requiere mecatrónico para línea de producción automatizada. Trabajo en turnos, conocimientos en neumática y control de motores requeridos.',
    ubicacion: 'Talcahuano, Bío-Bío', salario_min: 700000, salario_max: 950000,
    modalidad: 'presencial', publicado_en: new Date(Date.now() - 7200000).toISOString(),
    especialidades_requeridas: ['Mecatrónica', 'Neumática', 'Automatización'],
    empresa_id: { nombre_empresa: 'Carozzi S.A.', logo_url: null },
  },
  {
    _id: '3', titulo: 'Soporte técnico en redes',
    descripcion: 'Se necesita técnico en redes para instalación, configuración y soporte de infraestructura de red en empresas clientes. Certificación CCNA valorada.',
    ubicacion: 'Los Ángeles, Bío-Bío', salario_min: 580000, salario_max: 750000,
    modalidad: 'híbrido', publicado_en: new Date(Date.now() - 10800000).toISOString(),
    especialidades_requeridas: ['Redes', 'CCNA', 'Soporte TI'],
    empresa_id: { nombre_empresa: 'TechChile S.A.', logo_url: null },
  },
  {
    _id: '4', titulo: 'Operario de construcción calificado',
    descripcion: 'Constructora requiere operarios calificados para proyecto habitacional en Concepción. Manejo de maquinaria pesada es un plus. Contrato por faena con posibilidad de continuidad.',
    ubicacion: 'Concepción, Bío-Bío', salario_min: 600000, salario_max: 800000,
    modalidad: 'presencial', publicado_en: new Date(Date.now() - 86400000).toISOString(),
    especialidades_requeridas: ['Construcción', 'Obra civil'],
    empresa_id: { nombre_empresa: 'Constructora Sur', logo_url: null },
  },
  {
    _id: '5', titulo: 'Programador PLC - automatización',
    descripcion: 'Empresa de automatización busca técnico con experiencia en programación Siemens TIA Portal y Schneider. Proyecto en industria minera, disponibilidad para viajes.',
    ubicacion: 'Remoto / Antofagasta', salario_min: 900000, salario_max: 1300000,
    modalidad: 'remoto', publicado_en: new Date(Date.now() - 172800000).toISOString(),
    especialidades_requeridas: ['PLC', 'Siemens', 'Automatización'],
    empresa_id: { nombre_empresa: 'AutomaTec Ltda.', logo_url: null },
  },
];

function IcoFilter() { return <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/></svg>; }
function IcoSort()   { return <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="15" y2="12"/><line x1="3" y1="18" x2="9" y2="18"/></svg>; }

export default function HomePage() {
  const [modalidad, setModalidad] = useState('todos');
  const [especialidad, setEspecialidad] = useState('Todas');
  const [ordenar, setOrdenar] = useState('reciente');
  const [cargando, setCargando] = useState(true);
  const [ofertas, setOfertas] = useState([]);

// falta cambiar los mock up datos

  useEffect(() => {
    const t = setTimeout(() => { setOfertas(MOCK_OFERTAS); setCargando(false); }, 600);
    return () => clearTimeout(t);
  }, []);

  const ofertasFiltradas = ofertas
    .filter(o => modalidad === 'todos' || o.modalidad === modalidad)
    .filter(o => especialidad === 'Todas' || o.especialidades_requeridas?.includes(especialidad))
    .sort((a, b) => {
      if (ordenar === 'salario') return (b.salario_max ?? 0) - (a.salario_max ?? 0);
      return new Date(b.publicado_en) - new Date(a.publicado_en);
    });

  return (
    <div className="homepage">
      <div className="homepage-hero">
        <div className="homepage-hero-inner">
          <h1 className="hero-titulo">Encuentra tu primera oportunidad laboral</h1>
          <p className="hero-subtitulo">Conectamos egresados técnicos del Bío-Bío con empresas que valoran tu formación</p>
          <div className="hero-stats">
            <div className="hero-stat"><span className="hero-stat-num">123</span><span className="hero-stat-label">Ofertas activas</span></div>
            <div className="hero-stat-div" />
            <div className="hero-stat"><span className="hero-stat-num">231</span><span className="hero-stat-label">Empresas registradas</span></div>
            <div className="hero-stat-div" />
            <div className="hero-stat"><span className="hero-stat-num">321</span><span className="hero-stat-label">Estudiantes conectados</span></div>
          </div>
        </div>
      </div>

      <div className="homepage-content">
        <div className="homepage-feed">
          <div className="feed-toolbar">
            <div className="feed-toolbar-left">
              <IcoFilter />
              <span className="feed-count">{ofertasFiltradas.length} ofertas</span>
            </div>
            <div className="feed-toolbar-right">
              <div className="filtro-chips">
                {MODALIDADES.map(m => (
                  <button
                    key={m}
                    className={`filtro-chip ${modalidad === m ? 'activo' : ''}`}
                    onClick={() => setModalidad(m)}
                  >
                    {m.charAt(0).toUpperCase() + m.slice(1)}
                  </button>
                ))}
              </div>
              <select
                className="ordenar-select"
                value={ordenar}
                onChange={e => setOrdenar(e.target.value)}
              >
                <option value="reciente">Más reciente</option>
                <option value="salario">Mayor salario</option>
              </select>
            </div>
          </div>

          <div className="especialidad-chips">
            {ESPECIALIDADES.map(e => (
              <button
                key={e}
                className={`especialidad-chip ${especialidad === e ? 'activo' : ''}`}
                onClick={() => setEspecialidad(e)}
              >
                {e}
              </button>
            ))}
          </div>

          <div className="feed-lista">
            {cargando ? (
              Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="job-skeleton card" style={{ animationDelay: `${i * 0.1}s` }}>
                  <div className="skeleton-header">
                    <div className="skeleton-logo skeleton-pulse" />
                    <div className="skeleton-lines">
                      <div className="skeleton-line skeleton-pulse" style={{ width: '60%' }} />
                      <div className="skeleton-line skeleton-pulse" style={{ width: '40%' }} />
                    </div>
                  </div>
                  <div className="skeleton-line skeleton-pulse" style={{ width: '100%', height: 10 }} />
                  <div className="skeleton-line skeleton-pulse" style={{ width: '80%', height: 10 }} />
                </div>
              ))
            ) : ofertasFiltradas.length === 0 ? (
              <div className="feed-empty">
                <div className="feed-empty-icon">
                  <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="var(--gris-2)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
                </div>
                <p>No hay ofertas con los filtros seleccionados</p>
                <button className="btn-secondary" onClick={() => { setModalidad('todos'); setEspecialidad('Todas'); }}>
                  Limpiar filtros
                </button>
              </div>
            ) : (
              ofertasFiltradas.map((o, i) => (
                <div key={o._id} style={{ animation: `fadeInUp 0.3s ease both`, animationDelay: `${i * 0.06}s` }}>
                  <JobCard oferta={o} destacada={o.destacada} />
                </div>
              ))
            )}
          </div>
        </div>

        <ProfileSidebar />
      </div>
    </div>
  );
}
