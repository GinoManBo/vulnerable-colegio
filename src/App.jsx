import { BrowserRouter, Routes, Route } from 'react-router-dom';
import NavBar from './assets/NavBar';
import HomePage from './pages/HomePage';
import './index.css';

const MOCK_USUARIO = {
  nombre: 'Ginol',
  rol: 'Estudiante',
  foto: null,
};

export default function App() {
  return (
    <BrowserRouter>
      <NavBar usuario={MOCK_USUARIO} />
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/perfil/:id" element={<div style={{ padding: '40px 24px', color: 'var(--texto)' }}>Perfil de usuario — próximamente</div>} />
        <Route path="/empresa/:id" element={<div style={{ padding: '40px 24px', color: 'var(--texto)' }}>Perfil de empresa — próximamente</div>} />
        <Route path="/oferta/:id" element={<div style={{ padding: '40px 24px', color: 'var(--texto)' }}>Detalle de oferta — próximamente</div>} />
        <Route path="/mensajes" element={<div style={{ padding: '40px 24px', color: 'var(--texto)' }}>Mensajes — próximamente</div>} />
        <Route path="/notificaciones" element={<div style={{ padding: '40px 24px', color: 'var(--texto)' }}>Notificaciones — próximamente</div>} />
        <Route path="/configuracion" element={<div style={{ padding: '40px 24px', color: 'var(--texto)' }}>Configuración — próximamente</div>} />
        <Route path="/explorar" element={<div style={{ padding: '40px 24px', color: 'var(--texto)' }}>Explorar perfiles — próximamente</div>} />
      </Routes>
    </BrowserRouter>
  );
}
