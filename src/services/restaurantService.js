import apiFetch from './api'

export const restaurantService = {
  getAll: async () => {
    return await apiFetch('/restaurants')
  },

  getById: async (id) => {
    return await apiFetch(`/restaurants/${id}`)
  },

  create: async (data) => {
    return await apiFetch('/restaurants', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  },

  update: async (id, data) => {
    return await apiFetch(`/restaurants/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    })
  },

  delete: async (id) => {
    return await apiFetch(`/restaurants/${id}`, {
      method: 'DELETE',
    })
  },

  getBranches: async (restaurantId) => {
    return await apiFetch(`/restaurants/${restaurantId}/branches`)
  },

  addBranch: async (restaurantId, data) => {
    return await apiFetch(`/restaurants/${restaurantId}/branches`, {
      method: 'POST',
      body: JSON.stringify(data),
    })
  },

  updateBranch: async (branchId, data) => {
    return await apiFetch(`/branches/${branchId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    })
  },

  deleteBranch: async (branchId) => {
    return await apiFetch(`/branches/${branchId}`, {
      method: 'DELETE',
    })
  },
}

export default restaurantService
