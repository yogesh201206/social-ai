import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { History, Bot } from 'lucide-react'
import { useAI } from '../../context/AIContext'
import { usePosts } from '../../context/PostContext'
import { useRestaurants } from '../../context/RestaurantContext'
import AIInputForm from '../../components/AIInputForm'
import AIResultCard from '../../components/AIResultCard'
import SuggestionCard from '../../components/SuggestionCard'
import LoadingAI from '../../components/LoadingAI'
import { trendingSuggestions } from '../../data/suggestions'
import { userProfile } from '../../data/dashboardData'

const defaultInput = {
  restaurantName: 'Spice Garden',
  category: 'South Indian Restaurant',
  audience: 'Food Lovers',
  location: 'Madurai',
  contentType: 'caption',
}

export default function AIContentGenerator() {
  const navigate = useNavigate()
  const { generate, addToHistory } = useAI()
  const { addPost } = usePosts()
  const { restaurants } = useRestaurants()

  const [input, setInput] = useState(defaultInput)
  const [image, setImage] = useState(null)
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)
  const [lastGenType, setLastGenType] = useState('full')

  const runGenerate = async (genType = 'full') => {
    setLoading(true)
    setLastGenType(genType)
    await new Promise((r) => setTimeout(r, 1500 + Math.random() * 500))

    let generated = generate(input, genType)

    if (image?.preview) {
      generated = {
        ...generated,
        caption: `${generated.caption}\n\n📸 Inspired by your uploaded image — visually appetizing content that drives engagement!`,
      }
    }

    setResult(generated)
    setLoading(false)
  }

  const buildPostPayload = () => {
    const restaurant = restaurants.find(
      (r) => r.name.toLowerCase() === input.restaurantName.toLowerCase()
    ) || restaurants[0]

    return {
      title: `${input.restaurantName} — ${result?.contentType || 'AI Post'}`,
      caption: result?.caption || '',
      image: image?.preview || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=600&h=400&fit=crop',
      platform: 'Instagram',
      status: 'Draft',
      hashtags: result?.hashtags || [],
      cta: result?.cta || '',
      restaurantId: restaurant?.id || '1',
      restaurantName: restaurant?.name || input.restaurantName,
      restaurantLogo: restaurant?.logo || 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=100&h=100&fit=crop',
      scheduledDate: null,
      scheduledTime: null,
      publishedAt: null,
      metrics: null,
    }
  }

  const handleSaveDraft = () => {
    if (!result) return
    const postData = buildPostPayload()
    addPost(postData)
    addToHistory({ ...result, ...input })
    navigate('/dashboard/posts/drafts')
  }

  const handleCreatePost = () => {
    if (!result) return
    addToHistory({ ...result, ...input })
    navigate('/dashboard/posts/create', {
      state: {
        fromAI: true,
        title: `${input.restaurantName} — ${result.contentType}`,
        caption: result.caption,
        hashtags: result.hashtags?.join(' ') || '',
        cta: result.cta || '',
        imagePreview: image?.preview || null,
        restaurantName: input.restaurantName,
      },
    })
  }

  const handleSuggestion = (suggestion) => {
    setInput((prev) => ({
      ...prev,
      contentType: suggestion.contentType,
    }))
    runGenerate('full')
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">AI Content Generator</h2>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            Generate captions, hashtags, and marketing content powered by AI.
          </p>
        </div>
        <div className="flex gap-2">
          <Link
            to="/dashboard/ai-history"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
          >
            <History className="h-4 w-4" />
            AI History
          </Link>
          <Link
            to="/dashboard/ai-assistant"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium gradient-bg text-white shadow-md shadow-brand-500/25"
          >
            <Bot className="h-4 w-4" />
            AI Assistant
          </Link>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <AIInputForm
          values={input}
          onChange={setInput}
          image={image}
          onImageChange={setImage}
          onGenerate={runGenerate}
          loading={loading}
        />

        {loading ? (
          <div className="glass rounded-2xl">
            <LoadingAI />
          </div>
        ) : (
          <AIResultCard
            result={result}
            onRegenerate={() => runGenerate(lastGenType)}
            onSaveDraft={handleSaveDraft}
            onCreatePost={handleCreatePost}
            loading={loading}
          />
        )}
      </div>

      <div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Trending Food Post Ideas
        </h3>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {trendingSuggestions.map((s) => (
            <SuggestionCard
              key={s.id}
              {...s}
              onClick={() => handleSuggestion(s)}
            />
          ))}
        </div>
      </div>
    </div>
  )
}
