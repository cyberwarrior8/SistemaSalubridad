import { useState } from 'react'
import api from '../lib/api'

export default function Evaluador() {
  const [ensayo, setEnsayo] = useState({ id_muestra: '', id_parametro: '', resultado: '', dentro_norma: true })
  const [msg, setMsg] = useState('')

  async function crearEnsayo(e) {
    e.preventDefault()
    setMsg('')
    await api.post('/api/ensayos', { ...ensayo, id_muestra: +ensayo.id_muestra, id_parametro: +ensayo.id_parametro })
    setMsg('Ensayo registrado')
  }

  return (
    <form onSubmit={crearEnsayo} style={{ display: 'grid', gap: 8, padding: 16 }}>
      <h2>Evaluador</h2>
      <input placeholder="ID Muestra" value={ensayo.id_muestra} onChange={e => setEnsayo({ ...ensayo, id_muestra: e.target.value })} />
      <input placeholder="ID Parámetro" value={ensayo.id_parametro} onChange={e => setEnsayo({ ...ensayo, id_parametro: e.target.value })} />
      <input placeholder="Resultado" value={ensayo.resultado} onChange={e => setEnsayo({ ...ensayo, resultado: e.target.value })} />
      <label>
        <input type="checkbox" checked={ensayo.dentro_norma} onChange={e => setEnsayo({ ...ensayo, dentro_norma: e.target.checked })} /> Dentro de norma
      </label>
      <button>Registrar Ensayo</button>
      {msg && <div>{msg}</div>}
    </form>
  )
}
