import { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import NavBar from './assets/NavBar';
import HomePage from './pages/HomePage';
import AuthPage from './pages/AuthPage';
import MiPerfil from './pages/MiPerfil';
import Configuracion from './pages/Configuracion';
import './index.css';

export default function App() {
  const [usuario, setUsuario] = useState(null);

  return (
    <BrowserRouter>
      {usuario && <NavBar usuario={usuario} onLogout={() => setUsuario(null)} />}
      <Routes>
        <Route path="/acceso"        element={usuario ? <Navigate to="/" replace />                                                : <AuthPage onLogin={u => setUsuario(u)} />} />
        <Route path="/"              element={usuario ? <HomePage />                                                               : <Navigate to="/acceso" replace />} />
        <Route path="/perfil"        element={usuario ? <MiPerfil usuario={usuario} />                                             : <Navigate to="/acceso" replace />} />
        <Route path="/configuracion" element={usuario ? <Configuracion />                                                          : <Navigate to="/acceso" replace />} />
        <Route path="/perfil/:id"    element={usuario ? <div style={{padding:'40px 24px'}}>Perfil público — próximamente</div>     : <Navigate to="/acceso" replace />} />
        <Route path="/empresa/:id"   element={usuario ? <div style={{padding:'40px 24px'}}>Perfil empresa — próximamente</div>     : <Navigate to="/acceso" replace />} />
        <Route path="/oferta/:id"    element={usuario ? <div style={{padding:'40px 24px'}}>Detalle oferta — próximamente</div>     : <Navigate to="/acceso" replace />} />
        <Route path="/mensajes"      element={usuario ? <div style={{padding:'40px 24px'}}>Mensajes — próximamente</div>           : <Navigate to="/acceso" replace />} />
        <Route path="/notificaciones"element={usuario ? <div style={{padding:'40px 24px'}}>Notificaciones — próximamente</div>     : <Navigate to="/acceso" replace />} />
        <Route path="/explorar"      element={usuario ? <div style={{padding:'40px 24px'}}>Explorar — próximamente</div>           : <Navigate to="/acceso" replace />} />
        <Route path="*"              element={<Navigate to={usuario ? '/' : '/acceso'} replace />} />
      </Routes>
    </BrowserRouter>
  );
}
