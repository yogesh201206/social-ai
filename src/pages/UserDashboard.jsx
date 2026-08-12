import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import * as Icons from 'lucide-react'
import { Heart, MessageCircle, Share2, TrendingUp, FileText, Calendar, FileEdit, CheckCircle } from 'lucide-react'
import StatCard from '../components/StatCard'
import ActivityCard from '../components/ActivityCard'
import Card from '../components/Card'
import PostTable from '../components/PostTable'
import { StatCardSkeleton } from '../components/Skeleton'
import { usePosts } from '../context/PostContext'
import { dashboardStats, quickActions, userProfile } from '../data/dashboardData'
import { activities } from '../data/activityData'

export default function UserDashboard() {
  const [loading, setLoading] = useState(true)
  const { posts, getRecentPosts, getPostsByStatus, getPerformanceOverview } = usePosts()

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 600)
    return () => clearTimeout(timer)
  }, [])

  const recentPosts = getRecentPosts(5)
  const scheduledPosts = getPostsByStatus('Scheduled').slice(0, 4)
  const draftPosts = getPostsByStatus('Draft').slice(0, 3)
  const publishedPosts = getPostsByStatus('Published').slice(0, 3)
  const performance = getPerformanceOverview()

  const postStats = [
    { label: 'Draft Posts', value: String(getPostsByStatus('Draft').length), icon: FileEdit, color: 'yellow', path: '/dashboard/posts/drafts' },
    { label: 'Scheduled', value: String(getPostsByStatus('Scheduled').length), icon: Calendar, color: 'indigo', path: '/dashboard/posts/scheduled' },
    { label: 'Published', value: String(getPostsByStatus('Published').length), icon: CheckCircle, color: 'green', path: '/dashboard/posts/published' },
    { label: 'Total Posts', value: String(posts.length), icon: FileText, color: 'brand', path: '/dashboard/posts' },
  ]

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
          Welcome back, {userProfile.name.split(' ')[0]}!
        </h2>
        <p className="text-gray-500 dark:text-gray-400 mt-1">
          Here&apos;s what&apos;s happening with your social media today.
        </p>
      </div>

      <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4 lg:gap-6">
        {loading
          ? Array.from({ length: 6 }).map((_, i) => <StatCardSkeleton key={i} />)
          : dashboardStats.map((stat) => (
              <StatCard key={stat.label} {...stat} />
            ))}
      </div>

      <div className="grid sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {postStats.map(({ label, value, icon: Icon, color, path }) => (
          <Link
            key={label}
            to={path}
            className="glass rounded-2xl p-5 hover:shadow-lg hover:shadow-brand-500/10 transition-all duration-300 hover:-translate-y-0.5 group"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">{label}</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{value}</p>
              </div>
              <div className={`h-11 w-11 rounded-xl flex items-center justify-center ${
                color === 'yellow' ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-600 dark:text-yellow-400' :
                color === 'indigo' ? 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400' :
                color === 'green' ? 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400' :
                'bg-brand-100 dark:bg-brand-900/30 text-brand-600 dark:text-brand-400'
              } group-hover:scale-110 transition-transform`}>
                <Icon className="h-5 w-5" />
              </div>
            </div>
          </Link>
        ))}
      </div>

      <Card className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-brand-500" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Post Performance Overview</h3>
          </div>
          <Link to="/dashboard/analytics" className="text-sm text-brand-600 dark:text-brand-400 hover:text-brand-700 font-medium flex items-center gap-1">
            View Analytics →
          </Link>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-4 rounded-xl bg-pink-50 dark:bg-pink-900/20 border border-pink-100 dark:border-pink-800/30">
            <div className="flex items-center gap-2 text-pink-600 dark:text-pink-400 mb-2">
              <Heart className="h-4 w-4" />
              <span className="text-sm font-medium">Total Likes</span>
            </div>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">{performance.totalLikes.toLocaleString()}</p>
          </div>
          <div className="p-4 rounded-xl bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800/30">
            <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400 mb-2">
              <MessageCircle className="h-4 w-4" />
              <span className="text-sm font-medium">Total Comments</span>
            </div>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">{performance.totalComments.toLocaleString()}</p>
          </div>
          <div className="p-4 rounded-xl bg-green-50 dark:bg-green-900/20 border border-green-100 dark:border-green-800/30">
            <div className="flex items-center gap-2 text-green-600 dark:text-green-400 mb-2">
              <Share2 className="h-4 w-4" />
              <span className="text-sm font-medium">Total Shares</span>
            </div>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">{performance.totalShares.toLocaleString()}</p>
          </div>
          <div className="p-4 rounded-xl bg-purple-50 dark:bg-purple-900/20 border border-purple-100 dark:border-purple-800/30">
            <div className="flex items-center gap-2 text-purple-600 dark:text-purple-400 mb-2">
              <TrendingUp className="h-4 w-4" />
              <span className="text-sm font-medium">Avg. Engagement</span>
            </div>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">{performance.avgEngagement.toLocaleString()}</p>
          </div>
        </div>
      </Card>

      <div className="grid lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2 p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Recent Activity</h3>
            <button className="text-sm text-brand-600 dark:text-brand-400 hover:text-brand-700 font-medium">
              View all
            </button>
          </div>
          <div className="space-y-1">
            {activities.slice(0, 6).map((activity) => (
              <ActivityCard key={activity.id} {...activity} />
            ))}
          </div>
        </Card>

        <Card className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">Quick Actions</h3>
          <div className="space-y-3">
            {quickActions.map((action) => {
              const Icon = Icons[action.icon]
              return (
                <Link
                  key={action.label}
                  to={action.path}
                  className={`flex items-center gap-3 w-full p-3 rounded-xl text-sm font-medium transition-all hover:scale-[1.02] active:scale-[0.98] ${action.color}`}
                >
                  <Icon className="h-5 w-5" />
                  {action.label}
                </Link>
              )
            })}
          </div>

          <div className="mt-6 p-4 rounded-xl bg-gradient-to-br from-brand-50 to-accent-50 dark:from-brand-900/20 dark:to-accent-900/20 border border-brand-100 dark:border-brand-800">
            <p className="text-sm font-medium text-gray-900 dark:text-white">Pro Tip</p>
            <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
              Schedule posts during peak hours (11am–1pm and 5pm–7pm) for maximum engagement.
            </p>
          </div>
        </Card>
      </div>

      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Recent Posts</h3>
          <Link to="/dashboard/posts" className="text-sm text-brand-600 dark:text-brand-400 hover:text-brand-700 font-medium">
            View all
          </Link>
        </div>
        <PostTable posts={recentPosts} />
      </Card>

      <div className="grid lg:grid-cols-2 gap-6">
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Scheduled Posts</h3>
            <Link to="/dashboard/posts/scheduled" className="text-sm text-brand-600 dark:text-brand-400 hover:text-brand-700 font-medium">
              View all
            </Link>
          </div>
          {scheduledPosts.length > 0 ? (
            <PostTable posts={scheduledPosts} />
          ) : (
            <p className="text-sm text-gray-500 dark:text-gray-400 py-4 text-center">No scheduled posts</p>
          )}
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Draft Posts</h3>
            <Link to="/dashboard/posts/drafts" className="text-sm text-brand-600 dark:text-brand-400 hover:text-brand-700 font-medium">
              View all
            </Link>
          </div>
          {draftPosts.length > 0 ? (
            <div className="space-y-3">
              {draftPosts.map((post) => (
                <Link
                  key={post.id}
                  to={`/dashboard/posts/${post.id}/edit`}
                  className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors group"
                >
                  <img src={post.image} alt="" className="h-10 w-10 rounded-lg object-cover" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 dark:text-white truncate group-hover:text-brand-600 dark:group-hover:text-brand-400 transition-colors">
                      {post.title}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{post.platform} · {post.createdAt}</p>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-500 dark:text-gray-400 py-4 text-center">No draft posts</p>
          )}
        </Card>
      </div>

      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Published Posts</h3>
          <Link to="/dashboard/posts/published" className="text-sm text-brand-600 dark:text-brand-400 hover:text-brand-700 font-medium">
            View all
          </Link>
        </div>
        {publishedPosts.length > 0 ? (
          <PostTable posts={publishedPosts} showMetrics />
        ) : (
          <p className="text-sm text-gray-500 dark:text-gray-400 py-4 text-center">No published posts yet</p>
        )}
      </Card>
    </div>
  )
}
