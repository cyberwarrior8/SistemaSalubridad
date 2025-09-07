import { useState } from 'react'
import api from '../lib/api'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'

export default function Login() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [correo, setCorreo] = useState('registrador@example.com')
  const [password, setPassword] = useState('Password!123')
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
    <form onSubmit={onSubmit} style={{ maxWidth: 360, margin: '2rem auto', display: 'grid', gap: 8 }}>
      <h2>Iniciar sesión</h2>
      <input placeholder="Correo" value={correo} onChange={e => setCorreo(e.target.value)} />
      <input placeholder="Contraseña" type="password" value={password} onChange={e => setPassword(e.target.value)} />
      <button type="submit">Entrar</button>
      {error && <div style={{ color: 'red' }}>{error}</div>}
    </form>
  )
}
