import React, { createContext, useContext, useEffect, useState } from 'react'
import jwtDecode from 'jwt-decode'

const AuthCtx = createContext(null)

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem('token'))
  const [user, setUser] = useState(() => {
    const t = localStorage.getItem('token')
    return t ? jwtDecode(t) : null
  })

  function login(t) {
    localStorage.setItem('token', t)
    setToken(t)
    setUser(jwtDecode(t))
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
