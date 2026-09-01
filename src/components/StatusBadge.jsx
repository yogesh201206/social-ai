const statusStyles = {
  Draft: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
  Scheduled: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  Published: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  Cancelled: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400',
  Processing: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  Failed: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
}

export default function StatusBadge({ status, className = '' }) {
  const isProcessing = status === 'Processing'
  return (
    <span
      className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${statusStyles[status] || 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400'} ${className}`}
    >
      {isProcessing && (
        <span className="h-1.5 w-1.5 rounded-full bg-amber-500 animate-pulse flex-shrink-0" />
      )}
      {status}
    </span>
  )
}
