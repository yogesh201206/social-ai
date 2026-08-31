import * as Icons from 'lucide-react'
import { platforms, platformIcons, platformColors } from '../data/postsData'

// Platforms that are Coming Soon (Meta Business verification required)
const COMING_SOON_PLATFORMS = ['Instagram', 'Facebook']

export default function PlatformSelector({ value, onChange, multiple = false, connectedPlatforms = [] }) {
  const selected = multiple ? (value || []) : value

  const isSelected = (platform) =>
    multiple ? selected.includes(platform) : selected === platform

  const handleSelect = (platform) => {
    if (COMING_SOON_PLATFORMS.includes(platform)) {
      return // Disabled
    }
    if (multiple) {
      const current = value || []
      onChange?.(
        current.includes(platform)
          ? current.filter((p) => p !== platform)
          : [...current, platform]
      )
    } else {
      onChange?.(platform)
    }
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
      {platforms.map((platform) => {
        const Icon = Icons[platformIcons[platform]] || Icons.Globe
        const gradient = platformColors[platform]
        const active = isSelected(platform)
        const isComingSoon = COMING_SOON_PLATFORMS.includes(platform)
        const isConnected = connectedPlatforms.includes(platform)

        if (isComingSoon) {
          return (
            <div
              key={platform}
              className="relative flex flex-col items-center justify-between p-3.5 rounded-xl border border-dashed border-gray-200 dark:border-gray-700/60 bg-gray-50/50 dark:bg-gray-800/30 opacity-75 cursor-not-allowed select-none"
              title={`${platform} is coming soon`}
            >
              <div className="flex flex-col items-center gap-1.5 w-full">
                <div className={`h-9 w-9 rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center opacity-50`}>
                  <Icon className="h-4 w-4 text-white" />
                </div>
                <span className="text-xs font-medium text-gray-500 dark:text-gray-400">
                  {platform}
                </span>
              </div>
              <span className="mt-2 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider rounded-full bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300 border border-amber-200 dark:border-amber-700/40">
                Coming Soon
              </span>
            </div>
          )
        }

        return (
          <button
            key={platform}
            type="button"
            onClick={() => handleSelect(platform)}
            className={`relative flex flex-col items-center justify-between gap-2 p-3.5 rounded-xl border-2 transition-all duration-200 hover:scale-[1.02] ${
              active
                ? 'border-brand-500 bg-brand-50/80 dark:bg-brand-900/20 shadow-md shadow-brand-500/10'
                : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-gray-300 dark:hover:border-gray-600'
            }`}
          >
            <div className={`h-9 w-9 rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center shadow-sm`}>
              <Icon className="h-4 w-4 text-white" />
            </div>
            <div className="text-center">
              <span className={`block text-xs font-semibold ${active ? 'text-brand-600 dark:text-brand-400' : 'text-gray-800 dark:text-gray-200'}`}>
                {platform}
              </span>
              <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium">
                Active
              </span>
            </div>
            {active && (
              <div className="absolute top-2 right-2 h-4 w-4 rounded-full gradient-bg flex items-center justify-center shadow-sm">
                <Icons.Check className="h-2.5 w-2.5 text-white" />
              </div>
            )}
          </button>
        )
      })}
    </div>
  )
}
