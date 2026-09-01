import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { useAuth } from './AuthContext'
import postService from '../services/postService'

const PostContext = createContext()

function toUtcDate(dateStr) {
  if (!dateStr) return null
  if (dateStr instanceof Date) return dateStr
  const str = String(dateStr)
  const isoStr = (str.endsWith('Z') || str.includes('+') || (str.includes('-') && str.lastIndexOf('-') > 10))
    ? str
    : `${str}Z`
  const d = new Date(isoStr)
  return Number.isNaN(d.getTime()) ? null : d
}

function formatScheduleDate(dateStr, timezone = 'Asia/Kolkata') {
  const date = toUtcDate(dateStr)
  if (!date) return null
  try {
    return date.toLocaleDateString('en-US', {
      timeZone: timezone || 'Asia/Kolkata',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })
  } catch (e) {
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  }
}

function formatScheduleTime(dateStr, timezone = 'Asia/Kolkata') {
  const date = toUtcDate(dateStr)
  if (!date) return null
  try {
    return date.toLocaleTimeString('en-US', {
      timeZone: timezone || 'Asia/Kolkata',
      hour: 'numeric',
      minute: '2-digit',
    })
  } catch (e) {
    return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
  }
}

function mapPostFromBackend(p) {
  const platform = p.platform ? (p.platform.charAt(0).toUpperCase() + p.platform.slice(1).toLowerCase()) : 'Instagram'
  const status = p.status ? (p.status.charAt(0).toUpperCase() + p.status.slice(1).toLowerCase()) : 'Draft'
  const hashtags = p.hashtags
    ? (typeof p.hashtags === 'string' ? p.hashtags.split(/[\s,]+/).filter(Boolean) : p.hashtags)
    : []

  const tz = p.timezone || 'Asia/Kolkata'

  return {
    id: String(p.id),
    title: p.title,
    caption: p.caption || '',
    imageUrl: p.imageUrl,
    image: p.imageUrl || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=600&h=400&fit=crop',
    hashtags,
    platform,
    restaurantId: p.restaurantId ? String(p.restaurantId) : '',
    restaurantName: p.restaurantName || '',
    restaurant: p.restaurantName || '',
    branchId: p.branchId ? String(p.branchId) : '',
    branchName: p.branchName || '',
    branch: p.branchName || '',
    status,
    scheduledAt: p.scheduledAt,
    timezone: tz,
    scheduledDate: formatScheduleDate(p.scheduledAt, tz),
    scheduledTime: formatScheduleTime(p.scheduledAt, tz),
    publishedAt: p.publishedAt ? new Date(p.publishedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : null,
    createdAt: p.createdAt ? new Date(p.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'Recently',
    platformPostId: p.platformPostId || null,
    failureReason: p.failureReason || null,
    likes: p.likes ?? null,
    comments: p.comments ?? null,
    shares: p.shares ?? null,
    views: p.views ?? null,
    metricsStatus: p.metricsStatus || 'NOT_FETCHED',
    metricsUpdatedAt: p.metricsUpdatedAt || null,
    metrics: (p.likes != null || p.comments != null || p.shares != null || p.views != null)
      ? { likes: p.likes, comments: p.comments, shares: p.shares, views: p.views }
      : null,
  }
}

export function PostProvider({ children }) {
  const { token } = useAuth()
  const [posts, setPosts] = useState([])
  const [loading, setLoading] = useState(false)

  const refreshPosts = useCallback(async () => {
    setLoading(true)
    try {
      const data = await postService.getAll()
      if (Array.isArray(data)) {
        setPosts(data.map(mapPostFromBackend))
      }
    } catch (err) {
      console.warn('[PostContext fetch error]:', err.message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    refreshPosts()
  }, [refreshPosts, token])

  const getPost = useCallback((id) => posts.find((p) => String(p.id) === String(id)), [posts])

  const addPost = useCallback(async (post) => {
    const platformEnum = (post.platform || 'INSTAGRAM').toUpperCase()
    const statusEnum = (post.status || 'DRAFT').toUpperCase()
    const hashtagsStr = Array.isArray(post.hashtags)
      ? post.hashtags.join(' ')
      : (post.hashtags || '')

    let scheduledAt = post.scheduledAt
    if (!scheduledAt && post.scheduledDate && post.scheduledTimeInput) {
      scheduledAt = `${post.scheduledDate}T${post.scheduledTimeInput}:00`
    }

    const payload = {
      title: post.title,
      caption: post.caption || '',
      imageUrl: post.image || post.imageUrl || null,
      hashtags: hashtagsStr,
      platform: platformEnum,
      restaurantId: post.restaurantId ? Number(post.restaurantId) : null,
      branchId: post.branchId ? Number(post.branchId) : null,
      status: statusEnum,
      scheduledAt: scheduledAt || null,
      timezone: post.timezone || 'Asia/Kolkata',
    }

    const res = await postService.create(payload)
    const newPost = mapPostFromBackend(res)
    setPosts((prev) => [newPost, ...prev])
    return newPost
  }, [])

  const updatePost = useCallback(async (id, updates) => {
    const payload = {}
    if (updates.title !== undefined) payload.title = updates.title
    if (updates.caption !== undefined) payload.caption = updates.caption
    if (updates.image !== undefined || updates.imageUrl !== undefined) {
      payload.imageUrl = updates.image || updates.imageUrl
    }
    if (updates.hashtags !== undefined) {
      payload.hashtags = Array.isArray(updates.hashtags) ? updates.hashtags.join(' ') : updates.hashtags
    }
    if (updates.platform !== undefined) {
      payload.platform = updates.platform.toUpperCase()
    }
    if (updates.restaurantId !== undefined) {
      payload.restaurantId = updates.restaurantId ? Number(updates.restaurantId) : null
    }
    if (updates.branchId !== undefined) {
      payload.branchId = updates.branchId ? Number(updates.branchId) : null
    }
    if (updates.status !== undefined) {
      payload.status = updates.status.toUpperCase()
    }
    if (updates.timezone !== undefined) {
      payload.timezone = updates.timezone
    }
    if (updates.scheduledAt !== undefined) {
      payload.scheduledAt = updates.scheduledAt
    } else if (updates.scheduledDate && updates.scheduledTimeInput) {
      payload.scheduledAt = `${updates.scheduledDate}T${updates.scheduledTimeInput}:00`
    }

    const res = await postService.update(id, payload)
    const updatedPost = mapPostFromBackend(res)
    setPosts((prev) => prev.map((p) => (String(p.id) === String(id) ? updatedPost : p)))
    return updatedPost
  }, [])

  const deletePost = useCallback(async (id) => {
    await postService.delete(id)
    setPosts((prev) => prev.filter((p) => String(p.id) !== String(id)))
  }, [])

  const cancelSchedule = useCallback(async (id) => {
    const res = await postService.cancel(id)
    const updatedPost = mapPostFromBackend(res)
    setPosts((prev) => prev.map((p) => (String(p.id) === String(id) ? updatedPost : p)))
    return updatedPost
  }, [])

  const publishPost = useCallback(async (id) => {
    const res = await postService.publishPost(id)
    const updatedPost = mapPostFromBackend(res)
    setPosts((prev) => prev.map((p) => (String(p.id) === String(id) ? updatedPost : p)))
    return updatedPost
  }, [])

  const refreshMetrics = useCallback(async (id) => {
    const res = await postService.refreshMetrics(id)
    const updatedPost = mapPostFromBackend(res)
    setPosts((prev) => prev.map((p) => (String(p.id) === String(id) ? updatedPost : p)))
    return updatedPost
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
    const publishedWithMetrics = posts.filter(
      (p) => p.status === 'Published' && p.metrics && (p.metricsStatus === 'AVAILABLE' || p.likes != null)
    )
    const totalLikes = publishedWithMetrics.reduce((sum, p) => sum + (p.likes || 0), 0)
    const totalComments = publishedWithMetrics.reduce((sum, p) => sum + (p.comments || 0), 0)
    const totalShares = publishedWithMetrics.reduce((sum, p) => sum + (p.shares || 0), 0)
    const avgEngagement = publishedWithMetrics.length
      ? Math.round((totalLikes + totalComments + totalShares) / publishedWithMetrics.length)
      : 0
    return {
      totalLikes,
      totalComments,
      totalShares,
      avgEngagement,
      publishedCount: posts.filter((p) => p.status === 'Published').length,
    }
  }, [posts])

  return (
    <PostContext.Provider
      value={{
        posts,
        loading,
        refreshPosts,
        getPost,
        addPost,
        updatePost,
        deletePost,
        cancelSchedule,
        publishPost,
        refreshMetrics,
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

