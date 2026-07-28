export default function Card({ children, className = '', hover = false, ...props }) {
  return (
    <div
      className={`bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm ${
        hover ? 'hover:shadow-lg hover:shadow-brand-500/5 hover:-translate-y-1 transition-all duration-300' : ''
      } ${className}`}
      {...props}
    >
      {children}
    </div>
  )
}
