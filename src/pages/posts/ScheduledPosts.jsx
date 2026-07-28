import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { usePosts } from '../../context/PostContext'
import PostsNav from '../../components/PostsNav'
import ScheduleCard from '../../components/ScheduleCard'
import EmptyState from '../../components/EmptyState'
import Skeleton from '../../components/Skeleton'

export default function ScheduledPosts() {
  const navigate = useNavigate()
  const { getPostsByStatus, cancelSchedule } = usePosts()
  const scheduled = getPostsByStatus('Scheduled')
  const [loading, setLoading] = useState(true)
  const [showCancelConfirm, setShowCancelConfirm] = useState(null)

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 400)
    return () => clearTimeout(timer)
  }, [])

  const handleCancel = (id) => {
    cancelSchedule(id)
    setShowCancelConfirm(null)
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Scheduled Posts</h2>
        <p className="text-gray-500 dark:text-gray-400 mt-1">
          Manage posts queued for automatic publishing.
        </p>
      </div>

      <PostsNav />

      {loading ? (
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="glass rounded-2xl p-5">
              <Skeleton className="h-24 w-full" />
            </div>
          ))}
        </div>
      ) : scheduled.length === 0 ? (
        <EmptyState
          icon="Calendar"
          title="No scheduled posts"
          description="Schedule a post to automatically publish at your chosen date and time."
          actionLabel="Create Post"
          onAction={() => navigate('/dashboard/posts/create')}
        />
      ) : (
        <div className="space-y-4">
          {scheduled.map((post) => (
            <ScheduleCard
              key={post.id}
              post={post}
              onCancel={(id) => setShowCancelConfirm(id)}
            />
          ))}
        </div>
      )}

      {showCancelConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/50" onClick={() => setShowCancelConfirm(null)} />
          <div className="relative bg-white dark:bg-gray-800 rounded-2xl p-6 max-w-sm w-full shadow-xl animate-fade-in">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Cancel Schedule?</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
              This post will be moved back to drafts and will not be published automatically.
            </p>
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => handleCancel(showCancelConfirm)}
                className="flex-1 px-4 py-2 rounded-xl bg-red-600 text-white text-sm font-semibold hover:bg-red-700 transition-colors"
              >
                Cancel Schedule
              </button>
              <button
                onClick={() => setShowCancelConfirm(null)}
                className="flex-1 px-4 py-2 rounded-xl bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white text-sm font-semibold hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
              >
                Keep Scheduled
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
