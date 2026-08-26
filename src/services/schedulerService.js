import apiFetch from './api'

export const schedulerService = {
  getAll: async () => {
    return await apiFetch('/schedules')
  },

  getById: async (id) => {
    return await apiFetch(`/schedules/${id}`)
  },

  create: async (data) => {
    return await apiFetch('/schedules', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  },

  update: async (id, data) => {
    return await apiFetch(`/schedules/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    })
  },

  delete: async (id) => {
    return await apiFetch(`/schedules/${id}`, {
      method: 'DELETE',
    })
  },

  cancel: async (id) => {
    return await apiFetch(`/schedules/${id}/cancel`, {
      method: 'POST',
    })
  },
}

export default schedulerService
