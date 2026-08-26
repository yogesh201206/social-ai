import apiFetch from './api'

export const aiService = {
  getHistory: async () => {
    return await apiFetch('/ai/history')
  },

  getHistoryById: async (id) => {
    return await apiFetch(`/ai/history/${id}`)
  },

  saveHistory: async (data) => {
    return await apiFetch('/ai/history', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  },

  deleteHistory: async (id) => {
    return await apiFetch(`/ai/history/${id}`, {
      method: 'DELETE',
    })
  },
}

export default aiService
