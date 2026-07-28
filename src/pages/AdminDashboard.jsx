import * as Icons from 'lucide-react'
import DashboardCard from '../components/DashboardCard'
import Card from '../components/Card'
import { adminDashboardStats, recentUsers, systemActivities } from '../data/dummyData'

const statusColors = {
  Active: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  Trial: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  Inactive: 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-400',
}

const activityTypeIcons = {
  user: 'UserPlus',
  billing: 'CreditCard',
  system: 'AlertTriangle',
  restaurant: 'Building2',
  support: 'Headphones',
}

export default function AdminDashboard() {
  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Admin Dashboard</h2>
        <p className="text-gray-500 dark:text-gray-400 mt-1">
          Platform overview and system management.
        </p>
      </div>

      <div className="grid sm:grid-cols-2 xl:grid-cols-4 gap-4 lg:gap-6">
        {adminDashboardStats.map((stat) => (
          <DashboardCard key={stat.label} {...stat} />
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2 p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Recent Users</h3>
            <button className="text-sm text-brand-600 dark:text-brand-400 hover:text-brand-700 font-medium">
              View all users
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-gray-500 dark:text-gray-400 border-b border-gray-200 dark:border-gray-700">
                  <th className="pb-3 font-medium">User</th>
                  <th className="pb-3 font-medium hidden sm:table-cell">Plan</th>
                  <th className="pb-3 font-medium hidden md:table-cell">Restaurants</th>
                  <th className="pb-3 font-medium hidden lg:table-cell">Joined</th>
                  <th className="pb-3 font-medium">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                {recentUsers.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/30">
                    <td className="py-3">
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white">{user.name}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">{user.email}</p>
                      </div>
                    </td>
                    <td className="py-3 text-gray-500 dark:text-gray-400 hidden sm:table-cell">{user.plan}</td>
                    <td className="py-3 text-gray-500 dark:text-gray-400 hidden md:table-cell">{user.restaurants}</td>
                    <td className="py-3 text-gray-500 dark:text-gray-400 hidden lg:table-cell">{user.joined}</td>
                    <td className="py-3">
                      <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium ${statusColors[user.status]}`}>
                        {user.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        <Card className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">System Activity</h3>
          <div className="space-y-4">
            {systemActivities.map((activity) => {
              const Icon = Icons[activityTypeIcons[activity.type]] || Icons.Activity
              return (
                <div
                  key={activity.id}
                  className="flex items-start gap-3 p-3 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                >
                  <div className="p-2 rounded-lg bg-gray-100 dark:bg-gray-700">
                    <Icon className="h-4 w-4 text-gray-600 dark:text-gray-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 dark:text-white">{activity.event}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{activity.user}</p>
                  </div>
                  <span className="text-xs text-gray-400 whitespace-nowrap">{activity.time}</span>
                </div>
              )
            })}
          </div>
        </Card>
      </div>

      <div className="grid sm:grid-cols-3 gap-4">
        {[
          { label: 'Server Status', value: 'Operational', icon: 'Server', color: 'text-green-500' },
          { label: 'API Uptime', value: '99.98%', icon: 'Activity', color: 'text-brand-500' },
          { label: 'Active Sessions', value: '1,247', icon: 'Users', color: 'text-purple-500' },
        ].map((item) => {
          const Icon = Icons[item.icon]
          return (
            <Card key={item.label} className="p-5 flex items-center gap-4">
              <Icon className={`h-8 w-8 ${item.color}`} />
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">{item.label}</p>
                <p className="text-lg font-bold text-gray-900 dark:text-white">{item.value}</p>
              </div>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
