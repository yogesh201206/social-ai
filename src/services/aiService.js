import apiFetch from './api'

export const aiService = {
  /**
   * Calls the real backend AI generation endpoint.
   * Backend calls Hugging Face — HF_TOKEN never reaches the browser.
   */
  generate: async (data) => {
    return await apiFetch('/ai/generate', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  },

  getHistory: async () => {
    return await apiFetch('/ai/history')
  },

  getHistoryById: async (id) => {
    return await apiFetch(`/ai/history/${id}`)
  },

  deleteHistory: async (id) => {
    return await apiFetch(`/ai/history/${id}`, {
      method: 'DELETE',
    })
  },
}

export default aiService
