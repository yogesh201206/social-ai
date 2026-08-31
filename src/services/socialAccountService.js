import apiFetch from './api'

export const socialAccountService = {
  /**
   * Returns connected social accounts for the authenticated user's restaurants.
   * Access tokens are NEVER returned — backend-only.
   */
  getAccounts: async () => {
    return await apiFetch('/social-accounts')
  },

  /**
   * Initiates OAuth connection for a platform.
   * Returns { redirectUrl } — the browser should navigate to this URL.
   */
  initiateConnect: async (platform, restaurantId) => {
    return await apiFetch(`/social-accounts/${platform}/connect?restaurantId=${restaurantId}`)
  },

  /**
   * Disconnects a social account by ID.
   */
  disconnect: async (id) => {
    return await apiFetch(`/social-accounts/${id}`, {
      method: 'DELETE',
    })
  },
}

export default socialAccountService
