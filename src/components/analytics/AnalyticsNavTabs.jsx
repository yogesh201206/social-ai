import { NavLink } from 'react-router-dom'
import { LayoutDashboard, Layers, FileText } from 'lucide-react'

export default function AnalyticsNavTabs() {
  const tabs = [
    { label: 'Overview', path: '/dashboard/analytics', icon: LayoutDashboard, end: true },
    { label: 'Platform Analytics', path: '/dashboard/analytics/platforms', icon: Layers },
    { label: 'Post Analytics', path: '/dashboard/analytics/posts', icon: FileText },
  ]

  return (
    <div className="flex border-b border-gray-200 dark:border-gray-800 space-x-1 sm:space-x-4 overflow-x-auto no-scrollbar">
      {tabs.map((tab) => {
        const Icon = tab.icon
        return (
          <NavLink
            key={tab.path}
            to={tab.path}
            end={tab.end}
            className={({ isActive }) =>
              `flex items-center gap-2 px-4 py-3 text-sm font-semibold border-b-2 transition-all duration-200 whitespace-nowrap ${
                isActive
                  ? 'border-brand-500 text-brand-600 dark:text-brand-400'
                  : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:border-gray-300 dark:hover:border-gray-700'
              }`
            }
          >
            <Icon className="h-4 w-4" />
            <span>{tab.label}</span>
          </NavLink>
        )
      })}
    </div>
  )
}
