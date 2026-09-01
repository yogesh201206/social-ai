import { useState, useEffect, useCallback, useMemo } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, Eye, Save, Calendar, Hash, Megaphone, Lightbulb, AlertCircle, Send, CheckCircle, XCircle, Clock, Video } from 'lucide-react'
import { usePosts } from '../../context/PostContext'
import { useRestaurants } from '../../context/RestaurantContext'
import UploadBox from '../../components/UploadBox'
import VideoUploadBox from '../../components/VideoUploadBox'
import PlatformSelector from '../../components/PlatformSelector'
import Button from '../../components/Button'
import { platformCharLimits, platformHashtagSuggestions, captionTips } from '../../data/postsData'
import { schedulerTimezones } from '../../data/schedulerData'
import { userProfile } from '../../data/dashboardData'

// Platforms not yet live — show Coming Soon instead of publishing
const COMING_SOON_PLATFORMS = ['Instagram', 'Facebook']

const defaultForm = {
  title: '',
  caption: '',
  platform: 'Twitter',
  hashtags: '',
  cta: '',
  restaurantId: '',
  branchId: '',
  scheduledDate: '',
  scheduledTime: '',
  timezone: 'Asia/Kolkata',
}

function toUtcDate(dateStr) {
  if (!dateStr) return null
  if (dateStr instanceof Date) return dateStr
  const str = String(dateStr)
  const isoStr = (str.endsWith('Z') || str.includes('+') || (str.includes('-') && str.lastIndexOf('-') > 10))
    ? str
    : `${str}Z`
  const d = new Date(isoStr)
  return Number.isNaN(d.getTime()) ? null : d
}

function parseScheduleDateForInput(dateStr, timezone = 'Asia/Kolkata') {
  const date = toUtcDate(dateStr)
  if (!date) return ''
  try {
    return new Intl.DateTimeFormat('en-CA', {
      timeZone: timezone || 'Asia/Kolkata',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).format(date)
  } catch (e) {
    return date.toISOString().split('T')[0]
  }
}

function parseScheduleTimeForInput(timeStr, timezone = 'Asia/Kolkata') {
  const date = toUtcDate(timeStr)
  if (!date) return ''
  try {
    return new Intl.DateTimeFormat('en-GB', {
      timeZone: timezone || 'Asia/Kolkata',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    }).format(date)
  } catch (e) {
    return '18:00'
  }
}

export default function CreatePost() {
  const navigate = useNavigate()
  const { id } = useParams()
  const isEdit = Boolean(id)
  const { getPost, addPost, updatePost, publishPost } = usePosts()
  const { restaurants } = useRestaurants()

  const [form, setForm] = useState(defaultForm)
  const [image, setImage] = useState(null)
  const [video, setVideo] = useState(null)
  const [thumbnail, setThumbnail] = useState(null)
  const [privacy, setPrivacy] = useState('private')
  const [showSchedule, setShowSchedule] = useState(false)
  const [saving, setSaving] = useState(false)
  const [publishing, setPublishing] = useState(false)
  const [publishResult, setPublishResult] = useState(null) // { status: 'success'|'error', message: string }
  const [errors, setErrors] = useState({})
  const [apiError, setApiError] = useState('')
  const [showTips, setShowTips] = useState(false)
  const [draftSaved, setDraftSaved] = useState(false)

  const isYouTube = form.platform === 'YouTube'

  const selectedRestaurant = useMemo(
    () => restaurants.find((r) => String(r.id) === String(form.restaurantId)),
    [restaurants, form.restaurantId]
  )

  const availableBranches = selectedRestaurant?.branches || []

  // Autosave to localStorage
  useEffect(() => {
    if (!isEdit) {
      const saved = localStorage.getItem('createPostDraft')
      if (saved) {
        try {
          const parsed = JSON.parse(saved)
          setForm(parsed.form || defaultForm)
          if (parsed.imagePreview) {
            setImage({ preview: parsed.imagePreview })
          }
          if (parsed.videoPreview) {
            setVideo({ preview: parsed.videoPreview, mediaUrl: parsed.videoMediaUrl })
          }
          if (parsed.privacy) {
            setPrivacy(parsed.privacy)
          }
        } catch (e) {
          // ignore parse errors
        }
      }
    }
  }, [isEdit])

  useEffect(() => {
    if (!isEdit && form.title) {
      const timer = setTimeout(() => {
        localStorage.setItem('createPostDraft', JSON.stringify({
          form,
          imagePreview: image?.preview || null,
          videoPreview: video?.preview || null,
          videoMediaUrl: video?.mediaUrl || null,
          privacy,
        }))
        setDraftSaved(true)
        setTimeout(() => setDraftSaved(false), 2000)
      }, 1000)
      return () => clearTimeout(timer)
    }
  }, [form, image, video, privacy, isEdit])

  useEffect(() => {
    if (isEdit) {
      const post = getPost(id)
      if (post) {
        const tz = post.timezone || 'Asia/Kolkata'
        setForm({
          title: post.title || '',
          caption: post.caption || '',
          platform: post.platform || 'Instagram',
          hashtags: Array.isArray(post.hashtags) ? post.hashtags.join(' ') : (post.hashtags || ''),
          cta: post.cta || '',
          restaurantId: post.restaurantId ? String(post.restaurantId) : '',
          branchId: post.branchId ? String(post.branchId) : '',
          scheduledDate: parseScheduleDateForInput(post.scheduledAt || post.scheduledDate, tz),
          scheduledTime: parseScheduleTimeForInput(post.scheduledAt || post.scheduledTime, tz),
          timezone: tz,
        })
        const media = post.image || post.imageUrl
        if (post.platform === 'YouTube') {
          setVideo(media ? { preview: media, mediaUrl: media } : null)
        } else {
          setImage(media ? { preview: media } : null)
        }
        if (post.status?.toLowerCase() === 'scheduled') setShowSchedule(true)
      }
    }
  }, [id, isEdit, getPost])

  const charLimit = platformCharLimits[form.platform] || 2200
  const charCount = form.caption.length
  const charPercentage = (charCount / charLimit) * 100

  const getCharColor = () => {
    if (charPercentage >= 100) return 'text-red-500'
    if (charPercentage >= 80) return 'text-yellow-500'
    if (charPercentage >= 60) return 'text-amber-500'
    return 'text-gray-400'
  }

  const updateField = (field, value) => {
    setForm((prev) => {
      const next = { ...prev, [field]: value }
      if (field === 'restaurantId') {
        next.branchId = ''
      }
      return next
    })
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: null }))
    }
    setApiError('')
  }

  const validate = (forSchedule = false) => {
    const newErrors = {}
    if (!form.title.trim()) newErrors.title = 'Post title is required'
    if (!form.caption.trim()) newErrors.caption = 'Caption is required'
    if (charCount > charLimit) newErrors.caption = `Caption exceeds ${charLimit.toLocaleString()} character limit`
    if (!form.platform) {
      newErrors.platform = 'Please select a platform'
    } else if (['Instagram', 'Facebook'].includes(form.platform)) {
      newErrors.platform = `${form.platform} integration is coming soon. Please select an active platform (X, LinkedIn, or YouTube).`
    } else if (form.platform === 'YouTube' && !video?.preview && !video?.mediaUrl) {
      newErrors.video = 'YouTube publishing requires a video.'
    }
    if (!form.restaurantId) newErrors.restaurantId = 'Please select a restaurant'

    if (forSchedule || showSchedule) {
      if (!form.scheduledDate) {
        newErrors.schedule = 'Scheduled date is required'
      } else if (!form.scheduledTime) {
        newErrors.schedule = 'Scheduled time is required'
      } else {
        const tz = form.timezone || 'Asia/Kolkata'
        const now = new Date()
        let isPast = false
        try {
          const currentDate = new Intl.DateTimeFormat('en-CA', { timeZone: tz, year: 'numeric', month: '2-digit', day: '2-digit' }).format(now)
          const currentTime = new Intl.DateTimeFormat('en-GB', { timeZone: tz, hour: '2-digit', minute: '2-digit', hour12: false }).format(now)
          const selected = `${form.scheduledDate}T${form.scheduledTime}`
          const current = `${currentDate}T${currentTime}`
          isPast = selected <= current
        } catch (e) {
          const scheduledDateTime = new Date(`${form.scheduledDate}T${form.scheduledTime}:00`)
          isPast = Number.isNaN(scheduledDateTime.getTime()) || scheduledDateTime <= now
        }
        if (isPast) {
          newErrors.schedule = 'Scheduled date and time must be in the future'
        }
      }
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const buildPostData = (status) => {
    const restaurant = restaurants.find((r) => String(r.id) === String(form.restaurantId)) || restaurants[0]
    const hashtags = form.hashtags
      .split(/[\s,]+/)
      .filter(Boolean)
      .map((tag) => (tag.startsWith('#') ? tag : `#${tag}`))

    let finalImageUrl
    if (isYouTube) {
      finalImageUrl = video?.mediaUrl || video?.preview || ''
    } else {
      finalImageUrl = image?.preview || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=600&h=400&fit=crop'
    }

    let caption = form.caption
    if (isYouTube && privacy) {
      caption = `${caption} [privacy:${privacy}]`
    }

    return {
      title: form.title,
      caption,
      imageUrl: finalImageUrl,
      image: finalImageUrl,
      mediaPath: isYouTube ? (video?.mediaPath || null) : null,
      mediaType: isYouTube ? (video?.mediaType || 'video/mp4') : null,
      originalFileName: isYouTube ? (video?.originalFileName || video?.fileName || null) : null,
      platform: form.platform,
      status,
      hashtags,
      cta: form.cta,
      restaurantId: form.restaurantId,
      restaurantName: restaurant?.name || userProfile.businessName,
      branchId: form.branchId || null,
      scheduledDate: status === 'Scheduled' ? form.scheduledDate : null,
      scheduledTimeInput: status === 'Scheduled' ? form.scheduledTime : null,
      scheduledAt: status === 'Scheduled' && form.scheduledDate && form.scheduledTime ? `${form.scheduledDate}T${form.scheduledTime}:00` : null,
      timezone: form.timezone || 'Asia/Kolkata',
    }
  }

  const handleSaveDraft = async () => {
    if (!validate(false)) return
    setSaving(true)
    setApiError('')
    try {
      const data = buildPostData('Draft')
      if (isEdit) {
        await updatePost(id, data)
      } else {
        await addPost(data)
      }
      localStorage.removeItem('createPostDraft')
      navigate('/dashboard/posts/drafts')
    } catch (err) {
      setApiError(err.message || 'Failed to save draft')
    } finally {
      setSaving(false)
    }
  }

  const handlePreview = () => {
    const data = buildPostData('Draft')
    navigate('/dashboard/posts/preview', { state: { post: data } })
  }

  const handleSchedule = async () => {
    setShowSchedule(true)
    if (!validate(true)) return
    setSaving(true)
    setApiError('')
    try {
      const data = buildPostData('Scheduled')
      if (isEdit) {
        await updatePost(id, data)
      } else {
        await addPost(data)
      }
      localStorage.removeItem('createPostDraft')
      navigate('/dashboard/posts/scheduled')
    } catch (err) {
      setApiError(err.message || 'Failed to schedule post')
    } finally {
      setSaving(false)
    }
  }

  const handlePostNow = async () => {
    setPublishResult(null)
    setApiError('')

    // Platform guard
    if (COMING_SOON_PLATFORMS.includes(form.platform)) {
      setPublishResult({
        status: 'error',
        message: `${form.platform} publishing is coming soon. Please select X (Twitter), LinkedIn, or YouTube.`,
      })
      return
    }

    if (!validate(false)) return

    setPublishing(true)
    try {
      // 1. Save / update post first (as DRAFT so we get an id)
      const data = buildPostData('Draft')
      let savedPost
      if (isEdit) {
        savedPost = await updatePost(id, data)
      } else {
        savedPost = await addPost(data)
      }

      // 2. Immediately publish
      await publishPost(savedPost.id)
      localStorage.removeItem('createPostDraft')

      setPublishResult({ status: 'success', message: 'Published successfully! Redirecting...' })
      setTimeout(() => navigate('/dashboard/posts/published'), 2000)
    } catch (err) {
      const msg = err.message || 'Publishing failed. Please try again.'
      setPublishResult({ status: 'error', message: msg })
    } finally {
      setPublishing(false)
    }
  }

  const addHashtag = useCallback((tag) => {
    const current = form.hashtags ? form.hashtags.split(/[\s,]+/).filter(Boolean) : []
    const tagClean = tag.startsWith('#') ? tag : `#${tag}`
    if (!current.includes(tagClean)) {
      current.push(tagClean)
      updateField('hashtags', current.join(' '))
    }
  }, [form.hashtags])

  const currentTips = captionTips[form.platform] || captionTips['Instagram']
  const suggestedHashtags = platformHashtagSuggestions[form.platform] || platformHashtagSuggestions['Instagram']

  return (
    <div className="space-y-6 animate-fade-in max-w-4xl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="p-2 rounded-xl bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              {isEdit ? 'Edit Post' : 'Create Post'}
            </h2>
            <p className="text-gray-500 dark:text-gray-400 mt-1">
              Craft engaging content for your restaurant&apos;s social channels.
            </p>
          </div>
        </div>
        {draftSaved && (
          <span className="text-xs font-medium text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20 px-3 py-1.5 rounded-lg">
            Draft autosaved
          </span>
        )}
      </div>

      {apiError && (
        <div className="p-4 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 flex items-center gap-3">
          <AlertCircle className="h-5 w-5 flex-shrink-0" />
          <p className="text-sm font-medium">{apiError}</p>
        </div>
      )}

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="glass rounded-2xl p-6 space-y-5">
            <div>
              <label htmlFor="title" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Post Title *
              </label>
              <input
                id="title"
                type="text"
                value={form.title}
                onChange={(e) => updateField('title', e.target.value)}
                placeholder="e.g. Summer Menu Launch"
                className={`w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-gray-800 border text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-brand-500/50 transition-all ${
                  errors.title ? 'border-red-400' : 'border-gray-200 dark:border-gray-700'
                }`}
              />
              {errors.title && <p className="text-xs text-red-500 mt-1">{errors.title}</p>}
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label htmlFor="caption" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  {isYouTube ? 'Description / Caption *' : 'Caption *'}
                </label>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setShowTips(!showTips)}
                    className="flex items-center gap-1 text-xs text-brand-600 dark:text-brand-400 hover:text-brand-700"
                  >
                    <Lightbulb className="h-3.5 w-3.5" />
                    Tips
                  </button>
                  <span className={`text-xs font-medium ${getCharColor()}`}>
                    {charCount.toLocaleString()} / {charLimit.toLocaleString()}
                  </span>
                </div>
              </div>
              <textarea
                id="caption"
                value={form.caption}
                onChange={(e) => updateField('caption', e.target.value)}
                rows={5}
                placeholder={isYouTube ? 'Write a detailed description for your YouTube video...' : 'Write a compelling caption for your audience...'}
                className={`w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-gray-800 border text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-brand-500/50 resize-none transition-all ${
                  errors.caption ? 'border-red-400' : 'border-gray-200 dark:border-gray-700'
                }`}
              />
              {errors.caption && <p className="text-xs text-red-500 mt-1">{errors.caption}</p>}
              <div className="mt-2 h-1 rounded-full bg-gray-200 dark:bg-gray-700 overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-300 ${
                    charPercentage >= 100 ? 'bg-red-500' : charPercentage >= 80 ? 'bg-yellow-500' : 'gradient-bg'
                  }`}
                  style={{ width: `${Math.min(charPercentage, 100)}%` }}
                />
              </div>
              {showTips && (
                <ul className="mt-3 p-4 rounded-xl bg-brand-50 dark:bg-brand-900/20 border border-brand-100 dark:border-brand-800/30 space-y-2">
                  {currentTips.map((tip) => (
                    <li key={tip} className="flex items-start gap-2 text-xs text-gray-600 dark:text-gray-400">
                      <Lightbulb className="h-3.5 w-3.5 text-brand-500 flex-shrink-0 mt-0.5" />
                      {tip}
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {/* Dynamic Media Section: Video for YouTube vs Image for others */}
            {isYouTube ? (
              <div className="space-y-4 pt-2 border-t border-gray-200 dark:border-gray-700">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <Video className="h-4 w-4 text-red-500" />
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Upload Video *
                    </label>
                  </div>
                  <VideoUploadBox value={video} onChange={setVideo} />
                  {errors.video && <p className="text-xs text-red-500 mt-1.5">{errors.video}</p>}
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">
                    Upload Thumbnail (Optional)
                  </label>
                  <UploadBox value={thumbnail} onChange={setThumbnail} />
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">
                    Video Privacy Status
                  </label>
                  <div className="grid grid-cols-3 gap-3">
                    {[
                      { id: 'private', label: 'Private', desc: 'Default / Testing' },
                      { id: 'unlisted', label: 'Unlisted', desc: 'Anyone with link' },
                      { id: 'public', label: 'Public', desc: 'Live on channel' },
                    ].map((item) => (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => setPrivacy(item.id)}
                        className={`p-3 rounded-xl border text-left transition-all ${
                          privacy === item.id
                            ? 'border-red-500 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 font-semibold ring-1 ring-red-500/30'
                            : 'border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                        }`}
                      >
                        <div className="text-xs font-bold">{item.label}</div>
                        <div className="text-[10px] text-gray-500 dark:text-gray-400 mt-0.5">{item.desc}</div>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Upload Image
                </label>
                <UploadBox value={image} onChange={setImage} />
              </div>
            )}
          </div>

          <div className="glass rounded-2xl p-6 space-y-4">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Select Platform *
            </label>
            <PlatformSelector
              value={form.platform}
              onChange={(p) => updateField('platform', p)}
            />
            {errors.platform && <p className="text-xs text-red-500">{errors.platform}</p>}
          </div>

          <div className="glass rounded-2xl p-6 space-y-4">
            <div className="flex items-center gap-2">
              <Hash className="h-4 w-4 text-brand-500" />
              <label htmlFor="hashtags" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Hashtags
              </label>
            </div>
            <input
              id="hashtags"
              type="text"
              value={form.hashtags}
              onChange={(e) => updateField('hashtags', e.target.value)}
              placeholder="#Foodie #RestaurantLife #LocalEats"
              className="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-brand-500/50"
            />
            <div className="flex flex-wrap gap-2">
              {suggestedHashtags.map((tag) => (
                <button
                  key={tag}
                  type="button"
                  onClick={() => addHashtag(tag)}
                  className="px-3 py-1 rounded-lg text-xs font-medium bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-brand-50 dark:hover:bg-brand-900/20 hover:text-brand-600 dark:hover:text-brand-400 transition-colors"
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>

          <div className="glass rounded-2xl p-6 space-y-4">
            <div className="flex items-center gap-2">
              <Megaphone className="h-4 w-4 text-brand-500" />
              <label htmlFor="cta" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Call-To-Action
              </label>
            </div>
            <input
              id="cta"
              type="text"
              value={form.cta}
              onChange={(e) => updateField('cta', e.target.value)}
              placeholder="e.g. Reserve a Table, Order Now, Learn More"
              className="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-brand-500/50"
            />
          </div>

          <div className="glass rounded-2xl p-6 space-y-4">
            <label htmlFor="restaurant" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Restaurant *
            </label>
            <select
              id="restaurant"
              value={form.restaurantId}
              onChange={(e) => updateField('restaurantId', e.target.value)}
              className={`w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-gray-800 border text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-brand-500/50 ${
                errors.restaurantId ? 'border-red-400' : 'border-gray-200 dark:border-gray-700'
              }`}
            >
              <option value="">Select a restaurant</option>
              {restaurants.map((r) => (
                <option key={r.id} value={r.id}>{r.name}</option>
              ))}
            </select>
            {errors.restaurantId && <p className="text-xs text-red-500">{errors.restaurantId}</p>}
          </div>

          <div className="glass rounded-2xl p-6 space-y-4">
            <label htmlFor="branch" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Branch (Optional)
            </label>
            <select
              id="branch"
              value={form.branchId}
              onChange={(e) => updateField('branchId', e.target.value)}
              disabled={!form.restaurantId}
              className="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-brand-500/50 disabled:opacity-50"
            >
              <option value="">All Branches / Main Location</option>
              {availableBranches.map((b) => (
                <option key={b.id} value={b.id}>{b.name || b.branchName}</option>
              ))}
            </select>
          </div>

          <div className="glass rounded-2xl p-6 space-y-4">
            <button
              type="button"
              onClick={() => setShowSchedule(!showSchedule)}
              className="flex items-center justify-between w-full text-left"
            >
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-brand-500" />
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Schedule Post</span>
              </div>
              <span className="text-xs text-gray-500">{showSchedule ? 'Hide' : 'Optional'}</span>
            </button>
            {showSchedule && (
              <div className="grid sm:grid-cols-3 gap-4 pt-2">
                <div>
                  <label htmlFor="scheduledDate" className="block text-xs text-gray-500 dark:text-gray-400 mb-1.5">
                    Date
                  </label>
                  <input
                    id="scheduledDate"
                    type="date"
                    min={(() => {
                      try {
                        return new Intl.DateTimeFormat('en-CA', { timeZone: form.timezone || 'Asia/Kolkata', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date())
                      } catch (e) {
                        return new Date().toISOString().split('T')[0]
                      }
                    })()}
                    value={form.scheduledDate}
                    onChange={(e) => updateField('scheduledDate', e.target.value)}
                    className="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-brand-500/50"
                  />
                </div>
                <div>
                  <label htmlFor="scheduledTime" className="block text-xs text-gray-500 dark:text-gray-400 mb-1.5">
                    Time
                  </label>
                  <input
                    id="scheduledTime"
                    type="time"
                    value={form.scheduledTime}
                    onChange={(e) => updateField('scheduledTime', e.target.value)}
                    className="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-brand-500/50"
                  />
                </div>
                <div>
                  <label htmlFor="scheduleTimezone" className="block text-xs text-gray-500 dark:text-gray-400 mb-1.5">
                    Timezone
                  </label>
                  <select
                    id="scheduleTimezone"
                    value={form.timezone}
                    onChange={(e) => updateField('timezone', e.target.value)}
                    className="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-brand-500/50"
                  >
                    {schedulerTimezones.map((tz) => (
                      <option key={tz.value} value={tz.value}>{tz.label}</option>
                    ))}
                  </select>
                </div>
              </div>
            )}
            {errors.schedule && <p className="text-xs text-red-500">{errors.schedule}</p>}
          </div>
        </div>

        <div className="space-y-4">
          <div className="glass rounded-2xl p-6 sticky top-6 space-y-4">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Actions</h3>

            {/* Publish result banner */}
            {publishResult && (
              <div className={`flex items-start gap-2.5 p-3 rounded-xl text-sm ${
                publishResult.status === 'success'
                  ? 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 border border-green-200 dark:border-green-800'
                  : 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-800'
              }`}>
                {publishResult.status === 'success'
                  ? <CheckCircle className="h-4 w-4 flex-shrink-0 mt-0.5" />
                  : <XCircle className="h-4 w-4 flex-shrink-0 mt-0.5" />}
                <span>{publishResult.message}</span>
              </div>
            )}

            {/* General API error */}
            {apiError && !publishResult && (
              <div className="flex items-start gap-2.5 p-3 rounded-xl text-sm bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-800">
                <AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5" />
                <span>{apiError}</span>
              </div>
            )}

            {/* Coming Soon notice */}
            {COMING_SOON_PLATFORMS.includes(form.platform) && (
              <div className="flex items-start gap-2.5 p-3 rounded-xl text-sm bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800">
                <Clock className="h-4 w-4 flex-shrink-0 mt-0.5" />
                <span>{form.platform} publishing is <strong>coming soon</strong>. Use X (Twitter), LinkedIn, or YouTube to publish now.</span>
              </div>
            )}

            <Button
              variant="secondary"
              className="w-full"
              onClick={handleSaveDraft}
              disabled={saving || publishing}
              loading={saving}
            >
              <Save className="h-4 w-4" />
              Save Draft
            </Button>
            <Button
              variant="outline"
              className="w-full"
              onClick={handlePreview}
              disabled={publishing}
            >
              <Eye className="h-4 w-4" />
              Preview Post
            </Button>
            <Button
              variant="success"
              className="w-full"
              onClick={handlePostNow}
              disabled={saving || publishing}
              loading={publishing}
            >
              <Send className="h-4 w-4" />
              {publishing ? 'Publishing...' : 'Post Now'}
            </Button>
            <Button
              className="w-full"
              onClick={handleSchedule}
              disabled={saving || publishing}
              loading={saving && showSchedule}
            >
              <Calendar className="h-4 w-4" />
              Schedule Post
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
