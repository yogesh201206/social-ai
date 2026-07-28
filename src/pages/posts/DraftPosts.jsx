import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { usePosts } from '../../context/PostContext'
import PostsNav from '../../components/PostsNav'
import DraftCard from '../../components/DraftCard'
import EmptyState from '../../components/EmptyState'
import Skeleton from '../../components/Skeleton'

export default function DraftPosts() {
  const navigate = useNavigate()
  const { getPostsByStatus, deletePost } = usePosts()
  const drafts = getPostsByStatus('Draft')
  const [loading, setLoading] = useState(true)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(null)

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 400)
    return () => clearTimeout(timer)
  }, [])

  const handleDelete = (id) => {
    deletePost(id)
    setShowDeleteConfirm(null)
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Draft Posts</h2>
        <p className="text-gray-500 dark:text-gray-400 mt-1">
          Continue working on your unfinished posts.
        </p>
      </div>

      <PostsNav />

      {loading ? (
        <div className="space-y-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="glass rounded-2xl p-5 flex gap-4">
              <Skeleton className="h-20 w-20 flex-shrink-0" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-5 w-1/2" variant="text" />
                <Skeleton className="h-4 w-full" variant="text" />
                <Skeleton className="h-4 w-3/4" variant="text" />
              </div>
            </div>
          ))}
        </div>
      ) : drafts.length === 0 ? (
        <EmptyState
          icon="FileEdit"
          title="No draft posts"
          description="Posts you save as drafts will appear here for you to finish later."
          actionLabel="Create Post"
          onAction={() => navigate('/dashboard/posts/create')}
        />
      ) : (
        <div className="space-y-4">
          {drafts.map((post) => (
            <DraftCard
              key={post.id}
              post={post}
              onDelete={(id) => setShowDeleteConfirm(id)}
            />
          ))}
        </div>
      )}

      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/50" onClick={() => setShowDeleteConfirm(null)} />
          <div className="relative bg-white dark:bg-gray-800 rounded-2xl p-6 max-w-sm w-full shadow-xl animate-fade-in">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Delete Draft?</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
              This draft will be permanently removed.
            </p>
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => handleDelete(showDeleteConfirm)}
                className="flex-1 px-4 py-2 rounded-xl bg-red-600 text-white text-sm font-semibold hover:bg-red-700 transition-colors"
              >
                Delete
              </button>
              <button
                onClick={() => setShowDeleteConfirm(null)}
                className="flex-1 px-4 py-2 rounded-xl bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white text-sm font-semibold hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
