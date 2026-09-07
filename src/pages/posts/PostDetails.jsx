import { useState, useEffect, useCallback } from 'react'
import { useNavigate, useParams, Link } from 'react-router-dom'
import {
  ArrowLeft, Pencil, Trash2, Calendar, Clock, Heart, MessageCircle,
  Share2, Eye, RefreshCw, Send, CheckCircle, XCircle, AlertTriangle,
  Globe, AlertCircle, ExternalLink, Hash, Megaphone, Loader2, Sparkles,
  TrendingUp, Activity
} from 'lucide-react'
import * as Icons from 'lucide-react'
import { usePosts } from '../../context/PostContext'
import StatusBadge from '../../components/StatusBadge'
import PostPreview from '../../components/PostPreview'
import PostMediaPreview from '../../components/PostMediaPreview'
import Button from '../../components/Button'
import Card from '../../components/Card'
import { platformIcons, platformColors } from '../../data/postsData'

// Platforms where publishing is not yet live
const COMING_SOON_PLATFORMS = []

export default function PostDetails() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { getPost, deletePost, publishPost, refreshMetrics } = usePosts()
  const post = getPost(id)

  const [publishing, setPublishing] = useState(false)
  const [publishResult, setPublishResult] = useState(null)
  const [refreshingMetrics, setRefreshingMetrics] = useState(false)
  const [initialLoadingMetrics, setInitialLoadingMetrics] = useState(false)
  const [metricsMessage, setMetricsMessage] = useState(null)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState(null)

  const isPublished = post?.status === 'Published'
  const canPublishNow = ['Draft', 'Failed'].includes(post?.status)
  const isComingSoon = post ? COMING_SOON_PLATFORMS.includes(post.platform) : false

  // Auto-fetch / refresh metrics when page opens for a published post
  const triggerMetricsRefresh = useCallback(async (isInitial = false) => {
    if (!id || !post || post.status !== 'Published' || !post.platformPostId) return

    if (isInitial) {
      setInitialLoadingMetrics(true)
    } else {
      setRefreshingMetrics(true)
    }
    setMetricsMessage(null)

    try {
      const updated = await refreshMetrics(id)
      if (!isInitial) {
        if (updated?.metricsStatus === 'PERMISSION_REQUIRED') {
          setMetricsMessage({ type: 'warning', text: 'Analytics read permission is restricted for this platform token.' })
        } else if (updated?.metricsStatus === 'AVAILABLE') {
          setMetricsMessage({ type: 'success', text: 'Real metrics refreshed successfully.' })
        } else if (updated?.metricsStatus === 'API_ERROR') {
          setMetricsMessage({ type: 'error', text: 'Platform API returned an error while fetching metrics.' })
        } else {
          setMetricsMessage({ type: 'info', text: `Metrics status: ${updated?.metricsStatus || 'UPDATED'}` })
        }
        setTimeout(() => setMetricsMessage(null), 5000)
      }
    } catch (err) {
      if (!isInitial) {
        setMetricsMessage({ type: 'error', text: err.message || 'Failed to refresh metrics from platform.' })
        setTimeout(() => setMetricsMessage(null), 5000)
      }
    } finally {
      setRefreshingMetrics(false)
      setInitialLoadingMetrics(false)
    }
  }, [id, post?.status, post?.platformPostId, refreshMetrics])

  useEffect(() => {
    if (post && post.status === 'Published' && post.platformPostId) {
      triggerMetricsRefresh(true)
    }
  }, [id])

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

  // Construct external platform URL safely
  const getExternalPostUrl = () => {
    if (post.externalUrl) return post.externalUrl
    if (!post.platformPostId) return null
    const p = (post.platform || '').toLowerCase()
    if (p.includes('youtube')) {
      return `https://www.youtube.com/watch?v=${post.platformPostId}`
    }
    if (p.includes('facebook')) {
      return `https://www.facebook.com/${post.platformPostId}`
    }
    if (p.includes('linkedin')) {
      return post.platformPostId.startsWith('urn:')
        ? `https://www.linkedin.com/feed/update/${post.platformPostId}`
        : `https://www.linkedin.com/feed/update/urn:li:share:${post.platformPostId}`
    }
    if (p.includes('twitter') || p === 'x') {
      return `https://x.com/i/status/${post.platformPostId}`
    }
    if (p.includes('instagram')) {
      return `https://www.instagram.com/p/${post.platformPostId}`
    }
    return null
  }

  const externalUrl = getExternalPostUrl()

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
        message: `${post.platform} publishing is coming soon. Currently live: Facebook, LinkedIn, YouTube.`,
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
      setPublishResult({ status: 'success', message: 'Published successfully! Refreshing details...' })
      setTimeout(() => navigate('/dashboard/posts/published'), 1500)
    } catch (err) {
      setPublishResult({ status: 'error', message: err.message || 'Publishing failed. Please try again.' })
    } finally {
      setPublishing(false)
    }
  }

  const formatCount = (val) => {
    if (val === null || val === undefined) return '—'
    return Number(val).toLocaleString()
  }

  const formatLastUpdated = (dtStr) => {
    if (!dtStr) return 'Not refreshed yet'
    try {
      const d = new Date(dtStr.endsWith('Z') ? dtStr : `${dtStr}Z`)
      if (Number.isNaN(d.getTime())) return String(dtStr)
      return d.toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
      })
    } catch (e) {
      return String(dtStr)
    }
  }

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      {/* Top Header & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/dashboard/posts')}
            className="p-2 rounded-xl bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
            title="Back to Posts"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div>
            <div className="flex items-center gap-3">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{post.title}</h2>
              <StatusBadge status={post.status} />
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              {post.restaurantName} {post.branchName ? `· ${post.branchName}` : ''}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* External Social Platform Link Button */}
          {isPublished && externalUrl && (
            <a
              href={externalUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-brand-50 dark:bg-brand-900/30 text-brand-600 dark:text-brand-400 hover:bg-brand-100 dark:hover:bg-brand-900/50 transition-colors border border-brand-200/50 dark:border-brand-800/50 shadow-sm"
            >
              <ExternalLink className="h-3.5 w-3.5" />
              Open on {post.platform}
            </a>
          )}

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
              onClick={() => triggerMetricsRefresh(false)}
              disabled={refreshingMetrics || initialLoadingMetrics}
              loading={refreshingMetrics}
            >
              <RefreshCw className={`h-4 w-4 ${refreshingMetrics || initialLoadingMetrics ? 'animate-spin' : ''}`} />
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
                This post is live on <strong>{post.platform}</strong>. Deleting it will also attempt to remove it from your connected platform account.
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

      {/* Metrics refresh banner */}
      {metricsMessage && (
        <div className={`flex items-start gap-3 p-4 rounded-2xl text-sm ${
          metricsMessage.type === 'success'
            ? 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 border border-green-200 dark:border-green-800'
            : metricsMessage.type === 'warning'
            ? 'bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800'
            : metricsMessage.type === 'error'
            ? 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-800'
            : 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 border border-blue-200 dark:border-blue-800'
        }`}>
          <AlertCircle className="h-5 w-5 flex-shrink-0 mt-0.5" />
          <span>{metricsMessage.text}</span>
        </div>
      )}

      {/* Failure reason */}
      {post.status === 'Failed' && post.failureReason && !publishResult && (
        <div className="flex items-start gap-3 p-4 rounded-2xl text-sm bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-800">
          <AlertTriangle className="h-5 w-5 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold mb-0.5">Publishing Failed</p>
            <p>{post.failureReason}</p>
          </div>
        </div>
      )}

      {/* Real Platform Performance Metrics Section (For Published Posts) */}
      {isPublished && (
        <Card className="p-6 space-y-5 bg-gradient-to-br from-white via-white to-gray-50/50 dark:from-gray-900 dark:via-gray-900 dark:to-gray-800/50 border border-gray-200/80 dark:border-gray-800 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-gray-100 dark:border-gray-800">
            <div className="flex items-center gap-2.5">
              <div className={`h-8 w-8 rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center text-white shadow-sm`}>
                <PlatformIcon className="h-4 w-4" />
              </div>
              <div>
                <h3 className="text-base font-bold text-gray-900 dark:text-white flex items-center gap-2">
                  Real {post.platform} Performance Metrics
                  {(refreshingMetrics || initialLoadingMetrics) && (
                    <Loader2 className="h-4 w-4 text-brand-500 animate-spin" />
                  )}
                </h3>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Direct from connected account · Last refreshed: {formatLastUpdated(post.metricsUpdatedAt)}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className={`text-xs px-2.5 py-1 rounded-full font-semibold ${
                post.metricsStatus === 'AVAILABLE'
                  ? 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800'
                  : post.metricsStatus === 'PERMISSION_REQUIRED'
                  ? 'bg-amber-50 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-800'
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300'
              }`}>
                {post.metricsStatus === 'AVAILABLE' ? 'Live Data Synced' : (post.metricsStatus || 'NOT_FETCHED')}
              </span>
            </div>
          </div>

          {/* YouTube Metrics Breakdown */}
          {post.platform === 'YouTube' && (
            <div className="grid grid-cols-3 gap-4">
              <div className="p-4 rounded-2xl bg-purple-50/70 dark:bg-purple-900/20 border border-purple-100 dark:border-purple-800/30 text-center transition-transform hover:-translate-y-0.5">
                <Eye className="h-5 w-5 text-purple-600 dark:text-purple-400 mx-auto mb-2" />
                <p className="text-2xl font-black text-gray-900 dark:text-white">
                  {formatCount(post.views)}
                </p>
                <p className="text-xs font-semibold text-purple-700 dark:text-purple-300 mt-0.5">Total Views</p>
              </div>
              <div className="p-4 rounded-2xl bg-pink-50/70 dark:bg-pink-900/20 border border-pink-100 dark:border-pink-800/30 text-center transition-transform hover:-translate-y-0.5">
                <Heart className="h-5 w-5 text-pink-600 dark:text-pink-400 mx-auto mb-2" />
                <p className="text-2xl font-black text-gray-900 dark:text-white">
                  {formatCount(post.likes)}
                </p>
                <p className="text-xs font-semibold text-pink-700 dark:text-pink-300 mt-0.5">Likes</p>
              </div>
              <div className="p-4 rounded-2xl bg-blue-50/70 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800/30 text-center transition-transform hover:-translate-y-0.5">
                <MessageCircle className="h-5 w-5 text-blue-600 dark:text-blue-400 mx-auto mb-2" />
                <p className="text-2xl font-black text-gray-900 dark:text-white">
                  {formatCount(post.comments)}
                </p>
                <p className="text-xs font-semibold text-blue-700 dark:text-blue-300 mt-0.5">Comments</p>
              </div>
            </div>
          )}

          {/* Facebook Metrics Breakdown */}
          {post.platform === 'Facebook' && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-4 rounded-2xl bg-pink-50/70 dark:bg-pink-900/20 border border-pink-100 dark:border-pink-800/30 text-center transition-transform hover:-translate-y-0.5">
                <Heart className="h-5 w-5 text-pink-600 dark:text-pink-400 mx-auto mb-2" />
                <p className="text-2xl font-black text-gray-900 dark:text-white">
                  {formatCount(post.likes)}
                </p>
                <p className="text-xs font-semibold text-pink-700 dark:text-pink-300 mt-0.5">Reactions / Likes</p>
              </div>
              <div className="p-4 rounded-2xl bg-blue-50/70 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800/30 text-center transition-transform hover:-translate-y-0.5">
                <MessageCircle className="h-5 w-5 text-blue-600 dark:text-blue-400 mx-auto mb-2" />
                <p className="text-2xl font-black text-gray-900 dark:text-white">
                  {formatCount(post.comments)}
                </p>
                <p className="text-xs font-semibold text-blue-700 dark:text-blue-300 mt-0.5">Comments</p>
              </div>
              <div className="p-4 rounded-2xl bg-green-50/70 dark:bg-green-900/20 border border-green-100 dark:border-green-800/30 text-center transition-transform hover:-translate-y-0.5">
                <Share2 className="h-5 w-5 text-green-600 dark:text-green-400 mx-auto mb-2" />
                <p className="text-2xl font-black text-gray-900 dark:text-white">
                  {formatCount(post.shares)}
                </p>
                <p className="text-xs font-semibold text-green-700 dark:text-green-300 mt-0.5">Shares</p>
              </div>
              <div className="p-4 rounded-2xl bg-purple-50/70 dark:bg-purple-900/20 border border-purple-100 dark:border-purple-800/30 text-center transition-transform hover:-translate-y-0.5">
                <Eye className="h-5 w-5 text-purple-600 dark:text-purple-400 mx-auto mb-2" />
                <p className="text-2xl font-black text-gray-900 dark:text-white">
                  {formatCount(post.impressions || post.views)}
                </p>
                <p className="text-xs font-semibold text-purple-700 dark:text-purple-300 mt-0.5">Impressions / Reach</p>
              </div>
            </div>
          )}

          {/* LinkedIn Metrics Breakdown */}
          {post.platform === 'LinkedIn' && (
            <div className="grid grid-cols-3 gap-4">
              <div className="p-4 rounded-2xl bg-pink-50/70 dark:bg-pink-900/20 border border-pink-100 dark:border-pink-800/30 text-center transition-transform hover:-translate-y-0.5">
                <Heart className="h-5 w-5 text-pink-600 dark:text-pink-400 mx-auto mb-2" />
                <p className="text-2xl font-black text-gray-900 dark:text-white">
                  {formatCount(post.likes)}
                </p>
                <p className="text-xs font-semibold text-pink-700 dark:text-pink-300 mt-0.5">Reactions</p>
              </div>
              <div className="p-4 rounded-2xl bg-blue-50/70 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800/30 text-center transition-transform hover:-translate-y-0.5">
                <MessageCircle className="h-5 w-5 text-blue-600 dark:text-blue-400 mx-auto mb-2" />
                <p className="text-2xl font-black text-gray-900 dark:text-white">
                  {formatCount(post.comments)}
                </p>
                <p className="text-xs font-semibold text-blue-700 dark:text-blue-300 mt-0.5">Comments</p>
              </div>
              <div className="p-4 rounded-2xl bg-green-50/70 dark:bg-green-900/20 border border-green-100 dark:border-green-800/30 text-center transition-transform hover:-translate-y-0.5">
                <Share2 className="h-5 w-5 text-green-600 dark:text-green-400 mx-auto mb-2" />
                <p className="text-2xl font-black text-gray-900 dark:text-white">
                  {formatCount(post.shares)}
                </p>
                <p className="text-xs font-semibold text-green-700 dark:text-green-300 mt-0.5">Shares</p>
              </div>
            </div>
          )}

          {/* Twitter/X or other platforms */}
          {!['YouTube', 'Facebook', 'LinkedIn'].includes(post.platform) && (
            <div className="grid grid-cols-3 gap-4">
              <div className="p-4 rounded-2xl bg-pink-50/70 dark:bg-pink-900/20 border border-pink-100 dark:border-pink-800/30 text-center">
                <Heart className="h-5 w-5 text-pink-600 dark:text-pink-400 mx-auto mb-2" />
                <p className="text-2xl font-black text-gray-900 dark:text-white">{formatCount(post.likes)}</p>
                <p className="text-xs font-semibold text-pink-700 dark:text-pink-300 mt-0.5">Likes</p>
              </div>
              <div className="p-4 rounded-2xl bg-blue-50/70 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800/30 text-center">
                <MessageCircle className="h-5 w-5 text-blue-600 dark:text-blue-400 mx-auto mb-2" />
                <p className="text-2xl font-black text-gray-900 dark:text-white">{formatCount(post.comments)}</p>
                <p className="text-xs font-semibold text-blue-700 dark:text-blue-300 mt-0.5">Comments</p>
              </div>
              <div className="p-4 rounded-2xl bg-green-50/70 dark:bg-green-900/20 border border-green-100 dark:border-green-800/30 text-center">
                <Share2 className="h-5 w-5 text-green-600 dark:text-green-400 mx-auto mb-2" />
                <p className="text-2xl font-black text-gray-900 dark:text-white">{formatCount(post.shares)}</p>
                <p className="text-xs font-semibold text-green-700 dark:text-green-300 mt-0.5">Shares</p>
              </div>
            </div>
          )}

          {post.metricsStatus === 'PERMISSION_REQUIRED' && (
            <div className="p-3.5 rounded-xl bg-amber-50/80 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800/40 text-xs text-amber-700 dark:text-amber-400 flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 flex-shrink-0" />
              <span>
                Detailed analytics permissions are not granted by the platform OAuth token for this account type. Standard engagement counts will display when available.
              </span>
            </div>
          )}
        </Card>
      )}

      {/* Grid: Details & Media */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Left Column: Post Info & Schedule Info */}
        <div className="space-y-6">
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Post Information</h3>
            <dl className="space-y-4">
              <div>
                <dt className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">Title</dt>
                <dd className="text-sm font-medium text-gray-900 dark:text-white mt-1">{post.title}</dd>
              </div>
              <div>
                <dt className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">Restaurant & Branch</dt>
                <dd className="text-sm font-medium text-gray-900 dark:text-white mt-1">
                  {post.restaurantName} {post.branchName ? `(${post.branchName})` : ''}
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
                <dt className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">Published Date / Time</dt>
                <dd className="text-sm text-gray-900 dark:text-white mt-1">
                  {post.publishedDateTime || post.publishedAt || post.createdAt}
                </dd>
              </div>
              {post.platformPostId && (
                <div>
                  <dt className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">Platform Post ID</dt>
                  <dd className="text-sm font-mono text-gray-700 dark:text-gray-300 mt-1 break-all bg-gray-50 dark:bg-gray-800/60 p-2 rounded-lg border border-gray-100 dark:border-gray-800">
                    {post.platformPostId}
                  </dd>
                </div>
              )}
            </dl>
          </Card>

          <Card className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Caption</h3>
            <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-wrap">{post.caption}</p>
            {post.hashtags?.length > 0 && (
              <div className="flex items-start gap-2 mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                <Hash className="h-4 w-4 text-brand-500 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-brand-600 dark:text-brand-400 font-medium">{post.hashtags.join(' ')}</p>
              </div>
            )}
            {post.cta && (
              <div className="flex items-center gap-2 mt-3 pt-3 border-t border-gray-100 dark:border-gray-800">
                <Megaphone className="h-4 w-4 text-gray-400" />
                <span className="text-sm text-gray-600 dark:text-gray-400">CTA: {post.cta}</span>
              </div>
            )}
          </Card>
        </div>

        {/* Right Column: Media Preview & Platform Preview */}
        <div className="space-y-6">
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Media Preview</h3>
            <div className="w-full rounded-2xl aspect-video overflow-hidden bg-black/5 dark:bg-gray-800 shadow-sm flex items-center justify-center">
              <PostMediaPreview
                post={post}
                alt={post?.title}
                className="w-full h-full object-contain rounded-2xl"
              />
            </div>
          </Card>

          <Card className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Live Platform Preview</h3>
            <PostPreview post={post} />
          </Card>
        </div>
      </div>
    </div>
  )
}
