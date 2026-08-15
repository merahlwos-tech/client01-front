// src/context/StaffAuthContext.jsx
// Authentification de la plateforme interne (atelier), avec rôle.

import { createContext, useContext, useState, useEffect } from 'react'
import staffApi from '../utils/staffApi'

const StaffAuthContext = createContext(null)

export function StaffAuthProvider({ children }) {
  const [token, setToken]     = useState(null)
  const [user, setUser]       = useState(null)   // { username, role }
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const stored = localStorage.getItem('staffToken')
    if (stored) verifyToken(stored)
    else setLoading(false)
  }, [])

  const verifyToken = async (tkn) => {
    try {
      const res = await staffApi.get('/auth/verify', {
        headers: { Authorization: `Bearer ${tkn}` },
      })
      setToken(tkn)
      setUser(res.data.user || null)
    } catch {
      localStorage.removeItem('staffToken')
      setToken(null)
      setUser(null)
    } finally {
      setLoading(false)
    }
  }

  const login = async (username, password) => {
    const res = await staffApi.post('/auth/login', { username, password })
    const { token: newToken, user: newUser } = res.data
    localStorage.setItem('staffToken', newToken)
    setToken(newToken)
    setUser(newUser || null)
    return res.data
  }

  const logout = () => {
    localStorage.removeItem('staffToken')
    setToken(null)
    setUser(null)
  }

  const isAuthenticated = !!token
  const role = user?.role || null

  return (
    <StaffAuthContext.Provider
      value={{ token, user, role, loading, isAuthenticated, login, logout }}>
      {children}
    </StaffAuthContext.Provider>
  )
}

export function useStaffAuth() {
  const ctx = useContext(StaffAuthContext)
  if (!ctx) throw new Error('useStaffAuth must be used within StaffAuthProvider')
  return ctx
}

export default StaffAuthContext
