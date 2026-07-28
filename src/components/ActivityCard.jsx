import * as Icons from 'lucide-react'

const typeColors = {
  schedule: 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400',
  campaign: 'bg-purple-50 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400',
  restaurant: 'bg-brand-50 dark:bg-brand-900/30 text-brand-600 dark:text-brand-400',
  ai: 'bg-fuchsia-50 dark:bg-fuchsia-900/30 text-fuchsia-600 dark:text-fuchsia-400',
  publish: 'bg-green-50 dark:bg-green-900/30 text-green-600 dark:text-green-400',
  branch: 'bg-orange-50 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400',
  analytics: 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400',
}

export default function ActivityCard({ action, description, timestamp, icon, type = 'schedule' }) {
  const Icon = Icons[icon] || Icons.Activity

  return (
    <div className="flex items-center gap-4 p-3 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors group">
      <div className={`p-2.5 rounded-xl flex-shrink-0 transition-transform group-hover:scale-110 ${typeColors[type] || typeColors.schedule}`}>
        <Icon className="h-5 w-5" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-900 dark:text-white">{action}</p>
        <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{description}</p>
      </div>
      <span className="text-xs text-gray-400 whitespace-nowrap flex-shrink-0">{timestamp}</span>
    </div>
  )
}
