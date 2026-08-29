import { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react'
import { useAuth } from './AuthContext'
import schedulerService from '../services/schedulerService'

function formatDisplayDate(dateStr) {
  if (!dateStr) return ''
  const date = new Date(dateStr)
  if (Number.isNaN(date.getTime())) return ''
  return date.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
}

function formatDisplayTime(dateStr) {
  if (!dateStr) return ''
  const date = new Date(dateStr)
  if (Number.isNaN(date.getTime())) return ''
  return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
}

function parseDatePart(dateStr) {
  if (!dateStr) return ''
  return dateStr.split('T')[0]
}

function parseTimeInputPart(dateStr) {
  if (!dateStr) return '18:00'
  const timePart = dateStr.includes('T') ? dateStr.split('T')[1] : ''
  if (!timePart) return '18:00'
  const parts = timePart.split(':')
  return `${parts[0] || '18'}:${parts[1] || '00'}`
}

function mapScheduleFromBackend(s) {
  const platform = s.platform
    ? (s.platform.charAt(0).toUpperCase() + s.platform.slice(1).toLowerCase())
    : 'Instagram'

  const status = s.status === 'CANCELLED'
    ? 'Cancelled'
    : s.status === 'PUBLISHED'
    ? 'Published'
    : 'Scheduled'

  return {
    id: String(s.id),
    postId: s.postId ? String(s.postId) : null,
    title: s.postTitle || 'Scheduled Post',
    restaurantId: s.restaurantId ? String(s.restaurantId) : '',
    restaurantName: s.restaurantName || '',
    branchId: s.branchId ? String(s.branchId) : '',
    branchName: s.branchName || '',
    platforms: [platform],
    platform,
    scheduledDateTime: s.scheduledDateTime,
    scheduledDate: parseDatePart(s.scheduledDateTime),
    scheduledDateDisplay: formatDisplayDate(s.scheduledDateTime),
    scheduledTimeInput: parseTimeInputPart(s.scheduledDateTime),
    scheduledTime: formatDisplayTime(s.scheduledDateTime),
    timezone: s.timezone || 'UTC',
    status,
    createdAt: s.createdAt ? new Date(s.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'Recently',
  }
}

const SchedulerContext = createContext()

export function SchedulerProvider({ children }) {
  const { token } = useAuth()
  const [scheduledPosts, setScheduledPosts] = useState([])
  const [loading, setLoading] = useState(false)

  const refreshScheduledPosts = useCallback(async () => {
    setLoading(true)
    try {
      const data = await schedulerService.getAll()
      if (Array.isArray(data)) {
        setScheduledPosts(data.map(mapScheduleFromBackend))
      }
    } catch (err) {
      console.warn('[SchedulerContext fetch error]:', err.message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    refreshScheduledPosts()
  }, [refreshScheduledPosts, token])

  const addScheduledPost = useCallback(async (post) => {
    const scheduledDateTime = post.scheduledDateTime || `${post.scheduledDate}T${post.scheduledTimeInput || '18:00'}:00`
    const platform = (post.platforms?.[0] || post.platform || 'INSTAGRAM').toUpperCase()

    const payload = {
      postId: post.postId ? Number(post.postId) : null,
      restaurantId: post.restaurantId ? Number(post.restaurantId) : null,
      branchId: post.branchId ? Number(post.branchId) : null,
      platform,
      scheduledDateTime,
      timezone: post.timezone || 'UTC',
      status: (post.status || 'SCHEDULED').toUpperCase(),
    }

    const res = await schedulerService.create(payload)
    const newPost = {
      ...mapScheduleFromBackend(res),
      title: post.title || res.postTitle || 'Scheduled Post',
      caption: post.caption,
      hashtags: post.hashtags,
      image: post.image,
    }
    setScheduledPosts((prev) => [newPost, ...prev])
    return newPost
  }, [])

  const updateScheduledPost = useCallback(async (id, updates) => {
    let scheduledDateTime = updates.scheduledDateTime
    if (!scheduledDateTime && updates.scheduledDate && updates.scheduledTimeInput) {
      scheduledDateTime = `${updates.scheduledDate}T${updates.scheduledTimeInput}:00`
    }

    const payload = {}
    if (updates.restaurantId !== undefined) payload.restaurantId = updates.restaurantId ? Number(updates.restaurantId) : null
    if (updates.branchId !== undefined) payload.branchId = updates.branchId ? Number(updates.branchId) : null
    if (updates.platforms?.length) payload.platform = updates.platforms[0].toUpperCase()
    else if (updates.platform) payload.platform = updates.platform.toUpperCase()
    if (scheduledDateTime) payload.scheduledDateTime = scheduledDateTime
    if (updates.timezone !== undefined) payload.timezone = updates.timezone
    if (updates.status !== undefined) payload.status = updates.status.toUpperCase()

    const res = await schedulerService.update(id, payload)
    const updatedPost = {
      ...mapScheduleFromBackend(res),
      title: updates.title || res.postTitle || 'Scheduled Post',
      caption: updates.caption,
      hashtags: updates.hashtags,
      image: updates.image,
    }
    setScheduledPosts((prev) => prev.map((p) => (String(p.id) === String(id) ? updatedPost : p)))
    return updatedPost
  }, [])

  const deleteScheduledPost = useCallback(async (id) => {
    await schedulerService.delete(id)
    setScheduledPosts((prev) => prev.filter((post) => String(post.id) !== String(id)))
  }, [])

  const cancelScheduledPost = useCallback(async (id) => {
    const res = await schedulerService.cancel(id)
    const updatedPost = mapScheduleFromBackend(res)
    setScheduledPosts((prev) => prev.map((p) => (String(p.id) === String(id) ? { ...p, ...updatedPost } : p)))
    return updatedPost
  }, [])

  const getScheduledPost = useCallback(
    (id) => scheduledPosts.find((post) => String(post.id) === String(id)),
    [scheduledPosts]
  )

  const filterScheduledPosts = useCallback((filters = {}) => {
    const { platform, restaurantId, branchId, status, date, search } = filters
    return scheduledPosts.filter((post) => {
      if (platform && !post.platforms.includes(platform)) return false
      if (restaurantId && post.restaurantId !== restaurantId) return false
      if (branchId && post.branchId !== branchId) return false
      if (status && post.status !== status) return false
      if (date && post.scheduledDate !== date) return false
      if (search) {
        const q = search.toLowerCase()
        const haystack = [
          post.title,
          post.caption,
          post.restaurantName,
          post.branchName,
          ...(post.platforms || []),
        ].filter(Boolean).join(' ').toLowerCase()
        if (!haystack.includes(q)) return false
      }
      return true
    })
  }, [scheduledPosts])

  const getSchedulerStats = useMemo(() => {
    const now = new Date()
    const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
    const weekStart = new Date(now)
    weekStart.setDate(now.getDate() - now.getDay())
    weekStart.setHours(0, 0, 0, 0)
    const weekEnd = new Date(weekStart)
    weekEnd.setDate(weekStart.getDate() + 6)
    weekEnd.setHours(23, 59, 59, 999)

    const scheduled = scheduledPosts.filter((p) => p.status === 'Scheduled')
    const todayPosts = scheduledPosts.filter((p) => p.scheduledDate === today && p.status !== 'Cancelled')
    const weekPosts = scheduledPosts.filter((p) => {
      const d = new Date(`${p.scheduledDate}T12:00:00`)
      return d >= weekStart && d <= weekEnd && p.status !== 'Cancelled'
    })
    const platforms = new Set(
      scheduledPosts.filter((p) => p.status === 'Scheduled').flatMap((p) => p.platforms || [])
    )

    return {
      scheduledCount: scheduled.length,
      todayCount: todayPosts.length,
      weekCount: weekPosts.length,
      activePlatforms: platforms.size,
    }
  }, [scheduledPosts])

  const getPostsForDate = useCallback(
    (dateStr) => scheduledPosts.filter((post) => post.scheduledDate === dateStr),
    [scheduledPosts]
  )

  return (
    <SchedulerContext.Provider
      value={{
        scheduledPosts,
        loading,
        refreshScheduledPosts,
        addScheduledPost,
        updateScheduledPost,
        deleteScheduledPost,
        cancelScheduledPost,
        getScheduledPost,
        filterScheduledPosts,
        getSchedulerStats,
        getPostsForDate,
      }}
    >
      {children}
    </SchedulerContext.Provider>
  )
}

export function useScheduler() {
  const context = useContext(SchedulerContext)
  if (!context) {
    throw new Error('useScheduler must be used within SchedulerProvider')
  }
  return context
}

