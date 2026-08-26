import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { posts as initialPosts } from '../data/postsData'
import postService from '../services/postService'

const PostContext = createContext()

export function PostProvider({ children }) {
  const [posts, setPosts] = useState(initialPosts)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    setLoading(true)
    postService.getAll()
      .then((data) => {
        if (Array.isArray(data) && data.length > 0) {
          const formatted = data.map(p => ({
            id: String(p.id),
            title: p.title,
            caption: p.caption,
            imageUrl: p.imageUrl,
            hashtags: p.hashtags,
            platform: p.platform ? p.platform.charAt(0) + p.platform.slice(1).toLowerCase() : 'Instagram',
            restaurant: p.restaurantName || 'Bella Italia Bistro',
            branch: p.branchName || 'Main Branch',
            status: p.status ? p.status.charAt(0) + p.status.slice(1).toLowerCase() : 'Draft',
            createdAt: p.createdAt ? new Date(p.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'Recently',
            scheduledDate: p.scheduledAt ? new Date(p.scheduledAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : null,
            scheduledTime: p.scheduledAt ? new Date(p.scheduledAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : null,
            metrics: p.status === 'PUBLISHED' ? { likes: 120, comments: 14, shares: 8 } : null,
          }))
          setPosts(formatted)
        }
      })
      .catch((err) => {
        console.log('Using fallback mock data for posts:', err.message)
      })
      .finally(() => setLoading(false))
  }, [])

  const getPost = useCallback((id) => posts.find((p) => String(p.id) === String(id)), [posts])

  const addPost = useCallback(async (post) => {
    try {
      const platformEnum = (post.platform || 'INSTAGRAM').toUpperCase()
      const statusEnum = (post.status || 'DRAFT').toUpperCase()
      const res = await postService.create({
        title: post.title,
        caption: post.caption,
        imageUrl: post.imageUrl,
        hashtags: post.hashtags,
        platform: platformEnum,
        restaurantId: Number(post.restaurantId) || 1,
        branchId: post.branchId ? Number(post.branchId) : null,
        status: statusEnum,
      })
      const newPost = {
        ...post,
        id: String(res.id),
        createdAt: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
        status: post.status || 'Draft',
        metrics: post.status === 'Published' ? post.metrics || { likes: 0, comments: 0, shares: 0 } : null,
      }
      setPosts((prev) => [newPost, ...prev])
      return newPost
    } catch (e) {
      const newPost = {
        ...post,
        id: String(Date.now()),
        createdAt: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
        status: post.status || 'Draft',
        metrics: post.status === 'Published' ? post.metrics || { likes: 0, comments: 0, shares: 0 } : null,
      }
      setPosts((prev) => [newPost, ...prev])
      return newPost
    }
  }, [])

  const updatePost = useCallback(async (id, updates) => {
    try {
      await postService.update(id, updates)
    } catch (e) {}
    setPosts((prev) =>
      prev.map((p) => (String(p.id) === String(id) ? { ...p, ...updates } : p))
    )
  }, [])

  const deletePost = useCallback(async (id) => {
    try {
      await postService.delete(id)
    } catch (e) {}
    setPosts((prev) => prev.filter((p) => String(p.id) !== String(id)))
  }, [])

  const cancelSchedule = useCallback(async (id) => {
    try {
      await postService.cancel(id)
    } catch (e) {}
    setPosts((prev) =>
      prev.map((p) =>
        String(p.id) === String(id)
          ? { ...p, status: 'Draft', scheduledDate: null, scheduledTime: null }
          : p
      )
    )
  }, [])

  const getPostsByStatus = useCallback(
    (status) => posts.filter((p) => p.status?.toLowerCase() === status?.toLowerCase()),
    [posts]
  )

  const getRecentPosts = useCallback(
    (limit = 5) => [...posts].slice(0, limit),
    [posts]
  )

  const getPerformanceOverview = useCallback(() => {
    const published = posts.filter((p) => p.status === 'Published' && p.metrics)
    const totalLikes = published.reduce((sum, p) => sum + (p.metrics?.likes || 0), 0)
    const totalComments = published.reduce((sum, p) => sum + (p.metrics?.comments || 0), 0)
    const totalShares = published.reduce((sum, p) => sum + (p.metrics?.shares || 0), 0)
    const avgEngagement = published.length
      ? Math.round((totalLikes + totalComments + totalShares) / published.length)
      : 0
    return { totalLikes, totalComments, totalShares, avgEngagement, publishedCount: published.length }
  }, [posts])

  return (
    <PostContext.Provider
      value={{
        posts,
        loading,
        getPost,
        addPost,
        updatePost,
        deletePost,
        cancelSchedule,
        getPostsByStatus,
        getRecentPosts,
        getPerformanceOverview,
      }}
    >
      {children}
    </PostContext.Provider>
  )
}

export function usePosts() {
  const context = useContext(PostContext)
  if (!context) {
    throw new Error('usePosts must be used within PostProvider')
  }
  return context
}
