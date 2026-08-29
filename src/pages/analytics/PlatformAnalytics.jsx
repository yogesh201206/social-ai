import { useState } from 'react'
import * as Icons from 'lucide-react'
import { TrendingUp, Users, Eye, Heart, MessageCircle, Video, Radio, Layers, Sparkles } from 'lucide-react'
import Card from '../../components/Card'
import AnalyticsFilterBar from '../../components/analytics/AnalyticsFilterBar'
import AnalyticsNavTabs from '../../components/analytics/AnalyticsNavTabs'
import AreaChartComponent from '../../components/analytics/AreaChartComponent'
import { useAnalytics } from '../../context/AnalyticsContext'

export default function PlatformAnalytics() {
  const { platformData, timelineData, selectedPlatform, setSelectedPlatform } = useAnalytics()
  const [activeTab, setActiveTab] = useState('All')

  const activePlatforms = platformData

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      {/* Header */}
      <div>
        <h2 className="text-2xl sm:text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight">
          Platform Analytics
        </h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          Deep-dive into performance metrics and audience growth across social channels.
        </p>
      </div>

      <AnalyticsNavTabs />
      <AnalyticsFilterBar />

      {/* Quick Platform Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
        <button
          onClick={() => setSelectedPlatform('all')}
          className={`px-4 py-2 text-xs font-bold rounded-xl transition-all whitespace-nowrap ${
            selectedPlatform === 'all'
              ? 'gradient-bg text-white shadow-md'
              : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-700 hover:border-brand-500'
          }`}
        >
          All Platforms ({activePlatforms.length})
        </button>
        {activePlatforms.map((plat) => {
          const IconComponent = Icons[plat.icon] || Layers
          const isSelected = selectedPlatform.toLowerCase().includes(plat.platform.toLowerCase())
          return (
            <button
              key={plat.platform}
              onClick={() => setSelectedPlatform(plat.platform)}
              className={`flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-xl transition-all whitespace-nowrap ${
                isSelected
                  ? 'gradient-bg text-white shadow-md'
                  : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-700 hover:border-brand-500'
              }`}
            >
              <IconComponent className="h-3.5 w-3.5" />
              <span>{plat.platform}</span>
            </button>
          )
        })}
      </div>

      {/* Platform Cards Grid */}
      {activePlatforms.length === 0 ? (
        <Card className="p-8 text-center text-gray-500 dark:text-gray-400">
          No platform analytics available.
        </Card>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {activePlatforms.map((plat) => {
            const IconComponent = Icons[plat.icon] || Layers
            const isYouTube = plat.platform === 'YouTube'

            return (
              <Card
                key={plat.platform}
                className="p-6 flex flex-col justify-between hover:shadow-xl transition-all duration-300 border border-gray-100 dark:border-gray-800 group"
              >
                <div>
                  {/* Platform Card Header */}
                  <div className="flex items-center justify-between mb-5">
                    <div className="flex items-center gap-3">
                      <div className={`h-12 w-12 rounded-2xl flex items-center justify-center text-white bg-gradient-to-r ${plat.color} shadow-lg shadow-brand-500/10 group-hover:scale-110 transition-transform`}>
                        <IconComponent className="h-6 w-6" />
                      </div>
                      <div>
                        <h3 className="text-lg font-extrabold text-gray-900 dark:text-white">
                          {plat.platform}
                        </h3>
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          {plat.topContentType}
                        </span>
                      </div>
                    </div>

                    <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${plat.badgeColor}`}>
                      {plat.growth}
                    </span>
                  </div>

                  {/* Specific Metric Breakdown */}
                  {isYouTube ? (
                    <div className="grid grid-cols-2 gap-3 mb-6">
                      <div className="p-3 rounded-xl bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-800">
                        <span className="text-[11px] text-gray-500 dark:text-gray-400 font-semibold block">Subscribers</span>
                        <p className="text-lg font-bold text-gray-900 dark:text-white mt-0.5">{plat.subscribers}</p>
                      </div>
                      <div className="p-3 rounded-xl bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-800">
                        <span className="text-[11px] text-gray-500 dark:text-gray-400 font-semibold block">Views</span>
                        <p className="text-lg font-bold text-gray-900 dark:text-white mt-0.5">{plat.views}</p>
                      </div>
                      <div className="p-3 rounded-xl bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-800">
                        <span className="text-[11px] text-gray-500 dark:text-gray-400 font-semibold block">Likes</span>
                        <p className="text-lg font-bold text-pink-600 dark:text-pink-400 mt-0.5">{plat.likes}</p>
                      </div>
                      <div className="p-3 rounded-xl bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-800">
                        <span className="text-[11px] text-gray-500 dark:text-gray-400 font-semibold block">Comments</span>
                        <p className="text-lg font-bold text-blue-600 dark:text-blue-400 mt-0.5">{plat.comments}</p>
                      </div>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 gap-3 mb-6">
                      <div className="p-3 rounded-xl bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-800">
                        <span className="text-[11px] text-gray-500 dark:text-gray-400 font-semibold block">Followers</span>
                        <p className="text-lg font-bold text-gray-900 dark:text-white mt-0.5">{plat.followers}</p>
                      </div>
                      <div className="p-3 rounded-xl bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-800">
                        <span className="text-[11px] text-gray-500 dark:text-gray-400 font-semibold block">Reach</span>
                        <p className="text-lg font-bold text-purple-600 dark:text-purple-400 mt-0.5">{plat.reach}</p>
                      </div>
                      <div className="p-3 rounded-xl bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-800">
                        <span className="text-[11px] text-gray-500 dark:text-gray-400 font-semibold block">Impressions</span>
                        <p className="text-lg font-bold text-indigo-600 dark:text-indigo-400 mt-0.5">{plat.impressions}</p>
                      </div>
                      <div className="p-3 rounded-xl bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-800">
                        <span className="text-[11px] text-gray-500 dark:text-gray-400 font-semibold block">Engagement</span>
                        <p className="text-lg font-bold text-brand-600 dark:text-brand-400 mt-0.5">{plat.engagement}</p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Engagement Rate Footer Bar */}
                <div className="pt-4 border-t border-gray-100 dark:border-gray-800 flex items-center justify-between">
                  <span className="text-xs font-semibold text-gray-500 dark:text-gray-400">
                    Engagement Rate
                  </span>
                  <span className="text-base font-extrabold text-emerald-600 dark:text-emerald-400">
                    {plat.engagementRate}
                  </span>
                </div>
              </Card>
            )
          })}
        </div>
      )}

      {/* Platform Comparison Trend */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-bold text-gray-900 dark:text-white">
              Platform Engagement Trend
            </h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
              Historical interaction distribution over time
            </p>
          </div>
        </div>

        <AreaChartComponent
          data={timelineData}
          series={[
            { label: 'Likes', key: 'likes', color: '#ec4899' },
            { label: 'Comments', key: 'comments', color: '#3b82f6' },
            { label: 'Shares', key: 'shares', color: '#10b981' },
          ]}
        />
      </Card>
    </div>
  )
}
