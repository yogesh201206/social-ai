import * as Icons from 'lucide-react'
import { TrendingUp, TrendingDown } from 'lucide-react'

export default function AnalyticsStatCard({ label, value, growth, positive = true, previous, icon, color = 'brand' }) {
  const IconComponent = Icons[icon] || TrendingUp

  const colorStyles = {
    brand: 'bg-brand-50 text-brand-600 dark:bg-brand-900/30 dark:text-brand-400 border-brand-100 dark:border-brand-800/40',
    purple: 'bg-purple-50 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400 border-purple-100 dark:border-purple-800/40',
    indigo: 'bg-indigo-50 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400 border-indigo-100 dark:border-indigo-800/40',
    pink: 'bg-pink-50 text-pink-600 dark:bg-pink-900/30 dark:text-pink-400 border-pink-100 dark:border-pink-800/40',
    blue: 'bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400 border-blue-100 dark:border-blue-800/40',
    emerald: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400 border-emerald-100 dark:border-emerald-800/40',
  }

  const selectedStyle = colorStyles[color] || colorStyles.brand

  return (
    <div className="glass rounded-2xl p-5 hover:shadow-lg hover:shadow-brand-500/5 transition-all duration-300 border border-gray-100 dark:border-gray-800 flex flex-col justify-between group">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-gray-500 dark:text-gray-400">{label}</span>
        <div className={`h-11 w-11 rounded-xl flex items-center justify-center border ${selectedStyle} group-hover:scale-110 transition-transform`}>
          <IconComponent className="h-5 w-5" />
        </div>
      </div>

      <div className="mt-3">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <p className="text-xl sm:text-2xl lg:text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight">
            {value}
          </p>
          <span
            className={`inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full ${
              positive
                ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400'
                : 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400'
            }`}
          >
            {positive ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
            {growth}
          </span>
        </div>

        {previous && (
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1.5 flex items-center gap-1">
            <span>vs</span>
            <span className="font-medium">{previous}</span>
          </p>
        )}
      </div>
    </div>
  )
}
