import apiFetch from './api'

export const analyticsService = {
  getOverview: async (params = {}) => {
    const query = new URLSearchParams(params).toString()
    return await apiFetch(`/analytics/overview${query ? `?${query}` : ''}`)
  },

  getPlatformAnalytics: async (params = {}) => {
    const query = new URLSearchParams(params).toString()
    return await apiFetch(`/analytics/platforms${query ? `?${query}` : ''}`)
  },

  getPostAnalytics: async (params = {}) => {
    const query = new URLSearchParams(params).toString()
    return await apiFetch(`/analytics/posts${query ? `?${query}` : ''}`)
  },
}

export default analyticsService
