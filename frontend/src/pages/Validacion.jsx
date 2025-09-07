import { useState } from 'react'
import api from '../lib/api'

export default function Validacion() {
  const [asig, setAsig] = useState({ id_muestra: '', id_evaluador: '', comentario: '' })
  const [validar, setValidar] = useState({ id_informe: '', accion: 'Validado', comentario: '' })
  const [msg, setMsg] = useState('')

  async function asignar(e) {
    e.preventDefault()
    setMsg('')
    await api.post(`/api/muestras/${asig.id_muestra}/asignar`, { id_evaluador: +asig.id_evaluador, comentario: asig.comentario || null })
    setMsg('Evaluador asignado')
  }

  async function validarInforme(e) {
    e.preventDefault()
    setMsg('')
    await api.post(`/api/informes/${validar.id_informe}/validar`, { accion: validar.accion, comentario: validar.comentario || null })
    setMsg(`Informe ${validar.accion}`)
  }

  return (
    <div style={{ display: 'grid', gap: 16, padding: 16 }}>
      <h2>Validación</h2>

      <form onSubmit={asignar} style={{ display: 'grid', gap: 8 }}>
        <strong>Asignar Evaluador</strong>
        <input placeholder="ID Muestra" value={asig.id_muestra} onChange={e => setAsig({ ...asig, id_muestra: e.target.value })} />
        <input placeholder="ID Evaluador" value={asig.id_evaluador} onChange={e => setAsig({ ...asig, id_evaluador: e.target.value })} />
        <input placeholder="Comentario" value={asig.comentario} onChange={e => setAsig({ ...asig, comentario: e.target.value })} />
        <button>Asignar</button>
      </form>

      <form onSubmit={validarInforme} style={{ display: 'grid', gap: 8 }}>
        <strong>Validar Informe</strong>
        <input placeholder="ID Informe" value={validar.id_informe} onChange={e => setValidar({ ...validar, id_informe: e.target.value })} />
        <select value={validar.accion} onChange={e => setValidar({ ...validar, accion: e.target.value })}>
          <option value="Validado">Validar</option>
          <option value="Devuelto">Devolver</option>
        </select>
        <input placeholder="Comentario" value={validar.comentario} onChange={e => setValidar({ ...validar, comentario: e.target.value })} />
        <button>Enviar</button>
      </form>
      {msg && <div>{msg}</div>}
    </div>
  )
}
