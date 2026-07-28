import { useState, useEffect, useCallback } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, Eye, Save, Calendar, Hash, Megaphone, Lightbulb } from 'lucide-react'
import { usePosts } from '../../context/PostContext'
import { useRestaurants } from '../../context/RestaurantContext'
import UploadBox from '../../components/UploadBox'
import PlatformSelector from '../../components/PlatformSelector'
import Button from '../../components/Button'
import { platformCharLimits, platformHashtagSuggestions, captionTips } from '../../data/postsData'
import { userProfile } from '../../data/dashboardData'

const defaultForm = {
  title: '',
  caption: '',
  platform: 'Instagram',
  hashtags: '',
  cta: '',
  restaurantId: '',
  scheduledDate: '',
  scheduledTime: '',
}

function formatScheduleDate(dateStr) {
  if (!dateStr) return null
  const date = new Date(`${dateStr}T12:00:00`)
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

function formatScheduleTime(timeStr) {
  if (!timeStr) return null
  const [hours, minutes] = timeStr.split(':')
  const date = new Date()
  date.setHours(parseInt(hours, 10), parseInt(minutes, 10))
  return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
}

function parseScheduleDateForInput(dateStr) {
  if (!dateStr) return ''
  const parsed = new Date(`${dateStr} 12:00:00`)
  if (Number.isNaN(parsed.getTime())) return ''
  return parsed.toISOString().split('T')[0]
}

function parseScheduleTimeForInput(timeStr) {
  if (!timeStr) return ''
  const match = timeStr.match(/(\d{1,2}):(\d{2})\s*(AM|PM)?/i)
  if (!match) return ''
  let hours = parseInt(match[1], 10)
  const minutes = match[2]
  const period = match[3]?.toUpperCase()
  if (period === 'PM' && hours !== 12) hours += 12
  if (period === 'AM' && hours === 12) hours = 0
  return `${String(hours).padStart(2, '0')}:${minutes}`
}

export default function CreatePost() {
  const navigate = useNavigate()
  const { id } = useParams()
  const isEdit = Boolean(id)
  const { getPost, addPost, updatePost } = usePosts()
  const { restaurants } = useRestaurants()

  const [form, setForm] = useState(defaultForm)
  const [image, setImage] = useState(null)
  const [showSchedule, setShowSchedule] = useState(false)
  const [saving, setSaving] = useState(false)
  const [errors, setErrors] = useState({})
  const [showTips, setShowTips] = useState(false)
  const [draftSaved, setDraftSaved] = useState(false)

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
        }))
        setDraftSaved(true)
        setTimeout(() => setDraftSaved(false), 2000)
      }, 1000)
      return () => clearTimeout(timer)
    }
  }, [form, image, isEdit])

  useEffect(() => {
    if (isEdit) {
      const post = getPost(id)
      if (post) {
        setForm({
          title: post.title,
          caption: post.caption,
          platform: post.platform,
          hashtags: post.hashtags?.join(' ') || '',
          cta: post.cta || '',
          restaurantId: post.restaurantId,
          scheduledDate: parseScheduleDateForInput(post.scheduledDate),
          scheduledTime: parseScheduleTimeForInput(post.scheduledTime),
        })
        setImage(post.image ? { preview: post.image } : null)
        if (post.status === 'Scheduled') setShowSchedule(true)
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
    setForm((prev) => ({ ...prev, [field]: value }))
    // Clear error when field is updated
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: null }))
    }
  }

  const validate = () => {
    const newErrors = {}
    if (!form.title.trim()) newErrors.title = 'Post title is required'
    if (!form.caption.trim()) newErrors.caption = 'Caption is required'
    if (charCount > charLimit) newErrors.caption = `Caption exceeds ${charLimit.toLocaleString()} character limit`
    if (!form.platform) newErrors.platform = 'Please select a platform'
    if (!form.restaurantId) newErrors.restaurantId = 'Please select a restaurant'
    if (showSchedule && (!form.scheduledDate || !form.scheduledTime)) {
      newErrors.schedule = 'Please select both date and time for scheduling'
    }
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const buildPostData = (status) => {
    const restaurant = restaurants.find((r) => r.id === form.restaurantId) || restaurants[0]
    const hashtags = form.hashtags
      .split(/[\s,]+/)
      .filter(Boolean)
      .map((tag) => (tag.startsWith('#') ? tag : `#${tag}`))

    return {
      title: form.title,
      caption: form.caption,
      image: image?.preview || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=600&h=400&fit=crop',
      platform: form.platform,
      status,
      hashtags,
      cta: form.cta,
      restaurantId: restaurant?.id || '1',
      restaurantName: restaurant?.name || userProfile.businessName,
      restaurantLogo: restaurant?.logo || 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=100&h=100&fit=crop',
      scheduledDate: status === 'Scheduled' ? formatScheduleDate(form.scheduledDate) : null,
      scheduledTime: status === 'Scheduled' ? formatScheduleTime(form.scheduledTime) : null,
      publishedAt: null,
      metrics: null,
    }
  }

  const handleSaveDraft = async () => {
    if (!validate()) return
    setSaving(true)
    await new Promise((r) => setTimeout(r, 400))
    const data = buildPostData('Draft')
    if (isEdit) {
      updatePost(id, data)
    } else {
      addPost(data)
    }
    localStorage.removeItem('createPostDraft')
    setSaving(false)
    navigate('/dashboard/posts/drafts')
  }

  const handlePreview = () => {
    const data = buildPostData('Draft')
    navigate('/dashboard/posts/preview', { state: { post: data } })
  }

  const handleSchedule = async () => {
    if (!form.scheduledDate || !form.scheduledTime) {
      setShowSchedule(true)
      return
    }
    if (!validate()) return
    setSaving(true)
    await new Promise((r) => setTimeout(r, 400))
    const data = buildPostData('Scheduled')
    if (isEdit) {
      updatePost(id, data)
    } else {
      addPost(data)
    }
    localStorage.removeItem('createPostDraft')
    setSaving(false)
    navigate('/dashboard/posts/scheduled')
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

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="glass rounded-2xl p-6 space-y-5">
            <div>
              <label htmlFor="title" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Post Title
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
                  Caption
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
                placeholder="Write a compelling caption for your audience..."
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

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Upload Image
              </label>
              <UploadBox value={image} onChange={setImage} />
            </div>
          </div>

          <div className="glass rounded-2xl p-6 space-y-4">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Select Platform
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
              Restaurant
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
              <div className="grid sm:grid-cols-2 gap-4 pt-2">
                <div>
                  <label htmlFor="scheduledDate" className="block text-xs text-gray-500 dark:text-gray-400 mb-1.5">
                    Date
                  </label>
                  <input
                    id="scheduledDate"
                    type="date"
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
              </div>
            )}
            {errors.schedule && <p className="text-xs text-red-500">{errors.schedule}</p>}
          </div>
        </div>

        <div className="space-y-4">
          <div className="glass rounded-2xl p-6 sticky top-6 space-y-4">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Actions</h3>
            <Button
              variant="secondary"
              className="w-full"
              onClick={handleSaveDraft}
              loading={saving}
            >
              <Save className="h-4 w-4" />
              Save Draft
            </Button>
            <Button
              variant="outline"
              className="w-full"
              onClick={handlePreview}
            >
              <Eye className="h-4 w-4" />
              Preview Post
            </Button>
            <Button
              className="w-full"
              onClick={handleSchedule}
              loading={saving}
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
