import apiFetch from './api'

export const emailService = {
  getAll: async () => {
    return await apiFetch('/email-campaigns')
  },

  getById: async (id) => {
    return await apiFetch(`/email-campaigns/${id}`)
  },

  create: async (data) => {
    return await apiFetch('/email-campaigns', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  },

  update: async (id, data) => {
    return await apiFetch(`/email-campaigns/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    })
  },

  delete: async (id) => {
    return await apiFetch(`/email-campaigns/${id}`, {
      method: 'DELETE',
    })
  },

  schedule: async (id, scheduledAt) => {
    return await apiFetch(`/email-campaigns/${id}/schedule`, {
      method: 'POST',
      body: JSON.stringify({ scheduledAt }),
    })
  },
}

export default emailService
