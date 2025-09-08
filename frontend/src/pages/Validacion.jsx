import { useEffect, useState } from 'react'
import api from '../lib/api'

export default function Validacion() {
  const [asig, setAsig] = useState({ id_muestra: '', id_evaluador: '', comentario: '' })
  const [pendientes, setPendientes] = useState([])
  const [enAnalisis, setEnAnalisis] = useState([])
  const [enEspera, setEnEspera] = useState([])
  const [validadas, setValidadas] = useState([])
  const [evaluadores, setEvaluadores] = useState([])
  const [validar, setValidar] = useState({ id_muestra: '', id_informe: '', accion: 'Validado', comentario: '' })
  const [informes, setInformes] = useState([])
  const [msg, setMsg] = useState('')

  async function refreshLists() {
    const p = await api.get('/api/muestras/pendientes')
    setPendientes(p.data)
    const a = await api.get('/api/muestras/en-analisis')
    setEnAnalisis(a.data)
    try {
      const ev = await api.get('/api/muestras/evaluadas')
      setEnEspera(ev.data)
    } catch {}
    try {
      const va = await api.get('/api/muestras/validadas')
      setValidadas(va.data)
    } catch {}
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

  async function onSelectMuestraValidar(id_muestra) {
    setValidar(v => ({ ...v, id_muestra, id_informe: '' }))
    setInformes([])
    setMsg('')
    if (!id_muestra) return
    const { data } = await api.get(`/api/informes/muestra/${id_muestra}`)
    setInformes(data)
  }

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
  await refreshLists()
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
        <label>
          Muestra
          <select value={validar.id_muestra} onChange={e => onSelectMuestraValidar(e.target.value)}>
            <option value="">Seleccione…</option>
            {enEspera.map(m => (
              <option key={`val-${m.id_muestra}`} value={m.id_muestra}>{`#${m.id_muestra} - ${m.codigo_unico} (${m.tipo})`}</option>
            ))}
          </select>
        </label>
        <label>
          Informe
          <select value={validar.id_informe} onChange={e => setValidar({ ...validar, id_informe: e.target.value })} disabled={!validar.id_muestra}>
            <option value="">Seleccione…</option>
            {informes.map(i => (
              <option key={i.id_informe} value={i.id_informe}>{`#${i.id_informe} - ${new Date(i.fecha_creacion || i.fecha || Date.now()).toLocaleString()}`}</option>
            ))}
          </select>
        </label>
        {validar.id_informe && (
          <div style={{ border: '1px solid #ddd', padding: 8 }}>
            <div style={{ marginBottom: 8 }}>Vista previa del PDF</div>
            {/* Asumimos que el backend sirve /files */}
            {(() => {
              const inf = informes.find(i => String(i.id_informe) === String(validar.id_informe))
              const src = inf?.ruta_pdf ? (inf.ruta_pdf.startsWith('http') ? inf.ruta_pdf : `${api.defaults.baseURL}${inf.ruta_pdf}`) : null
              return src ? (
                <iframe title="informe" src={src} style={{ width: '100%', height: 400, border: 'none' }} />
              ) : (
                <div>No hay PDF asociado</div>
              )
            })()}
          </div>
        )}
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
      <section>
        <h3>Muestras en espera</h3>
        <table border="1" cellPadding="6" style={{ borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              <th>ID</th><th>Código</th><th>Tipo</th>
            </tr>
          </thead>
          <tbody>
            {enEspera.map(m => (
              <tr key={`espera-${m.id_muestra}`}>
                <td>{m.id_muestra}</td>
                <td>{m.codigo_unico}</td>
                <td>{m.tipo}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
      <section>
        <h3>Muestras validadas</h3>
        <table border="1" cellPadding="6" style={{ borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              <th>ID</th><th>Código</th><th>Tipo</th><th>Informe</th>
            </tr>
          </thead>
          <tbody>
            {validadas.map(m => (
              <tr key={`vali-${m.id_muestra}`}>
                <td>{m.id_muestra}</td>
                <td>{m.codigo_unico}</td>
                <td>{m.tipo}</td>
                <td>
                  {m.ruta_pdf ? (
                    <a href={`${api.defaults.baseURL}${m.ruta_pdf}`} target="_blank" rel="noreferrer">Ver PDF</a>
                  ) : '—'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
      {msg && <div>{msg}</div>}
    </div>
  )
}
