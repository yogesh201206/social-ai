import { useState } from 'react'
import { Link } from 'react-router-dom'
import * as Icons from 'lucide-react'
import { Users, UserCheck, Building2, MapPin, FileText, Calendar, Sparkles, Megaphone, ArrowUpRight, TrendingUp, Activity, Server, ShieldCheck } from 'lucide-react'
import Card from '../components/Card'
import DashboardCard from '../components/DashboardCard'
import AreaChartComponent from '../components/analytics/AreaChartComponent'
import { useAdmin } from '../context/AdminContext'
import { platformActivityOverviewData } from '../data/adminData'
import AdminGuard from '../components/admin/AdminGuard'

const iconMap = {
  Users,
  UserCheck,
  Building2,
  MapPin,
  FileText,
  Calendar,
  Sparkles,
  Megaphone,
}

const statusColors = {
  Active: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
  Inactive: 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-400',
  Suspended: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  Pending: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
}

export default function AdminDashboard() {
  const { adminStats, users, restaurants } = useAdmin()
  const [activeMetric, setActiveMetric] = useState('all')

  const overviewTimeline = platformActivityOverviewData

  // Metrics summary for Platform Overview
  const totalNewUsers = overviewTimeline.reduce((acc, curr) => acc + curr.newUsers, 0)
  const totalNewRestaurants = overviewTimeline.reduce((acc, curr) => acc + curr.newRestaurants, 0)
  const totalPostsCreated = overviewTimeline.reduce((acc, curr) => acc + curr.postsCreated, 0)
  const totalAIGenerations = overviewTimeline.reduce((acc, curr) => acc + curr.aiGenerations, 0)
  const totalCampaignsCreated = overviewTimeline.reduce((acc, curr) => acc + curr.campaignsCreated, 0)

  return (
    <AdminGuard>
      <div className="space-y-8 animate-fade-in pb-12">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight">
              Admin Dashboard
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Monitor and manage the SocialFlow AI platform.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              System Status: Operational
            </span>
          </div>
        </div>

        {/* STEP 1: Statistics Cards (8 Cards) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
          {adminStats.map((stat) => {
            const IconComp = iconMap[stat.icon] || Users
            return (
              <DashboardCard
                key={stat.label}
                label={stat.label}
                value={stat.value}
                change={stat.change}
                icon={stat.icon}
                color={stat.color}
              />
            )
          })}
        </div>

        {/* STEP 2: Platform Overview & Activity Chart */}
        <Card className="p-6">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-6">
            <div>
              <div className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-brand-600 dark:text-brand-400" />
                <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                  Platform Overview & Activity Trends
                </h3>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Real-time tracking of platform registrations, content generation, and campaigns over time.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => setActiveMetric('all')}
                className={`px-3 py-1.5 text-xs font-semibold rounded-xl transition-colors ${
                  activeMetric === 'all'
                    ? 'bg-brand-600 text-white shadow-md'
                    : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200'
                }`}
              >
                All Metrics
              </button>
              <button
                onClick={() => setActiveMetric('users')}
                className={`px-3 py-1.5 text-xs font-semibold rounded-xl transition-colors ${
                  activeMetric === 'users'
                    ? 'bg-purple-600 text-white shadow-md'
                    : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200'
                }`}
              >
                Users & Restaurants
              </button>
              <button
                onClick={() => setActiveMetric('content')}
                className={`px-3 py-1.5 text-xs font-semibold rounded-xl transition-colors ${
                  activeMetric === 'content'
                    ? 'bg-emerald-600 text-white shadow-md'
                    : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200'
                }`}
              >
                Posts & AI Generations
              </button>
            </div>
          </div>

          {/* Activity Metric Pills */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 mb-6 p-4 rounded-2xl bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-800">
            <div>
              <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">New Users</span>
              <p className="text-lg font-bold text-gray-900 dark:text-white mt-0.5">+{totalNewUsers}</p>
            </div>
            <div>
              <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">New Restaurants</span>
              <p className="text-lg font-bold text-purple-600 dark:text-purple-400 mt-0.5">+{totalNewRestaurants}</p>
            </div>
            <div>
              <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">Posts Created</span>
              <p className="text-lg font-bold text-indigo-600 dark:text-indigo-400 mt-0.5">{totalPostsCreated.toLocaleString()}</p>
            </div>
            <div>
              <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">AI Generations</span>
              <p className="text-lg font-bold text-pink-600 dark:text-pink-400 mt-0.5">{totalAIGenerations.toLocaleString()}</p>
            </div>
            <div className="col-span-2 sm:col-span-1">
              <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">Campaigns Created</span>
              <p className="text-lg font-bold text-amber-600 dark:text-amber-400 mt-0.5">+{totalCampaignsCreated}</p>
            </div>
          </div>

          {/* Interactive Chart */}
          <AreaChartComponent
            data={overviewTimeline}
            series={
              activeMetric === 'users'
                ? [
                    { label: 'New Users', key: 'newUsers', color: '#6366f1' },
                    { label: 'New Restaurants', key: 'newRestaurants', color: '#a855f7' },
                  ]
                : activeMetric === 'content'
                ? [
                    { label: 'Posts Created', key: 'postsCreated', color: '#3b82f6' },
                    { label: 'AI Generations', key: 'aiGenerations', color: '#ec4899' },
                  ]
                : [
                    { label: 'AI Generations', key: 'aiGenerations', color: '#ec4899' },
                    { label: 'Posts Created', key: 'postsCreated', color: '#3b82f6' },
                    { label: 'New Users', key: 'newUsers', color: '#10b981' },
                  ]
            }
            height={300}
          />
        </Card>

        {/* Management Quick Grid & Activity */}
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Registered Users Preview Table */}
          <Card className="lg:col-span-2 p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-lg font-bold text-gray-900 dark:text-white">Registered Platform Users</h3>
                <p className="text-xs text-gray-500 dark:text-gray-400">Recent user subscriptions and business details</p>
              </div>
              <Link
                to="/admin/users"
                className="text-xs font-semibold text-brand-600 dark:text-brand-400 hover:underline flex items-center gap-1"
              >
                <span>View All Users ({users.length})</span>
                <ArrowUpRight className="h-4 w-4" />
              </Link>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-gray-500 dark:text-gray-400 border-b border-gray-200 dark:border-gray-700">
                    <th className="pb-3 font-medium">User</th>
                    <th className="pb-3 font-medium hidden sm:table-cell">Business</th>
                    <th className="pb-3 font-medium hidden md:table-cell">Plan</th>
                    <th className="pb-3 font-medium">Status</th>
                    <th className="pb-3 font-medium text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                  {users.slice(0, 5).map((user) => (
                    <tr key={user.id} className="hover:bg-gray-50/50 dark:hover:bg-gray-800/40 transition-colors">
                      <td className="py-3">
                        <div>
                          <p className="font-semibold text-gray-900 dark:text-white">{user.name}</p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">{user.email}</p>
                        </div>
                      </td>
                      <td className="py-3 text-gray-600 dark:text-gray-300 hidden sm:table-cell">
                        {user.businessName}
                      </td>
                      <td className="py-3 hidden md:table-cell">
                        <span className="inline-flex px-2 py-0.5 rounded-md text-xs font-semibold bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300">
                          {user.plan}
                        </span>
                      </td>
                      <td className="py-3">
                        <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-semibold ${statusColors[user.status] || 'bg-gray-100 text-gray-700'}`}>
                          {user.status}
                        </span>
                      </td>
                      <td className="py-3 text-right">
                        <Link
                          to={`/admin/users/${user.id}`}
                          className="text-xs font-semibold text-brand-600 dark:text-brand-400 hover:underline"
                        >
                          Details
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>

          {/* Registered Restaurants Preview */}
          <Card className="p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-lg font-bold text-gray-900 dark:text-white">Active Restaurants</h3>
                <p className="text-xs text-gray-500 dark:text-gray-400">Connected restaurant accounts</p>
              </div>
              <Link
                to="/admin/restaurants"
                className="text-xs font-semibold text-brand-600 dark:text-brand-400 hover:underline flex items-center gap-1"
              >
                <span>View All ({restaurants.length})</span>
                <ArrowUpRight className="h-4 w-4" />
              </Link>
            </div>

            <div className="space-y-3">
              {restaurants.slice(0, 5).map((rest) => (
                <div
                  key={rest.id}
                  className="flex items-center justify-between p-3 rounded-xl bg-gray-50 dark:bg-gray-800/40 border border-gray-100 dark:border-gray-800 hover:bg-gray-100/60 dark:hover:bg-gray-800 transition-colors"
                >
                  <div className="min-w-0 pr-2">
                    <p className="text-sm font-bold text-gray-900 dark:text-white truncate">{rest.name}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                      {rest.owner} · {rest.location}
                    </p>
                  </div>
                  <Link
                    to={`/admin/restaurants/${rest.id}`}
                    className="shrink-0 text-xs font-semibold text-brand-600 dark:text-brand-400 hover:underline"
                  >
                    View
                  </Link>
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* System Diagnostics Footer */}
        <div className="grid sm:grid-cols-3 gap-4">
          <Card className="p-5 flex items-center gap-4">
            <div className="p-3 rounded-2xl bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400">
              <Server className="h-6 w-6" />
            </div>
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">Server Infrastructure</p>
              <p className="text-base font-bold text-gray-900 dark:text-white">All Systems Operational</p>
            </div>
          </Card>

          <Card className="p-5 flex items-center gap-4">
            <div className="p-3 rounded-2xl bg-brand-100 dark:bg-brand-900/30 text-brand-600 dark:text-brand-400">
              <Activity className="h-6 w-6" />
            </div>
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">Platform API Uptime</p>
              <p className="text-base font-bold text-gray-900 dark:text-white">99.98% (30-day average)</p>
            </div>
          </Card>

          <Card className="p-5 flex items-center gap-4">
            <div className="p-3 rounded-2xl bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400">
              <ShieldCheck className="h-6 w-6" />
            </div>
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">Security & Compliance</p>
              <p className="text-base font-bold text-gray-900 dark:text-white">0 Threats Detected</p>
            </div>
          </Card>
        </div>
      </div>
    </AdminGuard>
  )
}
