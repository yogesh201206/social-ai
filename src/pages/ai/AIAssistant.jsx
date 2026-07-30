import { Link } from 'react-router-dom'
import { Sparkles, History } from 'lucide-react'
import AIChat from '../../components/AIChat'
import SuggestionCard from '../../components/SuggestionCard'
import { trendingSuggestions } from '../../data/suggestions'
import { useNavigate } from 'react-router-dom'

export default function AIAssistant() {
  const navigate = useNavigate()

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">AI Assistant</h2>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            Chat with your AI marketing assistant for instant content ideas.
          </p>
        </div>
        <div className="flex gap-2">
          <Link
            to="/dashboard/content-generator"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
          >
            <Sparkles className="h-4 w-4" />
            Content Generator
          </Link>
          <Link
            to="/dashboard/ai-history"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
          >
            <History className="h-4 w-4" />
            History
          </Link>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <AIChat restaurantName="Spice Garden" />
        </div>

        <div className="space-y-4">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
            Trending Food Post Ideas
          </h3>
          {trendingSuggestions.slice(0, 4).map((s) => (
            <SuggestionCard
              key={s.id}
              {...s}
              onClick={() => navigate('/dashboard/content-generator')}
            />
          ))}
        </div>
      </div>
    </div>
  )
}
