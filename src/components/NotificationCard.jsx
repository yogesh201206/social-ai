import * as Icons from 'lucide-react'

export default function NotificationCard({ title, message, time, read, icon, onMarkRead }) {
  const Icon = Icons[icon] || Icons.Bell

  return (
    <div
      className={`p-4 border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors ${
        !read ? 'bg-brand-50/50 dark:bg-brand-900/10' : ''
      }`}
    >
      <div className="flex items-start gap-3">
        <div className={`p-2 rounded-lg flex-shrink-0 ${
          !read ? 'bg-brand-100 dark:bg-brand-900/30' : 'bg-gray-100 dark:bg-gray-700'
        }`}>
          <Icon className={`h-4 w-4 ${!read ? 'text-brand-600 dark:text-brand-400' : 'text-gray-500'}`} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <p className="text-sm font-medium text-gray-900 dark:text-white">{title}</p>
            {!read && (
              <span className="h-2 w-2 rounded-full bg-brand-600 flex-shrink-0 mt-1.5" />
            )}
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{message}</p>
          <div className="flex items-center justify-between mt-2">
            <p className="text-xs text-gray-400">{time}</p>
            {!read && onMarkRead && (
              <button
                onClick={onMarkRead}
                className="text-xs text-brand-600 dark:text-brand-400 hover:text-brand-700 font-medium"
              >
                Mark as read
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
