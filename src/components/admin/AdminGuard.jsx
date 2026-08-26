import { useState } from 'react'
import { Link } from 'react-router-dom'
import { ShieldAlert, ArrowLeft, KeyRound } from 'lucide-react'
import Button from '../Button'
import Card from '../Card'

export default function AdminGuard({ children }) {
  // Frontend mock admin access role state
  const [isAdmin, setIsAdmin] = useState(true)

  if (!isAdmin) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center p-4 animate-fade-in">
        <Card className="max-w-md w-full p-8 text-center space-y-5 border-red-200 dark:border-red-900/30">
          <div className="h-16 w-16 mx-auto rounded-2xl bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 flex items-center justify-center">
            <ShieldAlert className="h-8 w-8" />
          </div>

          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Access Denied</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
              You do not have administrator permissions to access the SocialFlow AI Admin Panel.
            </p>
          </div>

          <div className="p-3 rounded-xl bg-gray-50 dark:bg-gray-800 text-xs text-gray-500 dark:text-gray-400 flex items-center justify-between">
            <span>Current Role: <strong className="text-gray-700 dark:text-gray-300">Standard User</strong></span>
            <button
              onClick={() => setIsAdmin(true)}
              className="text-brand-600 dark:text-brand-400 hover:underline flex items-center gap-1 font-semibold"
            >
              <KeyRound className="h-3.5 w-3.5" />
              <span>Simulate Admin Role</span>
            </button>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <Link to="/dashboard" className="w-full sm:w-auto">
              <Button variant="primary" className="w-full">
                <ArrowLeft className="h-4 w-4" />
                Return to Dashboard
              </Button>
            </Link>
          </div>
        </Card>
      </div>
    )
  }

  return children
}
