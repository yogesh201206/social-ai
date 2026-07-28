import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Menu, X, Sparkles, Moon, Sun } from 'lucide-react'
import Button from './Button'
import { useTheme } from '../context/ThemeContext'

const navLinks = [
  { label: 'Home', href: '#hero' },
  { label: 'Features', href: '#features' },
  { label: 'Pricing', href: '#pricing' },
]

export default function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false)
  const { darkMode, toggleDarkMode } = useTheme()

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 glass">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 lg:h-18">
          <Link to="/" className="flex items-center gap-2 group">
            <div className="p-2 rounded-xl gradient-bg group-hover:scale-110 transition-transform duration-200">
              <Sparkles className="h-5 w-5 text-white" />
            </div>
            <span className="text-xl font-bold text-gray-900 dark:text-white">
              SocialFlow <span className="gradient-text">AI</span>
            </span>
          </Link>

          <div className="hidden md:flex items-center gap-8">
            {navLinks.map((link) => (
              <a
                key={link.label}
                href={link.href}
                className="text-sm font-medium text-gray-600 dark:text-gray-300 hover:text-brand-600 dark:hover:text-brand-400 transition-colors duration-200"
              >
                {link.label}
              </a>
            ))}
          </div>

          <div className="hidden md:flex items-center gap-3">
            <button
              onClick={toggleDarkMode}
              className="p-2 rounded-lg text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors duration-200"
              aria-label="Toggle dark mode"
            >
              {darkMode ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
            </button>
            <Link to="/login">
              <Button variant="ghost" size="sm">Login</Button>
            </Link>
            <Link to="/register">
              <Button size="sm">Get Started</Button>
            </Link>
          </div>

          <div className="flex md:hidden items-center gap-2">
            <button
              onClick={toggleDarkMode}
              className="p-2 rounded-lg text-gray-600 dark:text-gray-300"
              aria-label="Toggle dark mode"
            >
              {darkMode ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
            </button>
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="p-2 rounded-lg text-gray-600 dark:text-gray-300"
              aria-label="Toggle menu"
            >
              {mobileOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>
      </div>

      {mobileOpen && (
        <div className="md:hidden border-t border-gray-200 dark:border-gray-700 bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl animate-fade-in">
          <div className="px-4 py-4 space-y-3">
            {navLinks.map((link) => (
              <a
                key={link.label}
                href={link.href}
                onClick={() => setMobileOpen(false)}
                className="block px-3 py-2 rounded-lg text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 font-medium"
              >
                {link.label}
              </a>
            ))}
            <div className="pt-3 border-t border-gray-200 dark:border-gray-700 flex flex-col gap-2">
              <Link to="/login" onClick={() => setMobileOpen(false)}>
                <Button variant="secondary" className="w-full">Login</Button>
              </Link>
              <Link to="/register" onClick={() => setMobileOpen(false)}>
                <Button className="w-full">Get Started</Button>
              </Link>
            </div>
          </div>
        </div>
      )}
    </nav>
  )
}
