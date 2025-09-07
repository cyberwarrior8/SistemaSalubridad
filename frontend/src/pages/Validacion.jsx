import { useEffect, useState } from 'react'
import api from '../lib/api'

export default function Validacion() {
  const [asig, setAsig] = useState({ id_muestra: '', id_evaluador: '', comentario: '' })
  const [pendientes, setPendientes] = useState([])
  const [enAnalisis, setEnAnalisis] = useState([])
  const [evaluadores, setEvaluadores] = useState([])
  const [validar, setValidar] = useState({ id_informe: '', accion: 'Validado', comentario: '' })
  const [msg, setMsg] = useState('')

  async function refreshLists() {
    const p = await api.get('/api/muestras/pendientes')
    setPendientes(p.data)
    const a = await api.get('/api/muestras/en-analisis')
    setEnAnalisis(a.data)
  }

  useEffect(() => {
    (async () => {
      await refreshLists()
      const e = await api.get('/api/usuarios?rol=Evaluador')
      setEvaluadores(e.data)
    })()
    const t = setInterval(refreshLists, 10000)
    return () => clearInterval(t)
  }, [])

  async function asignar(e) {
    e.preventDefault()
    setMsg('')
    await api.post(`/api/muestras/${asig.id_muestra}/asignar`, { id_evaluador: +asig.id_evaluador, comentario: asig.comentario || null })
    setMsg('Evaluador asignado')
  await refreshLists()
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
        <label>
          Muestra
          <select value={asig.id_muestra} onChange={e => setAsig({ ...asig, id_muestra: e.target.value })}>
            <option value="">Seleccione…</option>
            {pendientes.map(m => (
              <option key={m.id_muestra} value={m.id_muestra}>{`#${m.id_muestra} - ${m.codigo_unico} (${m.tipo})`}</option>
            ))}
          </select>
        </label>
        <label>
          Evaluador
          <select value={asig.id_evaluador} onChange={e => setAsig({ ...asig, id_evaluador: e.target.value })}>
            <option value="">Seleccione…</option>
            {evaluadores.map(u => (
              <option key={u.id_usuario} value={u.id_usuario}>{u.nombre} ({u.correo})</option>
            ))}
          </select>
        </label>
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
      <section>
        <h3>Muestras en análisis</h3>
        <table border="1" cellPadding="6" style={{ borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              <th>ID</th><th>Código</th><th>Tipo</th><th>Evaluador</th><th>Correo</th>
            </tr>
          </thead>
          <tbody>
            {enAnalisis.map(m => (
              <tr key={m.id_muestra}>
                <td>{m.id_muestra}</td>
                <td>{m.codigo_unico}</td>
                <td>{m.tipo}</td>
                <td>{m.evaluador_nombre || '-'}</td>
                <td>{m.evaluador_correo || '-'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
      {msg && <div>{msg}</div>}
    </div>
  )
}
