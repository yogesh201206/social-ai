import { Link } from 'react-router-dom'
import { Eye, Pencil, Trash2, Calendar } from 'lucide-react'
import * as Icons from 'lucide-react'
import StatusBadge from './StatusBadge'
import { platformIcons, platformColors } from '../data/postsData'

export default function PostCard({ post, onDelete }) {
  const PlatformIcon = Icons[platformIcons[post.platform]] || Icons.Globe
  const gradient = platformColors[post.platform] || 'from-gray-500 to-gray-600'

  return (
    <article className="glass rounded-2xl overflow-hidden group hover:shadow-lg hover:shadow-brand-500/10 transition-all duration-300 hover:-translate-y-1">
      <div className="relative aspect-[16/10] overflow-hidden">
        <img
          src={post.image}
          alt={post.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        />
        <div className="absolute top-3 left-3">
          <StatusBadge status={post.status} />
        </div>
        <div className={`absolute top-3 right-3 h-8 w-8 rounded-lg bg-gradient-to-br ${gradient} flex items-center justify-center shadow-lg`}>
          <PlatformIcon className="h-4 w-4 text-white" />
        </div>
      </div>

      <div className="p-5">
        <h3 className="font-semibold text-gray-900 dark:text-white truncate">{post.title}</h3>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 line-clamp-2">{post.caption}</p>

        <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-200/50 dark:border-gray-700/50">
          <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
            <Calendar className="h-3.5 w-3.5" />
            {post.status?.toLowerCase() === 'scheduled' && post.scheduledDate
              ? `${post.scheduledDate}${post.scheduledTime ? ` · ${post.scheduledTime}` : ''}`
              : post.createdAt}
          </div>
          <span className="text-xs font-medium text-gray-600 dark:text-gray-300">{post.platform}</span>
        </div>

        <div className="flex gap-2 mt-4">
          <Link
            to={`/dashboard/posts/${post.id}`}
            className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-brand-50 dark:hover:bg-brand-900/20 hover:text-brand-600 dark:hover:text-brand-400 transition-colors"
          >
            <Eye className="h-3.5 w-3.5" />
            View
          </Link>
          <Link
            to={`/dashboard/posts/${post.id}/edit`}
            className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-brand-50 dark:hover:bg-brand-900/20 hover:text-brand-600 dark:hover:text-brand-400 transition-colors"
          >
            <Pencil className="h-3.5 w-3.5" />
            Edit
          </Link>
          <button
            onClick={() => onDelete?.(post.id)}
            className="inline-flex items-center justify-center px-3 py-2 rounded-xl text-xs font-medium bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/40 transition-colors"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </article>
  )
}
