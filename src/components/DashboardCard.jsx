import * as Icons from 'lucide-react'

const colorMap = {
  brand: 'bg-brand-50 dark:bg-brand-900/30 text-brand-600 dark:text-brand-400',
  purple: 'bg-purple-50 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400',
  indigo: 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400',
  accent: 'bg-fuchsia-50 dark:bg-fuchsia-900/30 text-fuchsia-600 dark:text-fuchsia-400',
}

export default function DashboardCard({ label, value, change, icon, color = 'brand' }) {
  const Icon = Icons[icon] || Icons.Activity

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-6 shadow-sm hover:shadow-md transition-shadow duration-300">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{label}</p>
          <p className="mt-2 text-3xl font-bold text-gray-900 dark:text-white">{value}</p>
          <p className="mt-1 text-xs text-gray-400 dark:text-gray-500">{change}</p>
        </div>
        <div className={`p-3 rounded-xl ${colorMap[color]}`}>
          <Icon className="h-6 w-6" />
        </div>
      </div>
    </div>
  )
}
