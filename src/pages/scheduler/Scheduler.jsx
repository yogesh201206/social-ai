import { useState, useMemo } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Plus, Calendar, Clock, CalendarDays, Share2, List, LayoutGrid } from 'lucide-react'
import StatCard from '../../components/StatCard'
import Button from '../../components/Button'
import SearchBar from '../../components/SearchBar'
import SchedulerPostCard from '../../components/SchedulerPostCard'
import EmptyState from '../../components/EmptyState'
import ScheduleCalendar from './ScheduleCalendar'
import { useScheduler } from '../../context/SchedulerContext'
import { useRestaurants } from '../../context/RestaurantContext'
import { schedulerStatuses } from '../../data/schedulerData'
import { platforms } from '../../data/postsData'

export default function Scheduler() {
  const navigate = useNavigate()
  const { getSchedulerStats, filterScheduledPosts, cancelScheduledPost, deleteScheduledPost } = useScheduler()
  const { restaurants } = useRestaurants()
  const stats = getSchedulerStats

  const [activeTab, setActiveTab] = useState('calendar')
  const [filters, setFilters] = useState({
    platform: '',
    restaurantId: '',
    branchId: '',
    status: '',
    date: '',
    search: '',
  })

  const branches = useMemo(() => {
    if (!filters.restaurantId) return []
    const restaurant = restaurants.find((r) => r.id === filters.restaurantId)
    return restaurant?.branches || []
  }, [filters.restaurantId, restaurants])

  const filteredPosts = useMemo(
    () => filterScheduledPosts(filters),
    [filterScheduledPosts, filters]
  )

  const handleCancel = (id) => {
    if (window.confirm('Cancel this scheduled post?')) {
      cancelScheduledPost(id)
    }
  }

  const handleDelete = (id) => {
    if (window.confirm('Permanently delete this post? This action cannot be undone.')) {
      deleteScheduledPost(id)
    }
  }

  const statCards = [
    { label: 'Scheduled Posts', value: String(stats.scheduledCount), growth: `${stats.scheduledCount} active`, icon: 'Calendar', color: 'brand' },
    { label: "Today's Posts", value: String(stats.todayCount), growth: 'Scheduled for today', icon: 'Clock', color: 'purple' },
    { label: 'This Week', value: String(stats.weekCount), growth: 'Upcoming this week', icon: 'CalendarDays', color: 'indigo' },
    { label: 'Active Platforms', value: String(stats.activePlatforms), growth: 'Connected platforms', icon: 'Share2', color: 'accent' },
  ]

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Social Media Scheduler</h2>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            Plan, schedule and manage your social media content.
          </p>
        </div>
        <Link to="/dashboard/scheduler/create">
          <Button size="lg" className="w-full sm:w-auto">
            <Plus className="h-5 w-5" /> Schedule Post
          </Button>
        </Link>
      </div>

      <div className="grid sm:grid-cols-2 xl:grid-cols-4 gap-4 lg:gap-6">
        {statCards.map((stat) => (
          <StatCard key={stat.label} {...stat} />
        ))}
      </div>

      <div className="flex rounded-xl bg-gray-100 dark:bg-gray-800 p-1 w-fit">
        <button
          type="button"
          onClick={() => setActiveTab('calendar')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
            activeTab === 'calendar'
              ? 'gradient-bg text-white shadow-sm'
              : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
          }`}
        >
          <LayoutGrid className="h-4 w-4" /> Calendar
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('list')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
            activeTab === 'list'
              ? 'gradient-bg text-white shadow-sm'
              : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
          }`}
        >
          <List className="h-4 w-4" /> All Posts
        </button>
      </div>

      {activeTab === 'calendar' ? (
        <ScheduleCalendar onSelectPost={(post) => navigate(`/dashboard/scheduler/${post.id}`)} />
      ) : (
        <>
          <div className="glass rounded-2xl p-4 sm:p-6 space-y-4">
            <div className="flex flex-col lg:flex-row gap-4">
              <SearchBar
                placeholder="Search posts, restaurants, captions..."
                className="flex-1"
                onSearch={(search) => setFilters((f) => ({ ...f, search }))}
              />
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
              <select
                value={filters.platform}
                onChange={(e) => setFilters((f) => ({ ...f, platform: e.target.value }))}
                className="px-3 py-2 rounded-xl bg-gray-100 dark:bg-gray-800 text-sm text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-brand-500/50"
              >
                <option value="">All Platforms</option>
                {platforms.map((p) => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>
              <select
                value={filters.restaurantId}
                onChange={(e) => setFilters((f) => ({ ...f, restaurantId: e.target.value, branchId: '' }))}
                className="px-3 py-2 rounded-xl bg-gray-100 dark:bg-gray-800 text-sm text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-brand-500/50"
              >
                <option value="">All Restaurants</option>
                {restaurants.map((r) => (
                  <option key={r.id} value={r.id}>{r.name}</option>
                ))}
              </select>
              <select
                value={filters.branchId}
                onChange={(e) => setFilters((f) => ({ ...f, branchId: e.target.value }))}
                disabled={!filters.restaurantId}
                className="px-3 py-2 rounded-xl bg-gray-100 dark:bg-gray-800 text-sm text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-brand-500/50 disabled:opacity-50"
              >
                <option value="">All Branches</option>
                {branches.map((b) => (
                  <option key={b.id} value={b.id}>{b.name}</option>
                ))}
              </select>
              <select
                value={filters.status}
                onChange={(e) => setFilters((f) => ({ ...f, status: e.target.value }))}
                className="px-3 py-2 rounded-xl bg-gray-100 dark:bg-gray-800 text-sm text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-brand-500/50"
              >
                <option value="">All Statuses</option>
                {schedulerStatuses.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
              <input
                type="date"
                value={filters.date}
                onChange={(e) => setFilters((f) => ({ ...f, date: e.target.value }))}
                className="px-3 py-2 rounded-xl bg-gray-100 dark:bg-gray-800 text-sm text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-brand-500/50"
              />
            </div>
            {(filters.platform || filters.restaurantId || filters.branchId || filters.status || filters.date || filters.search) && (
              <button
                type="button"
                onClick={() => setFilters({ platform: '', restaurantId: '', branchId: '', status: '', date: '', search: '' })}
                className="text-sm text-brand-600 dark:text-brand-400 hover:text-brand-700 font-medium"
              >
                Clear all filters
              </button>
            )}
          </div>

          {filteredPosts.length === 0 ? (
            <EmptyState
              icon="Calendar"
              title="No scheduled posts found"
              description="Try adjusting your filters or schedule a new post."
              actionLabel="Schedule Post"
              onAction={() => navigate('/dashboard/scheduler/create')}
            />
          ) : (
            <div className="space-y-4">
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Showing {filteredPosts.length} post{filteredPosts.length !== 1 ? 's' : ''}
              </p>
              {filteredPosts.map((post) => (
                <SchedulerPostCard
                  key={post.id}
                  post={post}
                  onCancel={handleCancel}
                  onDelete={handleDelete}
                />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  )
}
