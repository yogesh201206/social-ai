import { createContext, useContext, useState, useCallback, useMemo } from 'react'
import { initialScheduledPosts } from '../data/schedulerData'

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

  const addScheduledPost = useCallback((post) => {
    const newPost = {
      ...post,
      id: post.id || `sch-${Date.now()}`,
      scheduledDateDisplay: post.scheduledDateDisplay || formatDisplayDate(post.scheduledDate),
      scheduledTime: post.scheduledTime || formatDisplayTime(post.scheduledTimeInput),
      createdAt: post.createdAt || new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
    }
    setScheduledPosts((prev) => {
      const updated = [newPost, ...prev]
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated))
      return updated
    })
    return newPost
  }, [])

  const updateScheduledPost = useCallback((id, updates) => {
    setScheduledPosts((prev) => {
      const updated = prev.map((post) => {
        if (post.id !== id) return post
        const merged = { ...post, ...updates }
        if (updates.scheduledDate) {
          merged.scheduledDateDisplay = formatDisplayDate(updates.scheduledDate)
        }
        if (updates.scheduledTimeInput) {
          merged.scheduledTime = formatDisplayTime(updates.scheduledTimeInput)
        }
        return merged
      })
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated))
      return updated
    })
  }, [])

  const deleteScheduledPost = useCallback((id) => {
    setScheduledPosts((prev) => {
      const updated = prev.filter((post) => post.id !== id)
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated))
      return updated
    })
  }, [])

  const cancelScheduledPost = useCallback((id) => {
    updateScheduledPost(id, { status: 'Cancelled' })
  }, [updateScheduledPost])

  const getScheduledPost = useCallback(
    (id) => scheduledPosts.find((post) => post.id === id),
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
      scheduledPosts.filter((p) => p.status === 'Scheduled').flatMap((p) => p.platforms)
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
