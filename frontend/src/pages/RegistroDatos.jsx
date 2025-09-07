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
    <div style={{ display: 'grid', gap: 16, padding: 16 }}>
      <h2>Registro de Datos</h2>
      <form onSubmit={crearSolicitante} style={{ display: 'grid', gap: 8 }}>
        <strong>Nuevo Solicitante</strong>
        <input placeholder="Nombre" value={sol.nombre} onChange={e => setSol({ ...sol, nombre: e.target.value })} />
        <input placeholder="Dirección" value={sol.direccion} onChange={e => setSol({ ...sol, direccion: e.target.value })} />
        <input placeholder="Contacto" value={sol.contacto} onChange={e => setSol({ ...sol, contacto: e.target.value })} />
        <button>Crear Solicitante</button>
      </form>

      <form onSubmit={crearMuestra} style={{ display: 'grid', gap: 8 }}>
        <strong>Nueva Muestra</strong>
        <input placeholder="Código" value={muestra.codigo} onChange={e => setMuestra({ ...muestra, codigo: e.target.value })} />
        <select value={muestra.tipo} onChange={e => setMuestra({ ...muestra, tipo: e.target.value })}>
          <option>Agua</option>
          <option>Alimento</option>
          <option>Bebida</option>
        </select>
        <input type="date" value={muestra.fecha} onChange={e => setMuestra({ ...muestra, fecha: e.target.value })} />
        <input type="time" value={muestra.hora} onChange={e => setMuestra({ ...muestra, hora: e.target.value })} />
        <input placeholder="Origen" value={muestra.origen} onChange={e => setMuestra({ ...muestra, origen: e.target.value })} />
        <input placeholder="Condiciones" value={muestra.condiciones} onChange={e => setMuestra({ ...muestra, condiciones: e.target.value })} />
        <div style={{ display: 'grid', gap: 6 }}>
          <strong>Solicitante</strong>
          <input placeholder="Buscar solicitante por nombre o contacto" value={buscar} onChange={e => setBuscar(e.target.value)} />
          <select value={muestra.id_solicitante} onChange={e => setMuestra({ ...muestra, id_solicitante: e.target.value })}>
            <option value="">Seleccione…</option>
            {filtrados.map(s => (
              <option key={s.id_solicitante} value={s.id_solicitante}>
                {s.nombre_razon_social} {s.contacto ? `- ${s.contacto}` : ''}
              </option>
            ))}
          </select>
        </div>
        <button disabled={!muestra.id_solicitante || loadingMuestra}>{loadingMuestra ? 'Creando…' : 'Crear Muestra'}</button>
      </form>
      {msg && (
        <div role="alert" style={{
          marginTop: 8,
          padding: 8,
          borderRadius: 4,
          color: msgType === 'error' ? '#7a1111' : '#0f5132',
          background: msgType === 'error' ? '#f8d7da' : '#d1e7dd',
          border: `1px solid ${msgType === 'error' ? '#f5c2c7' : '#badbcc'}`
        }}>
          {msg}
        </div>
      )}
    </div>
  )
}
