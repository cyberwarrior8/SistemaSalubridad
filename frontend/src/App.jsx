import { Routes, Route, Navigate, Link } from 'react-router-dom'
import Login from './pages/Login'
import RegistroDatos from './pages/RegistroDatos'
import Evaluador from './pages/Evaluador'
import Validacion from './pages/Validacion'
import GestionUsuarios from './pages/GestionUsuarios'
import GestionParametros from './pages/GestionParametros'
import { AuthProvider, useAuth } from './auth/AuthContext'
import './styles.css'

function ProtectedRoute({ children, roles }) {
  const { user } = useAuth()
  if (!user) return <Navigate to="/login" />
  if (roles && !roles.some(r => user.roles.includes(r))) return <Navigate to="/" />
  return children
}

function Nav() {
  const { user, logout } = useAuth()
  return (
    <header className="navbar">
      <div className="brand">Sistema <span className="brand-accent">Salubridad</span></div>
      <nav className="nav-links">
        <Link to="/">Inicio</Link>
        {user?.roles.includes('Registro de Datos') && <Link to="/registro">Registro</Link>}
        {user?.roles.includes('Evaluador') && <Link to="/evaluador">Evaluador</Link>}
        {user?.roles.includes('Validacion') && <Link to="/validacion">Validación</Link>}
        {user?.roles.includes('Validacion') && <Link to="/usuarios">Usuarios</Link>}
        {user?.roles.includes('Validacion') && <Link to="/parametros">Parámetros</Link>}
      </nav>
      <div className="nav-spacer" />
      <div className="nav-links">
        {user ? (
          <>
            <span className="muted">{user.nombre}</span>
            <button className="btn btn-outline" onClick={logout}>Salir</button>
          </>
        ) : (
          <Link to="/login" className="btn btn-primary">Entrar</Link>
        )}
      </div>
    </header>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <div className="app-shell">
        <Nav />
        <main>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/registro" element={<ProtectedRoute roles={["Registro de Datos"]}><RegistroDatos /></ProtectedRoute>} />
            <Route path="/evaluador" element={<ProtectedRoute roles={["Evaluador"]}><Evaluador /></ProtectedRoute>} />
            <Route path="/validacion" element={<ProtectedRoute roles={["Validacion"]}><Validacion /></ProtectedRoute>} />
            <Route path="/usuarios" element={<ProtectedRoute roles={["Validacion"]}><GestionUsuarios /></ProtectedRoute>} />
            <Route path="/parametros" element={<ProtectedRoute roles={["Validacion"]}><GestionParametros /></ProtectedRoute>} />
            <Route path="/" element={
              <div className="container">
                <section className="hero">
                  <div className="hero-body">
                    <h1>Bienvenido al Sistema de Salubridad</h1>
                    <p>Gestione muestras, parámetros, evaluaciones e informes con una experiencia moderna y eficiente.</p>
                    <div className="field-row" style={{ marginTop: 6 }}>
                      <Link to="/registro" className="btn btn-primary">Registrar Muestra</Link>
                      <Link to="/evaluador" className="btn">Ir a Evaluación</Link>
                      <Link to="/validacion" className="btn">Validación</Link>
                    </div>
                  </div>
                </section>
                <div className="grid cols-3">
                  <div className="card">
                    <div className="card-header">Registro de Datos</div>
                    <div className="card-body">
                      Ingrese muestras y solicitantes de forma ágil con validaciones y búsqueda asistida.
                    </div>
                  </div>
                  <div className="card">
                    <div className="card-header">Evaluación</div>
                    <div className="card-body">
                      Registre resultados por parámetro con normas de referencia y genere informes PDF.
                    </div>
                  </div>
                  <div className="card">
                    <div className="card-header">Validación</div>
                    <div className="card-body">
                      Asigne evaluadores, revise versiones y valide o devuelva informes.
                    </div>
                  </div>
                </div>
              </div>
            } />
            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </main>
      </div>
    </AuthProvider>
  )
}
