import { useState, useEffect } from 'react';
import { ofertasAPI } from '../api';
import JobCard from '../components/JobCard';
import ProfileSidebar from '../components/ProfileSidebar';
import './HomePage.css';

const MODALIDADES = ['todos', 'presencial', 'remoto', 'híbrido'];
const ESPECIALIDADES = ['Todas', 'Electricidad', 'Mecatrónica', 'Redes', 'Construcción', 'Automatización'];



function IcoFilter() { return <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/></svg>; }
function IcoSort()   { return <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="15" y2="12"/><line x1="3" y1="18" x2="9" y2="18"/></svg>; }

export default function HomePage() {
  const [modalidad, setModalidad] = useState('todos');
  const [especialidad, setEspecialidad] = useState('Todas');
  const [ordenar, setOrdenar] = useState('reciente');
  const [cargando, setCargando] = useState(true);
  const [ofertas, setOfertas] = useState([]);

  useEffect(() => {
    async function cargarOfertas() {
      try {
        const datos = await ofertasAPI.listar();
        setOfertas(datos);
      } catch (err) {
        console.error('Error cargando ofertas:', err);
      } finally {
        setCargando(false);
      }
    }
    cargarOfertas();
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
