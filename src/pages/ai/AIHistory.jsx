import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ArrowLeft, Sparkles } from 'lucide-react'
import { useAI } from '../../context/AIContext'
import GenerationHistoryCard from '../../components/GenerationHistoryCard'
import SearchBar from '../../components/SearchBar'
import EmptyState from '../../components/EmptyState'
import Skeleton from '../../components/Skeleton'

export default function AIHistory() {
  const navigate = useNavigate()
  const { history, deleteFromHistory } = useAI()
  const [search, setSearch] = useState('')
  const [loading] = useState(false)

  const filtered = history.filter(
    (item) =>
      item.restaurantName.toLowerCase().includes(search.toLowerCase()) ||
      item.contentType.toLowerCase().includes(search.toLowerCase()) ||
      item.caption?.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={() => navigate('/dashboard/content-generator')}
            className="p-2 rounded-xl bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">AI History</h2>
            <p className="text-gray-500 dark:text-gray-400 mt-1">
              Browse and manage your previous AI generations.
            </p>
          </div>
        </div>
        <Link
          to="/dashboard/content-generator"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium gradient-bg text-white shadow-md shadow-brand-500/25"
        >
          <Sparkles className="h-4 w-4" />
          New Generation
        </Link>
      </div>

      <SearchBar placeholder="Search history..." className="max-w-md" onSearch={setSearch} />

      {loading ? (
        <div className="grid sm:grid-cols-2 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-40 rounded-2xl" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState
          icon="Sparkles"
          title={search ? 'No results found' : 'No AI history yet'}
          description={
            search
              ? 'Try a different search term.'
              : 'Generate content with AI and it will appear here.'
          }
          actionLabel={!search ? 'Open AI Generator' : undefined}
          onAction={!search ? () => navigate('/dashboard/content-generator') : undefined}
        />
      ) : (
        <div className="grid sm:grid-cols-2 gap-4">
          {filtered.map((item) => (
            <GenerationHistoryCard
              key={item.id}
              item={item}
              onDelete={deleteFromHistory}
            />
          ))}
        </div>
      )}
    </div>
  )
}
