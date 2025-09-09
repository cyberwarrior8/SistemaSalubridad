import { useEffect, useMemo, useState } from 'react'
import api from '../lib/api'

export default function RegistroDatos() {
  const [sol, setSol] = useState({ nombre: '', direccion: '', contacto: '' })
  const [muestra, setMuestra] = useState({ codigo: '', tipo: 'Agua', fecha: '', hora: '', origen: '', condiciones: '', id_solicitante: '' })
  const [solicitantes, setSolicitantes] = useState([])
  const [buscar, setBuscar] = useState('')
  const [msg, setMsg] = useState('')
  const [msgType, setMsgType] = useState('') // 'success' | 'error'
  const [loadingMuestra, setLoadingMuestra] = useState(false)
  const [loadingSolicitante, setLoadingSolicitante] = useState(false)

  async function cargarSolicitantes() {
    const { data } = await api.get('/api/solicitantes')
    setSolicitantes(data)
  }

  useEffect(() => {
    cargarSolicitantes()
  }, [])

  const filtrados = useMemo(() => {
    const q = buscar.trim().toLowerCase()
    if (!q) return solicitantes
    return solicitantes.filter(s => (s.nombre_razon_social || '').toLowerCase().includes(q) || (s.contacto || '').toLowerCase().includes(q))
  }, [buscar, solicitantes])

  async function crearSolicitante(e) {
    e.preventDefault()
    setMsg('')
    setMsgType('')
    setLoadingSolicitante(true)
    try {
      await api.post('/api/solicitantes', sol)
      setMsg('Solicitante creado')
      setMsgType('success')
      setSol({ nombre: '', direccion: '', contacto: '' })
      await cargarSolicitantes()
    } catch (err) {
      const status = err?.response?.status
      const errors = err?.response?.data?.errors
      const message = err?.response?.data?.message
      const details = err?.response?.data?.details
      if (status === 400 && Array.isArray(errors)) {
        setMsg(errors.map(e => `${e.path}: ${e.msg}`).join(' | '))
      } else if (status === 403) {
        setMsg('No tiene permisos para registrar solicitantes')
      } else {
        setMsg(message || 'No se pudo registrar el solicitante')
      }
      setMsgType('error')
    } finally {
      setLoadingSolicitante(false)
    }
  }

  async function crearMuestra(e) {
    e.preventDefault()
    setMsg('')
    setMsgType('')
    // Client-side validations
    if (!muestra.codigo || muestra.codigo.trim().length < 3) {
      setMsg('El código debe tener al menos 3 caracteres')
      setMsgType('error')
      return
    }
    if (!['Agua','Alimento','Bebida'].includes(muestra.tipo)) {
      setMsg('Seleccione un tipo de muestra válido')
      setMsgType('error')
      return
    }
    if (!muestra.fecha) {
      setMsg('Seleccione una fecha')
      setMsgType('error')
      return
    }
    if (!muestra.hora) {
      setMsg('Seleccione una hora')
      setMsgType('error')
      return
    }
    if (!muestra.id_solicitante) {
      setMsg('Seleccione un solicitante')
      setMsgType('error')
      return
    }
    setLoadingMuestra(true)
    try {
      await api.post('/api/muestras', { ...muestra, id_solicitante: parseInt(muestra.id_solicitante, 10) })
      setMsg('Muestra creada correctamente')
      setMsgType('success')
      setMuestra({ codigo: '', tipo: 'Agua', fecha: '', hora: '', origen: '', condiciones: '', id_solicitante: '' })
    } catch (err) {
      const status = err?.response?.status
      const errors = err?.response?.data?.errors
      const message = err?.response?.data?.message
      if (status === 400 && Array.isArray(errors)) {
        setMsg(errors.map(e => `${e.path}: ${e.msg}`).join(' | '))
      } else if (status === 403) {
        setMsg('No tiene permisos para registrar muestras')
      } else if (status === 409) {
        setMsg('El código de muestra ya existe')
      } else {
        setMsg([message || 'No se pudo registrar la muestra', details].filter(Boolean).join(' - '))
      }
      setMsgType('error')
    } finally {
      setLoadingMuestra(false)
    }
  }

  return (
    <div className="container page">
      <h2 style={{ margin: '6px 0' }}>Registro de Datos</h2>
      <div className="grid cols-2">
        <form onSubmit={crearSolicitante} className="card">
          <div className="card-header">Nuevo Solicitante</div>
          <div className="card-body" style={{ display: 'grid', gap: 10 }}>
            <input placeholder="Nombre / Razón Social" value={sol.nombre} onChange={e => setSol({ ...sol, nombre: e.target.value })} />
            <input placeholder="Dirección" value={sol.direccion} onChange={e => setSol({ ...sol, direccion: e.target.value })} />
            <input placeholder="Contacto" value={sol.contacto} onChange={e => setSol({ ...sol, contacto: e.target.value })} />
            <button className="btn btn-primary" disabled={loadingSolicitante}>{loadingSolicitante ? 'Creando…' : 'Crear Solicitante'}</button>
          </div>
        </form>

        <form onSubmit={crearMuestra} className="card">
          <div className="card-header">Nueva Muestra</div>
          <div className="card-body" style={{ display: 'grid', gap: 10 }}>
            <div className="field-row">
              <input placeholder="Código" value={muestra.codigo} onChange={e => setMuestra({ ...muestra, codigo: e.target.value })} />
              <select value={muestra.tipo} onChange={e => setMuestra({ ...muestra, tipo: e.target.value })}>
                <option>Agua</option>
                <option>Alimento</option>
                <option>Bebida</option>
              </select>
            </div>
            <div className="field-row">
              <input type="date" value={muestra.fecha} onChange={e => setMuestra({ ...muestra, fecha: e.target.value })} />
              <input type="time" value={muestra.hora} onChange={e => setMuestra({ ...muestra, hora: e.target.value })} />
            </div>
            <input placeholder="Origen" value={muestra.origen} onChange={e => setMuestra({ ...muestra, origen: e.target.value })} />
            <input placeholder="Condiciones de transporte" value={muestra.condiciones} onChange={e => setMuestra({ ...muestra, condiciones: e.target.value })} />
            <div className="field">
              <label>Solicitante</label>
              <input placeholder="Buscar por nombre o contacto" value={buscar} onChange={e => setBuscar(e.target.value)} />
              <select value={muestra.id_solicitante} onChange={e => setMuestra({ ...muestra, id_solicitante: e.target.value })}>
                <option value="">Seleccione…</option>
                {filtrados.map(s => (
                  <option key={s.id_solicitante} value={s.id_solicitante}>
                    {s.nombre_razon_social} {s.contacto ? `- ${s.contacto}` : ''}
                  </option>
                ))}
              </select>
            </div>
            <button className="btn btn-primary" disabled={!muestra.id_solicitante || loadingMuestra}>{loadingMuestra ? 'Creando…' : 'Crear Muestra'}</button>
          </div>
        </form>
      </div>
      {msg && (
        <div role="alert" className={`alert ${msgType === 'error' ? 'error' : 'ok'}`} style={{ marginTop: 12 }}>
          {msg}
        </div>
      )}
    </div>
  )
}
