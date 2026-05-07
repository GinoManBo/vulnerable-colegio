import { useState, useEffect } from 'react';
import { fetchAPI } from '../api';

export default function OnlineStatus({ usuarioId, size = 10 }) {
  const [enLinea, setEnLinea] = useState(false);

  useEffect(() => {
    if (!usuarioId) return;
    fetchAPI(`/usuarios/${usuarioId}/en-linea`)
      .then(res => setEnLinea(res.enLinea))
      .catch(() => setEnLinea(false));

    const interval = setInterval(() => {
      fetchAPI(`/usuarios/${usuarioId}/en-linea`)
        .then(res => setEnLinea(res.enLinea))
        .catch(() => setEnLinea(false));
    }, 10000);

    return () => clearInterval(interval);
  }, [usuarioId]);

  return (
    <span
      className="online-dot"
      title={enLinea ? 'En línea' : 'Desconectado'}
      style={{
        width: size,
        height: size,
        borderRadius: '50%',
        background: enLinea ? '#1DB67A' : '#9CA3AF',
        display: 'inline-block',
        flexShrink: 0,
        boxShadow: enLinea ? '0 0 4px rgba(29,182,122,.5)' : 'none',
      }}
    />
  );
}
