import { useState, useMemo } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import * as Icons from 'lucide-react'
import { useScheduler } from '../../context/SchedulerContext'
import { platformIcons, platformColors } from '../../data/postsData'
import { statusStyles } from '../../data/schedulerData'
import StatusBadge from '../../components/StatusBadge'

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
]
const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

function toDateStr(date) {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

function isSameDay(a, b) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate()
}

function CalendarEvent({ post, compact = false, onClick }) {
  const primaryPlatform = post.platforms[0]
  const Icon = Icons[platformIcons[primaryPlatform]] || Icons.Globe
  const gradient = platformColors[primaryPlatform] || 'from-gray-500 to-gray-600'

  return (
    <button
      type="button"
      onClick={() => onClick?.(post)}
      className={`w-full text-left border-l-4 rounded-lg px-2 py-1.5 mb-1 transition-all hover:scale-[1.01] ${statusStyles[post.status] || ''}`}
    >
      <div className="flex items-center gap-1.5">
        <div className={`h-4 w-4 rounded flex-shrink-0 bg-gradient-to-br ${gradient} flex items-center justify-center`}>
          <Icon className="h-2.5 w-2.5 text-white" />
        </div>
        <span className={`text-xs font-medium text-gray-900 dark:text-white truncate ${compact ? 'max-w-[60px]' : ''}`}>
          {post.title}
        </span>
      </div>
      {!compact && (
        <div className="flex items-center justify-between mt-0.5 pl-5">
          <span className="text-[10px] text-gray-500 dark:text-gray-400 truncate">{post.restaurantName}</span>
          <span className="text-[10px] text-brand-600 dark:text-brand-400 font-medium">{post.scheduledTime}</span>
        </div>
      )}
    </button>
  )
}

function MonthView({ currentDate, postsByDate, onSelectPost, onSelectDay }) {
  const year = currentDate.getFullYear()
  const month = currentDate.getMonth()
  const firstDay = new Date(year, month, 1)
  const lastDay = new Date(year, month + 1, 0)
  const startPad = firstDay.getDay()
  const totalDays = lastDay.getDate()
  const today = new Date()

  const cells = []
  for (let i = 0; i < startPad; i++) cells.push(null)
  for (let d = 1; d <= totalDays; d++) cells.push(new Date(year, month, d))

  return (
    <div>
      <div className="grid grid-cols-7 gap-px mb-2">
        {DAY_NAMES.map((day) => (
          <div key={day} className="text-center text-xs font-semibold text-gray-500 dark:text-gray-400 py-2">
            {day}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-1">
        {cells.map((date, idx) => {
          if (!date) return <div key={`empty-${idx}`} className="min-h-[100px]" />
          const dateStr = toDateStr(date)
          const dayPosts = postsByDate[dateStr] || []
          const isToday = isSameDay(date, today)

          return (
            <div
              key={dateStr}
              className={`min-h-[100px] p-1.5 rounded-xl border transition-colors ${
                isToday
                  ? 'border-brand-500 bg-brand-50/50 dark:bg-brand-900/10'
                  : 'border-gray-100 dark:border-gray-800 hover:border-gray-200 dark:hover:border-gray-700'
              }`}
            >
              <button
                type="button"
                onClick={() => onSelectDay?.(date)}
                className={`text-xs font-semibold mb-1 h-6 w-6 rounded-full flex items-center justify-center ${
                  isToday ? 'gradient-bg text-white' : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
                }`}
              >
                {date.getDate()}
              </button>
              <div className="space-y-0.5">
                {dayPosts.slice(0, 2).map((post) => (
                  <CalendarEvent key={post.id} post={post} compact onClick={onSelectPost} />
                ))}
                {dayPosts.length > 2 && (
                  <p className="text-[10px] text-brand-600 dark:text-brand-400 font-medium pl-1">
                    +{dayPosts.length - 2} more
                  </p>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function WeekView({ currentDate, postsByDate, onSelectPost }) {
  const start = new Date(currentDate)
  start.setDate(currentDate.getDate() - currentDate.getDay())

  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(start)
    d.setDate(start.getDate() + i)
    return d
  })

  return (
    <div className="grid grid-cols-1 sm:grid-cols-7 gap-3">
      {days.map((date) => {
        const dateStr = toDateStr(date)
        const dayPosts = postsByDate[dateStr] || []
        const isToday = isSameDay(date, new Date())

        return (
          <div
            key={dateStr}
            className={`rounded-xl border p-3 min-h-[200px] ${
              isToday
                ? 'border-brand-500 bg-brand-50/30 dark:bg-brand-900/10'
                : 'border-gray-100 dark:border-gray-800'
            }`}
          >
            <div className="text-center mb-3 pb-2 border-b border-gray-100 dark:border-gray-800">
              <p className="text-xs text-gray-500 dark:text-gray-400">{DAY_NAMES[date.getDay()]}</p>
              <p className={`text-lg font-bold ${isToday ? 'gradient-text' : 'text-gray-900 dark:text-white'}`}>
                {date.getDate()}
              </p>
            </div>
            <div className="space-y-1">
              {dayPosts.length === 0 ? (
                <p className="text-xs text-gray-400 text-center py-4">No posts</p>
              ) : (
                dayPosts.map((post) => (
                  <CalendarEvent key={post.id} post={post} onClick={onSelectPost} />
                ))
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}

function DayView({ currentDate, postsByDate, onSelectPost }) {
  const dateStr = toDateStr(currentDate)
  const dayPosts = (postsByDate[dateStr] || []).sort((a, b) =>
    (a.scheduledTimeInput || '').localeCompare(b.scheduledTimeInput || '')
  )

  return (
    <div className="max-w-2xl mx-auto">
      <div className="text-center mb-6">
        <p className="text-sm text-gray-500 dark:text-gray-400">
          {currentDate.toLocaleDateString('en-US', { weekday: 'long' })}
        </p>
        <p className="text-2xl font-bold text-gray-900 dark:text-white">
          {currentDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
        </p>
      </div>

      {dayPosts.length === 0 ? (
        <div className="text-center py-12 text-gray-400">
          <Icons.Calendar className="h-12 w-12 mx-auto mb-3 opacity-50" />
          <p className="text-sm">No posts scheduled for this day</p>
        </div>
      ) : (
        <div className="space-y-3">
          {dayPosts.map((post) => {
            const primaryPlatform = post.platforms[0]
            const Icon = Icons[platformIcons[primaryPlatform]] || Icons.Globe
            return (
              <button
                key={post.id}
                type="button"
                onClick={() => onSelectPost?.(post)}
                className={`w-full flex items-start gap-4 p-4 rounded-2xl border border-gray-100 dark:border-gray-800 hover:shadow-md transition-all text-left ${statusStyles[post.status]}`}
              >
                <div className="text-center flex-shrink-0 w-16">
                  <p className="text-lg font-bold text-brand-600 dark:text-brand-400">{post.scheduledTime}</p>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <Icon className="h-4 w-4 text-gray-500" />
                    <h4 className="font-semibold text-gray-900 dark:text-white truncate">{post.title}</h4>
                    <StatusBadge status={post.status} />
                  </div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {post.restaurantName} · {post.branchName}
                  </p>
                  <div className="flex flex-wrap gap-1 mt-2">
                    {post.platforms.map((p) => (
                      <span key={p} className="text-[10px] px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400">
                        {p}
                      </span>
                    ))}
                  </div>
                </div>
                <img src={post.image} alt="" className="h-14 w-14 rounded-xl object-cover flex-shrink-0 hidden sm:block" />
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}

export default function ScheduleCalendar({ onSelectPost, initialView = 'month', posts }) {
  const { scheduledPosts } = useScheduler()
  const displayPosts = posts || scheduledPosts
  const [view, setView] = useState(initialView)
  const [currentDate, setCurrentDate] = useState(new Date(2026, 7, 10))

  const postsByDate = useMemo(() => {
    const map = {}
    displayPosts.forEach((post) => {
      if (!post.scheduledDate) return
      if (!map[post.scheduledDate]) map[post.scheduledDate] = []
      map[post.scheduledDate].push(post)
    })
    return map
  }, [displayPosts])

  const navigate = (direction) => {
    const next = new Date(currentDate)
    if (view === 'month') {
      next.setMonth(next.getMonth() + direction)
    } else if (view === 'week') {
      next.setDate(next.getDate() + direction * 7)
    } else {
      next.setDate(next.getDate() + direction)
    }
    setCurrentDate(next)
  }

  const headerLabel = () => {
    if (view === 'month') return `${MONTH_NAMES[currentDate.getMonth()]} ${currentDate.getFullYear()}`
    if (view === 'week') {
      const start = new Date(currentDate)
      start.setDate(currentDate.getDate() - currentDate.getDay())
      const end = new Date(start)
      end.setDate(start.getDate() + 6)
      return `${start.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} – ${end.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`
    }
    return currentDate.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })
  }

  return (
    <div className="glass rounded-2xl p-4 sm:p-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-300 transition-colors"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white min-w-[200px] text-center">
            {headerLabel()}
          </h3>
          <button
            type="button"
            onClick={() => navigate(1)}
            className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-300 transition-colors"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
          <button
            type="button"
            onClick={() => setCurrentDate(new Date())}
            className="text-xs font-medium px-3 py-1.5 rounded-lg bg-brand-50 dark:bg-brand-900/20 text-brand-600 dark:text-brand-400 hover:bg-brand-100 dark:hover:bg-brand-900/40 transition-colors"
          >
            Today
          </button>
        </div>

        <div className="flex rounded-xl bg-gray-100 dark:bg-gray-800 p-1">
          {['month', 'week', 'day'].map((v) => (
            <button
              key={v}
              type="button"
              onClick={() => setView(v)}
              className={`px-4 py-1.5 rounded-lg text-sm font-medium capitalize transition-all ${
                view === v
                  ? 'gradient-bg text-white shadow-sm'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              {v}
            </button>
          ))}
        </div>
      </div>

      <div className="flex flex-wrap gap-3 mb-4 pb-4 border-b border-gray-100 dark:border-gray-800">
        {Object.entries(statusStyles).map(([status, style]) => (
          <div key={status} className="flex items-center gap-2">
            <div className={`h-3 w-3 rounded-full border-l-4 ${style.split(' ')[0]}`} />
            <span className="text-xs text-gray-500 dark:text-gray-400">{status}</span>
          </div>
        ))}
      </div>

      {view === 'month' && (
        <MonthView
          currentDate={currentDate}
          postsByDate={postsByDate}
          onSelectPost={onSelectPost}
          onSelectDay={(date) => { setCurrentDate(date); setView('day') }}
        />
      )}
      {view === 'week' && (
        <WeekView currentDate={currentDate} postsByDate={postsByDate} onSelectPost={onSelectPost} />
      )}
      {view === 'day' && (
        <DayView currentDate={currentDate} postsByDate={postsByDate} onSelectPost={onSelectPost} />
      )}
    </div>
  )
}
