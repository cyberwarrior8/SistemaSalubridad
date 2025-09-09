import { useEffect, useState } from 'react'
import api from '../lib/api'

export default function Validacion() {
  const [asig, setAsig] = useState({ id_muestra: '', id_evaluador: '', comentario: '' })
  const [pendientes, setPendientes] = useState([])
  const [enAnalisis, setEnAnalisis] = useState([])
  const [enEspera, setEnEspera] = useState([])
  const [validadas, setValidadas] = useState([])
  const [histIdMuestra, setHistIdMuestra] = useState('')
  const [histInformes, setHistInformes] = useState([])
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
    try {
      const { data } = await api.get(`/api/informes/muestra/${id_muestra}`)
      setInformes(data)
    } catch (e) {
      setMsg(e?.response?.data?.message || 'Error listando informes de la muestra')
    }
  }

  async function cargarHistorial(id) {
    setHistInformes([])
    const id_m = String(id || histIdMuestra).trim()
    if (!id_m) return
    try {
      const { data } = await api.get(`/api/informes/muestra/${id_m}`)
      setHistInformes(data)
    } catch (e) {
      setHistInformes([])
      setMsg(e?.response?.data?.message || 'No se pudo cargar el historial')
    }
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
    if (!validar.id_muestra) {
      setMsg('Seleccione una muestra')
      return
    }
    if (!validar.id_informe) {
      setMsg('Seleccione un informe')
      return
    }
    try {
  await api.post(`/api/informes/${validar.id_informe}/validar`, { accion: validar.accion, comentario: validar.comentario || null })
  setMsg(`Informe ${validar.accion}`)
  setInformes([])
  setValidar(v => ({ ...v, id_informe: '', id_muestra: '' }))
  await refreshLists()
    } catch (err) {
      const msg = err?.response?.data?.message || err?.message || 'Error al enviar la acción'
      setMsg(msg)
    }
  }

  async function eliminarMuestra(id_muestra) {
    if (!id_muestra) return
    if (!confirm(`Eliminar muestra #${id_muestra}? Esta acción no se puede deshacer.`)) return
    setMsg('')
    try {
      await api.delete(`/api/muestras/${id_muestra}`)
      setMsg('Muestra eliminada')
      await refreshLists()
    } catch (err) {
      const m = err?.response?.data?.message || 'No se pudo eliminar la muestra'
      setMsg(m)
    }
  }

  return (
    <div className="container page" style={{ display: 'grid', gap: 16 }}>
      <h2>Validación</h2>
      {pendientes.length > 0 && (
        <div className="alert warn">Tienes {pendientes.length} muestras pendientes de asignar a un evaluador.</div>
      )}

      <div className="grid cols-2">
        <form onSubmit={asignar} className="card">
          <div className="card-header">Asignar Evaluador</div>
          <div className="card-body" style={{ display: 'grid', gap: 8 }}>
            <div className="field-row" style={{ alignItems: 'end' }}>
              <label style={{ flex: 1 }}>
                Muestra
                <select value={asig.id_muestra} onChange={e => setAsig({ ...asig, id_muestra: e.target.value })}>
                  <option value="">Seleccione…</option>
                  {pendientes.map(m => (
                    <option key={m.id_muestra} value={m.id_muestra}>{`#${m.id_muestra} - ${m.codigo_unico} (${m.tipo})`}</option>
                  ))}
                </select>
              </label>
              {asig.id_muestra && (
                <button type="button" className="btn btn-danger" onClick={() => eliminarMuestra(Number(asig.id_muestra))}>Eliminar muestra</button>
              )}
            </div>
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
            <button className="btn btn-primary">Asignar</button>
          </div>
        </form>

        <form onSubmit={validarInforme} className="card">
          <div className="card-header">Validar Informe</div>
          <div className="card-body" style={{ display: 'grid', gap: 8 }}>
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
            {validar.id_muestra && informes.length === 0 && (
              <div className="alert error">Esta muestra aún no tiene informes disponibles.</div>
            )}
            {validar.id_informe && (
              <div className="card" style={{ borderColor: 'var(--border)' }}>
                <div className="card-body">
                  <div style={{ marginBottom: 8 }}>Vista previa del PDF</div>
                  {(() => {
                    const inf = informes.find(i => String(i.id_informe) === String(validar.id_informe))
                    const src = inf?.ruta_pdf ? (inf.ruta_pdf.startsWith('http') ? inf.ruta_pdf : `${api.defaults.baseURL}${inf.ruta_pdf}`) : null
                    return src ? (
                      <iframe title="informe" src={src} style={{ width: '100%', height: 400, border: 'none' }} />
                    ) : (
                      <div className="muted">No hay PDF asociado</div>
                    )
                  })()}
                </div>
              </div>
            )}
            <select value={validar.accion} onChange={e => setValidar({ ...validar, accion: e.target.value })}>
              <option value="Validado">Validar</option>
              <option value="Devuelto">Devolver</option>
            </select>
            <input placeholder="Comentario" value={validar.comentario} onChange={e => setValidar({ ...validar, comentario: e.target.value })} />
            <button className="btn btn-primary" disabled={!validar.id_muestra || !validar.id_informe}>Enviar</button>
          </div>
        </form>
      </div>

      <section className="card">
        <div className="card-header">Muestras en análisis</div>
        <div className="card-body">
          <table className="table">
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
        </div>
      </section>

      <section className="card">
        <div className="card-header">Historial de informes</div>
        <div className="card-body">
          <div className="field-row" style={{ marginBottom: 8 }}>
            <label style={{ minWidth: 260 }}>
              Muestra
              <select value={histIdMuestra} onChange={e => setHistIdMuestra(e.target.value)}>
                <option value="">Seleccione…</option>
                {[...enEspera, ...validadas].map(m => (
                  <option key={`hist-${m.id_muestra}`} value={m.id_muestra}>{`#${m.id_muestra} - ${m.codigo_unico} (${m.tipo})`}</option>
                ))}
              </select>
            </label>
            <input style={{ width: 140 }} placeholder="ID Muestra" value={histIdMuestra} onChange={e => setHistIdMuestra(e.target.value)} />
            <button type="button" className="btn" onClick={() => cargarHistorial()}>Cargar</button>
          </div>
          {histInformes.length > 0 ? (
            <table className="table">
              <thead>
                <tr>
                  <th>ID Informe</th>
                  <th>Versión</th>
                  <th>Estado</th>
                  <th>Fecha</th>
                  <th>PDF</th>
                </tr>
              </thead>
              <tbody>
                {histInformes.map(i => (
                  <tr key={`inf-${i.id_informe}`}>
                    <td>{i.id_informe}</td>
                    <td>{i.version}</td>
                    <td>{i.estado || '—'}</td>
                    <td>{i.fecha_creacion ? new Date(i.fecha_creacion).toLocaleString() : '—'}</td>
                    <td>{i.ruta_pdf ? <a href={`${api.defaults.baseURL}${i.ruta_pdf}`} target="_blank" rel="noreferrer">Ver PDF</a> : '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="muted">Seleccione una muestra y pulse Cargar para ver sus informes.</div>
          )}
        </div>
      </section>

      <section className="card">
        <div className="card-header">Muestras en espera</div>
        <div className="card-body">
          <table className="table">
            <thead>
              <tr>
                <th>ID</th><th>Código</th><th>Tipo</th><th>Acción</th>
              </tr>
            </thead>
            <tbody>
              {enEspera.map(m => (
                <tr key={`espera-${m.id_muestra}`}>
                  <td>{m.id_muestra}</td>
                  <td>{m.codigo_unico}</td>
                  <td>{m.tipo}</td>
                  <td>
                    <button type="button" className="btn" onClick={() => onSelectMuestraValidar(String(m.id_muestra))}>Seleccionar</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="card">
        <div className="card-header">Muestras validadas</div>
        <div className="card-body">
          <table className="table">
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
        </div>
      </section>
      {msg && <div className="alert ok">{msg}</div>}
    </div>
  )
}
