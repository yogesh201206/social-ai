import * as Icons from 'lucide-react'
import Button from './Button'

export default function EmptyState({
  icon = 'Inbox',
  title = 'No data found',
  description = 'There is nothing to display here yet.',
  actionLabel,
  onAction,
}) {
  const Icon = Icons[icon] || Icons.Inbox

  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 animate-fade-in">
      <div className="h-16 w-16 rounded-2xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center mb-4">
        <Icon className="h-8 w-8 text-gray-400" />
      </div>
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{title}</h3>
      <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 text-center max-w-sm">{description}</p>
      {actionLabel && onAction && (
        <Button onClick={onAction} className="mt-6">
          {actionLabel}
        </Button>
      )}
    </div>
  )
}
