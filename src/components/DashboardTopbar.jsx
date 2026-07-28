import { useState, useRef, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { Menu, Bell, Moon, Sun, User, Settings, LogOut, CheckCheck, Trash2 } from 'lucide-react'
import { useTheme } from '../context/ThemeContext'
import { useNotifications } from '../context/NotificationContext'
import { userProfile } from '../data/dashboardData'
import SearchBar from './SearchBar'
import NotificationCard from './NotificationCard'

export default function DashboardTopbar({ title, onMenuClick }) {
  const { darkMode, toggleDarkMode } = useTheme()
  const { notifications, unreadCount, markAsRead, markAllAsRead, clearAll } = useNotifications()
  const navigate = useNavigate()
  const [showNotifications, setShowNotifications] = useState(false)
  const [showProfile, setShowProfile] = useState(false)
  const notifRef = useRef(null)
  const profileRef = useRef(null)

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (notifRef.current && !notifRef.current.contains(e.target)) {
        setShowNotifications(false)
      }
      if (profileRef.current && !profileRef.current.contains(e.target)) {
        setShowProfile(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleLogout = () => {
    navigate('/login')
  }

  return (
    <header className="sticky top-0 z-30 bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl border-b border-gray-200 dark:border-gray-700">
      <div className="flex items-center justify-between px-4 sm:px-6 lg:px-8 h-16">
        <div className="flex items-center gap-4 min-w-0">
          <button
            onClick={onMenuClick}
            className="lg:hidden p-2 rounded-lg text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 flex-shrink-0"
          >
            <Menu className="h-5 w-5" />
          </button>
          <h1 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white truncate">{title}</h1>
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          <SearchBar
            placeholder="Search..."
            className="w-28 sm:w-40 lg:w-56"
          />

          <button
            onClick={toggleDarkMode}
            className="p-2 rounded-lg text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            aria-label="Toggle dark mode"
          >
            {darkMode ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
          </button>

          <div className="relative" ref={notifRef}>
            <button
              onClick={() => {
                setShowNotifications(!showNotifications)
                setShowProfile(false)
              }}
              className="relative p-2 rounded-lg text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              aria-label="Notifications"
            >
              <Bell className="h-5 w-5" />
              {unreadCount > 0 && (
                <span className="absolute top-1 right-1 h-4 w-4 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center">
                  {unreadCount}
                </span>
              )}
            </button>

            {showNotifications && (
              <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 z-50 animate-fade-in overflow-hidden">
                <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
                  <h3 className="font-semibold text-gray-900 dark:text-white">
                    Notifications
                    {unreadCount > 0 && (
                      <span className="ml-2 text-xs font-normal text-brand-600 dark:text-brand-400">
                        {unreadCount} new
                      </span>
                    )}
                  </h3>
                  <div className="flex items-center gap-2">
                    {unreadCount > 0 && (
                      <button
                        onClick={markAllAsRead}
                        className="p-1.5 rounded-lg text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700"
                        title="Mark all as read"
                      >
                        <CheckCheck className="h-4 w-4" />
                      </button>
                    )}
                    {notifications.length > 0 && (
                      <button
                        onClick={clearAll}
                        className="p-1.5 rounded-lg text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700"
                        title="Clear all"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                </div>
                <div className="max-h-80 overflow-y-auto">
                  {notifications.length === 0 ? (
                    <div className="p-8 text-center">
                      <Bell className="h-8 w-8 text-gray-300 dark:text-gray-600 mx-auto mb-2" />
                      <p className="text-sm text-gray-500 dark:text-gray-400">No notifications</p>
                    </div>
                  ) : (
                    notifications.map((notif) => (
                      <NotificationCard
                        key={notif.id}
                        {...notif}
                        onMarkRead={() => markAsRead(notif.id)}
                      />
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          <div className="relative" ref={profileRef}>
            <button
              onClick={() => {
                setShowProfile(!showProfile)
                setShowNotifications(false)
              }}
              className="flex items-center gap-2 pl-2 border-l border-gray-200 dark:border-gray-700"
            >
              <div className="h-8 w-8 rounded-full gradient-bg flex items-center justify-center flex-shrink-0">
                <span className="text-xs font-bold text-white">{userProfile.avatar}</span>
              </div>
              <span className="hidden md:block text-sm font-medium text-gray-700 dark:text-gray-300">
                {userProfile.name}
              </span>
            </button>

            {showProfile && (
              <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 z-50 animate-fade-in overflow-hidden">
                <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                  <p className="text-sm font-semibold text-gray-900 dark:text-white">{userProfile.name}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">{userProfile.email}</p>
                </div>
                <div className="p-2">
                  <Link
                    to="/dashboard/profile"
                    onClick={() => setShowProfile(false)}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                  >
                    <User className="h-4 w-4" />
                    My Profile
                  </Link>
                  <Link
                    to="/dashboard/settings"
                    onClick={() => setShowProfile(false)}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                  >
                    <Settings className="h-4 w-4" />
                    Settings
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                  >
                    <LogOut className="h-4 w-4" />
                    Logout
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}
