import { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react'
import { initialScheduledPosts } from '../data/schedulerData'
import schedulerService from '../services/schedulerService'

const STORAGE_KEY = 'socialflow_scheduler_posts'

function loadPosts() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved) return JSON.parse(saved)
  } catch {
    // ignore
  }
  return initialScheduledPosts
}

function formatDisplayDate(dateStr) {
  if (!dateStr) return ''
  const date = new Date(`${dateStr}T12:00:00`)
  return date.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
}

function formatDisplayTime(timeStr) {
  if (!timeStr) return ''
  const [hours, minutes] = timeStr.split(':')
  const date = new Date()
  date.setHours(parseInt(hours, 10), parseInt(minutes, 10))
  return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
}

const SchedulerContext = createContext()

export function SchedulerProvider({ children }) {
  const [scheduledPosts, setScheduledPosts] = useState(loadPosts)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    setLoading(true)
    schedulerService.getAll()
      .then((data) => {
        if (Array.isArray(data) && data.length > 0) {
          const formatted = data.map(s => ({
            id: String(s.id),
            postId: s.postId ? String(s.postId) : null,
            title: s.postTitle || 'Scheduled Post',
            restaurantId: String(s.restaurantId),
            restaurantName: s.restaurantName || 'Bella Italia Bistro',
            branchId: s.branchId ? String(s.branchId) : null,
            branchName: s.branchName || 'Main Branch',
            platforms: s.platform ? [s.platform.charAt(0) + s.platform.slice(1).toLowerCase()] : ['Instagram'],
            scheduledDate: s.scheduledDateTime ? s.scheduledDateTime.split('T')[0] : '2026-08-28',
            scheduledDateDisplay: s.scheduledDateTime ? new Date(s.scheduledDateTime).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) : 'Aug 28, 2026',
            scheduledTimeInput: '18:00',
            scheduledTime: s.scheduledDateTime ? new Date(s.scheduledDateTime).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }) : '6:00 PM',
            timezone: s.timezone || 'EST (UTC-5)',
            status: s.status === 'CANCELLED' ? 'Cancelled' : s.status === 'PUBLISHED' ? 'Published' : 'Scheduled',
          }))
          setScheduledPosts(formatted)
        }
      })
      .catch((err) => {
        console.log('Using fallback mock data for Scheduler:', err.message)
      })
      .finally(() => setLoading(false))
  }, [])

  const addScheduledPost = useCallback(async (post) => {
    try {
      const scheduledDateTime = `${post.scheduledDate || '2026-08-28'}T${post.scheduledTimeInput || '18:00'}:00`
      const res = await schedulerService.create({
        postId: post.postId ? Number(post.postId) : null,
        restaurantId: post.restaurantId ? Number(post.restaurantId) : 1,
        branchId: post.branchId ? Number(post.branchId) : null,
        platform: (post.platforms?.[0] || 'INSTAGRAM').toUpperCase(),
        scheduledDateTime,
        timezone: post.timezone || 'UTC',
      })
      const newPost = {
        ...post,
        id: String(res.id),
        scheduledDateDisplay: post.scheduledDateDisplay || formatDisplayDate(post.scheduledDate),
        scheduledTime: post.scheduledTime || formatDisplayTime(post.scheduledTimeInput),
        createdAt: post.createdAt || new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      }
      setScheduledPosts((prev) => [newPost, ...prev])
      return newPost
    } catch (e) {
      const newPost = {
        ...post,
        id: post.id || `sch-${Date.now()}`,
        scheduledDateDisplay: post.scheduledDateDisplay || formatDisplayDate(post.scheduledDate),
        scheduledTime: post.scheduledTime || formatDisplayTime(post.scheduledTimeInput),
        createdAt: post.createdAt || new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      }
      setScheduledPosts((prev) => [newPost, ...prev])
      return newPost
    }
  }, [])

  const updateScheduledPost = useCallback(async (id, updates) => {
    try {
      await schedulerService.update(id, updates)
    } catch (e) {}
    setScheduledPosts((prev) => {
      const updated = prev.map((post) => {
        if (String(post.id) !== String(id)) return post
        const merged = { ...post, ...updates }
        if (updates.scheduledDate) {
          merged.scheduledDateDisplay = formatDisplayDate(updates.scheduledDate)
        }
        if (updates.scheduledTimeInput) {
          merged.scheduledTime = formatDisplayTime(updates.scheduledTimeInput)
        }
        return merged
      })
      return updated
    })
  }, [])

  const deleteScheduledPost = useCallback(async (id) => {
    try {
      await schedulerService.delete(id)
    } catch (e) {}
    setScheduledPosts((prev) => prev.filter((post) => String(post.id) !== String(id)))
  }, [])

  const cancelScheduledPost = useCallback(async (id) => {
    try {
      await schedulerService.cancel(id)
    } catch (e) {}
    updateScheduledPost(id, { status: 'Cancelled' })
  }, [updateScheduledPost])

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
          ...post.platforms,
        ].join(' ').toLowerCase()
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
