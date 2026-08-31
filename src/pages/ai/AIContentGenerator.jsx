import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { History, Bot, AlertCircle, Loader2 } from 'lucide-react'
import { useAI } from '../../context/AIContext'
import { usePosts } from '../../context/PostContext'
import { useRestaurants } from '../../context/RestaurantContext'
import AIInputForm from '../../components/AIInputForm'
import AIResultCard from '../../components/AIResultCard'
import SuggestionCard from '../../components/SuggestionCard'
import { trendingSuggestions } from '../../data/suggestions'

const defaultInput = {
  restaurantName: '',
  category: '',
  audience: '',
  location: '',
  contentType: 'caption',
  platform: '',
}

export default function AIContentGenerator() {
  const navigate = useNavigate()
  const { generate } = useAI()
  const { addPost } = usePosts()
  const { restaurants } = useRestaurants()

  const [input, setInput] = useState(defaultInput)
  const [image, setImage] = useState(null)
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const getSelectedRestaurant = () => {
    if (!input.restaurantName) return restaurants[0] || null
    return restaurants.find(r =>
      r.name.toLowerCase() === input.restaurantName.toLowerCase()
    ) || restaurants[0] || null
  }

  const runGenerate = async () => {
    const restaurant = getSelectedRestaurant()

    if (!input.restaurantName && !restaurant) {
      setError('Please enter a restaurant name or select a restaurant.')
      return
    }

    setLoading(true)
    setError(null)
    setResult(null)

    try {
      // Build the prompt from form fields — backend enriches with restaurant context
      const promptParts = []
      if (input.contentType) {
        const typeMap = {
          caption: 'Create a social media caption',
          hashtags: 'Generate relevant hashtags',
          cta: 'Write a compelling call-to-action',
          marketing_idea: 'Generate a creative marketing idea',
          email_content: 'Write email marketing content',
        }
        promptParts.push(typeMap[input.contentType.toLowerCase()] || `Generate ${input.contentType}`)
      }
      if (input.restaurantName) promptParts.push(`for ${input.restaurantName}`)
      if (input.category) promptParts.push(`(${input.category})`)
      if (input.audience) promptParts.push(`targeting ${input.audience}`)
      if (input.location) promptParts.push(`in ${input.location}`)
      if (input.platform) promptParts.push(`for ${input.platform}`)

      const prompt = promptParts.join(' ')

      const response = await generate({
        prompt,
        restaurantId: restaurant?.id ? Number(restaurant.id) : null,
        restaurantName: input.restaurantName || restaurant?.name,
        category: input.category,
        audience: input.audience,
        location: input.location,
        contentType: mapContentType(input.contentType),
        platform: mapPlatform(input.platform),
      })

      // Convert backend response to result format expected by AIResultCard
      setResult({
        generatedContent: response.generatedContent,
        caption: response.generatedContent,
        contentType: input.contentType,
        platform: input.platform,
        historyId: response.historyId,
        model: response.model,
      })
    } catch (err) {
      const msg = err.message || 'AI generation failed. Please try again.'
      setError(msg)
    } finally {
      setLoading(false)
    }
  }

  const mapContentType = (type) => {
    if (!type) return null
    const map = {
      caption: 'Caption',
      hashtags: 'Hashtags',
      cta: 'CTA',
      marketing_idea: 'Marketing_Idea',
      email_content: 'Email_Content',
    }
    return map[type.toLowerCase()] || 'Caption'
  }

  const mapPlatform = (platform) => {
    if (!platform) return null
    const map = {
      instagram: 'INSTAGRAM',
      facebook: 'FACEBOOK',
      twitter: 'TWITTER',
      x: 'TWITTER',
      tiktok: 'TIKTOK',
      youtube: 'YOUTUBE',
    }
    return map[platform.toLowerCase()] || null
  }

  const buildPostPayload = () => {
    const restaurant = getSelectedRestaurant()
    return {
      title: `${input.restaurantName || restaurant?.name || 'Restaurant'} — ${input.contentType || 'AI Post'}`,
      caption: result?.generatedContent || result?.caption || '',
      image: image?.preview || null,
      platform: mapPlatform(input.platform) || 'INSTAGRAM',
      status: 'DRAFT',
      restaurantId: restaurant?.id || null,
      restaurantName: restaurant?.name || input.restaurantName,
    }
  }

  const handleSaveDraft = () => {
    if (!result) return
    addPost(buildPostPayload())
    navigate('/dashboard/posts/drafts')
  }

  const handleCreatePost = () => {
    if (!result) return
    navigate('/dashboard/posts/create', {
      state: {
        fromAI: true,
        title: `${input.restaurantName} — ${input.contentType}`,
        caption: result.generatedContent,
        imagePreview: image?.preview || null,
        restaurantName: input.restaurantName,
        platform: mapPlatform(input.platform),
      },
    })
  }

  const handleSuggestion = (suggestion) => {
    setInput(prev => ({
      ...prev,
      contentType: suggestion.contentType || prev.contentType,
    }))
    // Auto-trigger generation with suggestion
    setTimeout(() => runGenerate(), 100)
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">AI Content Generator</h2>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            Generate captions, hashtags, and marketing content powered by Hugging Face AI.
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

      {error && (
        <div className="px-4 py-3 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-red-700 dark:text-red-400">Generation Failed</p>
            <p className="text-xs text-red-600 dark:text-red-400 mt-0.5">{error}</p>
          </div>
        </div>
      )}

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
          <div className="glass rounded-2xl flex flex-col items-center justify-center min-h-[300px] gap-4">
            <div className="h-14 w-14 rounded-2xl gradient-bg flex items-center justify-center animate-pulse">
              <Loader2 className="h-7 w-7 text-white animate-spin" />
            </div>
            <div className="text-center">
              <p className="font-semibold text-gray-900 dark:text-white">Generating with AI...</p>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Hugging Face is crafting your content</p>
            </div>
          </div>
        ) : (
          <AIResultCard
            result={result}
            onRegenerate={runGenerate}
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
