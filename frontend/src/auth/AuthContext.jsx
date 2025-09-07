import React, { createContext, useContext, useEffect, useState } from 'react'
import { jwtDecode } from 'jwt-decode'

const AuthCtx = createContext(null)

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem('token'))
  const [user, setUser] = useState(() => {
    const t = localStorage.getItem('token')
    if (!t) return null
    try {
      return jwtDecode(t)
    } catch {
      // token inválido o corrupto
      localStorage.removeItem('token')
      return null
    }
  })

  function login(t) {
    localStorage.setItem('token', t)
    setToken(t)
    try {
      setUser(jwtDecode(t))
    } catch {
      setUser(null)
    }
  }

  function logout() {
    localStorage.removeItem('token')
    setToken(null)
    setUser(null)
  }

  const value = { token, user, login, logout }
  return <AuthCtx.Provider value={value}>{children}</AuthCtx.Provider>
}

export function useAuth() {
  return useContext(AuthCtx)
}
