import './ConfirmDialog.css';

export default function ConfirmDialog({ titulo, mensaje, textoCancelar = 'Cancelar', textoConfirmar = 'Confirmar', onConfirmar, onCancelar, cargando = false, peligroso = false }) {
  return (
    <div className="confirm-dialog-overlay" onClick={onCancelar}>
      <div className="confirm-dialog" onClick={e => e.stopPropagation()}>
        <div className="confirm-dialog-header">
          <h2>{titulo}</h2>
        </div>
        <div className="confirm-dialog-body">
          <p>{mensaje}</p>
        </div>
        <div className="confirm-dialog-footer">
          <button className="btn-secondary" onClick={onCancelar} disabled={cargando}>
            {textoCancelar}
          </button>
          <button 
            className={`btn-primary ${peligroso ? 'btn-danger' : ''}`} 
            onClick={onConfirmar} 
            disabled={cargando}
          >
            {cargando ? '...' : textoConfirmar}
          </button>
        </div>
      </div>
    </div>
  );
}
