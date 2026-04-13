import { useState } from 'react';
import { Link } from 'react-router-dom';
import './JobCard.css';

function IcoPin()    { return <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>; }
function IcoPeso()   { return <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>; }
function IcoReloj()  { return <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>; }
function IcoCorazon({ lleno }) {
  return <svg width="16" height="16" viewBox="0 0 24 24" fill={lleno ? '#EF4444' : 'none'} stroke={lleno ? '#EF4444' : 'currentColor'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>;
}

function formatSalario(min, max) {
  const fmt = n => '$' + Math.round(n).toLocaleString('es-CL');
  if (!min && !max) return 'A convenir';
  if (!max) return `Desde ${fmt(min)}`;
  return `${fmt(min)} – ${fmt(max)}`;
}

function tiempoRelativo(fecha) {
  const diff = (Date.now() - new Date(fecha)) / 1000;
  if (diff < 3600)  return `Hace ${Math.floor(diff / 60)} min`;
  if (diff < 86400) return `Hace ${Math.floor(diff / 3600)} h`;
  if (diff < 604800) return `Hace ${Math.floor(diff / 86400)} días`;
  return new Date(fecha).toLocaleDateString('es-CL');
}

export default function JobCard({ oferta, destacada = false }) {
  const [guardada, setGuardada] = useState(false);

  const {
    _id, titulo, descripcion, ubicacion,
    salario_min, salario_max, modalidad,
    publicado_en, especialidades_requeridas,
    empresa_id,
  } = oferta;

  const empresa = empresa_id ?? { nombre_empresa: 'Empresa', logo_url: null };

  return (
    <Link to={`/oferta/${_id}`} className={`job-card card ${destacada ? 'job-card--destacada' : ''}`}>
      {destacada && <div className="job-card-destacada-badge">Destacada</div>}
      <div className="job-card-header">
        <div className="job-empresa-logo">
          {empresa.logo_url
            ? <img src={empresa.logo_url} alt={empresa.nombre_empresa} />
            : <span>{empresa.nombre_empresa?.[0] ?? 'E'}</span>
          }
        </div>
        <div className="job-card-titulo-wrap">
          <h3 className="job-card-titulo">{titulo}</h3>
          <p className="job-empresa-nombre">{empresa.nombre_empresa}</p>
        </div>
        <button
          className={`job-guardar-btn ${guardada ? 'guardada' : ''}`}
          onClick={e => { e.preventDefault(); setGuardada(p => !p); }}
          title={guardada ? 'Quitar de guardados' : 'Guardar oferta'}
        >
          <IcoCorazon lleno={guardada} />
        </button>
      </div>

      <p className="job-card-desc">{descripcion}</p>

      <div className="job-card-tags">
        {especialidades_requeridas?.slice(0, 3).map(tag => (
          <span key={tag} className="badge badge-azul">{tag}</span>
        ))}
      </div>

      <div className="job-card-footer">
        <div className="job-card-meta">
          <span className="job-meta-item">
            <IcoPin /> {ubicacion}
          </span>
          <span className="job-meta-item">
            <IcoPeso /> {formatSalario(salario_min, salario_max)}
          </span>
          <span className={`badge ${modalidad === 'remoto' ? 'badge-verde' : modalidad === 'híbrido' ? 'badge-naranja' : 'badge-gris'}`}>
            {modalidad}
          </span>
        </div>
        <span className="job-meta-item job-tiempo">
          <IcoReloj /> {tiempoRelativo(publicado_en)}
        </span>
      </div>
    </Link>
  );
}
