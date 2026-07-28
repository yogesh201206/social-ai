import * as Icons from 'lucide-react'

const colorMap = {
  brand: 'bg-brand-50 dark:bg-brand-900/30 text-brand-600 dark:text-brand-400',
  purple: 'bg-purple-50 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400',
  indigo: 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400',
  accent: 'bg-fuchsia-50 dark:bg-fuchsia-900/30 text-fuchsia-600 dark:text-fuchsia-400',
}

export default function StatCard({ label, value, growth, icon, color = 'brand' }) {
  const Icon = Icons[icon] || Icons.Activity
  const isPositive = growth?.startsWith('+')

  return (
    <div className="glass rounded-2xl p-6 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-300">
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">{label}</p>
          <p className="mt-2 text-3xl font-bold text-gray-900 dark:text-white">{value}</p>
          {growth && (
            <p className={`mt-1 text-xs font-semibold flex items-center gap-1 ${
              isPositive ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
            }`}>
              <Icons.TrendingUp className={`h-3 w-3 ${!isPositive ? 'rotate-180' : ''}`} />
              {growth}
            </p>
          )}
        </div>
        <div className={`p-3 rounded-xl flex-shrink-0 ${colorMap[color]}`}>
          <Icon className="h-6 w-6" />
        </div>
      </div>
    </div>
  )
}
