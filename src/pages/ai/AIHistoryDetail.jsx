import { useNavigate, useParams, Link } from 'react-router-dom'
import { ArrowLeft, Copy, FilePlus, Save, Check, Clock, Hash, Megaphone, MessageSquare } from 'lucide-react'
import { useState } from 'react'
import { useAI } from '../../context/AIContext'
import { usePosts } from '../../context/PostContext'
import { useRestaurants } from '../../context/RestaurantContext'
import Button from '../../components/Button'
import Card from '../../components/Card'

export default function AIHistoryDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { getHistoryItem } = useAI()
  const { addPost } = usePosts()
  const { restaurants } = useRestaurants()
  const [copied, setCopied] = useState(false)

  const item = getHistoryItem(id)

  if (!item) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <p className="text-gray-500 dark:text-gray-400 mb-4">Generation not found.</p>
        <Button onClick={() => navigate('/dashboard/ai-history')}>Back to History</Button>
      </div>
    )
  }

  const copyAll = async () => {
    const text = [item.caption, item.hashtags?.join(' '), item.cta].filter(Boolean).join('\n\n')
    await navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleSaveDraft = () => {
    const restaurant = restaurants.find(
      (r) => r.name.toLowerCase() === item.restaurantName.toLowerCase()
    ) || restaurants[0]

    addPost({
      title: `${item.restaurantName} — ${item.contentType}`,
      caption: item.caption,
      image: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=600&h=400&fit=crop',
      platform: 'Instagram',
      status: 'Draft',
      hashtags: item.hashtags || [],
      cta: item.cta || '',
      restaurantId: restaurant?.id || '1',
      restaurantName: restaurant?.name || item.restaurantName,
      restaurantLogo: restaurant?.logo || '',
      scheduledDate: null,
      scheduledTime: null,
      publishedAt: null,
      metrics: null,
    })
    navigate('/dashboard/posts/drafts')
  }

  const handleCreatePost = () => {
    navigate('/dashboard/posts/create', {
      state: {
        fromAI: true,
        title: `${item.restaurantName} — ${item.contentType}`,
        caption: item.caption,
        hashtags: item.hashtags?.join(' ') || '',
        cta: item.cta || '',
        restaurantName: item.restaurantName,
      },
    })
  }

  return (
    <div className="space-y-6 animate-fade-in max-w-3xl">
      <div className="flex items-center gap-4">
        <button
          type="button"
          onClick={() => navigate('/dashboard/ai-history')}
          className="p-2 rounded-xl bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{item.restaurantName}</h2>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            {item.contentType} · {item.generatedAt}
          </p>
        </div>
      </div>

      <Card className="p-6 space-y-5">
        {item.caption && (
          <section>
            <div className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              <MessageSquare className="h-4 w-4 text-brand-500" />
              Caption
            </div>
            <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-wrap">
              {item.caption}
            </p>
          </section>
        )}

        {item.hashtags?.length > 0 && (
          <section>
            <div className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              <Hash className="h-4 w-4 text-brand-500" />
              Hashtags
            </div>
            <div className="flex flex-wrap gap-2">
              {item.hashtags.map((tag) => (
                <span key={tag} className="px-2.5 py-1 rounded-lg text-xs font-medium bg-brand-100 dark:bg-brand-900/30 text-brand-700 dark:text-brand-300">
                  {tag}
                </span>
              ))}
            </div>
          </section>
        )}

        {item.cta && (
          <section>
            <div className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              <Megaphone className="h-4 w-4 text-brand-500" />
              Call To Action
            </div>
            <p className="text-sm text-gray-700 dark:text-gray-300">{item.cta}</p>
          </section>
        )}

        {item.bestPostingTime && (
          <section className="flex items-center gap-3 p-4 rounded-xl bg-indigo-50 dark:bg-indigo-900/20">
            <Clock className="h-5 w-5 text-indigo-500" />
            <div>
              <p className="text-xs text-indigo-600 dark:text-indigo-400">Best time to post</p>
              <p className="text-sm font-semibold text-gray-900 dark:text-white">{item.bestPostingTime}</p>
            </div>
          </section>
        )}
      </Card>

      <div className="flex flex-wrap gap-3">
        <Button variant="secondary" onClick={copyAll}>
          {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
          Copy All
        </Button>
        <Button variant="secondary" onClick={handleSaveDraft}>
          <Save className="h-4 w-4" />
          Save As Draft
        </Button>
        <Button onClick={handleCreatePost}>
          <FilePlus className="h-4 w-4" />
          Create Post
        </Button>
        <Link to="/dashboard/ai-generator">
          <Button variant="outline">Generate New</Button>
        </Link>
      </div>
    </div>
  )
}
