import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Sparkles, Mail, ArrowLeft, CheckCircle, Moon, Sun } from 'lucide-react'
import Button from '../components/Button'
import { useTheme } from '../context/ThemeContext'

export default function ForgotPassword() {
  const { darkMode, toggleDarkMode } = useTheme()
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)

  const handleSubmit = (e) => {
    e.preventDefault()
    setLoading(true)
    setTimeout(() => {
      setLoading(false)
      setSent(true)
    }, 1000)
  }

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden bg-gray-50 dark:bg-gray-950 px-4">
      <div className="absolute inset-0 bg-gradient-to-br from-brand-100 via-white to-accent-100 dark:from-gray-950 dark:via-gray-900 dark:to-brand-950" />
      <div className="absolute top-20 left-1/2 -translate-x-1/2 w-96 h-96 bg-brand-400/10 rounded-full blur-3xl" />

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
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Forgot password?</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            No worries, we&apos;ll send you reset instructions.
          </p>
        </div>

        <div className="glass rounded-2xl p-8 shadow-xl">
          {sent ? (
            <div className="text-center py-4 animate-fade-in">
              <div className="inline-flex items-center justify-center h-16 w-16 rounded-full bg-green-100 dark:bg-green-900/30 mb-4">
                <CheckCircle className="h-8 w-8 text-green-600 dark:text-green-400" />
              </div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                Check your email
              </h2>
              <p className="text-gray-600 dark:text-gray-400 text-sm mb-6">
                Password reset link sent successfully.
              </p>
              <Link to="/login">
                <Button variant="outline" className="w-full">
                  <ArrowLeft className="h-4 w-4" /> Back to Login
                </Button>
              </Link>
            </div>
          ) : (
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
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@restaurant.com"
                    className="w-full pl-11 pr-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-600 bg-white/50 dark:bg-gray-800/50 text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-brand-500 focus:border-transparent outline-none"
                  />
                </div>
              </div>

              <Button type="submit" className="w-full" size="lg" loading={loading}>
                Send Reset Link
              </Button>

              <Link to="/login" className="flex items-center justify-center gap-2 text-sm text-gray-500 dark:text-gray-400 hover:text-brand-600 dark:hover:text-brand-400 transition-colors">
                <ArrowLeft className="h-4 w-4" /> Back to Login
              </Link>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}
