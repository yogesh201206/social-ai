import apiFetch from './api'

export const adminService = {
  getDashboard: async () => {
    return await apiFetch('/admin/dashboard')
  },

  getUsers: async () => {
    return await apiFetch('/admin/users')
  },

  getRestaurants: async () => {
    return await apiFetch('/admin/restaurants')
  },

  getReports: async () => {
    return await apiFetch('/admin/reports')
  },
}

export default adminService
