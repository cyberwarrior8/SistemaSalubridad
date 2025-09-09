import { useEffect, useState } from 'react'
import api from '../lib/api'

export default function Evaluador() {
  const [asignadas, setAsignadas] = useState([])
  const [seleccion, setSeleccion] = useState(null)
  const [parametros, setParametros] = useState([])
  const [resultados, setResultados] = useState({}) // key: id_parametro => { resultado, dentro_norma }
  const [msg, setMsg] = useState('')
  const [apto, setApto] = useState(false)

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
    // Prefill resultados with saved values if present
    const prefill = {}
    for (const p of data) {
      if (p.resultado_guardado != null || p.dentro_norma_guardado != null) {
        prefill[p.id_parametro] = {
          resultado: p.resultado_guardado ?? '',
          dentro_norma: !!p.dentro_norma_guardado,
        }
      }
    }
    setResultados(prefill)
    setMsg('')
  setApto(false)
  }

  async function guardarParametro(id_parametro) {
  const r = resultados[id_parametro]
  if (!r || r.resultado == null || r.resultado === '') return setMsg('Completa el resultado')
    await api.post('/api/ensayos', {
      id_muestra: seleccion.id_muestra,
      id_parametro,
      resultado: r.resultado,
      dentro_norma: !!r.dentro_norma
    })
    // Keep saved value reflected locally
    setResultados(prev => ({
      ...prev,
      [id_parametro]: { resultado: r.resultado, dentro_norma: !!r.dentro_norma },
    }))
    setMsg('Parámetro guardado')
  }

  async function completarEvaluacion() {
    if (!seleccion) return
  await api.post(`/api/ensayos/muestras/${seleccion.id_muestra}/completar`, { apto })
  // Refresh assigned list so evaluated sample disappears
  const { data } = await api.get('/api/ensayos/asignadas')
  setAsignadas(data)
  setSeleccion(null)
  setParametros([])
  setResultados({})
  setApto(false)
  setMsg('Evaluación completada')
  }

  return (
    <div className="container page" style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 16 }}>
      <div className="card">
        <div className="card-header">Muestras asignadas</div>
        <div className="card-body list">
          {asignadas.length === 0 && <div className="muted">No hay muestras en análisis.</div>}
          {asignadas.map(m => (
            <div key={m.id_muestra} className="list-item">
              <div>#{m.id_muestra} - {m.codigo_unico} <span className="muted">({m.tipo})</span></div>
              <button className="btn" onClick={() => cargarParametros(m.id_muestra)}>Abrir</button>
            </div>
          ))}
        </div>
      </div>

      <div className="card">
        <div className="card-header">Parámetros</div>
        <div className="card-body" style={{ display: 'grid', gap: 12 }}>
          {!seleccion && <div className="muted">Seleccione una muestra de la lista.</div>}
          {seleccion && (
            <>
              <div><strong>Muestra:</strong> #{seleccion.id_muestra} - {seleccion.codigo_unico}</div>
              <div className="grid" style={{ gap: 12 }}>
                {parametros.map(p => (
                  <div key={p.id_parametro} className="card" style={{ borderColor: p.es_micro ? '#0ea5e9' : 'var(--border)' }}>
                    <div className="card-body" style={{ display: 'grid', gap: 8 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}>
                        <div><strong>{p.nombre || `Parámetro ${p.id_parametro}`}</strong> {p.unidad ? <span className="muted">({p.unidad})</span> : null}</div>
                        <div style={{ fontSize: 12, color: 'var(--muted)', textAlign: 'right' }}>
                          {p.operador && (p.limite_minimo != null || p.limite_maximo != null) ? (
                            <div>
                              Norma: {p.operador}
                              {p.limite_minimo != null ? ` ${p.limite_minimo}` : ''}
                              {p.limite_maximo != null ? ` - ${p.limite_maximo}` : ''}
                              {p.unidad ? ` ${p.unidad}` : ''}
                            </div>
                          ) : null}
                          {p.norma_descripcion ? <div>{p.norma_descripcion}</div> : null}
                          {p.norma_fuente ? <div>Fuente: {p.norma_fuente}</div> : null}
                        </div>
                      </div>
                      <div className="field-row">
                        <input placeholder="Resultado" value={resultados[p.id_parametro]?.resultado || ''}
                          onChange={e => setResultados({ ...resultados, [p.id_parametro]: { ...(resultados[p.id_parametro] || {}), resultado: e.target.value } })} />
                        <label>
                          <input type="checkbox" checked={!!resultados[p.id_parametro]?.dentro_norma}
                            onChange={e => setResultados({ ...resultados, [p.id_parametro]: { ...(resultados[p.id_parametro] || {}), dentro_norma: e.target.checked } })} /> Dentro de norma
                        </label>
                        <button className="btn btn-outline" onClick={() => guardarParametro(p.id_parametro)}>Guardar</button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <div style={{ marginTop: 8 }}>
                <label style={{ marginRight: 12 }}>
                  <input type="checkbox" checked={apto} onChange={e => setApto(e.target.checked)} /> Apto Para Consumo
                </label>
                <button className="btn btn-primary" onClick={completarEvaluacion}>Evaluación completa</button>
              </div>
            </>
          )}
          {msg && <div className="alert ok">{msg}</div>}
        </div>
      </div>
    </div>
  )
}
