import { useState } from 'react'
import { Search, ArrowUpDown, Eye, Heart, MessageCircle, Share2, TrendingUp, Sparkles, Filter } from 'lucide-react'
import * as Icons from 'lucide-react'
import Card from '../../components/Card'
import AnalyticsFilterBar from '../../components/analytics/AnalyticsFilterBar'
import AnalyticsNavTabs from '../../components/analytics/AnalyticsNavTabs'
import PostDetailModal from '../../components/analytics/PostDetailModal'
import { useAnalytics } from '../../context/AnalyticsContext'
import { platformPerformanceData } from '../../data/analyticsData'

export default function PostAnalytics() {
  const {
    postAnalytics,
    searchQuery,
    setSearchQuery,
    sortBy,
    setSortBy,
    sortOrder,
    setSortOrder,
  } = useAnalytics()

  const [selectedPost, setSelectedPost] = useState(null)

  const handleSort = (field) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc')
    } else {
      setSortBy(field)
      setSortOrder('desc')
    }
  }

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      {/* Header */}
      <div>
        <h2 className="text-2xl sm:text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight">
          Post Analytics
        </h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          Detailed breakdown of reach, likes, comments, shares, and engagement rates for every post.
        </p>
      </div>

      <AnalyticsNavTabs />
      <AnalyticsFilterBar />

      {/* Controls Bar: Search & Sort */}
      <div className="glass rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4 border border-gray-100 dark:border-gray-800">
        {/* Search */}
        <div className="relative w-full sm:w-80">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
            <Search className="h-4 w-4" />
          </div>
          <input
            type="text"
            placeholder="Search by caption or post title..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-brand-500 focus:border-brand-500 transition-colors"
          />
        </div>

        {/* Sort Controls */}
        <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto no-scrollbar">
          <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 flex items-center gap-1 shrink-0">
            <ArrowUpDown className="h-3.5 w-3.5" />
            Sort by:
          </span>

          {[
            { label: 'Reach', key: 'reach' },
            { label: 'Likes', key: 'likes' },
            { label: 'Engagement', key: 'engagement' },
            { label: 'Eng. Rate', key: 'engagementRate' },
          ].map((item) => (
            <button
              key={item.key}
              onClick={() => handleSort(item.key)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-xl transition-colors whitespace-nowrap ${
                sortBy === item.key
                  ? 'bg-brand-600 text-white shadow-sm'
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
              }`}
            >
              {item.label} {sortBy === item.key ? (sortOrder === 'desc' ? '↓' : '↑') : ''}
            </button>
          ))}
        </div>
      </div>

      {/* Post Table */}
      <Card className="p-0 overflow-hidden">
        {postAnalytics.length === 0 ? (
          <div className="py-16 text-center text-gray-500 dark:text-gray-400">
            <Sparkles className="h-12 w-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
            <h4 className="text-base font-bold text-gray-900 dark:text-white">No posts match your filters</h4>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 max-w-sm mx-auto">
              No analytics data available for the selected filters. Try broadening your search or resetting filters.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-800 bg-gray-50/80 dark:bg-gray-800/50 text-[11px] uppercase tracking-wider font-bold text-gray-500 dark:text-gray-400">
                  <th className="py-3.5 px-4 min-w-[220px]">Post</th>
                  <th className="py-3.5 px-4">Restaurant</th>
                  <th className="py-3.5 px-4">Platform</th>
                  <th className="py-3.5 px-4">Published Date</th>
                  <th className="py-3.5 px-4 text-right">Reach</th>
                  <th className="py-3.5 px-4 text-right">Likes</th>
                  <th className="py-3.5 px-4 text-right">Comments</th>
                  <th className="py-3.5 px-4 text-right">Shares</th>
                  <th className="py-3.5 px-4 text-right">Engagement</th>
                  <th className="py-3.5 px-4 text-right">Eng. Rate</th>
                  <th className="py-3.5 px-4 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800 text-sm">
                {postAnalytics.map((post) => {
                  const platInfo = platformPerformanceData.find(
                    (p) => p.platform.toLowerCase() === post.platform.toLowerCase()
                  )
                  const IconComponent = platInfo ? Icons[platInfo.icon] : Icons.Share2

                  return (
                    <tr
                      key={post.id}
                      className="hover:bg-gray-50/60 dark:hover:bg-gray-800/30 transition-colors group cursor-pointer"
                      onClick={() => setSelectedPost(post)}
                    >
                      {/* Post Thumbnail & Title */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <img
                            src={post.image}
                            alt={post.title}
                            className="h-10 w-10 rounded-lg object-cover shrink-0 border border-gray-200 dark:border-gray-700"
                          />
                          <div className="min-w-0">
                            <p className="font-bold text-gray-900 dark:text-white truncate group-hover:text-brand-600 dark:group-hover:text-brand-400 transition-colors">
                              {post.title}
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-400 truncate max-w-[200px]">
                              {post.caption}
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* Restaurant */}
                      <td className="py-3.5 px-4 font-medium text-gray-700 dark:text-gray-300 whitespace-nowrap">
                        {post.restaurantName}
                        {post.branchName && (
                          <span className="block text-xs text-gray-400">{post.branchName}</span>
                        )}
                      </td>

                      {/* Platform */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          <span className={`h-5 w-5 rounded flex items-center justify-center text-white text-[10px] bg-gradient-to-r ${platInfo?.color || 'from-gray-700 to-gray-900'}`}>
                            <IconComponent className="h-3 w-3" />
                          </span>
                          <span className="font-semibold text-xs text-gray-800 dark:text-gray-200">
                            {post.platform}
                          </span>
                        </div>
                      </td>

                      {/* Date */}
                      <td className="py-3.5 px-4 text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap">
                        {post.publishedDate}
                      </td>

                      {/* Reach */}
                      <td className="py-3.5 px-4 text-right font-semibold text-gray-900 dark:text-white">
                        {(post.reach || 0).toLocaleString()}
                      </td>

                      {/* Likes */}
                      <td className="py-3.5 px-4 text-right font-semibold text-pink-600 dark:text-pink-400">
                        {(post.likes || 0).toLocaleString()}
                      </td>

                      {/* Comments */}
                      <td className="py-3.5 px-4 text-right font-semibold text-blue-600 dark:text-blue-400">
                        {(post.comments || 0).toLocaleString()}
                      </td>

                      {/* Shares */}
                      <td className="py-3.5 px-4 text-right font-semibold text-green-600 dark:text-green-400">
                        {(post.shares || 0).toLocaleString()}
                      </td>

                      {/* Engagement */}
                      <td className="py-3.5 px-4 text-right font-bold text-gray-900 dark:text-white">
                        {(post.engagement || 0).toLocaleString()}
                      </td>

                      {/* Engagement Rate */}
                      <td className="py-3.5 px-4 text-right font-bold text-emerald-600 dark:text-emerald-400">
                        {post.engagementRate}
                      </td>

                      {/* Action */}
                      <td className="py-3.5 px-4 text-center" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={() => setSelectedPost(post)}
                          className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-brand-50 dark:bg-brand-900/30 text-brand-600 dark:text-brand-400 hover:bg-brand-100 dark:hover:bg-brand-900/50 transition-colors"
                        >
                          Details
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Post Detail Modal */}
      {selectedPost && (
        <PostDetailModal
          post={selectedPost}
          onClose={() => setSelectedPost(null)}
        />
      )}
    </div>
  )
}
