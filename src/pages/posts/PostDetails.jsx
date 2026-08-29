import { useNavigate, useParams, Link } from 'react-router-dom'
import { ArrowLeft, Pencil, Trash2, Calendar, Clock, Heart, MessageCircle, Share2, Hash, Megaphone } from 'lucide-react'
import * as Icons from 'lucide-react'
import { usePosts } from '../../context/PostContext'
import StatusBadge from '../../components/StatusBadge'
import PostPreview from '../../components/PostPreview'
import Button from '../../components/Button'
import Card from '../../components/Card'
import { platformIcons, platformColors } from '../../data/postsData'

export default function PostDetails() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { getPost, deletePost } = usePosts()
  const post = getPost(id)

  if (!post) {
    return (
      <div className="flex flex-col items-center justify-center py-20 animate-fade-in">
        <p className="text-gray-500 dark:text-gray-400 mb-4">Post not found.</p>
        <Button onClick={() => navigate('/dashboard/posts')}>Back to Posts</Button>
      </div>
    )
  }

  const PlatformIcon = Icons[platformIcons[post.platform]] || Icons.Globe
  const gradient = platformColors[post.platform] || 'from-gray-500 to-gray-600'

  const handleDelete = async () => {
    if (window.confirm('Are you sure you want to delete this post? This action cannot be undone.')) {
      try {
        await deletePost(id)
        navigate('/dashboard/posts')
      } catch (err) {
        alert(err.message || 'Failed to delete post')
      }
    }
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/dashboard/posts')}
            className="p-2 rounded-xl bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div>
            <div className="flex items-center gap-3">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{post.title}</h2>
              <StatusBadge status={post.status} />
            </div>
            <p className="text-gray-500 dark:text-gray-400 mt-1">{post.restaurantName}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Link to={`/dashboard/posts/${id}/edit`}>
            <Button variant="secondary">
              <Pencil className="h-4 w-4" />
              Edit
            </Button>
          </Link>
          <Link to="/dashboard/posts/preview" state={{ post }}>
            <Button variant="outline">Preview</Button>
          </Link>
          <Button variant="danger" onClick={handleDelete}>
            <Trash2 className="h-4 w-4" />
            Delete
          </Button>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <div className="space-y-6">
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Post Information</h3>
            <dl className="space-y-4">
              <div>
                <dt className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">Title</dt>
                <dd className="text-sm font-medium text-gray-900 dark:text-white mt-1">{post.title}</dd>
              </div>
              <div>
                <dt className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">Restaurant</dt>
                <dd className="flex items-center gap-2 mt-1">
                  <img src={post.restaurantLogo} alt="" className="h-6 w-6 rounded-full object-cover" />
                  <span className="text-sm font-medium text-gray-900 dark:text-white">{post.restaurantName}</span>
                </dd>
              </div>
              <div>
                <dt className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">Platform</dt>
                <dd className="flex items-center gap-2 mt-1">
                  <div className={`h-7 w-7 rounded-lg bg-gradient-to-br ${gradient} flex items-center justify-center`}>
                    <PlatformIcon className="h-3.5 w-3.5 text-white" />
                  </div>
                  <span className="text-sm font-medium text-gray-900 dark:text-white">{post.platform}</span>
                </dd>
              </div>
              <div>
                <dt className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">Created</dt>
                <dd className="text-sm text-gray-900 dark:text-white mt-1">{post.createdAt}</dd>
              </div>
            </dl>
          </Card>

          <Card className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Caption</h3>
            <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">{post.caption}</p>
            {post.hashtags?.length > 0 && (
              <div className="flex items-start gap-2 mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                <Hash className="h-4 w-4 text-brand-500 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-brand-600 dark:text-brand-400">{post.hashtags.join(' ')}</p>
              </div>
            )}
            {post.cta && (
              <div className="flex items-center gap-2 mt-3">
                <Megaphone className="h-4 w-4 text-gray-400" />
                <span className="text-sm text-gray-600 dark:text-gray-400">CTA: {post.cta}</span>
              </div>
            )}
          </Card>

          {(post.scheduledDate || post.publishedAt) && (
            <Card className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Schedule Information</h3>
              {post.status === 'Scheduled' && (
                <div className="flex flex-wrap gap-4">
                  <div className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                    <Calendar className="h-4 w-4 text-brand-500" />
                    {post.scheduledDate}
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                    <Clock className="h-4 w-4 text-brand-500" />
                    {post.scheduledTime}
                  </div>
                </div>
              )}
              {post.status === 'Published' && (
                <p className="text-sm text-gray-700 dark:text-gray-300">
                  Published on {post.publishedAt}
                </p>
              )}
            </Card>
          )}

          {post.metrics && (
            <Card className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Performance Metrics</h3>
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center p-4 rounded-xl bg-pink-50 dark:bg-pink-900/20">
                  <Heart className="h-5 w-5 text-pink-500 mx-auto mb-2" />
                  <p className="text-xl font-bold text-gray-900 dark:text-white">{post.metrics.likes.toLocaleString()}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Likes</p>
                </div>
                <div className="text-center p-4 rounded-xl bg-blue-50 dark:bg-blue-900/20">
                  <MessageCircle className="h-5 w-5 text-blue-500 mx-auto mb-2" />
                  <p className="text-xl font-bold text-gray-900 dark:text-white">{post.metrics.comments.toLocaleString()}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Comments</p>
                </div>
                <div className="text-center p-4 rounded-xl bg-green-50 dark:bg-green-900/20">
                  <Share2 className="h-5 w-5 text-green-500 mx-auto mb-2" />
                  <p className="text-xl font-bold text-gray-900 dark:text-white">{post.metrics.shares.toLocaleString()}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Shares</p>
                </div>
              </div>
            </Card>
          )}
        </div>

        <div className="space-y-6">
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Image Preview</h3>
            <img
              src={post.image}
              alt={post.title}
              className="w-full rounded-xl aspect-video object-cover"
            />
          </Card>

          <Card className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Platform Preview</h3>
            <PostPreview post={post} />
          </Card>
        </div>
      </div>
    </div>
  )
}
