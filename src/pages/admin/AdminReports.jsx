import { useState, useMemo } from 'react'
import { Calendar, Filter, Users, Building2, FileText, Sparkles, Megaphone, Download, RefreshCw } from 'lucide-react'
import Card from '../../components/Card'
import Button from '../../components/Button'
import AreaChartComponent from '../../components/analytics/AreaChartComponent'
import { useAdmin } from '../../context/AdminContext'
import AdminGuard from '../../components/admin/AdminGuard'

export default function AdminReports() {
  const { reportsData, restaurants } = useAdmin()

  const [dateRange, setDateRange] = useState('Last 30 Days')
  const [selectedRestaurant, setSelectedRestaurant] = useState('All')
  const [selectedBusinessType, setSelectedBusinessType] = useState('All')
  const [exporting, setExporting] = useState(false)

  // Current active report dataset based on selected date range
  const currentData = reportsData[dateRange] || reportsData['Last 30 Days']

  // Summary Metrics calculations
  const totalUserGrowth = useMemo(
    () => currentData.userGrowth.reduce((acc, c) => acc + c.count, 0),
    [currentData]
  )
  const totalRestaurantGrowth = useMemo(
    () => currentData.restaurantGrowth.reduce((acc, c) => acc + c.count, 0),
    [currentData]
  )
  const totalPostsActivity = useMemo(
    () => currentData.postActivity.reduce((acc, c) => acc + c.count, 0),
    [currentData]
  )
  const totalAIUsage = useMemo(
    () => currentData.aiUsage.reduce((acc, c) => acc + c.count, 0),
    [currentData]
  )
  const totalCampaignActivity = useMemo(
    () => currentData.campaignActivity.reduce((acc, c) => acc + c.count, 0),
    [currentData]
  )

  const handleExportReport = () => {
    setExporting(true)
    setTimeout(() => {
      setExporting(false)
      const blob = new Blob([
        `SocialFlow AI Admin Analytics Report (${dateRange})\n` +
        `Generated: ${new Date().toLocaleString()}\n\n` +
        `Total New Users: ${totalUserGrowth}\n` +
        `Total New Restaurants: ${totalRestaurantGrowth}\n` +
        `Total Posts Created: ${totalPostsActivity}\n` +
        `Total AI Generations: ${totalAIUsage}\n` +
        `Total Campaigns Launched: ${totalCampaignActivity}\n`
      ], { type: 'text/plain' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `socialflow-admin-report-${dateRange.toLowerCase().replace(/\s+/g, '-')}.txt`
      a.click()
    }, 600)
  }

  return (
    <AdminGuard>
      <div className="space-y-8 animate-fade-in pb-12">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight">
              Admin Reports & Analytics
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Platform-wide performance reports across users, restaurants, AI usage, and campaigns.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Button variant="outline" size="sm" onClick={handleExportReport} loading={exporting}>
              <Download className="h-4 w-4" />
              Export Report Data
            </Button>
          </div>
        </div>

        {/* STEP 7: Filters Bar */}
        <Card className="p-4 sm:p-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Date Range Select */}
            <div>
              <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1">
                Date Range
              </label>
              <select
                value={dateRange}
                onChange={(e) => setDateRange(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500 font-medium"
              >
                <option value="Last 7 Days">Last 7 Days</option>
                <option value="Last 30 Days">Last 30 Days</option>
                <option value="Last 3 Months">Last 3 Months</option>
                <option value="This Year">This Year</option>
              </select>
            </div>

            {/* Restaurant Filter */}
            <div>
              <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1">
                Filter by Restaurant
              </label>
              <select
                value={selectedRestaurant}
                onChange={(e) => setSelectedRestaurant(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500"
              >
                <option value="All">All Restaurants</option>
                {restaurants.map((r) => (
                  <option key={r.id} value={r.name}>
                    {r.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Business Type Filter */}
            <div>
              <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1">
                Business Type
              </label>
              <select
                value={selectedBusinessType}
                onChange={(e) => setSelectedBusinessType(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500"
              >
                <option value="All">All Business Types</option>
                <option value="Fine Dining">Fine Dining</option>
                <option value="Casual Dining">Casual Dining</option>
                <option value="Fast Casual">Fast Casual</option>
                <option value="Cafe & Bakery">Cafe & Bakery</option>
                <option value="Bar & Lounge">Bar & Lounge</option>
                <option value="Multi-location Restaurant">Multi-location Restaurant</option>
              </select>
            </div>
          </div>
        </Card>

        {/* STEP 7: Section Summary Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
          <Card className="p-5">
            <div className="flex items-center gap-3 text-brand-600 dark:text-brand-400 mb-2">
              <Users className="h-5 w-5" />
              <span className="text-xs font-bold uppercase">User Growth</span>
            </div>
            <p className="text-2xl font-black text-gray-900 dark:text-white">+{totalUserGrowth}</p>
            <span className="text-[11px] text-gray-400 font-medium">New registrations</span>
          </Card>

          <Card className="p-5">
            <div className="flex items-center gap-3 text-purple-600 dark:text-purple-400 mb-2">
              <Building2 className="h-5 w-5" />
              <span className="text-xs font-bold uppercase">Restaurant Growth</span>
            </div>
            <p className="text-2xl font-black text-gray-900 dark:text-white">+{totalRestaurantGrowth}</p>
            <span className="text-[11px] text-gray-400 font-medium">Locations onboarded</span>
          </Card>

          <Card className="p-5">
            <div className="flex items-center gap-3 text-blue-600 dark:text-blue-400 mb-2">
              <FileText className="h-5 w-5" />
              <span className="text-xs font-bold uppercase">Post Activity</span>
            </div>
            <p className="text-2xl font-black text-gray-900 dark:text-white">{totalPostsActivity.toLocaleString()}</p>
            <span className="text-[11px] text-gray-400 font-medium">Posts generated & scheduled</span>
          </Card>

          <Card className="p-5">
            <div className="flex items-center gap-3 text-pink-600 dark:text-pink-400 mb-2">
              <Sparkles className="h-5 w-5" />
              <span className="text-xs font-bold uppercase">AI Usage</span>
            </div>
            <p className="text-2xl font-black text-gray-900 dark:text-white">{totalAIUsage.toLocaleString()}</p>
            <span className="text-[11px] text-gray-400 font-medium">Captions & copy generated</span>
          </Card>

          <Card className="p-5 col-span-2 sm:col-span-1">
            <div className="flex items-center gap-3 text-amber-600 dark:text-amber-400 mb-2">
              <Megaphone className="h-5 w-5" />
              <span className="text-xs font-bold uppercase">Campaign Activity</span>
            </div>
            <p className="text-2xl font-black text-gray-900 dark:text-white">+{totalCampaignActivity}</p>
            <span className="text-[11px] text-gray-400 font-medium">Marketing campaigns</span>
          </Card>
        </div>

        {/* STEP 7: Section Charts */}
        <div className="grid lg:grid-cols-2 gap-6">
          {/* Section 1: User & Restaurant Growth Chart */}
          <Card className="p-6">
            <div className="mb-4">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">User & Restaurant Growth</h3>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                New user signups vs new restaurant onboardings ({dateRange})
              </p>
            </div>
            <AreaChartComponent
              data={currentData.userGrowth.map((d, i) => ({
                date: d.date,
                users: d.count,
                restaurants: currentData.restaurantGrowth[i]?.count || 0,
              }))}
              series={[
                { label: 'User Signups', key: 'users', color: '#6366f1' },
                { label: 'Restaurant Onboardings', key: 'restaurants', color: '#a855f7' },
              ]}
              height={260}
            />
          </Card>

          {/* Section 2: Post Activity & AI Usage Chart */}
          <Card className="p-6">
            <div className="mb-4">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">Post Activity & AI Content Usage</h3>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Volume of AI generations compared to published & scheduled posts ({dateRange})
              </p>
            </div>
            <AreaChartComponent
              data={currentData.postActivity.map((d, i) => ({
                date: d.date,
                posts: d.count,
                aiUsage: currentData.aiUsage[i]?.count || 0,
              }))}
              series={[
                { label: 'AI Generations', key: 'aiUsage', color: '#ec4899' },
                { label: 'Posts Created', key: 'posts', color: '#3b82f6' },
              ]}
              height={260}
            />
          </Card>
        </div>

        {/* Section 3: Campaign Activity Breakdown */}
        <Card className="p-6">
          <div className="mb-4">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white">Email & Marketing Campaign Activity</h3>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Active promotional email blasts and multi-channel campaign executions over time
            </p>
          </div>
          <AreaChartComponent
            data={currentData.campaignActivity.map((d) => ({
              date: d.date,
              campaigns: d.count,
            }))}
            series={[{ label: 'Campaigns Launched', key: 'campaigns', color: '#f59e0b' }]}
            height={220}
          />
        </Card>
      </div>
    </AdminGuard>
  )
}
