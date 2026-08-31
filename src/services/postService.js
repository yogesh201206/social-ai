import apiFetch from './api'

export const postService = {
  getAll: async () => {
    return await apiFetch('/posts')
  },

  getById: async (id) => {
    return await apiFetch(`/posts/${id}`)
  },

  create: async (data) => {
    return await apiFetch('/posts', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  },

  update: async (id, data) => {
    return await apiFetch(`/posts/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    })
  },

  delete: async (id) => {
    return await apiFetch(`/posts/${id}`, {
      method: 'DELETE',
    })
  },

  getDrafts: async () => {
    return await apiFetch('/posts/drafts')
  },

  getScheduled: async () => {
    return await apiFetch('/posts/scheduled')
  },

  getPublished: async () => {
    return await apiFetch('/posts/published')
  },

  schedule: async (id, scheduledAt) => {
    return await apiFetch(`/posts/${id}/schedule`, {
      method: 'POST',
      body: JSON.stringify({ scheduledAt }),
    })
  },

  cancel: async (id) => {
    return await apiFetch(`/posts/${id}/cancel`, {
      method: 'POST',
    })
  },

  /**
   * Publishes a post to the connected social media platform.
   * Requires connected social account for the post's platform.
   */
  publishPost: async (id) => {
    return await apiFetch(`/posts/${id}/publish`, {
      method: 'POST',
    })
  },
}

export default postService
