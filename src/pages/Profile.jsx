import { useState } from 'react'
import ProfileCard from '../components/ProfileCard'
import Card from '../components/Card'
import { userProfile } from '../data/dashboardData'
import { Building2, Calendar, Sparkles, TrendingUp } from 'lucide-react'

export default function Profile() {
  const [profile, setProfile] = useState(userProfile)

  const stats = [
    { label: 'Restaurants', value: '6', icon: Building2 },
    { label: 'Posts Scheduled', value: '48', icon: Calendar },
    { label: 'AI Generations', value: '284', icon: Sparkles },
    { label: 'Total Reach', value: '128K', icon: TrendingUp },
  ]

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fade-in">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">My Profile</h2>
        <p className="text-gray-500 dark:text-gray-400 mt-1">
          Manage your personal information and account details.
        </p>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map(({ label, value, icon: Icon }) => (
          <Card key={label} className="p-4 text-center">
            <Icon className="h-5 w-5 text-brand-600 dark:text-brand-400 mx-auto mb-2" />
            <p className="text-2xl font-bold text-gray-900 dark:text-white">{value}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{label}</p>
          </Card>
        ))}
      </div>

      <ProfileCard profile={profile} onSave={setProfile} />
    </div>
  )
}
