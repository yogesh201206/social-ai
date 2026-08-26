import apiFetch from './api'

export const userService = {
  getAll: async () => {
    return await apiFetch('/users')
  },

  getById: async (id) => {
    return await apiFetch(`/users/${id}`)
  },

  update: async (id, data) => {
    return await apiFetch(`/users/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    })
  },

  delete: async (id) => {
    return await apiFetch(`/users/${id}`, {
      method: 'DELETE',
    })
  },

  activate: async (id) => {
    return await apiFetch(`/users/${id}/activate`, {
      method: 'PUT',
    })
  },

  deactivate: async (id) => {
    return await apiFetch(`/users/${id}/deactivate`, {
      method: 'PUT',
    })
  },

  suspend: async (id) => {
    return await apiFetch(`/users/${id}/suspend`, {
      method: 'PUT',
    })
  },
}

export default userService
