import { Link, useLocation, useNavigate } from 'react-router-dom'
import * as Icons from 'lucide-react'
import { LogOut, ChevronLeft, ChevronRight } from 'lucide-react'

export default function Sidebar({ links, isCollapsed, onToggleCollapse }) {
  const location = useLocation()
  const navigate = useNavigate()

  const handleLogout = () => {
    navigate('/login')
  }

  const isActive = (path) => {
    if (path === '/dashboard') return location.pathname === '/dashboard'
    return location.pathname.startsWith(path)
  }

  return (
    <aside
      className={`hidden lg:flex flex-col h-full bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-700 transition-all duration-300 ease-in-out ${
        isCollapsed ? 'w-20' : 'w-72'
      }`}
    >
      <div className={`flex items-center border-b border-gray-200 dark:border-gray-700 ${
        isCollapsed ? 'justify-center p-4' : 'justify-between p-6'
      }`}>
        <Link to="/" className={`flex items-center gap-2 ${isCollapsed ? 'justify-center' : ''}`}>
          <div className="p-2 rounded-xl gradient-bg flex-shrink-0">
            <Icons.Sparkles className="h-5 w-5 text-white" />
          </div>
          {!isCollapsed && (
            <span className="text-lg font-bold text-gray-900 dark:text-white">
              SocialFlow <span className="gradient-text">AI</span>
            </span>
          )}
        </Link>
      </div>

      <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
        {links.map((link) => {
          const Icon = Icons[link.icon] || Icons.Circle
          const active = isActive(link.path)

          return (
            <Link
              key={link.path}
              to={link.path}
              title={isCollapsed ? link.label : undefined}
              className={`flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${
                isCollapsed ? 'justify-center' : ''
              } ${
                active
                  ? 'gradient-bg text-white shadow-lg shadow-brand-500/25'
                  : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              <Icon className="h-5 w-5 flex-shrink-0" />
              {!isCollapsed && <span>{link.label}</span>}
            </Link>
          )
        })}
      </nav>

      <div className="p-3 border-t border-gray-200 dark:border-gray-700 space-y-1">
        <button
          onClick={onToggleCollapse}
          className={`flex items-center gap-3 w-full px-3 py-3 rounded-xl text-sm font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors ${
            isCollapsed ? 'justify-center' : ''
          }`}
        >
          {isCollapsed ? (
            <ChevronRight className="h-5 w-5" />
          ) : (
            <>
              <ChevronLeft className="h-5 w-5" />
              <span>Collapse</span>
            </>
          )}
        </button>
        <button
          onClick={handleLogout}
          title={isCollapsed ? 'Logout' : undefined}
          className={`flex items-center gap-3 w-full px-3 py-3 rounded-xl text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors ${
            isCollapsed ? 'justify-center' : ''
          }`}
        >
          <LogOut className="h-5 w-5 flex-shrink-0" />
          {!isCollapsed && <span>Logout</span>}
        </button>
      </div>
    </aside>
  )
}
