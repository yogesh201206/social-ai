import { X, Heart, MessageCircle, Share2, Eye, TrendingUp, Calendar, Building2, MapPin } from 'lucide-react'
import * as Icons from 'lucide-react'
import { platformPerformanceData } from '../../data/analyticsData'

export default function PostDetailModal({ post, onClose }) {
  if (!post) return null

  const platInfo = platformPerformanceData.find(
    (p) => p.platform.toLowerCase() === post.platform.toLowerCase()
  )
  const IconComponent = platInfo ? Icons[platInfo.icon] : Icons.Share2

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl shadow-2xl max-w-2xl w-full overflow-hidden flex flex-col max-h-[90vh] animate-scale-up">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-100 dark:border-gray-800">
          <div className="flex items-center gap-2">
            <span className={`h-7 w-7 rounded-lg flex items-center justify-center text-white text-xs bg-gradient-to-r ${platInfo?.color || 'from-brand-500 to-accent-500'}`}>
              <IconComponent className="h-4 w-4" />
            </span>
            <div>
              <h3 className="text-base font-bold text-gray-900 dark:text-white truncate max-w-md">
                {post.title}
              </h3>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Published on {post.publishedDate}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-6 overflow-y-auto">
          <div className="grid sm:grid-cols-2 gap-4 items-start">
            <div className="relative rounded-xl overflow-hidden aspect-video bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
              <img
                src={post.image}
                alt={post.title}
                className="w-full h-full object-cover"
              />
              <div className="absolute top-2 left-2 px-2.5 py-1 rounded-full text-xs font-semibold bg-black/60 text-white backdrop-blur-md">
                {post.platform}
              </div>
            </div>

            <div className="space-y-3">
              <div>
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Caption</p>
                <p className="text-sm text-gray-700 dark:text-gray-300 mt-1 leading-relaxed">
                  {post.caption}
                </p>
              </div>

              <div className="flex flex-wrap gap-2 text-xs text-gray-500 dark:text-gray-400 pt-2">
                <span className="flex items-center gap-1 bg-gray-100 dark:bg-gray-800 px-2.5 py-1 rounded-lg">
                  <Building2 className="h-3.5 w-3.5 text-brand-500" />
                  {post.restaurantName}
                </span>
                {post.branchName && (
                  <span className="flex items-center gap-1 bg-gray-100 dark:bg-gray-800 px-2.5 py-1 rounded-lg">
                    <MapPin className="h-3.5 w-3.5 text-purple-500" />
                    {post.branchName}
                  </span>
                )}
                <span className="flex items-center gap-1 bg-gray-100 dark:bg-gray-800 px-2.5 py-1 rounded-lg">
                  <Calendar className="h-3.5 w-3.5 text-indigo-500" />
                  {post.publishedDate}
                </span>
              </div>
            </div>
          </div>

          {/* Detailed Performance Metrics */}
          <div>
            <h4 className="text-sm font-bold text-gray-900 dark:text-white mb-3">
              Performance Breakdown
            </h4>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-3.5 rounded-xl bg-pink-50 dark:bg-pink-900/20 border border-pink-100 dark:border-pink-800/30">
                <div className="flex items-center gap-1.5 text-pink-600 dark:text-pink-400 text-xs font-semibold mb-1">
                  <Heart className="h-4 w-4" />
                  Likes
                </div>
                <p className="text-xl font-bold text-gray-900 dark:text-white">
                  {(post.likes || 0).toLocaleString()}
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800/30">
                <div className="flex items-center gap-1.5 text-blue-600 dark:text-blue-400 text-xs font-semibold mb-1">
                  <MessageCircle className="h-4 w-4" />
                  Comments
                </div>
                <p className="text-xl font-bold text-gray-900 dark:text-white">
                  {(post.comments || 0).toLocaleString()}
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-green-50 dark:bg-green-900/20 border border-green-100 dark:border-green-800/30">
                <div className="flex items-center gap-1.5 text-green-600 dark:text-green-400 text-xs font-semibold mb-1">
                  <Share2 className="h-4 w-4" />
                  Shares
                </div>
                <p className="text-xl font-bold text-gray-900 dark:text-white">
                  {(post.shares || 0).toLocaleString()}
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-purple-50 dark:bg-purple-900/20 border border-purple-100 dark:border-purple-800/30">
                <div className="flex items-center gap-1.5 text-purple-600 dark:text-purple-400 text-xs font-semibold mb-1">
                  <TrendingUp className="h-4 w-4" />
                  Eng. Rate
                </div>
                <p className="text-xl font-bold text-gray-900 dark:text-white">
                  {post.engagementRate}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 mt-3">
              <div className="p-3.5 rounded-xl bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-800 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Eye className="h-4 w-4 text-brand-500" />
                  <span className="text-xs font-medium text-gray-600 dark:text-gray-400">Total Reach</span>
                </div>
                <span className="text-base font-bold text-gray-900 dark:text-white">
                  {(post.reach || 0).toLocaleString()}
                </span>
              </div>

              <div className="p-3.5 rounded-xl bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-800 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-emerald-500" />
                  <span className="text-xs font-medium text-gray-600 dark:text-gray-400">Total Impressions</span>
                </div>
                <span className="text-base font-bold text-gray-900 dark:text-white">
                  {(post.impressions || Math.floor((post.reach || 0) * 1.6)).toLocaleString()}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-100 dark:border-gray-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 text-sm font-semibold text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  )
}
