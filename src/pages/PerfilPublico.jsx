import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { perfilAPI } from '../api';
import './PerfilPublico.css';

export default function PerfilPublico() {
  const { id } = useParams();
  const [usuario, setUsuario] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function cargarPerfil() {
      try {
        const datos = await perfilAPI.obtener(id);
        setUsuario(datos);
      } catch (err) {
        setError(err.message);
      } finally {
        setCargando(false);
      }
    }
    cargarPerfil();
  }, [id]);

  if (cargando) return (
    <div style={{display:'flex',alignItems:'center',justifyContent:'center',minHeight:'60vh'}}>
      <div style={{width:36,height:36,border:'3px solid var(--azul-light)',borderTopColor:'var(--azul)',borderRadius:'50%',animation:'spin .8s linear infinite'}}/>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );

  if (error || !usuario) return (
    <div className="perfil-publico-page">
      <div style={{textAlign:'center',padding:'60px 20px'}}>
        <p style={{color:'var(--rojo)',marginBottom:12}}>{error || 'Perfil no encontrado'}</p>
        <Link to="/" className="btn-secondary">Volver al inicio</Link>
      </div>
    </div>
  );

  const perfil = usuario.perfil ?? {};

  return (
    <div className="perfil-publico-page">
      <div className="perfil-publico-inner">
        <Link to="/" className="perfil-publico-back">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="15 18 9 12 15 6"/></svg>
          Volver
        </Link>

        <div className="perfil-publico-card card">
          <div className="perfil-publico-header">
            <div className="perfil-publico-avatar">
              {perfil.foto_perfil_url || perfil.logo_url ? (
                <img src={perfil.foto_perfil_url || perfil.logo_url} alt="avatar" />
              ) : (
                <span>{usuario.nombre?.[0] ?? 'U'}</span>
              )}
            </div>
            <div className="perfil-publico-info">
              <h1>{usuario.nombre} {usuario.apellido}</h1>
              <p className="perfil-publico-rol">
                <span className={`badge ${usuario.rol === 'empresa' ? 'badge-azul' : 'badge-verde'}`}>
                  {usuario.rol === 'empresa' ? 'Empresa' : 'Estudiante'}
                </span>
              </p>
              {usuario.rol === 'empresa' && perfil.nombre_empresa && (
                <p className="perfil-publico-empresa">{perfil.nombre_empresa}</p>
              )}
              {usuario.rol === 'estudiante' && perfil.especialidad && (
                <p className="perfil-publico-especialidad">{perfil.especialidad}</p>
              )}
            </div>
          </div>

          <div className="perfil-publico-body">
            {usuario.rol === 'estudiante' ? (
              <>
                {perfil.descripcion && (
                  <div className="perfil-section">
                    <h3>Sobre mí</h3>
                    <p>{perfil.descripcion}</p>
                  </div>
                )}
                {perfil.ciudad && (
                  <div className="perfil-section">
                    <h3>Ubicación</h3>
                    <p>{perfil.ciudad}</p>
                  </div>
                )}
                {perfil.linkedin && (
                  <div className="perfil-section">
                    <h3>LinkedIn</h3>
                    <a href={perfil.linkedin} target="_blank" rel="noopener noreferrer" className="perfil-link">{perfil.linkedin}</a>
                  </div>
                )}
                {perfil.destrezas && perfil.destrezas.length > 0 && (
                  <div className="perfil-section">
                    <h3>Destrezas</h3>
                    <div className="perfil-tags">
                      {perfil.destrezas.map((d, i) => <span key={i} className="badge badge-azul">{d}</span>)}
                    </div>
                  </div>
                )}
                {perfil.intereses && perfil.intereses.length > 0 && (
                  <div className="perfil-section">
                    <h3>Intereses</h3>
                    <div className="perfil-tags">
                      {perfil.intereses.map((inter, i) => <span key={i} className="badge badge-verde">{inter}</span>)}
                    </div>
                  </div>
                )}
              </>
            ) : (
              <>
                {perfil.descripcion && (
                  <div className="perfil-section">
                    <h3>Descripción</h3>
                    <p>{perfil.descripcion}</p>
                  </div>
                )}
                {perfil.rubro && (
                  <div className="perfil-section">
                    <h3>Rubro</h3>
                    <p>{perfil.rubro}</p>
                  </div>
                )}
                {perfil.ciudad && (
                  <div className="perfil-section">
                    <h3>Ubicación</h3>
                    <p>{perfil.ciudad}{perfil.region ? `, ${perfil.region}` : ''}</p>
                  </div>
                )}
                {perfil.sitio_web && (
                  <div className="perfil-section">
                    <h3>Sitio web</h3>
                    <a href={perfil.sitio_web} target="_blank" rel="noopener noreferrer" className="perfil-link">{perfil.sitio_web}</a>
                  </div>
                )}
                {perfil.telefono && (
                  <div className="perfil-section">
                    <h3>Teléfono</h3>
                    <p>{perfil.telefono}</p>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
