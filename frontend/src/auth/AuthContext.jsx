import React, { createContext, useContext, useEffect, useState } from 'react'
import api from '../lib/api'

const AuthCtx = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    api.get('/api/auth/me')
      .then(({ data }) => setUser(data.user))
      .catch(() => setUser(null))
      .finally(() => setReady(true))
  }, [])

  function login(nextUser) {
    setUser(nextUser)
  }

  async function logout() {
    try { await api.post('/api/auth/logout') } finally { setUser(null) }
  }

  const value = { user, ready, login, logout }
  return <AuthCtx.Provider value={value}>{children}</AuthCtx.Provider>
}

export function useAuth() {
  return useContext(AuthCtx)
}
