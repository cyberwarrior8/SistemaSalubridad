import { useState } from 'react'
import api from '../lib/api'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'

export default function Login() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [correo, setCorreo] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState(null)

  async function onSubmit(e) {
    e.preventDefault()
    setError(null)
    try {
      const { data } = await api.post('/api/auth/login', { correo, password })
  login(data.token)
  navigate('/')
    } catch (err) {
      setError(err.response?.data?.message || 'Error')
    }
  }

  return (
    <div className="container" style={{ display: 'grid', placeItems: 'center', minHeight: 'calc(100vh - 64px)' }}>
      <form onSubmit={onSubmit} className="card" style={{ width: 360 }}>
        <div className="card-header">Iniciar sesión</div>
        <div className="card-body" style={{ display: 'grid', gap: 10 }}>
          <div className="field">
            <label>Correo</label>
            <input placeholder="usuario@dominio.com" value={correo} onChange={e => setCorreo(e.target.value)} />
          </div>
          <div className="field">
            <label>Contraseña</label>
            <input placeholder="••••••••" type="password" value={password} onChange={e => setPassword(e.target.value)} />
          </div>
          <button type="submit" className="btn btn-primary">Entrar</button>
          {error && <div className="alert error">{error}</div>}
        </div>
      </form>
    </div>
  )
}
