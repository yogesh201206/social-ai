import apiFetch, { setAuthToken } from './api'

export const authService = {
  login: async (credentials) => {
    const data = await apiFetch('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    })
    if (data?.token) {
      setAuthToken(data.token)
      if (data.user) {
        localStorage.setItem('socialflow_user', JSON.stringify(data.user))
      }
    }
    return data
  },

  register: async (userData) => {
    const data = await apiFetch('/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData),
    })
    if (data?.token) {
      setAuthToken(data.token)
      if (data.user) {
        localStorage.setItem('socialflow_user', JSON.stringify(data.user))
      }
    }
    return data
  },

  getCurrentUser: async () => {
    return await apiFetch('/auth/me')
  },

  logout: () => {
    setAuthToken(null)
    localStorage.removeItem('socialflow_user')
  },
}

export default authService
