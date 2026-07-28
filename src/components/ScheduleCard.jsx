import { Link } from 'react-router-dom'
import { Calendar, Clock, Pencil, XCircle } from 'lucide-react'
import * as Icons from 'lucide-react'
import StatusBadge from './StatusBadge'
import { platformIcons, platformColors } from '../data/postsData'

export default function ScheduleCard({ post, onCancel }) {
  const PlatformIcon = Icons[platformIcons[post.platform]] || Icons.Globe
  const gradient = platformColors[post.platform] || 'from-gray-500 to-gray-600'

  return (
    <article className="glass rounded-2xl overflow-hidden hover:shadow-lg hover:shadow-brand-500/10 transition-all duration-300 hover:-translate-y-0.5">
      <div className="flex flex-col sm:flex-row">
        <div className="relative sm:w-48 flex-shrink-0">
          <img
            src={post.image}
            alt={post.title}
            className="w-full h-32 sm:h-full object-cover"
          />
          <div className={`absolute top-3 left-3 h-8 w-8 rounded-lg bg-gradient-to-br ${gradient} flex items-center justify-center shadow-lg`}>
            <PlatformIcon className="h-4 w-4 text-white" />
          </div>
        </div>

        <div className="flex-1 p-5">
          <div className="flex items-start justify-between gap-2">
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-white">{post.title}</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">{post.restaurantName}</p>
            </div>
            <StatusBadge status={post.status} />
          </div>

          <p className="text-sm text-gray-500 dark:text-gray-400 mt-2 line-clamp-2">{post.caption}</p>

          <div className="flex flex-wrap items-center gap-4 mt-4">
            <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
              <Calendar className="h-4 w-4 text-brand-500" />
              <span className="font-medium">{post.scheduledDate}</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
              <Clock className="h-4 w-4 text-brand-500" />
              <span className="font-medium">{post.scheduledTime}</span>
            </div>
            <span className="text-xs px-2 py-1 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400">
              {post.platform}
            </span>
          </div>

          <div className="flex gap-2 mt-4">
            <Link
              to={`/dashboard/posts/${post.id}/edit`}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-medium bg-brand-50 dark:bg-brand-900/20 text-brand-600 dark:text-brand-400 hover:bg-brand-100 dark:hover:bg-brand-900/40 transition-colors"
            >
              <Pencil className="h-3.5 w-3.5" />
              Edit Schedule
            </Link>
            <button
              onClick={() => onCancel?.(post.id)}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-medium bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/40 transition-colors"
            >
              <XCircle className="h-3.5 w-3.5" />
              Cancel Schedule
            </button>
          </div>
        </div>
      </div>
    </article>
  )
}
