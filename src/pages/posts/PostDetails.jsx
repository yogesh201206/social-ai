import { useState } from 'react'
import { useNavigate, useParams, Link } from 'react-router-dom'
import {
  ArrowLeft, Pencil, Trash2, Calendar, Clock, Heart, MessageCircle,
  Share2, Eye, RefreshCw, Send, CheckCircle, XCircle, AlertTriangle,
  Globe, AlertCircle, Play
} from 'lucide-react'
import * as Icons from 'lucide-react'
import { usePosts } from '../../context/PostContext'
import StatusBadge from '../../components/StatusBadge'
import PostPreview from '../../components/PostPreview'
import Button from '../../components/Button'
import Card from '../../components/Card'
import { platformIcons, platformColors } from '../../data/postsData'

// Platforms where publishing is not yet live
const COMING_SOON_PLATFORMS = ['Instagram', 'Facebook']

export default function PostDetails() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { getPost, deletePost, publishPost, refreshMetrics } = usePosts()
  const post = getPost(id)

  const [publishing, setPublishing] = useState(false)
  const [publishResult, setPublishResult] = useState(null) // { status: 'success'|'error', message }
  const [refreshingMetrics, setRefreshingMetrics] = useState(false)
  const [metricsMessage, setMetricsMessage] = useState(null)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState(null)

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

  const isPublished = post.status === 'Published'
  const canPublishNow = ['Draft', 'Failed'].includes(post.status)
  const isComingSoon = COMING_SOON_PLATFORMS.includes(post.platform)

  const handleDeleteClick = () => {
    setDeleteError(null)
    if (isPublished && post.platformPostId) {
      setShowDeleteModal(true)
    } else {
      if (window.confirm('Are you sure you want to delete this post?')) {
        performDelete()
      }
    }
  }

  const performDelete = async () => {
    setDeleting(true)
    setDeleteError(null)
    try {
      await deletePost(id)
      setShowDeleteModal(false)
      navigate('/dashboard/posts')
    } catch (err) {
      const msg = err.message || `Could not delete the post from ${post.platform}. The SocialFlow record was kept so you can retry.`
      setDeleteError(msg)
    } finally {
      setDeleting(false)
    }
  }

  const handlePostNow = async () => {
    setPublishResult(null)

    if (isComingSoon) {
      setPublishResult({
        status: 'error',
        message: `${post.platform} publishing is coming soon. Currently live: X (Twitter), LinkedIn, YouTube.`,
      })
      return
    }

    if (post.platform === 'YouTube' && (!post.image || post.image.startsWith('data:image') || post.image.endsWith('.jpg') || post.image.endsWith('.png'))) {
      setPublishResult({
        status: 'error',
        message: 'YouTube publishing requires a video.',
      })
      return
    }

    setPublishing(true)
    try {
      await publishPost(post.id)
      setPublishResult({ status: 'success', message: 'Published successfully! Redirecting...' })
      setTimeout(() => navigate('/dashboard/posts/published'), 2000)
    } catch (err) {
      setPublishResult({ status: 'error', message: err.message || 'Publishing failed. Please try again.' })
    } finally {
      setPublishing(false)
    }
  }

  const handleRefreshMetrics = async () => {
    setRefreshingMetrics(true)
    setMetricsMessage(null)
    try {
      const updated = await refreshMetrics(post.id)
      if (updated?.metricsStatus === 'PERMISSION_REQUIRED') {
        setMetricsMessage('Analytics permission is restricted on this platform account.')
      } else if (updated?.metricsStatus === 'AVAILABLE') {
        setMetricsMessage('Metrics refreshed successfully.')
      } else {
        setMetricsMessage('Metrics status: ' + (updated?.metricsStatus || 'NOT_FETCHED'))
      }
      setTimeout(() => setMetricsMessage(null), 4000)
    } catch (err) {
      setMetricsMessage(err.message || 'Failed to refresh metrics.')
      setTimeout(() => setMetricsMessage(null), 4000)
    } finally {
      setRefreshingMetrics(false)
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
        <div className="flex flex-wrap gap-2">
          {canPublishNow && (
            <Button
              variant="success"
              onClick={handlePostNow}
              disabled={publishing}
              loading={publishing}
            >
              <Send className="h-4 w-4" />
              {publishing ? 'Publishing...' : 'Post Now'}
            </Button>
          )}
          {isPublished && (
            <Button
              variant="secondary"
              onClick={handleRefreshMetrics}
              disabled={refreshingMetrics}
              loading={refreshingMetrics}
            >
              <RefreshCw className={`h-4 w-4 ${refreshingMetrics ? 'animate-spin' : ''}`} />
              Refresh Metrics
            </Button>
          )}
          <Link to={`/dashboard/posts/${id}/edit`}>
            <Button variant="secondary">
              <Pencil className="h-4 w-4" />
              Edit
            </Button>
          </Link>
          <Link to="/dashboard/posts/preview" state={{ post }}>
            <Button variant="outline">Preview</Button>
          </Link>
          <Button variant="danger" onClick={handleDeleteClick}>
            <Trash2 className="h-4 w-4" />
            Delete
          </Button>
        </div>
      </div>

      {/* Delete Confirmation Modal for Published Posts */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4 animate-scale-in">
            <div className="h-12 w-12 rounded-2xl bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 flex items-center justify-center">
              <Trash2 className="h-6 w-6" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">Delete from {post.platform} & SocialFlow?</h3>
              <p className="text-sm text-gray-600 dark:text-gray-300 mt-2">
                This post is already live on <strong>{post.platform}</strong>. Deleting it will also attempt to remove it from the connected social platform.
              </p>
            </div>
            {deleteError && (
              <div className="p-3 rounded-xl text-xs bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-800">
                {deleteError}
              </div>
            )}
            <div className="flex gap-3 pt-2">
              <Button
                variant="secondary"
                className="flex-1"
                onClick={() => { setShowDeleteModal(false); setDeleteError(null); }}
                disabled={deleting}
              >
                Cancel
              </Button>
              <Button
                variant="danger"
                className="flex-1"
                onClick={performDelete}
                disabled={deleting}
                loading={deleting}
              >
                {deleting ? `Deleting from ${post.platform}...` : 'Delete Everywhere'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Publish result banner */}
      {publishResult && (
        <div className={`flex items-start gap-3 p-4 rounded-2xl text-sm font-medium ${
          publishResult.status === 'success'
            ? 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 border border-green-200 dark:border-green-800'
            : 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-800'
        }`}>
          {publishResult.status === 'success'
            ? <CheckCircle className="h-5 w-5 flex-shrink-0" />
            : <XCircle className="h-5 w-5 flex-shrink-0" />}
          <span>{publishResult.message}</span>
        </div>
      )}

      {/* Metrics refresh feedback */}
      {metricsMessage && (
        <div className="flex items-start gap-3 p-4 rounded-2xl text-sm bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 border border-blue-200 dark:border-blue-800">
          <AlertCircle className="h-5 w-5 flex-shrink-0 mt-0.5" />
          <span>{metricsMessage}</span>
        </div>
      )}

      {/* Delete error feedback when modal is closed */}
      {deleteError && !showDeleteModal && (
        <div className="flex items-start gap-3 p-4 rounded-2xl text-sm bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-800">
          <AlertTriangle className="h-5 w-5 flex-shrink-0 mt-0.5" />
          <span>{deleteError}</span>
        </div>
      )}

      {/* Failure reason from backend */}
      {post.status === 'Failed' && post.failureReason && !publishResult && (
        <div className="flex items-start gap-3 p-4 rounded-2xl text-sm bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-800">
          <AlertTriangle className="h-5 w-5 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold mb-0.5">Publishing Failed</p>
            <p>{post.failureReason}</p>
          </div>
        </div>
      )}

      {/* Coming Soon notice on detail page */}
      {canPublishNow && isComingSoon && (
        <div className="flex items-start gap-3 p-4 rounded-2xl text-sm bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800">
          <Clock className="h-5 w-5 flex-shrink-0 mt-0.5" />
          <span><strong>{post.platform}</strong> publishing is coming soon. Currently live platforms: X (Twitter), LinkedIn, YouTube.</span>
        </div>
      )}

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
                  {isComingSoon && (
                    <span className="text-xs px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 font-medium">Coming Soon</span>
                  )}
                </dd>
              </div>
              <div>
                <dt className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">Created</dt>
                <dd className="text-sm text-gray-900 dark:text-white mt-1">{post.createdAt}</dd>
              </div>
              {post.platformPostId && (
                <div>
                  <dt className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">Platform Post ID</dt>
                  <dd className="text-sm font-mono text-gray-700 dark:text-gray-300 mt-1 break-all">{post.platformPostId}</dd>
                </div>
              )}
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

          {/* Scheduling / Publishing info */}
          {(post.scheduledDate || post.scheduledTime || post.publishedAt || post.status === 'Processing' || post.status === 'Failed') && (
            <Card className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                {post.status === 'Published' ? 'Publishing Info' : 'Schedule Info'}
              </h3>
              {post.status === 'Scheduled' && (
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                    <Calendar className="h-4 w-4 text-brand-500" />
                    <span className="font-medium">Scheduled for:</span>
                    <span>{post.scheduledDate}</span>
                  </div>
                  {post.scheduledTime && (
                    <div className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                      <Clock className="h-4 w-4 text-brand-500" />
                      <span>
                        {post.scheduledTime}
                        {post.timezone === 'Asia/Kolkata' ? ' IST' : post.timezone ? ` (${post.timezone})` : ''}
                      </span>
                    </div>
                  )}
                  {post.timezone && (
                    <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                      <Globe className="h-4 w-4" />
                      <span>{post.timezone}</span>
                    </div>
                  )}
                </div>
              )}
              {post.status === 'Processing' && (
                <div className="flex items-center gap-2 text-sm text-amber-600 dark:text-amber-400">
                  <span className="h-2 w-2 rounded-full bg-amber-500 animate-pulse" />
                  Publishing in progress...
                </div>
              )}
              {post.status === 'Published' && post.publishedAt && (
                <div className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span className="font-medium">Published at:</span>
                  <span>{post.publishedAt}</span>
                </div>
              )}
            </Card>
          )}

          {/* Real Platform-Specific Metrics Card */}
          {isPublished && (
            <Card className="p-6 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Real Performance Metrics</h3>
                <span className="text-xs px-2.5 py-0.5 rounded-full font-medium bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300">
                  {post.metricsStatus || 'NOT_FETCHED'}
                </span>
              </div>

              {post.platform === 'YouTube' && (
                <div className="grid grid-cols-3 gap-4">
                  <div className="text-center p-4 rounded-xl bg-purple-50 dark:bg-purple-900/20">
                    <Eye className="h-5 w-5 text-purple-500 mx-auto mb-2" />
                    <p className="text-xl font-bold text-gray-900 dark:text-white">
                      {post.views != null ? post.views.toLocaleString() : '—'}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Views</p>
                  </div>
                  <div className="text-center p-4 rounded-xl bg-pink-50 dark:bg-pink-900/20">
                    <Heart className="h-5 w-5 text-pink-500 mx-auto mb-2" />
                    <p className="text-xl font-bold text-gray-900 dark:text-white">
                      {post.likes != null ? post.likes.toLocaleString() : '—'}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Likes</p>
                  </div>
                  <div className="text-center p-4 rounded-xl bg-blue-50 dark:bg-blue-900/20">
                    <MessageCircle className="h-5 w-5 text-blue-500 mx-auto mb-2" />
                    <p className="text-xl font-bold text-gray-900 dark:text-white">
                      {post.comments != null ? post.comments.toLocaleString() : '—'}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Comments</p>
                  </div>
                </div>
              )}

              {post.platform === 'Twitter' && (
                <div className="grid grid-cols-4 gap-3">
                  <div className="text-center p-3 rounded-xl bg-pink-50 dark:bg-pink-900/20">
                    <Heart className="h-4 w-4 text-pink-500 mx-auto mb-1.5" />
                    <p className="text-lg font-bold text-gray-900 dark:text-white">
                      {post.likes != null ? post.likes.toLocaleString() : '—'}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Likes</p>
                  </div>
                  <div className="text-center p-3 rounded-xl bg-blue-50 dark:bg-blue-900/20">
                    <MessageCircle className="h-4 w-4 text-blue-500 mx-auto mb-1.5" />
                    <p className="text-lg font-bold text-gray-900 dark:text-white">
                      {post.comments != null ? post.comments.toLocaleString() : '—'}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Replies</p>
                  </div>
                  <div className="text-center p-3 rounded-xl bg-green-50 dark:bg-green-900/20">
                    <Share2 className="h-4 w-4 text-green-500 mx-auto mb-1.5" />
                    <p className="text-lg font-bold text-gray-900 dark:text-white">
                      {post.shares != null ? post.shares.toLocaleString() : '—'}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Reposts</p>
                  </div>
                  <div className="text-center p-3 rounded-xl bg-purple-50 dark:bg-purple-900/20">
                    <Eye className="h-4 w-4 text-purple-500 mx-auto mb-1.5" />
                    <p className="text-lg font-bold text-gray-900 dark:text-white">
                      {post.views != null ? post.views.toLocaleString() : '—'}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Views</p>
                  </div>
                </div>
              )}

              {post.platform === 'LinkedIn' && (
                <div className="grid grid-cols-3 gap-4">
                  <div className="text-center p-4 rounded-xl bg-pink-50 dark:bg-pink-900/20">
                    <Heart className="h-5 w-5 text-pink-500 mx-auto mb-2" />
                    <p className="text-xl font-bold text-gray-900 dark:text-white">
                      {post.likes != null ? post.likes.toLocaleString() : '—'}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Likes</p>
                  </div>
                  <div className="text-center p-4 rounded-xl bg-blue-50 dark:bg-blue-900/20">
                    <MessageCircle className="h-5 w-5 text-blue-500 mx-auto mb-2" />
                    <p className="text-xl font-bold text-gray-900 dark:text-white">
                      {post.comments != null ? post.comments.toLocaleString() : '—'}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Comments</p>
                  </div>
                  <div className="text-center p-4 rounded-xl bg-green-50 dark:bg-green-900/20">
                    <Share2 className="h-5 w-5 text-green-500 mx-auto mb-2" />
                    <p className="text-xl font-bold text-gray-900 dark:text-white">
                      {post.shares != null ? post.shares.toLocaleString() : '—'}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Shares</p>
                  </div>
                </div>
              )}

              {post.metricsStatus === 'PERMISSION_REQUIRED' && (
                <p className="text-xs text-amber-600 dark:text-amber-400">
                  Analytics read permission is not granted by the platform token.
                </p>
              )}
            </Card>
          )}
        </div>

        <div className="space-y-6">
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Media Preview</h3>
            {post.platform === 'YouTube' || (post.image && (post.image.includes('/videos/') || post.image.endsWith('.mp4') || post.image.endsWith('.mov') || post.image.endsWith('.webm') || post.image.startsWith('data:video/'))) ? (
              <video
                src={post.image || post.imageUrl}
                controls
                className="w-full rounded-xl aspect-video bg-black object-contain"
              />
            ) : (
              <img
                src={post.image || post.imageUrl}
                alt={post.title}
                className="w-full rounded-xl aspect-video object-cover"
              />
            )}
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
