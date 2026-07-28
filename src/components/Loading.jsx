export default function Loading({ size = 'md', text = 'Loading...' }) {
  const sizes = {
    sm: 'h-6 w-6',
    md: 'h-10 w-10',
    lg: 'h-14 w-14',
  }

  return (
    <div className="flex flex-col items-center justify-center gap-3 py-12">
      <div className={`${sizes[size]} relative`}>
        <div className="absolute inset-0 rounded-full border-4 border-brand-200 dark:border-brand-800" />
        <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-brand-600 animate-spin" />
      </div>
      {text && <p className="text-sm text-gray-500 dark:text-gray-400 animate-pulse">{text}</p>}
    </div>
  )
}
