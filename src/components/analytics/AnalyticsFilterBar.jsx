import { useState } from 'react'
import { Building2, MapPin, Share2, Calendar, Download, RefreshCw, CheckCircle2 } from 'lucide-react'
import { useAnalytics } from '../../context/AnalyticsContext'
import { useRestaurants } from '../../context/RestaurantContext'
import { useNotifications } from '../../context/NotificationContext'
import { dateRangeOptions, platformOptions } from '../../data/analyticsData'

export default function AnalyticsFilterBar() {
  const {
    selectedRestaurant,
    setSelectedRestaurant,
    selectedBranch,
    setSelectedBranch,
    selectedPlatform,
    setSelectedPlatform,
    selectedDateRange,
    setSelectedDateRange,
    availableBranches,
    resetFilters,
  } = useAnalytics()

  const { restaurants } = useRestaurants()
  const { addNotification } = useNotifications()
  const [toastMessage, setToastMessage] = useState(null)

  const handleExport = () => {
    const msg = 'Analytics report export will be available after backend integration.'
    addNotification({
      title: 'Report Export',
      message: msg,
      type: 'info',
    })
    setToastMessage(msg)
    setTimeout(() => setToastMessage(null), 4000)
  }

  const isFiltered =
    selectedRestaurant !== 'all' ||
    selectedBranch !== 'all' ||
    selectedPlatform !== 'all' ||
    selectedDateRange !== '30d'

  return (
    <div className="space-y-3">
      {toastMessage && (
        <div className="flex items-center gap-2 p-3 rounded-xl bg-brand-50 dark:bg-brand-900/30 border border-brand-200 dark:border-brand-800 text-brand-700 dark:text-brand-300 text-sm animate-fade-in">
          <CheckCircle2 className="h-4 w-4 shrink-0 text-brand-500" />
          <span>{toastMessage}</span>
        </div>
      )}

      <div className="glass rounded-2xl p-4 flex flex-wrap items-center justify-between gap-3 border border-gray-100 dark:border-gray-800">
        <div className="flex flex-wrap items-center gap-3 flex-1 min-w-0">
          {/* Restaurant Filter */}
          <div className="relative min-w-[160px] flex-1 sm:flex-none">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
              <Building2 className="h-4 w-4 text-brand-500" />
            </div>
            <select
              value={selectedRestaurant}
              onChange={(e) => setSelectedRestaurant(e.target.value)}
              className="w-full pl-9 pr-8 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm font-medium text-gray-900 dark:text-white focus:ring-2 focus:ring-brand-500 focus:border-brand-500 transition-colors cursor-pointer"
            >
              <option value="all">All Restaurants</option>
              {restaurants.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.name}
                </option>
              ))}
            </select>
          </div>

          {/* Branch Filter */}
          <div className="relative min-w-[150px] flex-1 sm:flex-none">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
              <MapPin className="h-4 w-4 text-purple-500" />
            </div>
            <select
              value={selectedBranch}
              onChange={(e) => setSelectedBranch(e.target.value)}
              className="w-full pl-9 pr-8 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm font-medium text-gray-900 dark:text-white focus:ring-2 focus:ring-brand-500 focus:border-brand-500 transition-colors cursor-pointer"
            >
              <option value="all">All Branches</option>
              {availableBranches.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name} ({b.city})
                </option>
              ))}
            </select>
          </div>

          {/* Platform Filter */}
          <div className="relative min-w-[150px] flex-1 sm:flex-none">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
              <Share2 className="h-4 w-4 text-indigo-500" />
            </div>
            <select
              value={selectedPlatform}
              onChange={(e) => setSelectedPlatform(e.target.value)}
              className="w-full pl-9 pr-8 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm font-medium text-gray-900 dark:text-white focus:ring-2 focus:ring-brand-500 focus:border-brand-500 transition-colors cursor-pointer"
            >
              {platformOptions.map((p) => (
                <option key={p.value} value={p.value}>
                  {p.label}
                </option>
              ))}
            </select>
          </div>

          {/* Date Range Selector */}
          <div className="relative min-w-[150px] flex-1 sm:flex-none">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
              <Calendar className="h-4 w-4 text-accent-500" />
            </div>
            <select
              value={selectedDateRange}
              onChange={(e) => setSelectedDateRange(e.target.value)}
              className="w-full pl-9 pr-8 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm font-medium text-gray-900 dark:text-white focus:ring-2 focus:ring-brand-500 focus:border-brand-500 transition-colors cursor-pointer"
            >
              {dateRangeOptions.map((d) => (
                <option key={d.value} value={d.value}>
                  {d.label}
                </option>
              ))}
            </select>
          </div>

          {isFiltered && (
            <button
              onClick={resetFilters}
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-gray-500 dark:text-gray-400 hover:text-brand-600 dark:hover:text-brand-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition-colors"
              title="Reset all filters"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              Reset
            </button>
          )}
        </div>

        {/* Export Button */}
        <button
          onClick={handleExport}
          className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white gradient-bg rounded-xl shadow-md shadow-brand-500/20 hover:opacity-95 active:scale-95 transition-all"
        >
          <Download className="h-4 w-4" />
          <span>Export Report</span>
        </button>
      </div>
    </div>
  )
}
