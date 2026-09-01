const variants = {
  primary:
    'gradient-bg text-white shadow-lg shadow-brand-500/25 hover:shadow-brand-500/40 hover:scale-[1.02] active:scale-[0.98]',
  secondary:
    'bg-white dark:bg-gray-800 text-gray-900 dark:text-white border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 hover:scale-[1.02] active:scale-[0.98]',
  outline:
    'border-2 border-brand-600 text-brand-600 dark:text-brand-400 dark:border-brand-400 hover:bg-brand-50 dark:hover:bg-brand-900/20 hover:scale-[1.02] active:scale-[0.98]',
  ghost:
    'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 hover:scale-[1.02] active:scale-[0.98]',
  danger:
    'bg-red-600 text-white hover:bg-red-700 hover:scale-[1.02] active:scale-[0.98]',
  success:
    'bg-green-600 text-white shadow-lg shadow-green-500/25 hover:bg-green-700 hover:shadow-green-500/40 hover:scale-[1.02] active:scale-[0.98]',
}

const sizes = {
  sm: 'px-3 py-1.5 text-sm',
  md: 'px-5 py-2.5 text-sm',
  lg: 'px-6 py-3 text-base',
  xl: 'px-8 py-3.5 text-base',
}

export default function Button({
  children,
  variant = 'primary',
  size = 'md',
  className = '',
  loading = false,
  disabled = false,
  ...props
}) {
  return (
    <button
      className={`inline-flex items-center justify-center gap-2 font-semibold rounded-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 ${variants[variant]} ${sizes[size]} ${className}`}
      disabled={disabled || loading}
      {...props}
    >
      {loading && (
        <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
          />
        </svg>
      )}
      {children}
    </button>
  )
}
