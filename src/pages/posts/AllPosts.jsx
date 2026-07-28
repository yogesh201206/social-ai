import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Plus, Filter } from 'lucide-react'
import { usePosts } from '../../context/PostContext'
import PostCard from '../../components/PostCard'
import PostsNav from '../../components/PostsNav'
import SearchBar from '../../components/SearchBar'
import EmptyState from '../../components/EmptyState'
import Button from '../../components/Button'
import { PostCardSkeleton } from '../../components/Skeleton'
import { platforms } from '../../data/postsData'

export default function AllPosts() {
  const navigate = useNavigate()
  const { posts, deletePost } = usePosts()
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('All')
  const [platformFilter, setPlatformFilter] = useState('All')
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(null)

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 500)
    return () => clearTimeout(timer)
  }, [])

  const filtered = posts.filter((post) => {
    const matchesSearch =
      post.title.toLowerCase().includes(search.toLowerCase()) ||
      post.caption.toLowerCase().includes(search.toLowerCase()) ||
      post.restaurantName.toLowerCase().includes(search.toLowerCase())
    const matchesStatus = statusFilter === 'All' || post.status === statusFilter
    const matchesPlatform = platformFilter === 'All' || post.platform === platformFilter
    return matchesSearch && matchesStatus && matchesPlatform
  })

  const handleDelete = (id) => {
    deletePost(id)
    setShowDeleteConfirm(null)
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">All Posts</h2>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            Create, manage, and track all your social media posts.
          </p>
        </div>
        <Link to="/dashboard/posts/create">
          <Button>
            <Plus className="h-4 w-4" />
            Create Post
          </Button>
        </Link>
      </div>

      <PostsNav />

      <div className="flex flex-col lg:flex-row gap-4">
        <SearchBar
          placeholder="Search posts..."
          className="flex-1 max-w-md"
          onSearch={setSearch}
        />
        <div className="flex flex-wrap gap-3">
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-gray-400" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 rounded-xl bg-gray-100 dark:bg-gray-800 text-sm text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-brand-500/50"
            >
              <option value="All">All Status</option>
              <option value="Draft">Draft</option>
              <option value="Scheduled">Scheduled</option>
              <option value="Published">Published</option>
            </select>
          </div>
          <select
            value={platformFilter}
            onChange={(e) => setPlatformFilter(e.target.value)}
            className="px-3 py-2 rounded-xl bg-gray-100 dark:bg-gray-800 text-sm text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-brand-500/50"
          >
            <option value="All">All Platforms</option>
            {platforms.map((p) => (
              <option key={p} value={p}>{p}</option>
            ))}
          </select>
        </div>
      </div>

      {loading ? (
        <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4 lg:gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <PostCardSkeleton key={i} />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState
          icon="FileText"
          title={search || statusFilter !== 'All' || platformFilter !== 'All' ? 'No posts found' : 'No posts yet'}
          description={
            search || statusFilter !== 'All' || platformFilter !== 'All'
              ? 'Try adjusting your filters or search terms.'
              : 'Create your first post to start engaging with your audience.'
          }
          actionLabel={!search && statusFilter === 'All' && platformFilter === 'All' ? 'Create Post' : undefined}
          onAction={
            !search && statusFilter === 'All' && platformFilter === 'All'
              ? () => navigate('/dashboard/posts/create')
              : undefined
          }
        />
      ) : (
        <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4 lg:gap-6">
          {filtered.map((post) => (
            <PostCard
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
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Delete Post?</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
              This action cannot be undone. The post will be permanently removed.
            </p>
            <div className="flex gap-3 mt-6">
              <Button variant="danger" onClick={() => handleDelete(showDeleteConfirm)} className="flex-1">
                Delete
              </Button>
              <Button variant="secondary" onClick={() => setShowDeleteConfirm(null)} className="flex-1">
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
