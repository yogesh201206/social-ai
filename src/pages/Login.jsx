import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Sparkles, Mail, Lock, Eye, EyeOff } from 'lucide-react'
import Button from '../components/Button'
import { useTheme } from '../context/ThemeContext'
import { Moon, Sun } from 'lucide-react'

export default function Login() {
  const navigate = useNavigate()
  const { darkMode, toggleDarkMode } = useTheme()
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({ email: '', password: '', remember: false })

  const handleSubmit = (e) => {
    e.preventDefault()
    setLoading(true)
    setTimeout(() => {
      setLoading(false)
      navigate('/dashboard')
    }, 1000)
  }

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden bg-gray-50 dark:bg-gray-950 px-4">
      <div className="absolute inset-0 bg-gradient-to-br from-brand-100 via-white to-accent-100 dark:from-gray-950 dark:via-gray-900 dark:to-brand-950" />
      <div className="absolute top-20 left-20 w-64 h-64 bg-brand-400/20 rounded-full blur-3xl" />
      <div className="absolute bottom-20 right-20 w-80 h-80 bg-accent-400/20 rounded-full blur-3xl" />

      <button
        onClick={toggleDarkMode}
        className="absolute top-6 right-6 p-2 rounded-lg text-gray-600 dark:text-gray-300 hover:bg-white/50 dark:hover:bg-gray-800/50 backdrop-blur transition-colors z-10"
      >
        {darkMode ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
      </button>

      <div className="relative w-full max-w-md animate-slide-up">
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2 mb-6">
            <div className="p-2.5 rounded-xl gradient-bg">
              <Sparkles className="h-6 w-6 text-white" />
            </div>
            <span className="text-2xl font-bold text-gray-900 dark:text-white">
              SocialFlow <span className="gradient-text">AI</span>
            </span>
          </Link>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Welcome back</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">Sign in to your account</p>
        </div>

        <div className="glass rounded-2xl p-8 shadow-xl">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                Email
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="email"
                  required
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  placeholder="you@restaurant.com"
                  className="w-full pl-11 pr-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-600 bg-white/50 dark:bg-gray-800/50 text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-brand-500 focus:border-transparent outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  placeholder="Enter your password"
                  className="w-full pl-11 pr-11 py-2.5 rounded-xl border border-gray-200 dark:border-gray-600 bg-white/50 dark:bg-gray-800/50 text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-brand-500 focus:border-transparent outline-none"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.remember}
                  onChange={(e) => setForm({ ...form, remember: e.target.checked })}
                  className="h-4 w-4 rounded border-gray-300 text-brand-600 focus:ring-brand-500"
                />
                <span className="text-sm text-gray-600 dark:text-gray-400">Remember me</span>
              </label>
              <Link
                to="/forgot-password"
                className="text-sm font-medium text-brand-600 dark:text-brand-400 hover:text-brand-700"
              >
                Forgot Password?
              </Link>
            </div>

            <Button type="submit" className="w-full" size="lg" loading={loading}>
              Login
            </Button>
          </form>

          <p className="text-center text-sm text-gray-500 dark:text-gray-400 mt-6">
            Don&apos;t have an account?{' '}
            <Link to="/register" className="font-medium text-brand-600 dark:text-brand-400 hover:text-brand-700">
              Register
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
