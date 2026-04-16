import { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import NavBar      from './assets/NavBar';
import HomePage    from './pages/HomePage';
import AuthPage    from './pages/AuthPage';
import MiPerfil    from './pages/MiPerfil';
import Configuracion  from './pages/Configuracion';
import VistaEmpresa   from './pages/VistaEmpresa';
import DetalleOferta  from './pages/DetalleOferta';
import Mensajes       from './pages/Mensajes';
import PanelAdmin     from './pages/PanelAdmin';
import './index.css';

function RutaProtegida({ usuario, roles, children }) {
  if (!usuario) return <Navigate to="/acceso" replace />;
  if (roles && !roles.includes(usuario.rol)) return <Navigate to="/" replace />;
  return children;
}

export default function App() {
  const [usuario, setUsuario] = useState(null);

  function homeSegunRol() {
    if (!usuario) return <Navigate to="/acceso" replace />;
    if (usuario.rol === 'empresa') return <VistaEmpresa usuario={usuario} />;
    if (usuario.rol === 'admin')   return <PanelAdmin   usuario={usuario} />;
    return <HomePage />;
  }

  return (
    <BrowserRouter>
      {usuario && <NavBar usuario={usuario} onLogout={() => setUsuario(null)} />}
      <Routes>
        <Route path="/acceso" element={usuario ? <Navigate to="/" replace /> : <AuthPage onLogin={u => setUsuario(u)} />} />

        <Route path="/"              element={homeSegunRol()} />
        <Route path="/perfil"        element={<RutaProtegida usuario={usuario}><MiPerfil usuario={usuario} /></RutaProtegida>} />
        <Route path="/configuracion" element={<RutaProtegida usuario={usuario}><Configuracion /></RutaProtegida>} />
        <Route path="/mensajes"      element={<RutaProtegida usuario={usuario}><Mensajes usuario={usuario} /></RutaProtegida>} />
        <Route path="/oferta/:id"    element={<RutaProtegida usuario={usuario}><DetalleOferta usuario={usuario} /></RutaProtegida>} />
        <Route path="/admin"         element={<RutaProtegida usuario={usuario} roles={['admin']}><PanelAdmin usuario={usuario} /></RutaProtegida>} />
        <Route path="/empresa"       element={<RutaProtegida usuario={usuario} roles={['empresa','admin']}><VistaEmpresa usuario={usuario} /></RutaProtegida>} />
        <Route path="/perfil/:id"    element={<RutaProtegida usuario={usuario}><div style={{padding:'40px 24px'}}>Perfil público</div></RutaProtegida>} />
        <Route path="/empresa/:id"   element={<RutaProtegida usuario={usuario}><div style={{padding:'40px 24px'}}>Perfil empresa</div></RutaProtegida>} />
        <Route path="/notificaciones"element={<RutaProtegida usuario={usuario}><div style={{padding:'40px 24px'}}>Notificaciones</div></RutaProtegida>} />
        <Route path="/explorar"      element={<RutaProtegida usuario={usuario}><div style={{padding:'40px 24px'}}>Explorar</div></RutaProtegida>} />
        <Route path="*"              element={<Navigate to={usuario ? '/' : '/acceso'} replace />} />
      </Routes>
    </BrowserRouter>
  );
}
