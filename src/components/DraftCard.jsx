import { Link } from 'react-router-dom'
import { Pencil, Trash2, Eye, FileText } from 'lucide-react'
import StatusBadge from './StatusBadge'

export default function DraftCard({ post, onDelete }) {
  return (
    <article className="glass rounded-2xl p-5 hover:shadow-lg hover:shadow-brand-500/10 transition-all duration-300 hover:-translate-y-0.5">
      <div className="flex gap-4">
        <img
          src={post.image}
          alt={post.title}
          className="h-20 w-20 rounded-xl object-cover flex-shrink-0"
        />
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <h3 className="font-semibold text-gray-900 dark:text-white truncate">{post.title}</h3>
            <StatusBadge status={post.status} />
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 line-clamp-2">{post.caption}</p>
          <div className="flex items-center gap-3 mt-2 text-xs text-gray-400">
            <span>{post.platform}</span>
            <span>·</span>
            <span>{post.restaurantName}</span>
            <span>·</span>
            <span>{post.createdAt}</span>
          </div>
        </div>
      </div>

      <div className="flex gap-2 mt-4 pt-4 border-t border-gray-200/50 dark:border-gray-700/50">
        <Link
          to={`/dashboard/posts/${post.id}/edit`}
          className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium gradient-bg text-white hover:opacity-90 transition-opacity"
        >
          <Pencil className="h-3.5 w-3.5" />
          Continue Editing
        </Link>
        <Link
          to={`/dashboard/posts/preview`}
          state={{ post }}
          className="inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-brand-50 dark:hover:bg-brand-900/20 transition-colors"
        >
          <Eye className="h-3.5 w-3.5" />
          Preview
        </Link>
        <button
          onClick={() => onDelete?.(post.id)}
          className="inline-flex items-center justify-center px-3 py-2 rounded-xl text-xs font-medium bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/40 transition-colors"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      </div>

      <div className="flex items-center gap-2 mt-3 text-xs text-gray-400">
        <FileText className="h-3.5 w-3.5" />
        Last edited {post.createdAt}
      </div>
    </article>
  )
}
