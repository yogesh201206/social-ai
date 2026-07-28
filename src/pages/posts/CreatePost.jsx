import { useState, useEffect, useCallback } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, Eye, Save, Calendar, Hash, Megaphone, Lightbulb, X } from 'lucide-react'
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
          scheduledDate: post.scheduledDate || '',
          scheduledTime: post.scheduledTime || '',
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
