import { useState } from 'react'
import api from '../lib/api'

export default function Evaluador() {
  const [ensayo, setEnsayo] = useState({ id_muestra: '', id_parametro: '', resultado: '', dentro_norma: true })
  const [msg, setMsg] = useState('')
  const [pdf, setPdf] = useState(null)
  const [idMuestraInforme, setIdMuestraInforme] = useState('')

  async function crearEnsayo(e) {
    e.preventDefault()
    setMsg('')
    await api.post('/api/ensayos', { ...ensayo, id_muestra: +ensayo.id_muestra, id_parametro: +ensayo.id_parametro })
    setMsg('Ensayo registrado')
  }

  return (
    <div style={{ display: 'grid', gap: 24, padding: 16 }}>
      <form onSubmit={crearEnsayo} style={{ display: 'grid', gap: 8 }}>
        <h2>Evaluador</h2>
        <input placeholder="ID Muestra" value={ensayo.id_muestra} onChange={e => setEnsayo({ ...ensayo, id_muestra: e.target.value })} />
        <input placeholder="ID Parámetro" value={ensayo.id_parametro} onChange={e => setEnsayo({ ...ensayo, id_parametro: e.target.value })} />
        <input placeholder="Resultado" value={ensayo.resultado} onChange={e => setEnsayo({ ...ensayo, resultado: e.target.value })} />
        <label>
          <input type="checkbox" checked={ensayo.dentro_norma} onChange={e => setEnsayo({ ...ensayo, dentro_norma: e.target.checked })} /> Dentro de norma
        </label>
        <button>Registrar Ensayo</button>
      </form>

      <form style={{ display: 'grid', gap: 8 }} onSubmit={async e => {
        e.preventDefault()
        setMsg('')
        if (!pdf) return setMsg('Seleccione un PDF')
        const data = new FormData()
        data.append('id_muestra', idMuestraInforme)
        data.append('pdf', pdf)
        await api.post('/api/informes/upload', data, { headers: { 'Content-Type': 'multipart/form-data' } })
        setMsg('Informe creado con PDF')
      }}>
        <strong>Subir PDF de Informe</strong>
        <input placeholder="ID Muestra" value={idMuestraInforme} onChange={e => setIdMuestraInforme(e.target.value)} />
        <input type="file" accept="application/pdf" onChange={e => setPdf(e.target.files?.[0] || null)} />
        <button>Subir PDF</button>
      </form>
      {msg && <div>{msg}</div>}
    </div>
  )
}
