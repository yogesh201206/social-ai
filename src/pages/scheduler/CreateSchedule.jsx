import { useState, useEffect, useMemo } from 'react'
import { useNavigate, useSearchParams, Link, useLocation } from 'react-router-dom'
import {
  ArrowLeft, Building2, MapPin, Sparkles, Calendar, Clock, Globe,
  Hash, Video, CheckCircle, Eye,
} from 'lucide-react'
import Button from '../../components/Button'
import Card from '../../components/Card'
import PlatformSelector from '../../components/PlatformSelector'
import UploadBox from '../../components/UploadBox'
import PostPreview from '../../components/PostPreview'
import { useScheduler } from '../../context/SchedulerContext'
import { useRestaurants } from '../../context/RestaurantContext'
import { schedulerTimezones } from '../../data/schedulerData'
import { restaurants as restaurantData } from '../../data/restaurantData'

const defaultForm = {
  title: '',
  caption: '',
  hashtags: '',
  restaurantId: '',
  branchId: '',
  platforms: [],
  scheduledDate: '',
  scheduledTimeInput: '',
  timezone: 'Asia/Kolkata',
}

function SuccessModal({ data, onClose, onViewAll, onScheduleAnother }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
      <div className="glass rounded-2xl p-8 max-w-md w-full shadow-2xl animate-slide-up">
        <div className="text-center">
          <div className="inline-flex items-center justify-center h-16 w-16 rounded-full bg-green-100 dark:bg-green-900/30 mb-4">
            <CheckCircle className="h-8 w-8 text-green-600 dark:text-green-400" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">Post Scheduled Successfully</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
            Your post has been scheduled and will publish automatically.
          </p>
        </div>

        <div className="mt-6 space-y-3 p-4 rounded-xl bg-gray-50 dark:bg-gray-800/50">
          {[
            { label: 'Restaurant', value: data.restaurantName },
            { label: 'Branch', value: data.branchName },
            { label: 'Platforms', value: data.platforms?.join(', ') },
            { label: 'Date', value: data.scheduledDateDisplay },
            { label: 'Time', value: data.scheduledTime },
          ].map(({ label, value }) => (
            <div key={label} className="flex justify-between text-sm">
              <span className="text-gray-500 dark:text-gray-400">{label}</span>
              <span className="font-medium text-gray-900 dark:text-white text-right">{value}</span>
            </div>
          ))}
        </div>

        <div className="flex flex-col gap-2 mt-6">
          <Button onClick={onViewAll} className="w-full">View Scheduled Posts</Button>
          <Button variant="outline" onClick={onScheduleAnother} className="w-full">Schedule Another Post</Button>
          <button type="button" onClick={onClose} className="text-sm text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 mt-1">
            Close
          </button>
        </div>
      </div>
    </div>
  )
}

function FormSection({ number, title, icon: Icon, children }) {
  return (
    <Card className="p-6">
      <div className="flex items-center gap-3 mb-5">
        <div className="h-8 w-8 rounded-lg gradient-bg flex items-center justify-center text-white text-sm font-bold">
          {number}
        </div>
        <Icon className="h-5 w-5 text-brand-500" />
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{title}</h3>
      </div>
      {children}
    </Card>
  )
}

export default function CreateSchedule() {
  const navigate = useNavigate()
  const location = useLocation()
  const [searchParams] = useSearchParams()
  const editId = searchParams.get('edit')
  const isEdit = Boolean(editId)

  const { addScheduledPost, updateScheduledPost, getScheduledPost } = useScheduler()
  const { restaurants } = useRestaurants()

  const [form, setForm] = useState(defaultForm)
  const [image, setImage] = useState(null)
  const [errors, setErrors] = useState({})
  const [saving, setSaving] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)
  const [successData, setSuccessData] = useState(null)
  const [previewPlatform, setPreviewPlatform] = useState('Instagram')

  const allRestaurants = restaurants.length > 0 ? restaurants : restaurantData

  const selectedRestaurant = useMemo(
    () => allRestaurants.find((r) => r.id === form.restaurantId),
    [allRestaurants, form.restaurantId]
  )

  const branches = selectedRestaurant?.branches || []

  useEffect(() => {
    if (isEdit) {
      const post = getScheduledPost(editId)
      if (post) {
        setForm({
          title: post.title,
          caption: post.caption,
          hashtags: post.hashtags?.join(' ') || '',
          restaurantId: post.restaurantId,
          branchId: post.branchId,
          platforms: post.platforms,
          scheduledDate: post.scheduledDate,
          scheduledTimeInput: post.scheduledTimeInput,
          timezone: post.timezone || 'Asia/Kolkata',
        })
        setImage(post.image ? { preview: post.image } : null)
        if (post.platforms?.length) setPreviewPlatform(post.platforms[0])
      }
    } else if (location.state?.fromAI) {
      const ai = location.state
      setForm((f) => ({
        ...f,
        caption: ai.caption || f.caption,
        hashtags: ai.hashtags || f.hashtags,
        title: ai.title || f.title,
      }))
    }
  }, [isEdit, editId, getScheduledPost, location.state])

  const validate = (forSchedule = true) => {
    const newErrors = {}
    if (!form.restaurantId) newErrors.restaurantId = 'Please select a restaurant'
    if (!form.branchId) newErrors.branchId = 'Please select a branch'
    if (form.platforms.length === 0) newErrors.platforms = 'Select at least one platform'
    if (!form.caption.trim()) newErrors.caption = 'Caption is required'
    if (forSchedule) {
      if (!form.scheduledDate) newErrors.scheduledDate = 'Date is required'
      if (!form.scheduledTimeInput) newErrors.scheduledTimeInput = 'Time is required'
    }
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const buildPostData = (status) => {
    const restaurant = allRestaurants.find((r) => r.id === form.restaurantId)
    const branch = branches.find((b) => b.id === form.branchId)
    const hashtagList = form.hashtags
      .split(/[\s,]+/)
      .filter(Boolean)
      .map((h) => (h.startsWith('#') ? h : `#${h}`))

    return {
      title: form.title || form.caption.slice(0, 50) + (form.caption.length > 50 ? '...' : ''),
      caption: form.caption,
      hashtags: hashtagList,
      image: image?.preview || image?.url || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=600&h=400&fit=crop',
      video: null,
      restaurantId: form.restaurantId,
      restaurantName: restaurant?.name || '',
      branchId: form.branchId,
      branchName: branch?.name || '',
      branchCity: branch?.city || '',
      platforms: form.platforms,
      scheduledDate: form.scheduledDate,
      scheduledTimeInput: form.scheduledTimeInput,
      timezone: form.timezone,
      status,
    }
  }

  const handleSaveDraft = () => {
    if (!validate(false)) return
    setSaving(true)
    setTimeout(() => {
      const data = buildPostData('Draft')
      if (isEdit) {
        updateScheduledPost(editId, data)
      } else {
        addScheduledPost(data)
      }
      setSaving(false)
      navigate('/dashboard/scheduler')
    }, 600)
  }

  const handleSchedule = () => {
    if (!validate(true)) return
    setSaving(true)
    setTimeout(() => {
      const data = buildPostData('Scheduled')
      let saved
      if (isEdit) {
        updateScheduledPost(editId, data)
        saved = { ...data, id: editId }
      } else {
        saved = addScheduledPost(data)
      }
      setSaving(false)
      setSuccessData(saved)
      setShowSuccess(true)
    }, 800)
  }

  const previewPost = useMemo(() => {
    const restaurant = allRestaurants.find((r) => r.id === form.restaurantId)
    const hashtagList = form.hashtags.split(/[\s,]+/).filter(Boolean).map((h) => (h.startsWith('#') ? h : `#${h}`))
    return {
      title: form.title || 'Preview',
      caption: form.caption || 'Your caption will appear here...',
      hashtags: hashtagList,
      image: image?.preview || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=600&h=400&fit=crop',
      restaurantName: restaurant?.name || 'Your Restaurant',
      restaurantLogo: restaurant?.logo || 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=100&h=100&fit=crop',
      platform: previewPlatform,
    }
  }, [form, image, allRestaurants, previewPlatform])

  const inputClass = (field) =>
    `w-full px-4 py-2.5 rounded-xl border ${
      errors[field] ? 'border-red-400' : 'border-gray-200 dark:border-gray-700'
    } bg-white dark:bg-gray-900 text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-brand-500 focus:border-transparent outline-none transition-shadow`

  return (
    <div className="space-y-6 animate-fade-in max-w-4xl mx-auto">
      <div className="flex items-center gap-4">
        <button
          type="button"
          onClick={() => navigate('/dashboard/scheduler')}
          className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-300 transition-colors"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            {isEdit ? 'Edit Schedule' : 'Schedule New Post'}
          </h2>
          <p className="text-gray-500 dark:text-gray-400 mt-0.5">
            Configure your post and pick the perfect time to publish.
          </p>
        </div>
      </div>

      <div className="space-y-6">
        <FormSection number="1" title="Select Restaurant" icon={Building2}>
          <select
            value={form.restaurantId}
            onChange={(e) => setForm({ ...form, restaurantId: e.target.value, branchId: '' })}
            className={inputClass('restaurantId')}
          >
            <option value="">Choose a restaurant...</option>
            {allRestaurants.map((r) => (
              <option key={r.id} value={r.id}>{r.name} — {r.category}</option>
            ))}
          </select>
          {errors.restaurantId && <p className="text-red-500 text-xs mt-1">{errors.restaurantId}</p>}
        </FormSection>

        <FormSection number="2" title="Select Branch / Location" icon={MapPin}>
          {!form.restaurantId ? (
            <p className="text-sm text-gray-500 dark:text-gray-400">Select a restaurant first to see available branches.</p>
          ) : (
            <div className="grid sm:grid-cols-2 gap-3">
              {branches.map((branch) => (
                <button
                  key={branch.id}
                  type="button"
                  onClick={() => setForm({ ...form, branchId: branch.id })}
                  className={`p-4 rounded-xl border-2 text-left transition-all hover:scale-[1.01] ${
                    form.branchId === branch.id
                      ? 'border-brand-500 bg-brand-50 dark:bg-brand-900/20'
                      : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
                  }`}
                >
                  <p className="font-semibold text-gray-900 dark:text-white">{branch.name}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{branch.city}</p>
                  <p className="text-xs text-gray-400 mt-0.5 truncate">{branch.address}</p>
                </button>
              ))}
            </div>
          )}
          {errors.branchId && <p className="text-red-500 text-xs mt-2">{errors.branchId}</p>}
        </FormSection>

        <FormSection number="3" title="Select Platforms" icon={Globe}>
          <PlatformSelector
            value={form.platforms}
            onChange={(platforms) => setForm({ ...form, platforms })}
            multiple
          />
          {errors.platforms && <p className="text-red-500 text-xs mt-2">{errors.platforms}</p>}
        </FormSection>

        <FormSection number="4" title="Post Content" icon={Sparkles}>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Post Title (optional)</label>
              <input
                type="text"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                placeholder="e.g. Weekend Special"
                className={inputClass('title')}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Caption</label>
              <textarea
                rows={4}
                value={form.caption}
                onChange={(e) => setForm({ ...form, caption: e.target.value })}
                placeholder="Write your post caption..."
                className={inputClass('caption')}
              />
              {errors.caption && <p className="text-red-500 text-xs mt-1">{errors.caption}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                <Hash className="h-4 w-4 inline mr-1" />
                Hashtags
              </label>
              <input
                type="text"
                value={form.hashtags}
                onChange={(e) => setForm({ ...form, hashtags: e.target.value })}
                placeholder="#Foodie #Restaurant #LocalEats"
                className={inputClass('hashtags')}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Image</label>
              <UploadBox value={image} onChange={setImage} />
            </div>
            <div className="p-4 rounded-xl border border-dashed border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-800/50">
              <div className="flex items-center gap-3">
                <Video className="h-8 w-8 text-gray-400" />
                <div>
                  <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Video (optional)</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Video upload will be available in the API integration phase.</p>
                </div>
              </div>
            </div>
            <Link to="/dashboard/content-generator" state={{ returnTo: '/dashboard/scheduler/create' }}>
              <Button variant="outline" type="button" className="w-full sm:w-auto">
                <Sparkles className="h-4 w-4" /> Use AI Generated Content
              </Button>
            </Link>
          </div>
        </FormSection>

        <FormSection number="5" title="Schedule" icon={Calendar}>
          <div className="grid sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                <Calendar className="h-4 w-4 inline mr-1" /> Date
              </label>
              <input
                type="date"
                value={form.scheduledDate}
                onChange={(e) => setForm({ ...form, scheduledDate: e.target.value })}
                className={inputClass('scheduledDate')}
              />
              {errors.scheduledDate && <p className="text-red-500 text-xs mt-1">{errors.scheduledDate}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                <Clock className="h-4 w-4 inline mr-1" /> Time
              </label>
              <input
                type="time"
                value={form.scheduledTimeInput}
                onChange={(e) => setForm({ ...form, scheduledTimeInput: e.target.value })}
                className={inputClass('scheduledTimeInput')}
              />
              {errors.scheduledTimeInput && <p className="text-red-500 text-xs mt-1">{errors.scheduledTimeInput}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                <Globe className="h-4 w-4 inline mr-1" /> Timezone
              </label>
              <select
                value={form.timezone}
                onChange={(e) => setForm({ ...form, timezone: e.target.value })}
                className={inputClass('timezone')}
              >
                {schedulerTimezones.map((tz) => (
                  <option key={tz.value} value={tz.value}>{tz.label}</option>
                ))}
              </select>
            </div>
          </div>
        </FormSection>

        <FormSection number="6" title="Preview" icon={Eye}>
          {form.platforms.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-4">
              {form.platforms.map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setPreviewPlatform(p)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                    previewPlatform === p
                      ? 'gradient-bg text-white'
                      : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400'
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>
          )}
          <PostPreview post={previewPost} platform={previewPlatform} />
        </FormSection>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 sticky bottom-4 glass rounded-2xl p-4 shadow-lg">
        <Button variant="secondary" onClick={() => navigate('/dashboard/scheduler')} className="sm:flex-1">
          Cancel
        </Button>
        <Button variant="outline" onClick={handleSaveDraft} loading={saving} className="sm:flex-1">
          Save Draft
        </Button>
        <Button onClick={handleSchedule} loading={saving} className="sm:flex-1">
          Schedule Post
        </Button>
      </div>

      {showSuccess && successData && (
        <SuccessModal
          data={successData}
          onClose={() => navigate('/dashboard/scheduler')}
          onViewAll={() => navigate('/dashboard/scheduler')}
          onScheduleAnother={() => {
            setShowSuccess(false)
            setForm(defaultForm)
            setImage(null)
            navigate('/dashboard/scheduler/create')
          }}
        />
      )}
    </div>
  )
}
