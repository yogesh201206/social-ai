import { Link, useLocation, useNavigate } from 'react-router-dom'
import * as Icons from 'lucide-react'
import { LogOut, X } from 'lucide-react'

export default function MobileSidebar({ links, isOpen, onClose }) {
  const location = useLocation()
  const navigate = useNavigate()

  const handleLogout = () => {
    onClose()
    navigate('/login')
  }

  const isActive = (path) => {
    if (path === '/dashboard') return location.pathname === '/dashboard'
    return location.pathname.startsWith(path)
  }

  if (!isOpen) return null

  return (
    <>
      <div
        className="fixed inset-0 bg-black/50 z-40 lg:hidden animate-fade-in"
        onClick={onClose}
      />

      <aside className="fixed top-0 left-0 z-50 h-full w-72 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-700 transform transition-transform duration-300 ease-in-out lg:hidden translate-x-0">
        <div className="flex flex-col h-full">
          <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
            <Link to="/" className="flex items-center gap-2" onClick={onClose}>
              <div className="p-2 rounded-xl gradient-bg">
                <Icons.Sparkles className="h-5 w-5 text-white" />
              </div>
              <span className="text-lg font-bold text-gray-900 dark:text-white">
                SocialFlow <span className="gradient-text">AI</span>
              </span>
            </Link>
            <button
              onClick={onClose}
              className="p-1 rounded-lg text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
            {links.map((link) => {
              const Icon = Icons[link.icon] || Icons.Circle
              const active = isActive(link.path)

              return (
                <Link
                  key={link.path}
                  to={link.path}
                  onClick={onClose}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${
                    active
                      ? 'gradient-bg text-white shadow-lg shadow-brand-500/25'
                      : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white'
                  }`}
                >
                  <Icon className="h-5 w-5" />
                  {link.label}
                </Link>
              )
            })}
          </nav>

          <div className="p-4 border-t border-gray-200 dark:border-gray-700">
            <button
              onClick={handleLogout}
              className="flex items-center gap-3 w-full px-4 py-3 rounded-xl text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
            >
              <LogOut className="h-5 w-5" />
              Logout
            </button>
          </div>
        </div>
      </aside>
    </>
  )
}
