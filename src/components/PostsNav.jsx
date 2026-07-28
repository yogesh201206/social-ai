import { NavLink } from 'react-router-dom'
import { FileText, FileEdit, Calendar, CheckCircle } from 'lucide-react'

const tabs = [
  { label: 'All Posts', path: '/dashboard/posts', icon: FileText, end: true },
  { label: 'Drafts', path: '/dashboard/posts/drafts', icon: FileEdit },
  { label: 'Scheduled', path: '/dashboard/posts/scheduled', icon: Calendar },
  { label: 'Published', path: '/dashboard/posts/published', icon: CheckCircle },
]

export default function PostsNav() {
  return (
    <nav className="flex gap-1 p-1 rounded-xl bg-gray-100 dark:bg-gray-800/80 overflow-x-auto">
      {tabs.map(({ label, path, icon: Icon, end }) => (
        <NavLink
          key={path}
          to={path}
          end={end}
          className={({ isActive }) =>
            `flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all ${
              isActive
                ? 'gradient-bg text-white shadow-md shadow-brand-500/25'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-white/50 dark:hover:bg-gray-700/50'
            }`
          }
        >
          <Icon className="h-4 w-4" />
          {label}
        </NavLink>
      ))}
    </nav>
  )
}
