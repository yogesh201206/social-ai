import { Link } from 'react-router-dom'
import { Copy, Trash2, Eye, Check, Sparkles } from 'lucide-react'
import { useState } from 'react'

export default function GenerationHistoryCard({ item, onDelete, onCopy }) {
  const [copied, setCopied] = useState(false)

  const previewText = item.caption || item.hashtags?.join(' ') || 'No content'
  const truncated = previewText.length > 120 ? `${previewText.slice(0, 120)}...` : previewText

  const handleCopy = async () => {
    const text = [item.caption, item.hashtags?.join(' '), item.cta].filter(Boolean).join('\n\n')
    await navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
    onCopy?.(item)
  }

  return (
    <article className="glass rounded-2xl p-5 hover:shadow-lg hover:shadow-brand-500/10 transition-all duration-300 group">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className="h-10 w-10 rounded-xl gradient-bg flex items-center justify-center flex-shrink-0">
            <Sparkles className="h-5 w-5 text-white" />
          </div>
          <div className="min-w-0">
            <h3 className="font-semibold text-gray-900 dark:text-white truncate">{item.restaurantName}</h3>
            <p className="text-xs text-gray-500 dark:text-gray-400">{item.contentType}</p>
          </div>
        </div>
        <span className="text-[10px] text-gray-400 whitespace-nowrap flex-shrink-0">{item.generatedAt}</span>
      </div>

      <p className="text-sm text-gray-600 dark:text-gray-400 mt-3 line-clamp-3">{truncated}</p>

      {item.hashtags?.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mt-3">
          {item.hashtags.slice(0, 4).map((tag) => (
            <span key={tag} className="text-[10px] px-2 py-0.5 rounded-md bg-brand-100 dark:bg-brand-900/30 text-brand-600 dark:text-brand-400">
              {tag}
            </span>
          ))}
          {item.hashtags.length > 4 && (
            <span className="text-[10px] text-gray-400">+{item.hashtags.length - 4} more</span>
          )}
        </div>
      )}

      <div className="flex gap-2 mt-4 pt-4 border-t border-gray-200/50 dark:border-gray-700/50">
        <Link
          to={`/dashboard/ai-history/${item.id}`}
          className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-brand-50 dark:hover:bg-brand-900/20 hover:text-brand-600 transition-colors"
        >
          <Eye className="h-3.5 w-3.5" />
          View
        </Link>
        <button
          type="button"
          onClick={handleCopy}
          className="inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-brand-50 dark:hover:bg-brand-900/20 transition-colors"
        >
          {copied ? <Check className="h-3.5 w-3.5 text-green-500" /> : <Copy className="h-3.5 w-3.5" />}
          Copy
        </button>
        <button
          type="button"
          onClick={() => onDelete?.(item.id)}
          className="inline-flex items-center justify-center px-3 py-2 rounded-xl text-xs font-medium bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/40 transition-colors"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      </div>
    </article>
  )
}
