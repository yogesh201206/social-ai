import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { TrendingUp, Users, Heart, Eye, ArrowUpRight, Sparkles } from 'lucide-react'
import * as Icons from 'lucide-react'
import Card from '../../components/Card'
import AnalyticsFilterBar from '../../components/analytics/AnalyticsFilterBar'
import AnalyticsNavTabs from '../../components/analytics/AnalyticsNavTabs'
import AnalyticsStatCard from '../../components/analytics/AnalyticsStatCard'
import AreaChartComponent from '../../components/analytics/AreaChartComponent'
import BarChartComponent from '../../components/analytics/BarChartComponent'
import PostDetailModal from '../../components/analytics/PostDetailModal'
import { StatCardSkeleton } from '../../components/Skeleton'
import { useAnalytics } from '../../context/AnalyticsContext'

export default function Analytics() {
  const [loading, setLoading] = useState(true)
  const [selectedPost, setSelectedPost] = useState(null)

  const {
    analyticsData,
    timelineData,
    platformData,
    topPosts,
    selectedRestaurant,
    selectedBranch,
    selectedPlatform,
  } = useAnalytics()

  useEffect(() => {
    setLoading(true)
    const timer = setTimeout(() => setLoading(false), 400)
    return () => clearTimeout(timer)
  }, [selectedRestaurant, selectedBranch, selectedPlatform])

  const statsList = [
    { label: 'Total Reach', ...analyticsData.totalReach, color: 'purple' },
    { label: 'Impressions', ...analyticsData.impressions, color: 'brand' },
    { label: 'Engagement', ...analyticsData.engagement, color: 'pink' },
    { label: 'Followers', ...analyticsData.followers, color: 'indigo' },
    { label: 'Posts Published', ...analyticsData.postsPublished, color: 'blue' },
    { label: 'Engagement Rate', ...analyticsData.engagementRate, color: 'emerald' },
  ]

  // Follower growth calculations
  const firstFollowers = timelineData[0]?.followers ?? 0
  const lastFollowers = timelineData[timelineData.length - 1]?.followers ?? 0
  const netGrowth = lastFollowers - firstFollowers
  const growthRatePercent = firstFollowers > 0 ? ((netGrowth / firstFollowers) * 100).toFixed(1) : '0.0'

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      {/* Header & Sub-navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight">
            Analytics
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Track your social media performance and marketing growth.
          </p>
        </div>
      </div>

      <AnalyticsNavTabs />

      {/* Top Filter Section */}
      <AnalyticsFilterBar />

      {/* Step 3: Overview Statistics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-6 gap-4">
        {loading
          ? Array.from({ length: 6 }).map((_, i) => <StatCardSkeleton key={i} />)
          : statsList.map((stat) => (
              <AnalyticsStatCard key={stat.label} {...stat} />
            ))}
      </div>

      {/* Step 4 & 5: Charts Grid */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Engagement Overview Chart */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                Engagement Overview
              </h3>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                Likes, comments, and shares across date range
              </p>
            </div>
            <div className="h-8 w-8 rounded-xl bg-pink-50 dark:bg-pink-900/30 text-pink-600 dark:text-pink-400 flex items-center justify-center">
              <Heart className="h-4 w-4" />
            </div>
          </div>

          {loading ? (
            <div className="h-64 flex items-center justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-500" />
            </div>
          ) : (
            <AreaChartComponent
              data={timelineData}
              series={[
                { label: 'Likes', key: 'likes', color: '#ec4899' },
                { label: 'Comments', key: 'comments', color: '#3b82f6' },
                { label: 'Shares', key: 'shares', color: '#10b981' },
              ]}
            />
          )}
        </Card>

        {/* Reach & Impressions Chart */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                Reach & Impressions
              </h3>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                Audience reach compared to total content views
              </p>
            </div>
            <div className="h-8 w-8 rounded-xl bg-purple-50 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 flex items-center justify-center">
              <Eye className="h-4 w-4" />
            </div>
          </div>

          {loading ? (
            <div className="h-64 flex items-center justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-500" />
            </div>
          ) : (
            <AreaChartComponent
              data={timelineData}
              series={[
                { label: 'Reach', key: 'reach', color: '#8b5cf6' },
                { label: 'Impressions', key: 'impressions', color: '#6366f1' },
              ]}
            />
          )}
        </Card>
      </div>

      {/* Step 6 & 7: Platform Comparison & Follower Growth */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Step 6: Platform Performance Comparison */}
        <Card className="p-6 lg:col-span-2">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                Platform Performance Comparison
              </h3>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                Comparative metrics across Instagram, Facebook, X, TikTok & YouTube
              </p>
            </div>
            <Link
              to="/dashboard/analytics/platforms"
              className="text-xs font-semibold text-brand-600 dark:text-brand-400 hover:underline flex items-center gap-1"
            >
              <span>View Details</span>
              <ArrowUpRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          {loading ? (
            <div className="h-48 flex items-center justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-500" />
            </div>
          ) : (
            <BarChartComponent platforms={platformData} />
          )}
        </Card>

        {/* Step 7: Follower Growth */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                Follower Growth
              </h3>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                Net expansion over selected period
              </p>
            </div>
            <div className="h-8 w-8 rounded-xl bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <Users className="h-4 w-4" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 mb-4 p-3 rounded-xl bg-gray-50 dark:bg-gray-800/40 border border-gray-100 dark:border-gray-800">
            <div>
              <span className="text-xs text-gray-500 dark:text-gray-400">Starting</span>
              <p className="text-base font-bold text-gray-900 dark:text-white">
                {firstFollowers.toLocaleString()}
              </p>
            </div>
            <div>
              <span className="text-xs text-gray-500 dark:text-gray-400">Current</span>
              <p className="text-base font-bold text-gray-900 dark:text-white">
                {lastFollowers.toLocaleString()}
              </p>
            </div>
            <div>
              <span className="text-xs text-gray-500 dark:text-gray-400">Net Growth</span>
              <p className="text-base font-bold text-emerald-600 dark:text-emerald-400">
                {netGrowth > 0 ? `+${netGrowth.toLocaleString()}` : netGrowth.toLocaleString()}
              </p>
            </div>
            <div>
              <span className="text-xs text-gray-500 dark:text-gray-400">Growth %</span>
              <p className="text-base font-bold text-emerald-600 dark:text-emerald-400">
                {growthRatePercent !== '0.0' && growthRatePercent !== '0' ? `+${growthRatePercent}%` : '0%'}
              </p>
            </div>
          </div>

          <AreaChartComponent
            data={timelineData}
            series={[{ label: 'Followers', key: 'followers', color: '#10b981' }]}
            height={180}
            showLegend={false}
          />
        </Card>
      </div>

      {/* Step 8: Top Performing Posts */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-lg font-bold text-gray-900 dark:text-white">
              Top Performing Posts
            </h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
              Posts with highest engagement and reach across active channels
            </p>
          </div>
          <Link
            to="/dashboard/analytics/posts"
            className="text-xs font-semibold text-brand-600 dark:text-brand-400 hover:underline flex items-center gap-1"
          >
            <span>All Posts Analytics</span>
            <ArrowUpRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        {topPosts.length === 0 ? (
          <div className="py-12 text-center text-gray-500 dark:text-gray-400">
            <Sparkles className="h-10 w-10 text-gray-300 dark:text-gray-600 mx-auto mb-2" />
            <p className="font-semibold text-base">No analytics data available for the selected filters.</p>
            <p className="text-xs mt-1">Try resetting your restaurant, branch, or platform filters.</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100 dark:divide-gray-800">
            {topPosts.map((post) => {
              const platInfo = platformData.find(
                (p) => p.platform.toLowerCase() === post.platform.toLowerCase()
              )
              const IconComponent = platInfo && Icons[platInfo.icon] ? Icons[platInfo.icon] : Icons.Share2

              return (
                <div
                  key={post.id}
                  className="py-4 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-gray-50/50 dark:hover:bg-gray-800/20 px-2 rounded-xl transition-colors group"
                >
                  <div className="flex items-center gap-3.5 min-w-0 flex-1">
                    <img
                      src={post.image}
                      alt={post.title}
                      className="h-14 w-14 rounded-xl object-cover shrink-0 border border-gray-200 dark:border-gray-700"
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className={`h-5 w-5 rounded-md flex items-center justify-center text-white text-[10px] bg-gradient-to-r ${platInfo?.color || 'from-gray-700 to-gray-900'}`}>
                          <IconComponent className="h-3 w-3" />
                        </span>
                        <h4 className="text-sm font-bold text-gray-900 dark:text-white truncate group-hover:text-brand-600 dark:group-hover:text-brand-400 transition-colors">
                          {post.title}
                        </h4>
                      </div>
                      <p className="text-xs text-gray-500 dark:text-gray-400 truncate mt-0.5">
                        {post.caption}
                      </p>
                      <p className="text-[11px] text-gray-400 dark:text-gray-500 mt-1">
                        {post.restaurantName} ({post.branchName}) · Published {post.publishedDate}
                      </p>
                    </div>
                  </div>

                  {/* Metrics Badge */}
                  <div className="flex items-center justify-between md:justify-end gap-4 shrink-0 border-t md:border-t-0 pt-2 md:pt-0 border-gray-100 dark:border-gray-800">
                    <div className="grid grid-cols-4 gap-3 text-center">
                      <div>
                        <span className="text-[10px] text-gray-400 uppercase font-semibold block">Reach</span>
                        <span className="text-sm font-bold text-gray-900 dark:text-white">
                          {(post.reach || 0).toLocaleString()}
                        </span>
                      </div>
                      <div>
                        <span className="text-[10px] text-gray-400 uppercase font-semibold block">Likes</span>
                        <span className="text-sm font-bold text-pink-600 dark:text-pink-400">
                          {(post.likes || 0).toLocaleString()}
                        </span>
                      </div>
                      <div>
                        <span className="text-[10px] text-gray-400 uppercase font-semibold block">Comments</span>
                        <span className="text-sm font-bold text-blue-600 dark:text-blue-400">
                          {(post.comments || 0).toLocaleString()}
                        </span>
                      </div>
                      <div>
                        <span className="text-[10px] text-gray-400 uppercase font-semibold block">Eng. Rate</span>
                        <span className="text-sm font-bold text-emerald-600 dark:text-emerald-400">
                          {post.engagementRate}
                        </span>
                      </div>
                    </div>

                    <button
                      onClick={() => setSelectedPost(post)}
                      className="px-3.5 py-1.5 text-xs font-semibold rounded-xl bg-brand-50 dark:bg-brand-900/30 text-brand-600 dark:text-brand-400 hover:bg-brand-100 dark:hover:bg-brand-900/50 transition-colors"
                    >
                      View Details
                    </button>
                  </div>
                </div>
              )
            })}
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
