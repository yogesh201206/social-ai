const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api'

export const getAuthToken = () => {
  return localStorage.getItem('socialflow_token') || localStorage.getItem('token') || ''
}

export const setAuthToken = (token) => {
  if (token) {
    localStorage.setItem('socialflow_token', token)
    localStorage.setItem('token', token)
  } else {
    localStorage.removeItem('socialflow_token')
    localStorage.removeItem('token')
  }
}

export const apiFetch = async (endpoint, options = {}) => {
  const token = getAuthToken()
  
  const isFormData = options.body instanceof FormData
  const headers = {
    ...(isFormData ? {} : { 'Content-Type': 'application/json' }),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  }

  const url = endpoint.startsWith('http') ? endpoint : `${API_BASE_URL}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`

  try {
    const response = await fetch(url, {
      ...options,
      headers,
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      let message = errorData.message
      if (errorData.errors && typeof errorData.errors === 'object') {
        const fieldErrors = Object.entries(errorData.errors).map(([field, msg]) => `${field}: ${msg}`).join(', ')
        if (fieldErrors) message = `${message ? message + ': ' : ''}${fieldErrors}`
      }
      const error = new Error(message || `Request failed with status ${response.status}`)
      error.status = response.status
      error.data = errorData
      throw error
    }

    if (response.status === 204) {
      return null
    }

    return await response.json()
  } catch (err) {
    console.warn(`[API fetch error for ${endpoint}]:`, err.message)
    throw err
  }
}

export default apiFetch
