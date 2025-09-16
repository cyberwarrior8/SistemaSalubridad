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


  async function guardarTodosParametros() {
    if (!seleccion) return
    // Tomar solo los parámetros que tengan valor no vacío
    const aGuardar = parametros.filter(p => {
      const r = resultados[p.id_parametro]
      return r && r.resultado != null && r.resultado !== ''
    })
    if (aGuardar.length === 0) {
      setMsg('No hay parámetros con resultado para guardar')
      return
    }
    setMsg('Guardando...')
    try {
      await Promise.all(aGuardar.map(p => {
        const r = resultados[p.id_parametro]
        return api.post('/api/ensayos', {
          id_muestra: seleccion.id_muestra,
          id_parametro: p.id_parametro,
          resultado: r.resultado,
          dentro_norma: !!r.dentro_norma
        })
      }))
      setMsg(`${aGuardar.length} parámetro(s) guardado(s)`) 
    } catch (err) {
      setMsg('Error al guardar parámetros')
    }
  }

  function evaluarDentroNorma(parametro, valorStr) {
    if (!parametro) return false;
    if (valorStr == null || valorStr === '') return false;
    const vNum = parseFloat(String(valorStr).replace(',', '.'));
    if (!Number.isFinite(vNum)) {
      // Heurística simple para microbiológico: si texto contiene 'ausente' / 'negativo' => dentro
      const txt = valorStr.toString().toLowerCase();
      if (/(ausente|negativo|no\s*detectado)/.test(txt)) return true;
      return false;
    }
    const op = (parametro.operador || '').toUpperCase();
    const min = parametro.limite_minimo;
    const max = parametro.limite_maximo;
    if (op === 'BETWEEN' && min != null && max != null) return vNum >= min && vNum <= max;
    if (op === '<=' && max != null) return vNum <= max;
    if (op === '<' && max != null) return vNum < max;
    if (op === '>=' && min != null) return vNum >= min;
    if (op === '>' && min != null) return vNum > min;
    if (op === '=' && min != null) return vNum === min;
    // Sin operador: deducir
    if (min != null && max != null) return vNum >= min && vNum <= max;
    if (max != null) return vNum <= max;
    if (min != null) return vNum >= min;
    return false;
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
              <div>
                #{m.id_muestra} - {m.codigo_unico} <span className="muted">({m.tipo})</span>
                {m.comentario_asignacion ? (
                  <div className="muted" style={{ fontSize: 12, marginTop: 2 }}>Nota: {m.comentario_asignacion}</div>
                ) : null}
              </div>
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
              <div>
                <strong>Muestra:</strong> #{seleccion.id_muestra} - {seleccion.codigo_unico}
                {seleccion.comentario_asignacion ? (
                  <div className="muted" style={{ fontSize: 12, marginTop: 2 }}>Nota de asignación: {seleccion.comentario_asignacion}</div>
                ) : null}
              </div>
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
                          onChange={e => {
                            const val = e.target.value;
                            const autoDentro = evaluarDentroNorma(p, val);
                            setResultados({
                              ...resultados,
                              [p.id_parametro]: {
                                ...(resultados[p.id_parametro] || {}),
                                resultado: val,
                                dentro_norma: autoDentro
                              }
                            })
                          }} />
                        <label>
                          <input type="checkbox" checked={!!resultados[p.id_parametro]?.dentro_norma}
                            onChange={e => setResultados({ ...resultados, [p.id_parametro]: { ...(resultados[p.id_parametro] || {}), dentro_norma: e.target.checked } })} /> Dentro de norma
                        </label>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <div style={{ marginTop: 8, display: 'flex', gap: 12 }}>
                <button className="btn btn-primary" onClick={guardarTodosParametros}>Guardar todos</button>
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
