import { Routes, Route, Navigate, Link } from 'react-router-dom'
import Login from './pages/Login'
import RegistroDatos from './pages/RegistroDatos'
import Evaluador from './pages/Evaluador'
import Validacion from './pages/Validacion'
import GestionUsuarios from './pages/GestionUsuarios'
import { AuthProvider, useAuth } from './auth/AuthContext'

function ProtectedRoute({ children, roles }) {
  const { user } = useAuth()
  if (!user) return <Navigate to="/login" />
  if (roles && !roles.some(r => user.roles.includes(r))) return <Navigate to="/" />
  return children
}

function Nav() {
  const { user, logout } = useAuth()
  return (
    <nav style={{ display: 'flex', gap: 12 }}>
      <Link to="/">Inicio</Link>
      {user?.roles.includes('Registro de Datos') && <Link to="/registro">Registro</Link>}
      {user?.roles.includes('Evaluador') && <Link to="/evaluador">Evaluador</Link>}
      {user?.roles.includes('Validacion') && <Link to="/validacion">Validación</Link>}
  {user?.roles.includes('Validacion') && <Link to="/usuarios">Usuarios</Link>}
      <span style={{ marginLeft: 'auto' }}>
        {user ? (
          <>
            {user.nombre} <button onClick={logout}>Salir</button>
          </>
        ) : (
          <Link to="/login">Entrar</Link>
        )}
      </span>
    </nav>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <Nav />
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/registro" element={<ProtectedRoute roles={["Registro de Datos"]}><RegistroDatos /></ProtectedRoute>} />
        <Route path="/evaluador" element={<ProtectedRoute roles={["Evaluador"]}><Evaluador /></ProtectedRoute>} />
        <Route path="/validacion" element={<ProtectedRoute roles={["Validacion"]}><Validacion /></ProtectedRoute>} />
  <Route path="/usuarios" element={<ProtectedRoute roles={["Validacion"]}><GestionUsuarios /></ProtectedRoute>} />
        <Route path="/" element={<div style={{ padding: 16 }}>Bienvenido al Sistema de Salubridad</div>} />
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </AuthProvider>
  )
}
