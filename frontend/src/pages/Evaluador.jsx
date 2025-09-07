import { useEffect, useState } from 'react'
import api from '../lib/api'

export default function Evaluador() {
  const [asignadas, setAsignadas] = useState([])
  const [seleccion, setSeleccion] = useState(null)
  const [parametros, setParametros] = useState([])
  const [resultados, setResultados] = useState({}) // key: id_parametro => { resultado, dentro_norma }
  const [msg, setMsg] = useState('')

  useEffect(() => {
    (async () => {
      const { data } = await api.get('/api/ensayos/asignadas')
      setAsignadas(data)
    })()
  }, [])

  async function cargarParametros(id_muestra) {
    setSeleccion(asignadas.find(m => m.id_muestra === id_muestra) || null)
    const { data } = await api.get(`/api/ensayos/muestras/${id_muestra}/parametros`)
    setParametros(data)
    setResultados({})
    setMsg('')
  }

  async function guardarParametro(id_parametro) {
    const r = resultados[id_parametro]
    if (!r || !r.resultado) return setMsg('Completa el resultado')
    await api.post('/api/ensayos', {
      id_muestra: seleccion.id_muestra,
      id_parametro,
      resultado: r.resultado,
      dentro_norma: !!r.dentro_norma
    })
    setMsg('Parámetro guardado')
  }

  async function completarEvaluacion() {
    if (!seleccion) return
    await api.post(`/api/ensayos/muestras/${seleccion.id_muestra}/completar`)
    setMsg('Evaluación completada')
  }

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 24, padding: 16 }}>
      <div>
        <h2>Muestras asignadas</h2>
        <ul>
          {asignadas.map(m => (
            <li key={m.id_muestra}>
              <button onClick={() => cargarParametros(m.id_muestra)}>#{m.id_muestra} - {m.codigo_unico} ({m.tipo})</button>
            </li>
          ))}
        </ul>
      </div>

      <div>
        <h2>Parámetros</h2>
        {!seleccion && <div>Seleccione una muestra</div>}
        {seleccion && (
          <>
            <div><strong>Muestra:</strong> #{seleccion.id_muestra} - {seleccion.codigo_unico}</div>
            <div style={{ display: 'grid', gap: 12, marginTop: 12 }}>
        {parametros.map(p => (
                <div key={p.id_parametro} style={{ border: '1px solid #ddd', padding: 8 }}>
          <div><strong>{p.nombre || `Parámetro ${p.id_parametro}`}</strong></div>
                  <input placeholder="Resultado" value={resultados[p.id_parametro]?.resultado || ''}
                    onChange={e => setResultados({ ...resultados, [p.id_parametro]: { ...(resultados[p.id_parametro] || {}), resultado: e.target.value } })} />
                  <label>
                    <input type="checkbox" checked={!!resultados[p.id_parametro]?.dentro_norma}
                      onChange={e => setResultados({ ...resultados, [p.id_parametro]: { ...(resultados[p.id_parametro] || {}), dentro_norma: e.target.checked } })} /> Dentro de norma
                  </label>
                  <button onClick={() => guardarParametro(p.id_parametro)}>Guardar</button>
                </div>
              ))}
            </div>
            <div style={{ marginTop: 16 }}>
              <button onClick={completarEvaluacion}>Evaluación completa</button>
            </div>
          </>
        )}
        {msg && <div style={{ marginTop: 12 }}>{msg}</div>}
      </div>
    </div>
  )
}
