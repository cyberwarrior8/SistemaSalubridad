import { useEffect, useState } from 'react'
import api from '../lib/api'

export default function GestionUsuarios() {
  const [usuarios, setUsuarios] = useState([])
  const [roles, setRoles] = useState([])
  const [msg, setMsg] = useState('')
  const [form, setForm] = useState({ id_usuario: null, nombre: '', correo: '', password: '', roles: [] })
  const [q, setQ] = useState('')

  async function loadAll() {
    setMsg('')
    const [u, r] = await Promise.all([
      api.get('/api/usuarios/todos', { params: { q: q || undefined } }),
      api.get('/api/usuarios/roles')
    ])
    setUsuarios(u.data)
    setRoles(r.data)
  }

  useEffect(() => { loadAll() }, [])

  function startNew() {
    setForm({ id_usuario: null, nombre: '', correo: '', password: '', roles: [] })
    setMsg('')
  }

  function edit(u) {
    setForm({ id_usuario: u.id_usuario, nombre: u.nombre, correo: u.correo, password: '', roles: u.roles || [] })
    setMsg('')
  }

  function toggleRole(roleName) {
    setForm(f => ({
      ...f,
      roles: f.roles.includes(roleName) ? f.roles.filter(r => r !== roleName) : [...f.roles, roleName]
    }))
  }

  async function save(e) {
    e.preventDefault()
    setMsg('')
    try {
      if (form.id_usuario == null) {
        await api.post('/api/usuarios', {
          nombre: form.nombre,
          correo: form.correo,
          password: form.password,
          roles: form.roles
        })
        setMsg('Usuario creado')
      } else {
        await api.put(`/api/usuarios/${form.id_usuario}`, {
          nombre: form.nombre,
          correo: form.correo,
          password: form.password || undefined,
          roles: form.roles
        })
        setMsg('Usuario actualizado')
      }
      await loadAll()
      startNew()
    } catch (err) {
      setMsg(err?.response?.data?.message || 'Error guardando usuario')
    }
  }

  async function remove(u) {
    if (!confirm(`Desactivar usuario ${u.nombre}?`)) return
    try {
      await api.delete(`/api/usuarios/${u.id_usuario}`)
      setMsg('Usuario desactivado')
      await loadAll()
    } catch (err) {
      setMsg(err?.response?.data?.message || 'Error desactivando usuario')
    }
  }

  async function activate(u) {
    try {
      await api.post(`/api/usuarios/${u.id_usuario}/activar`)
      setMsg('Usuario activado')
      await loadAll()
    } catch (err) {
      setMsg(err?.response?.data?.message || 'Error activando usuario')
    }
  }

  return (
    <div className="container page" style={{ display: 'grid', gap: 16 }}>
      <h2>Gestión de Usuarios</h2>
      <form onSubmit={save} className="card">
        <div className="card-header">{form.id_usuario == null ? 'Nuevo Usuario' : `Editar Usuario #${form.id_usuario}`}</div>
        <div className="card-body" style={{ display: 'grid', gap: 8 }}>
          <input placeholder='Nombre' value={form.nombre} onChange={e => setForm({ ...form, nombre: e.target.value })} />
          <input placeholder='Correo' value={form.correo} onChange={e => setForm({ ...form, correo: e.target.value })} />
          <input placeholder='Contraseña' type='password' value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} />
          <div>
            Roles:
            <div className="field-row" style={{ marginTop: 6 }}>
              {roles.map(r => (
                <label key={r.id_rol} className="btn btn-outline" style={{ gap: 6 }}>
                  <input type='checkbox' checked={form.roles.includes(r.nombre_rol)} onChange={() => toggleRole(r.nombre_rol)} /> {r.nombre_rol}
                </label>
              ))}
            </div>
          </div>
          <div className="field-row">
            <button className="btn btn-primary" type='submit'>{form.id_usuario == null ? 'Crear' : 'Guardar'}</button>
            <button className="btn" type='button' onClick={startNew}>Nuevo</button>
          </div>
        </div>
      </form>

      <div className="card">
        <div className="card-header">Usuarios</div>
        <div className="card-body">
          <div className="field-row" style={{ marginBottom: 8 }}>
            <input placeholder='Buscar por nombre o correo' value={q} onChange={e => setQ(e.target.value)} />
            <button className="btn" type='button' onClick={loadAll}>Buscar</button>
          </div>
          <table className="table">
            <thead>
              <tr>
                <th>ID</th><th>Nombre</th><th>Correo</th><th>Estado</th><th>Roles</th><th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {usuarios.map(u => (
                <tr key={u.id_usuario}>
                  <td>{u.id_usuario}</td>
                  <td>{u.nombre}</td>
                  <td>{u.correo}</td>
                  <td>{u.estado ? 'Activo' : 'Inactivo'}</td>
                  <td>{(u.roles || []).join(', ')}</td>
                  <td>
                    <button className="btn" onClick={() => edit(u)}>Editar</button>
                    {u.estado ? (
                      <button className="btn btn-danger" onClick={() => remove(u)}>Desactivar</button>
                    ) : (
                      <button className="btn btn-primary" onClick={() => activate(u)}>Activar</button>
                    )}
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
