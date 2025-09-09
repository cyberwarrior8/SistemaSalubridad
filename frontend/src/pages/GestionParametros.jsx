import { useEffect, useState } from 'react'
import api from '../lib/api'

const TIPOS = ['Agua', 'Alimento', 'Bebida Alcoholica']

export default function GestionParametros() {
  const [lista, setLista] = useState([])
  const [q, setQ] = useState('')
  const [tipo, setTipo] = useState('')
  const [msg, setMsg] = useState('')
  const [form, setForm] = useState({ id_parametro: null, nombre: '', tipo_muestra: '', unidad: '' })
  const [norma, setNorma] = useState({ operador: '', limite_minimo: '', limite_maximo: '', descripcion: '', fuente: '' })

  async function load() {
    setMsg('')
    const { data } = await api.get('/api/parametros', { params: { q: q || undefined, tipo: tipo || undefined } })
    setLista(data)
  }

  useEffect(() => { load() }, [])

  function nuevo() {
    setForm({ id_parametro: null, nombre: '', tipo_muestra: '', unidad: '' })
    setNorma({ operador: '', limite_minimo: '', limite_maximo: '', descripcion: '', fuente: '' })
    setMsg('')
  }

  async function editar(p) {
    setForm({ id_parametro: p.id_parametro, nombre: p.nombre, tipo_muestra: p.tipo_muestra, unidad: p.unidad || '' })
    setMsg('')
    try {
      const { data } = await api.get(`/api/parametros/${p.id_parametro}/norma`)
      setNorma({
        operador: data?.operador || '',
        limite_minimo: data?.limite_minimo ?? '',
        limite_maximo: data?.limite_maximo ?? '',
        descripcion: data?.descripcion || '',
        fuente: data?.fuente || ''
      })
    } catch (e) {
      setNorma({ operador: '', limite_minimo: '', limite_maximo: '', descripcion: '', fuente: '' })
    }
  }

  async function guardar(e) {
    e.preventDefault()
    setMsg('')
    try {
      if (form.id_parametro == null) {
        const { data } = await api.post('/api/parametros', {
          nombre: form.nombre,
          tipo_muestra: form.tipo_muestra,
          unidad: form.unidad || undefined
        })
        setMsg('Parámetro creado')
        setForm({ ...form, id_parametro: data.id_parametro })
      } else {
        await api.put(`/api/parametros/${form.id_parametro}`, {
          nombre: form.nombre,
          tipo_muestra: form.tipo_muestra,
          unidad: form.unidad || undefined
        })
        setMsg('Parámetro actualizado')
      }
      await load()
    } catch (err) {
      setMsg(err?.response?.data?.message || 'Error guardando parámetro')
    }
  }

  async function guardarNorma(e) {
    e.preventDefault()
    if (form.id_parametro == null) {
      setMsg('Guarde el parámetro primero')
      return
    }
    setMsg('')
    try {
      await api.put(`/api/parametros/${form.id_parametro}/norma`, {
        operador: norma.operador,
        limite_minimo: norma.limite_minimo === '' ? null : Number(norma.limite_minimo),
        limite_maximo: norma.limite_maximo === '' ? null : Number(norma.limite_maximo),
        descripcion: norma.descripcion || null,
        fuente: norma.fuente || null
      })
      setMsg('Norma actualizada')
      await load()
    } catch (err) {
      setMsg(err?.response?.data?.message || 'Error guardando norma')
    }
  }

  async function eliminar(p) {
    if (!confirm(`Eliminar parámetro ${p.nombre}?`)) return
    try {
      await api.delete(`/api/parametros/${p.id_parametro}`)
      setMsg('Parámetro eliminado')
      await load()
    } catch (err) {
      setMsg(err?.response?.data?.message || 'Error eliminando parámetro')
    }
  }

  return (
    <div className="container page" style={{ display: 'grid', gap: 16 }}>
      <h2>Gestión de Parámetros y Normas</h2>
      <div className="card">
        <div className="card-body field-row">
          <select value={tipo} onChange={e => setTipo(e.target.value)}>
            <option value=''>Todos los tipos</option>
            {TIPOS.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
          <input placeholder='Buscar por nombre/unidad' value={q} onChange={e => setQ(e.target.value)} />
          <button className="btn" onClick={load}>Buscar</button>
          <button className="btn" onClick={nuevo}>Nuevo</button>
        </div>
      </div>

      <div className="grid cols-2">
        <form onSubmit={guardar} className="card">
          <div className="card-header">{form.id_parametro == null ? 'Nuevo Parámetro' : `Editar Parámetro #${form.id_parametro}`}</div>
          <div className="card-body" style={{ display: 'grid', gap: 8 }}>
            <input placeholder='Nombre' value={form.nombre} onChange={e => setForm({ ...form, nombre: e.target.value })} />
            <select value={form.tipo_muestra} onChange={e => setForm({ ...form, tipo_muestra: e.target.value })}>
              <option value=''>Tipo de muestra</option>
              {TIPOS.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
            <input placeholder='Unidad (opcional)' value={form.unidad} onChange={e => setForm({ ...form, unidad: e.target.value })} />
            <div className="field-row">
              <button className="btn btn-primary" type='submit'>{form.id_parametro == null ? 'Crear' : 'Guardar'}</button>
            </div>
          </div>
        </form>

        <form onSubmit={guardarNorma} className="card">
          <div className="card-header">Norma de Referencia</div>
          <div className="card-body" style={{ display: 'grid', gap: 8 }}>
            <input placeholder='Operador (ej. <=, >=, entre)' value={norma.operador} onChange={e => setNorma({ ...norma, operador: e.target.value })} />
            <input placeholder='Límite mínimo' value={norma.limite_minimo} onChange={e => setNorma({ ...norma, limite_minimo: e.target.value })} />
            <input placeholder='Límite máximo' value={norma.limite_maximo} onChange={e => setNorma({ ...norma, limite_maximo: e.target.value })} />
            <input placeholder='Descripción' value={norma.descripcion} onChange={e => setNorma({ ...norma, descripcion: e.target.value })} />
            <input placeholder='Fuente' value={norma.fuente} onChange={e => setNorma({ ...norma, fuente: e.target.value })} />
            <button className="btn btn-primary" type='submit' disabled={form.id_parametro == null}>Guardar norma</button>
          </div>
        </form>
      </div>

      <div className="card">
        <div className="card-header">Parámetros</div>
        <div className="card-body">
          <table className="table">
            <thead>
              <tr>
                <th>ID</th><th>Nombre</th><th>Tipo</th><th>Unidad</th><th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {lista.map(p => (
                <tr key={p.id_parametro}>
                  <td>{p.id_parametro}</td>
                  <td>{p.nombre}</td>
                  <td>{p.tipo_muestra}</td>
                  <td>{p.unidad || '—'}</td>
                  <td>
                    <button className="btn" onClick={() => editar(p)}>Editar</button>
                    <button className="btn btn-danger" onClick={() => eliminar(p)}>Eliminar</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {msg && <div className="alert ok">{msg}</div>}
    </div>
  )
}
