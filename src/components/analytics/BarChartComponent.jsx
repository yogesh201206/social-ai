import * as Icons from 'lucide-react'

export default function BarChartComponent({ platforms = [] }) {
  if (!platforms || platforms.length === 0) {
    return <p className="text-sm text-gray-500 py-4 text-center">No platform comparison data.</p>
  }

  // Parse reach values to numeric for progress calculation
  const getNumericReach = (reachStr) => {
    if (!reachStr) return 0
    if (typeof reachStr === 'number') return reachStr
    const clean = reachStr.toString().replace(/[^0-9.]/g, '')
    const num = parseFloat(clean) || 0
    if (reachStr.includes('K')) return num * 1000
    if (reachStr.includes('M')) return num * 1000000
    return num
  }

  const maxReach = Math.max(...platforms.map((p) => getNumericReach(p.reach)), 1)

  return (
    <div className="space-y-4">
      {platforms.map((plat) => {
        const IconComponent = Icons[plat.icon] || Icons.Share2
        const numericReach = getNumericReach(plat.reach)
        const percent = Math.min(Math.round((numericReach / maxReach) * 100), 100)

        return (
          <div key={plat.platform} className="p-3.5 rounded-xl bg-gray-50/70 dark:bg-gray-800/40 border border-gray-100 dark:border-gray-800 hover:bg-gray-100/60 dark:hover:bg-gray-800/80 transition-colors">
            <div className="flex items-center justify-between gap-3 mb-2">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className={`h-8 w-8 rounded-lg flex items-center justify-center text-white bg-gradient-to-r ${plat.color} shadow-sm shrink-0`}>
                  <IconComponent className="h-4 w-4" />
                </div>
                <div className="min-w-0">
                  <h4 className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                    {plat.platform}
                  </h4>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {plat.followers || plat.subscribers || '0'} {plat.platform === 'YouTube' ? 'subscribers' : 'followers'} · {plat.posts} posts
                  </p>
                </div>
              </div>

              <div className="text-right shrink-0">
                <span className="text-sm font-bold text-gray-900 dark:text-white">
                  {plat.reach}
                </span>
                <span className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold block">
                  {plat.engagementRate} eng. rate
                </span>
              </div>
            </div>

            {/* Custom Bar / Progress indicator */}
            <div className="w-full bg-gray-200 dark:bg-gray-700 h-2.5 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full bg-gradient-to-r ${plat.color} transition-all duration-500`}
                style={{ width: `${Math.max(percent, 6)}%` }}
              />
            </div>
          </div>
        )
      })}
    </div>
  )
}
