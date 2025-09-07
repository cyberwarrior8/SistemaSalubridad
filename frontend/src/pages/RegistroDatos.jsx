import { useEffect, useMemo, useState } from 'react'
import api from '../lib/api'

export default function RegistroDatos() {
  const [sol, setSol] = useState({ nombre: '', direccion: '', contacto: '' })
  const [muestra, setMuestra] = useState({ codigo: '', tipo: 'Agua', fecha: '', hora: '', origen: '', condiciones: '', id_solicitante: '' })
  const [solicitantes, setSolicitantes] = useState([])
  const [buscar, setBuscar] = useState('')
  const [msg, setMsg] = useState('')

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
    await api.post('/api/solicitantes', sol)
    setMsg('Solicitante creado')
    setSol({ nombre: '', direccion: '', contacto: '' })
    await cargarSolicitantes()
  }

  async function crearMuestra(e) {
    e.preventDefault()
    setMsg('')
    if (!muestra.id_solicitante) {
      setMsg('Seleccione un solicitante')
      return
    }
    await api.post('/api/muestras', { ...muestra, id_solicitante: parseInt(muestra.id_solicitante, 10) })
    setMsg('Muestra creada')
    setMuestra({ codigo: '', tipo: 'Agua', fecha: '', hora: '', origen: '', condiciones: '', id_solicitante: '' })
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
  <button disabled={!muestra.id_solicitante}>Crear Muestra</button>
      </form>
      {msg && <div>{msg}</div>}
    </div>
  )
}
