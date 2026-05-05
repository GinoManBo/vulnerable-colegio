import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';

export default function Chats({ usuario }) {
  const navigate = useNavigate();
  const [conversaciones, setConversaciones] = useState([]);
  const [chatActivo, setChatActivo] = useState(null);
  const [mensajes, setMensajes] = useState([]);
  const [nuevoMensaje, setNuevoMensaje] = useState('');
  const [busqueda, setBusqueda] = useState('');
  const mensajesEndRef = useRef(null);

  useEffect(() => {
    const cargarConversaciones = async () => {
      try {
        setConversaciones([]);
      } catch (error) {
        console.error('Error al cargar conversaciones:', error);
      }
    };
    cargarConversaciones();
  }, [usuario]);

  useEffect(() => {
    mensajesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [mensajes]);

  const enviarMensaje = async () => {
    if (!nuevoMensaje.trim() || !chatActivo) return;
    try {
      setMensajes(prev => [...prev, {
        _id: Date.now(),
        emisor: usuario._id,
        texto: nuevoMensaje,
        creado_en: new Date().toISOString()
      }]);
      setNuevoMensaje('');
    } catch (error) {
      console.error('Error al enviar mensaje:', error);
    }
  };

  const conversacionesFiltradas = conversaciones.filter(c =>
    c.titulo?.toLowerCase().includes(busqueda.toLowerCase())
  );

  return (
    <div className="chats-container">
      <div className="chats-sidebar">
        <div className="chats-header">
          <h2>Chats</h2>
          <input
            type="text"
            placeholder="Buscar conversaciones..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            className="chats-search"
          />
        </div>
        <div className="chats-list">
          {conversacionesFiltradas.length === 0 ? (
            <p className="no-chats">No hay conversaciones</p>
          ) : (
            conversacionesFiltradas.map(conv => (
              <div
                key={conv._id}
                className={`chat-item ${chatActivo?._id === conv._id ? 'active' : ''}`}
                onClick={() => setChatActivo(conv)}
              >
                <div className="chat-avatar">{conv.titulo?.[0] ?? 'C'}</div>
                <div className="chat-info">
                  <p className="chat-title">{conv.titulo}</p>
                  <p className="chat-last-msg">{conv.ultimoMensaje}</p>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      <div className="chat-main">
        {chatActivo ? (
          <>
            <div className="chat-header">
              <div className="chat-header-info">
                <div className="chat-avatar">{chatActivo.titulo?.[0] ?? 'C'}</div>
                <div>
                  <h3>{chatActivo.titulo}</h3>
                </div>
              </div>
            </div>
            <div className="chat-messages">
              {mensajes.map(msg => (
                <div
                  key={msg._id}
                  className={`message ${msg.emisor === usuario._id ? 'sent' : 'received'}`}
                >
                  <p>{msg.texto}</p>
                  <span className="message-time">
                    {new Date(msg.creado_en).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              ))}
              <div ref={mensajesEndRef} />
            </div>
            <div className="chat-input">
              <input
                type="text"
                placeholder="Escribe un mensaje..."
                value={nuevoMensaje}
                onChange={(e) => setNuevoMensaje(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && enviarMensaje()}
              />
              <button onClick={enviarMensaje} className="send-btn">Enviar</button>
            </div>
          </>
        ) : (
          <div className="no-chat-selected">
            <p>Selecciona una conversación para comenzar</p>
          </div>
        )}
      </div>
    </div>
  );
}
