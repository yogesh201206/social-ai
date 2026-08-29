import { createContext, useContext, useState, useEffect } from 'react'
import authService from '../services/authService'
import { getAuthToken } from '../services/api'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('socialflow_user')
    if (saved) {
      try { return JSON.parse(saved) } catch (e) { return null }
    }
    return null
  })
  const [token, setToken] = useState(() => getAuthToken())
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (token) {
      authService.getCurrentUser()
        .then(u => {
          if (u) {
            setUser(u)
            localStorage.setItem('socialflow_user', JSON.stringify(u))
          }
        })
        .catch(() => {
          setUser(null)
          setToken('')
          authService.logout()
        })
    } else {
      setUser(null)
    }
  }, [token])

  const login = async (email, password) => {
    setLoading(true)
    setError(null)
    try {
      const res = await authService.login({ email, password })
      if (res?.user) {
        setUser(res.user)
        setToken(res.token)
      }
      setLoading(false)
      return res
    } catch (err) {
      setLoading(false)
      setError(err.message || 'Login failed')
      throw err
    }
  }

  const register = async (userData) => {
    setLoading(true)
    setError(null)
    try {
      const res = await authService.register(userData)
      if (res?.user) {
        setUser(res.user)
        setToken(res.token)
      }
      setLoading(false)
      return res
    } catch (err) {
      setLoading(false)
      setError(err.message || 'Registration failed')
      throw err
    }
  }

  const logout = () => {
    authService.logout()
    setUser(null)
    setToken('')
  }

  return (
    <AuthContext.Provider value={{ user, token, loading, error, login, register, logout, setUser }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

export default AuthContext
