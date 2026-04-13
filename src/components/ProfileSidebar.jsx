import { useState } from 'react';
import { Link } from 'react-router-dom';
import './ProfileSidebar.css';

const MOCK_PERFILES = [
  { _id: '1', nombre: 'Valentina Mora',   rol: 'estudiante', especialidad: 'Mecatrónica',  puntuacion: 6.2, destrezas: ['AutoCAD', 'SolidWorks'], conectado: false },
  { _id: '2', nombre: 'Diego Fuentes',    rol: 'estudiante', especialidad: 'Electricidad', puntuacion: 6.8, destrezas: ['PLC', 'Instalaciones'], conectado: false },
  { _id: '3', nombre: 'TechChile S.A.',   rol: 'empresa',    rubro: 'Tecnología',           activos: 4, conectado: false },
  { _id: '4', nombre: 'Camila Torres',    rol: 'estudiante', especialidad: 'Redes',         puntuacion: 5.9, destrezas: ['CCNA', 'Linux'], conectado: false },
  { _id: '5', nombre: 'Constructora Sur', rol: 'empresa',    rubro: 'Construcción',         activos: 2, conectado: false },
];

function StarRating({ valor }) {
  const pct = ((valor / 7) * 100).toFixed(0);
  return (
    <div className="star-rating" title={`${valor.toFixed(1)} / 7`}>
      <div className="star-bar-bg">
        <div className="star-bar-fill" style={{ width: `${pct}%` }} />
      </div>
      <span className="star-valor">{valor.toFixed(1)}</span>
    </div>
  );
}

export default function ProfileSidebar() {
  const [perfiles, setPerfiles] = useState(MOCK_PERFILES);

  function toggleConectar(id) {
    setPerfiles(prev => prev.map(p => p._id === id ? { ...p, conectado: !p.conectado } : p));
  }

  return (
    <aside className="profile-sidebar">
      <div className="sidebar-section card">
        <h2 className="sidebar-title">Perfiles sugeridos</h2>
        <div className="sidebar-perfiles">
          {perfiles.map(p => (
            <div key={p._id} className="sidebar-perfil-item">
              <Link to={p.rol === 'empresa' ? `/empresa/${p._id}` : `/perfil/${p._id}`} className="sidebar-perfil-link">
                <div className={`avatar sidebar-avatar ${p.rol}`} style={{ width: 40, height: 40, fontSize: 15 }}>
                  {p.nombre[0]}
                </div>
                <div className="sidebar-perfil-info">
                  <p className="sidebar-perfil-nombre">{p.nombre}</p>
                  {p.rol === 'estudiante' ? (
                    <>
                      <p className="sidebar-perfil-sub">{p.especialidad}</p>
                      <StarRating valor={p.puntuacion} />
                    </>
                  ) : (
                    <p className="sidebar-perfil-sub">{p.rubro} · {p.activos} ofertas activas</p>
                  )}
                </div>
              </Link>
              <button
                className={`conectar-btn ${p.conectado ? 'conectado' : ''}`}
                onClick={() => toggleConectar(p._id)}
              >
                {p.conectado ? '✓' : '+'}
              </button>
            </div>
          ))}
        </div>
        <Link to="/explorar" className="sidebar-ver-mas">Ver más perfiles</Link>
      </div>

      <div className="sidebar-section card">
        <h2 className="sidebar-title">Especialidades en demanda</h2>
        <div className="demanda-lista">
          {[
            { nombre: 'Electricidad industrial', ofertas: 12 },
            { nombre: 'Mecatrónica',              ofertas: 9  },
            { nombre: 'Redes y comunicaciones',   ofertas: 7  },
            { nombre: 'Automatización PLC',        ofertas: 6  },
            { nombre: 'Construcción',              ofertas: 11 },
          ].map(d => (
            <Link key={d.nombre} to={`/buscar?q=${encodeURIComponent(d.nombre)}`} className="demanda-item">
              <span className="demanda-nombre">{d.nombre}</span>
              <span className="badge badge-azul">{d.ofertas}</span>
            </Link>
          ))}
        </div>
      </div>
    </aside>
  );
}
