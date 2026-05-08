import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ofertasAPI, getMediaUrl } from '../api';
import ConfirmDialog from './ConfirmDialog';
import './JobCard.css';

function IcoPin() {
  return (
    <svg
      width="13"
      height="13"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
      <circle cx="12" cy="10" r="3" />
    </svg>
  );
}

function IcoPeso() {
  return (
    <svg
      width="13"
      height="13"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <line x1="12" y1="1" x2="12" y2="23" />
      <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
    </svg>
  );
}

function IcoReloj() {
  return (
    <svg
      width="13"
      height="13"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  );
}

function IcoCorazon({ lleno }) {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill={lleno ? '#EF4444' : 'none'}
      stroke={lleno ? '#EF4444' : 'currentColor'}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
    </svg>
  );
}

function IcoCheck() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

function formatSalario(min, max) {
  const fmt = (n) => '$' + Math.round(Number(n)).toLocaleString('es-CL');

  if (!min && !max) return 'A convenir';
  if (!max) return `Desde ${fmt(min)}`;

  return `${fmt(min)} – ${fmt(max)}`;
}

function tiempoRelativo(fecha) {
  const diff = (Date.now() - new Date(fecha)) / 1000;

  if (diff < 60) {
    return 'Hace unos segundos';
  }

  if (diff < 3600) {
    return `Hace ${Math.floor(diff / 60)} min`;
  }

  if (diff < 86400) {
    return `Hace ${Math.floor(diff / 3600)} h`;
  }

  if (diff < 604800) {
    return `Hace ${Math.floor(diff / 86400)} días`;
  }

  return new Date(fecha).toLocaleDateString('es-CL');
}

export default function JobCard({
  oferta,
  destacada = false,
  usuario,
  onPostuladoExito,
  yaPostulado = false,
  estadoPostulacion,
}) {
  const [guardada, setGuardada] = useState(false);
  const [cargando, setCargando] = useState(false);
  const [mostrarConfirm, setMostrarConfirm] = useState(false);
  const [postuladoLocal, setPostuladoLocal] = useState(false);

  const navigate = useNavigate();

  const {
    _id,
    titulo,
    descripcion,
    ubicacion,
    salario_min,
    salario_max,
    modalidad,
    publicado_en,
    especialidades_requeridas,
    empresa_id,
  } = oferta;

  const empresa = empresa_id ?? {
    nombre_empresa: 'Empresa',
    logo_url: null,
  };

  function handleCardClick(e) {
    // Solo navegar si el click no fue en un botón
    if (e.target.closest('button')) return;
    navigate(`/oferta/${_id}`);
  }

  async function handlePostular(e) {
    e.preventDefault();
    e.stopPropagation();

    if (!usuario) {
      navigate('/acceso');
      return;
    }

    if (usuario.rol !== 'estudiante') {
      alert('Solo los estudiantes pueden postularse');
      return;
    }

    setMostrarConfirm(true);
  }

  async function confirmarPostulacion() {
    setCargando(true);

    try {
      await ofertasAPI.postularse(_id, {
        carta_presentacion: '',
      });

      alert('¡Postulación enviada exitosamente!');

      setPostuladoLocal(true);
      setMostrarConfirm(false);

      // Disparar eventos para actualizar UI
      window.dispatchEvent(new Event('recargar-notificaciones'));
      window.dispatchEvent(new Event('actualizar-postulaciones'));

      if (onPostuladoExito) {
        onPostuladoExito();
      }
    } catch (err) {

      // Si el error es "Ya postulaste", marcamos como postulado
      if (err.message?.includes('Ya postulaste')) {
        setPostuladoLocal(true);
      }

      alert(`Error: ${err.message || 'No se pudo realizar la postulación'}`);
      setMostrarConfirm(false);
    } finally {
      setCargando(false);
    }
  }

  function handleGuardar(e) {
    e.preventDefault();
    e.stopPropagation();

    setGuardada((prev) => !prev);
  }

  return (
    <>
      <div
        onClick={handleCardClick}
        className={`job-card card ${
          destacada ? 'job-card--destacada' : ''
        }`}
        style={{ cursor: 'pointer' }}
      >
        {destacada && (
          <div className="job-card-destacada-badge">
            Destacada
          </div>
        )}

        <div className="job-card-header">
          <div className="job-empresa-logo">
            {empresa.logo_url ? (
              <img
                src={getMediaUrl(empresa.logo_url)}
                alt={empresa.nombre_empresa}
              />
            ) : (
              <span>
                {empresa.nombre_empresa?.[0] ?? 'E'}
              </span>
            )}
          </div>

          <div className="job-card-titulo-wrap">
            <h3 className="job-card-titulo">
              {titulo}
            </h3>

            <p className="job-empresa-nombre">
              {empresa.nombre_empresa}
            </p>
          </div>

          <button
            type="button"
            className={`job-guardar-btn ${
              guardada ? 'guardada' : ''
            }`}
            onClick={handleGuardar}
            title={
              guardada
                ? 'Quitar de guardados'
                : 'Guardar oferta'
            }
          >
            <IcoCorazon lleno={guardada} />
          </button>
        </div>

        <p className="job-card-desc">
          {descripcion}
        </p>

        <div className="job-card-tags">
          {especialidades_requeridas
            ?.slice(0, 3)
            .map((tag) => (
              <span
                key={tag}
                className="badge badge-azul"
              >
                {tag}
              </span>
            ))}
        </div>

        <div className="job-card-footer">
          <div className="job-card-meta">
            <span className="job-meta-item">
              <IcoPin /> {ubicacion}
            </span>

            <span className="job-meta-item">
              <IcoPeso />{' '}
              {formatSalario(
                salario_min,
                salario_max
              )}
            </span>

            <span
              className={`badge ${
                modalidad === 'remoto'
                  ? 'badge-verde'
                  : modalidad === 'híbrido'
                  ? 'badge-naranja'
                  : 'badge-gris'
              }`}
            >
              {modalidad}
            </span>
          </div>

          <div
            style={{
              display: 'flex',
              gap: '8px',
              alignItems: 'center',
            }}
          >
            <span className="job-meta-item job-tiempo">
              <IcoReloj />{' '}
              {tiempoRelativo(publicado_en)}
            </span>

            {usuario?.rol === 'estudiante' && (
              usuario?.perfilPendiente
                ? <div className="btn-postulado btn-pendiente" title="Tu perfil está pendiente de verificación">Pendiente</div>
                : (yaPostulado || postuladoLocal) ? (
                  estadoPostulacion === 'aceptada' ? (
                    <div className="btn-postulado btn-aceptado" title="Fuiste aceptado en esta oferta">
                      <IcoCheck />
                      Aceptado
                    </div>
                  ) : estadoPostulacion === 'rechazada' ? (
                    <div className="btn-postulado btn-rechazado" title="Tu postulación fue rechazada">
                      Rechazado
                    </div>
                  ) : (
                    <div className="btn-postulado" title="Ya postulaste a esta oferta">
                      <IcoCheck />
                      Postulado
                    </div>
                  )
                ) : (
                  <button
                    type="button"
                    className="btn-postular"
                    onClick={handlePostular}
                    disabled={cargando}
                    title="Postularse a esta oferta"
                  >
                    {cargando ? '...' : 'Postular'}
                  </button>
                )
            )}
          </div>
        </div>
      </div>

      {mostrarConfirm && (
        <ConfirmDialog
          titulo="Confirmar postulación"
          mensaje={`¿Estás seguro de que deseas postularte a "${titulo}"?`}
          textoCancelar="Cancelar"
          textoConfirmar="Postular"
          cargando={cargando}
          onConfirmar={confirmarPostulacion}
          onCancelar={() => setMostrarConfirm(false)}
        />
      )}
    </>
  );
}
